import requests
import time
from datetime import datetime, timezone

# --- 1. CONFIGURATION ---
# Using your $59/mo The-Odds-API Key for both segments
API_KEY = '5f628a5b66f578a4bea36edba378dac4'

SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A'

# --- 2. SETTINGS ---
GAP_THRESHOLD = 1.0 
GAME_LIMIT = 8 # Increased limit since you have the $59 plan
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
    
    # 1. Fetch Schedule
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

    # --- PART 2: FIRST BASKETS ---
    print("\n🏆 Scanning First Baskets (Premium Market)...")
    first_baskets = []
    for event_id in game_ids[:GAME_LIMIT]:
        try:
            # Market Key for First Basket Scorer
            fb_url = f"https://api.the-odds-api.com/v4/sports/basketball_nba/events/{event_id}/odds?apiKey={API_KEY}&regions=us&markets=player_first_basket&oddsFormat=american"
            fb_data = requests.get(fb_url, timeout=15).json()
            
            player_odds = {}
            for book in fb_data.get('bookmakers', []):
                if any(ignored in book.get('title') for ignored in BOOKS_TO_IGNORE): continue
                for m in book.get('markets', []):
                    if m['key'] == 'player_first_basket':
                        for out in m.get('outcomes', []):
                            player = out.get('description')
                            price = out.get('price')
                            if player and price:
                                if player not in player_odds: player_odds[player] = []
                                player_odds[player].append({"book": book['title'], "price": price})

            for player, lines in player_odds.items():
                best = max(lines, key=lambda x: x['price'])
                first_baskets.append({
                    "player_name": player,
                    "game": f"{fb_data.get('away_team')} vs {fb_data.get('home_team')}",
                    "team": "TBD",
                    "best_odds": f"+{best['price']}",
                    "bookmaker": best['book'],
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
        except: continue
        time.sleep(0.2)

    if first_baskets: 
        save_to_supabase(first_baskets, "first_baskets")
    else:
        print("No First Basket markets found for these games yet.")

if __name__ == "__main__":
    run_cloud_scan()
