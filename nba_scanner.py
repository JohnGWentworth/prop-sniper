import requests
import time
from datetime import datetime, timezone, timedelta

# --- 1. CONFIGURATION ---
API_KEY = '5f628a5b66f578a4bea36edba378dac4'

SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A'

# --- 2. SETTINGS ---
GAP_THRESHOLD = 1.0 
GAME_LIMIT = 15 
MARKETS_TO_SCAN = ['player_points', 'player_rebounds', 'player_assists']
BOOKS_TO_IGNORE = ['Bovada', 'MyBookie.ag', 'BetOnline.ag', 'BetRivers']

# --- 3. CORE MATH ---
def calculate_implied_prob(american_odds):
    """Converts +400 into 20.0%"""
    try:
        odds = int(american_odds)
        if odds > 0: return round((100 / (odds + 100)) * 100, 1)
        else: return round((abs(odds) / (abs(odds) + 100)) * 100, 1)
    except:
        return 0.0

def calculate_decimal_odds(american_odds):
    """Converts +400 to 5.0 decimal for EV math"""
    try:
        odds = int(american_odds)
        if odds > 0: return (odds / 100) + 1
        else: return (100 / abs(odds)) + 1
    except:
        return 0.0

def save_to_supabase(data, table_name="nba_edges"):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    headers = {
        "apikey": SUPABASE_KEY, 
        "Authorization": f"Bearer {SUPABASE_KEY}", 
        "Content-Type": "application/json", 
        "Prefer": "resolution=merge-duplicates"
    }
    try:
        r = requests.post(url, headers=headers, json=data, timeout=15)
        if r.status_code in [200, 201, 204]:
            print(f"✅ {table_name} Update: {len(data)} rows synced.")
        else:
            print(f"❌ DB Error ({table_name}): {r.text}")
    except Exception as e:
        print(f"❌ DB Connection Error: {e}")

def run_cloud_scan():
    print(f"🚀 STARTING PREMIUM SCAN: {datetime.now(timezone.utc)}")
    
    try:
        r_games = requests.get(f"https://api.the-odds-api.com/v4/sports/basketball_nba/events?apiKey={API_KEY}", timeout=15)
        if r_games.status_code == 200:
            all_games = r_games.json()
            game_ids = []
            
            us_now = datetime.now(timezone.utc) - timedelta(hours=5)
            us_today = us_now.strftime('%Y-%m-%d')

            for e in all_games:
                try:
                    event_time = datetime.strptime(e['commence_time'], '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
                    event_us_time = event_time - timedelta(hours=5)
                    if event_us_time.strftime('%Y-%m-%d') == us_today:
                        game_ids.append(e['id'])
                except: continue
                
            print(f"📅 Filtered Schedule: Found {len(game_ids)} games scheduled for today ({us_today}).")
        else:
            game_ids = []
    except:
        print("❌ Could not fetch schedule.")
        return

    if not game_ids:
        print("🔍 No games found for today.")
        return

    # --- PART 1: LIVE MARKET EDGES ---
    found_edges = []
    for market in MARKETS_TO_SCAN:
        clean_name = market.replace('player_', '').capitalize()
        print(f"🔵 Scanning Edges: {clean_name}...")
        
        for event_id in game_ids[:GAME_LIMIT]:
            try:
                url = f"https://api.the-odds-api.com/v4/sports/basketball_nba/events/{event_id}/odds?apiKey={API_KEY}&regions=us&markets={market}&oddsFormat=american"
                game_data = requests.get(url, timeout=15).json()
                
                player_map = {}
                for book in game_data.get('bookmakers', []):
                    if any(ignored in book.get('title') for ignored in BOOKS_TO_IGNORE): continue
                    for m in book.get('markets', []):
                        if m['key'] == market:
                            for out in m.get('outcomes', []):
                                if out.get('point'):
                                    name = out['description']
                                    if name not in player_map: player_map[name] = []
                                    player_map[name].append({"book": book['title'], "point": out['point']})

                for player, lines in player_map.items():
                    if len(lines) > 1:
                        low = min(lines, key=lambda x: x['point'])
                        high = max(lines, key=lambda x: x['point'])
                        diff = round(high['point'] - low['point'], 2)
                        if diff >= GAP_THRESHOLD:
                            found_edges.append({
                                "player_name": player,
                                "game": f"{game_data.get('away_team')} vs {game_data.get('home_team')}",
                                "market": clean_name,
                                "low_line": float(low['point']), "low_book": low['book'],
                                "high_line": float(high['point']), "high_book": high['book'],
                                "edge_size": diff,
                                "created_at": datetime.now(timezone.utc).isoformat()
                            })
            except: continue
            time.sleep(0.2)

    if found_edges: save_to_supabase(found_edges, "nba_edges")

    # --- PART 2: FIRST BASKETS & EINSTEIN EV MATH ---
    print("\n🏆 Scanning First Baskets (Einstein Engine Active)...")
    first_baskets = []
    
    for event_id in game_ids[:GAME_LIMIT]:
        try:
            fb_url = f"https://api.the-odds-api.com/v4/sports/basketball_nba/events/{event_id}/odds?apiKey={API_KEY}&regions=us&markets=player_first_basket&oddsFormat=american"
            r_fb = requests.get(fb_url, timeout=15)
            
            if r_fb.status_code != 200:
                continue
                    
            fb_data = r_fb.json()
            away_team = fb_data.get('away_team')
            home_team = fb_data.get('home_team')
            
            player_odds = {}
            for book in fb_data.get('bookmakers', []):
                if any(ignored in book.get('title') for ignored in BOOKS_TO_IGNORE): continue
                for m in book.get('markets', []):
                    for out in m.get('outcomes', []):
                        player = out.get('description')
                        price = out.get('price')
                        if player and price:
                            if player not in player_odds: 
                                player_odds[player] = []
                            player_odds[player].append({"book": book['title'], "price": price})

            game_players_added = 0
            for player, lines in player_odds.items():
                try:
                    # 1. Safely find the absolute best odds available
                    best_line = max(lines, key=lambda x: int(x['price']) if str(x['price']).lstrip('-').isdigit() else -9999)
                    best_price = int(best_line['price'])
                    
                    # 2. Find the Market Consensus (average of all OTHER books)
                    other_lines = [l for l in lines if l['book'] != best_line['book']]
                    if len(other_lines) > 0:
                        consensus_prob = sum(calculate_implied_prob(l['price']) for l in other_lines) / len(other_lines)
                    else:
                        consensus_prob = calculate_implied_prob(best_price) # Fallback
                    
                    # 3. Calculate the Einstein Expected Value (EV%)
                    decimal_odds = calculate_decimal_odds(best_price)
                    ev_percent = round(((consensus_prob / 100) * decimal_odds - 1) * 100, 1)

                    # 4. Standard Metrics
                    implied_prob = calculate_implied_prob(best_price)
                    baseline_usage = round(implied_prob * 2, 1)

                    first_baskets.append({
                        "player_name": player,
                        "game": f"{away_team} vs {home_team}",
                        "team": f"{away_team} or {home_team}", 
                        "best_odds": f"+{best_price}" if best_price > 0 else str(best_price),
                        "bookmaker": best_line['book'],
                        "tip_win_prob": round(implied_prob, 1),
                        "first_shot_prob": baseline_usage, 
                        "einstein_ev": ev_percent,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })
                    game_players_added += 1
                except Exception as player_e:
                    # If ONE player has weird data, skip just them, not the whole game
                    print(f"      ⚠️ Player Math Skipped ({player}): {player_e}")
                    continue
            
            print(f"   ✅ Processed {game_players_added} players for {away_team} vs {home_team}")

        except Exception as game_e:
            print(f"      ⚠️ Game skipped due to API error: {game_e}")
            continue
        time.sleep(0.5)

    if first_baskets: 
        save_to_supabase(first_baskets, "first_baskets")
    else:
        print("No First Basket markets found for these games yet.")

if __name__ == "__main__":
    run_cloud_scan()
