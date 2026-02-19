import requests
import time
from datetime import datetime, timezone

# --- 1. CONFIGURATION ---
THE_ODDS_API_KEY = 'b8ad6f2ea05156239ed9f4c67a315eff'
PROP_ODDS_API_KEY = '5f628a5b66f578a4bea36edba378dac4' 

SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A'

# --- 2. SETTINGS ---
GAP_THRESHOLD = 1.0 
GAME_LIMIT = 5 
MARKETS_TO_SCAN = ['player_points', 'player_rebounds', 'player_assists']
BOOKS_TO_IGNORE = ['Bovada', 'MyBookie.ag', 'BetOnline.ag', 'BetRivers']

def save_to_supabase(data, table_name="nba_edges"):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    headers = {
        "apikey": SUPABASE_KEY, 
        "Authorization": f"Bearer {SUPABASE_KEY}", 
        "Content-Type": "application/json", 
        "Prefer": "resolution=merge-duplicates"
    }
    # Implement retry for DB
    for i in range(3):
        try:
            r = requests.post(url, headers=headers, json=data, timeout=15)
            if r.status_code in [200, 201, 204]:
                print(f"✅ DB Update: {len(data)} rows sent to {table_name}.")
                return
            else:
                print(f"⚠️ DB Attempt {i+1} failed: {r.text}")
        except:
            pass
        time.sleep(2)

def get_nba_game_ids():
    """Gets Game IDs from The Odds API."""
    try:
        r = requests.get(f"https://api.the-odds-api.com/v4/sports/basketball_nba/events?apiKey={THE_ODDS_API_KEY}", timeout=15)
        return [e['id'] for e in r.json()] if r.status_code == 200 else []
    except: return []

def fetch_props(event_id, market_key):
    """Fetches prop lines from The Odds API."""
    try:
        r = requests.get(f"https://api.the-odds-api.com/v4/sports/basketball_nba/events/{event_id}/odds?apiKey={THE_ODDS_API_KEY}&regions=us&markets={market_key}&oddsFormat=american", timeout=15)
        return r.json() if r.status_code == 200 else None
    except: return None

def run_cloud_scan():
    game_ids = get_nba_game_ids()
    if not game_ids: 
        print("🔍 No games found via Odds API.")
    else:
        found_edges = []
        # --- PART 1: LIVE MARKET EDGES ---
        for market in MARKETS_TO_SCAN:
            clean_market_name = market.replace('player_', '').capitalize()
            print(f"🔵 SCANNING: {clean_market_name}...")
            
            for event_id in game_ids[:GAME_LIMIT]:
                game_data = fetch_props(event_id, market)
                if not game_data or 'bookmakers' not in game_data: continue

                player_map = {}
                for book in game_data.get('bookmakers', []):
                    book_name = book.get('title')
                    if any(ignored in book_name for ignored in BOOKS_TO_IGNORE): continue
                    
                    for m in book.get('markets', []):
                        if m['key'] == market:
                            for out in m.get('outcomes', []):
                                if out.get('point'):
                                    desc = out['description']
                                    if desc not in player_map: player_map[desc] = []
                                    player_map[desc].append({"book": book['title'], "point": out['point']})

                for player, lines in player_map.items():
                    if len(lines) > 1:
                        low = min(lines, key=lambda x: x['point'])
                        high = max(lines, key=lambda x: x['point'])
                        diff = high['point'] - low['point']

                        if diff >= GAP_THRESHOLD:
                            found_edges.append({
                                "player_name": player,
                                "game": f"{game_data.get('away_team')} vs {game_data.get('home_team')}",
                                "market": clean_market_name,
                                "low_line": float(low['point']),
                                "low_book": low['book'],
                                "high_line": float(high['point']),
                                "high_book": high['book'],
                                "edge_size": round(float(diff), 2),
                                "created_at": datetime.now(timezone.utc).isoformat()
                            })
                time.sleep(0.5)

        if found_edges:
            save_to_supabase(found_edges, "nba_edges")

    # --- PART 2: FIRST BASKETS (PropOdds API) ---
    print("\n🏆 SCANNING: First Baskets (PropOdds)...")
    first_baskets = []
    
    try:
        # Use the standard v4/games/nba endpoint
        po_games_url = f"https://api.prop-odds.com/v4/games/nba?api_key={PROP_ODDS_API_KEY}"
        
        # Retry logic for DNS issues
        game_response = None
        for i in range(3):
            try:
                r = requests.get(po_games_url, timeout=15)
                if r.status_code == 200:
                    game_response = r.json()
                    break
            except Exception as e:
                print(f"⚠️ DNS/Connection retry {i+1}...")
                time.sleep(2)
        
        if game_response:
            today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
            po_games = [g for g in game_response.get('games', []) if today in g.get('start_time', '')]

            for game in po_games[:GAME_LIMIT]:
                game_id = game['game_id']
                market_url = f"https://api.prop-odds.com/v4/markets/{game_id}?api_key={PROP_ODDS_API_KEY}&market=first_basket_scorer"
                
                try:
                    m_res = requests.get(market_url, timeout=15).json()
                    player_odds = {}
                    
                    for market in m_res.get('markets', []):
                        for book in market.get('bookmakers', []):
                            book_name = book.get('bookmaker_name')
                            if any(ignored in book_name for ignored in BOOKS_TO_IGNORE): continue
                            
                            for outcome in book.get('outcomes', []):
                                player = outcome.get('participant_name')
                                price = outcome.get('price')
                                if player and price:
                                    if player not in player_odds: player_odds[player] = []
                                    player_odds[player].append({"book": book_name, "price": price})

                    for player, lines in player_odds.items():
                        best_line = max(lines, key=lambda x: x['price'])
                        first_baskets.append({
                            "player_name": player,
                            "game": f"{game['away_team']} vs {game['home_team']}",
                            "team": "TBD", 
                            "best_odds": f"+{best_line['price']}",
                            "bookmaker": best_line['book'],
                            "created_at": datetime.now(timezone.utc).isoformat()
                        })
                except:
                    continue
                time.sleep(0.5)

            if first_baskets:
                save_to_supabase(first_baskets, "first_baskets")
            else:
                print("No First Basket odds found yet.")
        else:
            print("❌ Failed to reach PropOdds API after retries.")

    except Exception as e:
        print(f"❌ PropOdds Critical Error: {e}")

if __name__ == "__main__":
    run_cloud_scan()
