import requests
import time
import json
import os
from datetime import datetime, timezone

# --- 1. CONFIGURATION ---
API_KEY = '5f628a5b66f578a4bea36edba378dac4'
BDL_API_KEY = '34a924cc-1a40-4386-89e6-3701418c4132' # Added for Team lookups

SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A'

# --- 2. SETTINGS ---
GAP_THRESHOLD = 1.0 
GAME_LIMIT = 8 
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
    """Uses the BDL API to find a player's team, caching the result to save credits."""
    if player_name in TEAM_CACHE:
        return TEAM_CACHE[player_name]
        
    print(f"      🕵️‍♂️ Identifying team for {player_name}...")
    headers = {'Authorization': BDL_API_KEY}
    time.sleep(2.0) # Stay under the 30 req/min BDL limit
    
    try:
        r = requests.get("https://api.balldontlie.io/v1/players", headers=headers, params={'search': player_name}, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get('data'):
                team_full = data['data'][0]['team']['full_name']
                TEAM_CACHE[player_name] = team_full
                save_team_cache(TEAM_CACHE)
                return team_full
    except Exception as e:
        print(f"      ❌ Could not identify team for {player_name}.")
        
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
        game_ids = [e['id'] for e in r_games.json()] if r_games.status_code == 200 else []
    except:
        print("❌ Could not fetch schedule.")
        return

    if not game_ids:
        print("🔍 No games found.")
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

    # --- PART 2: FIRST BASKETS & TIP-OFF MATH ---
    print("\n🏆 Scanning First Baskets (Intelligence Layer Active)...")
    first_baskets = []
    
    premium_markets = "player_first_basket,first_team_to_score,player_first_basket_method"

    for event_id in game_ids[:GAME_LIMIT]:
        try:
            fb_url = f"https://api.the-odds-api.com/v4/sports/basketball_nba/events/{event_id}/odds?apiKey={API_KEY}&regions=us&markets={premium_markets}&oddsFormat=american"
            fb_data = requests.get(fb_url, timeout=15).json()
            
            # STEP 1: Find the Tip-Win Probabilities for each team from 'first_team_to_score'
            team_tip_probs = {}
            for book in fb_data.get('bookmakers', []):
                for m in book.get('markets', []):
                    if m['key'] == 'first_team_to_score':
                        for out in m.get('outcomes', []):
                            team_name = out.get('description')
                            prob = calculate_implied_prob(out.get('price'))
                            if team_name and team_name not in team_tip_probs:
                                team_tip_probs[team_name] = prob

            # STEP 2: Gather all odds
            player_odds = {}
            for book in fb_data.get('bookmakers', []):
                if any(ignored in book.get('title') for ignored in BOOKS_TO_IGNORE): continue
                for m in book.get('markets', []):
                    market_key = m['key']
                    for out in m.get('outcomes', []):
                        player_or_team = out.get('description')
                        price = out.get('price')
                        if player_or_team and price:
                            unique_id = f"{player_or_team}_{market_key}"
                            if unique_id not in player_odds: 
                                player_odds[unique_id] = {
                                    "name": player_or_team,
                                    "market_type": market_key,
                                    "lines": []
                                }
                            player_odds[unique_id]["lines"].append({"book": book['title'], "price": price})

            # STEP 3: Process the Intelligence and Build the Database Array
            for unique_id, data in player_odds.items():
                best = max(data["lines"], key=lambda x: x['price'])
                market_type = data["market_type"]
                player_prob = calculate_implied_prob(best['price'])
                
                team_name = "Unknown"
                tip_prob = 50.0
                first_shot_usage = 0.0

                if market_type == "player_first_basket":
                    # Figure out their team and usage
                    team_name = get_player_team(data["name"])
                    tip_prob = team_tip_probs.get(team_name, 50.0)
                    first_shot_usage = round((player_prob / tip_prob) * 100, 1) if tip_prob > 0 else 0.0
                    clean_market = "First Basket"
                    
                elif market_type == "first_team_to_score":
                    team_name = data["name"]
                    tip_prob = player_prob
                    first_shot_usage = 100.0 # They are the team
                    clean_market = "First Team to Score"
                    
                elif market_type == "player_first_basket_method":
                    base_name = data["name"].split(" - ")[0] if " - " in data["name"] else data["name"]
                    team_name = get_player_team(base_name)
                    tip_prob = team_tip_probs.get(team_name, 50.0)
                    first_shot_usage = round((player_prob / tip_prob) * 100, 1) if tip_prob > 0 else 0.0
                    clean_market = "First Basket Method"

                first_baskets.append({
                    "player_name": data["name"],
                    "game": f"{fb_data.get('away_team')} vs {fb_data.get('home_team')}",
                    "team": team_name, 
                    "best_odds": f"+{best['price']}" if best['price'] > 0 else str(best['price']),
                    "bookmaker": best['book'],
                    "tip_win_prob": float(tip_prob),
                    "first_shot_prob": float(first_shot_usage),
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
        except: continue
        time.sleep(0.5)

    if first_baskets: 
        save_to_supabase(first_baskets, "first_baskets")
    else:
        print("No First Basket markets found for these games yet.")

if __name__ == "__main__":
    run_cloud_scan()
