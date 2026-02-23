import requests
import time
import json
import os
from datetime import datetime, timezone, timedelta

# --- 1. CONFIGURATION ---
API_KEY = '5f628a5b66f578a4bea36edba378dac4'
BDL_API_KEY = '34a924cc-1a40-4386-89e6-3701418c4132' 

SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A'

# --- 2. SETTINGS ---
GAP_THRESHOLD = 1.0 
GAME_LIMIT = 15 
MARKETS_TO_SCAN = ['player_points', 'player_rebounds', 'player_assists']
BOOKS_TO_IGNORE = ['Bovada', 'MyBookie.ag', 'BetOnline.ag', 'BetRivers']
TEAM_CACHE_FILE = "player_teams_cache.json"

# --- 3. TEAM ROSTER CACHE ---
def load_team_cache():
    if os.path.exists(TEAM_CACHE_FILE):
        try:
            with open(TEAM_CACHE_FILE, 'r') as f: return json.load(f)
        except: return {}
    return {}

def save_team_cache(cache):
    try:
        with open(TEAM_CACHE_FILE, 'w') as f: json.dump(cache, f)
    except: pass

TEAM_CACHE = load_team_cache()

def get_player_team(player_name):
    """Uses the BDL API to find a player's team with strict rate limit protection."""
    # Don't return 'Unknown' from cache, force a retry if it failed previously
    if player_name in TEAM_CACHE and TEAM_CACHE[player_name] != "Unknown":
        return TEAM_CACHE[player_name]
        
    print(f"      🕵️‍♂️ Identifying team for {player_name}...")
    headers = {'Authorization': BDL_API_KEY}
    time.sleep(2.1) # Strictly > 2 seconds to avoid 30/min limit
    
    try:
        r = requests.get("https://api.balldontlie.io/v1/players", headers=headers, params={'search': player_name}, timeout=10)
        
        # If we hit the speed limit, sleep and retry once
        if r.status_code == 429:
            print("      ⏳ BDL Rate Limit. Sleeping 60s to protect math...")
            time.sleep(60)
            r = requests.get("https://api.balldontlie.io/v1/players", headers=headers, params={'search': player_name}, timeout=10)

        if r.status_code == 200:
            data = r.json()
            if data.get('data'):
                team_full = data['data'][0]['team']['full_name']
                TEAM_CACHE[player_name] = team_full
                save_team_cache(TEAM_CACHE)
                return team_full
    except Exception as e:
        pass
        
    return "Unknown"

# --- 4. SHARP BETTOR MATH ---
def calculate_implied_prob(american_odds):
    """Converts +400 into 20.0%, or -150 into 60.0%."""
    try:
        odds = int(american_odds)
        if odds > 0: return round((100 / (odds + 100)) * 100, 1)
        else: return round((abs(odds) / (abs(odds) + 100)) * 100, 1)
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

    # --- PART 2: FIRST BASKETS & BULLETPROOF TIP MATH ---
    print("\n🏆 Scanning First Baskets (Intelligence Layer Active)...")
    first_baskets = []
    
    for event_id in game_ids[:GAME_LIMIT]:
        try:
            fb_url = f"https://api.the-odds-api.com/v4/sports/basketball_nba/events/{event_id}/odds?apiKey={API_KEY}&regions=us&markets=player_first_basket&oddsFormat=american"
            r_fb = requests.get(fb_url, timeout=15)
            
            if r_fb.status_code != 200:
                continue
                    
            fb_data = r_fb.json()
            home_team = fb_data.get('home_team')
            away_team = fb_data.get('away_team')
            
            # 1. Gather all player odds for the game
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

            # 2. Strict Team Mapping (Prevents the 100% Bug)
            game_players = []
            team_implied_totals = {home_team: 0.0, away_team: 0.0}

            for player, lines in player_odds.items():
                best = max(lines, key=lambda x: x['price'])
                prob = calculate_implied_prob(best['price'])
                bdl_team = get_player_team(player)
                
                assigned_team = "Unknown"
                if bdl_team != "Unknown":
                    # Fuzzy match: Look at just the mascot (e.g., "Lakers") to sync the APIs
                    bdl_mascot = bdl_team.split()[-1] 
                    if bdl_mascot in home_team:
                        assigned_team = home_team
                        team_implied_totals[home_team] += prob
                    elif bdl_mascot in away_team:
                        assigned_team = away_team
                        team_implied_totals[away_team] += prob
                
                game_players.append({
                    "name": player,
                    "team": assigned_team,
                    "best_price": best['price'],
                    "best_book": best['book'],
                    "prob": prob
                })

            # 3. Calculate True Ratios (Home vs Away only)
            total_identified_juice = team_implied_totals[home_team] + team_implied_totals[away_team]

            for p in game_players:
                # If a player couldn't be mapped, default to baseline so they don't break the game math
                if p["team"] == "Unknown":
                    tip_prob = 50.0
                    first_shot_usage = 0.0
                else:
                    team_raw_prob = team_implied_totals[p["team"]]
                    
                    # True Tip Win % (Home vs Away ratio)
                    tip_prob = (team_raw_prob / total_identified_juice * 100) if total_identified_juice > 0 else 50.0
                    
                    # First Shot Usage (Player vs Their Own Team)
                    first_shot_usage = (p["prob"] / team_raw_prob * 100) if team_raw_prob > 0 else 0.0

                first_baskets.append({
                    "player_name": p["name"],
                    "game": f"{away_team} vs {home_team}",
                    "team": p["team"] if p["team"] != "Unknown" else "TBD", 
                    "best_odds": f"+{p['best_price']}" if p['best_price'] > 0 else str(p['best_price']),
                    "bookmaker": p['best_book'],
                    "tip_win_prob": round(tip_prob, 1),
                    "first_shot_prob": round(first_shot_usage, 1),
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
        except Exception as e:
            print(f"      ⚠️ Game Error: {e}")
            continue
        time.sleep(0.5)

    if first_baskets: 
        save_to_supabase(first_baskets, "first_baskets")
    else:
        print("No First Basket markets found for these games yet.")

if __name__ == "__main__":
    run_cloud_scan()
