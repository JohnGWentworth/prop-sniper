import requests
import time
import json
from datetime import datetime, timezone

# --- 1. CONFIGURATION ---
THE_ODDS_API_KEY = 'b8ad6f2ea05156239ed9f4c67a315eff'
BDL_API_KEY = '34a924cc-1a40-4386-89e6-3701418c4132'

SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A'

# --- 2. SETTINGS ---
GAP_THRESHOLD = 1.0 
GAME_LIMIT = 5 
MARKETS_TO_SCAN = ['player_points', 'player_rebounds', 'player_assists']

# UPDATED: Added 'BetRivers' to the ignore list to prevent skewed data
BOOKS_TO_IGNORE = ['Bovada', 'MyBookie.ag', 'BetOnline.ag', 'BetRivers']

# Cloud Cache (In-memory only, resets every run)
STATS_CACHE = {}

def get_season_avg(player_name, market_type):
    """Fetches the specific season stat from BallDontLie with Rate Limit Handling."""
    cache_key = f"{player_name}_{market_type}"
    if cache_key in STATS_CACHE: return STATS_CACHE[cache_key]

    print(f"      📊 Fetching stats for {player_name}...")
    headers = {'Authorization': BDL_API_KEY}
    
    # Polite delay for API limits
    time.sleep(1.5) 

    try:
        # 1. Search Player
        r = requests.get("https://api.balldontlie.io/v1/players", headers=headers, params={'search': player_name}, timeout=10)
        
        # Simple Retry Logic
        if r.status_code == 429:
            print("      ⏳ Rate Limit. Sleeping 30s...")
            time.sleep(30)
            r = requests.get("https://api.balldontlie.io/v1/players", headers=headers, params={'search': player_name}, timeout=10)
        
        data = r.json()
        if not data.get('data'): return 0
        p_id = data['data'][0]['id']
        
        # 2. Get 2025 Stats
        r_avg = requests.get("https://api.balldontlie.io/v1/season_averages", headers=headers, params={'season': 2025, 'player_ids[]': p_id}, timeout=10)
        
        if r_avg.status_code == 429:
            time.sleep(30)
            r_avg = requests.get("https://api.balldontlie.io/v1/season_averages", headers=headers, params={'season': 2025, 'player_ids[]': p_id}, timeout=10)

        avg_data = r_avg.json()
        if not avg_data.get('data'): return 0
        
        stats = avg_data['data'][0]
        val = 0
        if 'points' in market_type: val = stats.get('pts', 0)
        elif 'rebounds' in market_type: val = stats.get('reb', 0)
        elif 'assists' in market_type: val = stats.get('ast', 0)
            
        STATS_CACHE[cache_key] = val
        return val
    except:
        return 0

def get_nba_game_ids():
    print("☁️ [Cloud] Fetching schedule...")
    try:
        r = requests.get(f"https://api.the-odds-api.com/v4/sports/basketball_nba/events?apiKey={THE_ODDS_API_KEY}")
        return [e['id'] for e in r.json()] if r.status_code == 200 else []
    except: return []

def fetch_props(event_id, market_key):
    try:
        r = requests.get(f"https://api.the-odds-api.com/v4/sports/basketball_nba/events/{event_id}/odds?apiKey={THE_ODDS_API_KEY}&regions=us&markets={market_key}&oddsFormat=american")
        return r.json() if r.status_code == 200 else None
    except: return None

def save_to_supabase(edges):
    url = f"{SUPABASE_URL}/rest/v1/nba_edges"
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"}
    r = requests.post(url, headers=headers, json=edges)
    if r.status_code in [200, 201, 204]:
        print(f"✅ Cloud Update Success: {len(edges)} edges live.")
    else:
        print(f"❌ DB Error: {r.text}")

def run_cloud_scan():
    game_ids = get_nba_game_ids()
    if not game_ids: 
        print("No games found.")
        return

    found_edges = []
    
    # 1. LOOP BY MARKET FIRST
    for market in MARKETS_TO_SCAN:
        clean_market_name = market.replace('player_', '').capitalize()
        print(f"\nScanning: {clean_market_name}...")
        
        # 2. LOOP BY GAMES
        for event_id in game_ids[:GAME_LIMIT]:
            game_data = fetch_props(event_id, market)
            if not game_data or 'bookmakers' not in game_data: continue

            player_map = {}
            for book in game_data.get('bookmakers', []):
                book_name = book.get('title')
                
                # --- FILTER BAD BOOKS ---
                # Checks if any ignored book name appears in the title
                if any(ignored in book_name for ignored in BOOKS_TO_IGNORE):
                    continue
                # ------------------------

                for m in book.get('markets', []):
                    if m['key'] == market:
                        for out in m.get('outcomes', []):
                            if out.get('point'):
                                if out['description'] not in player_map: player_map[out['description']] = []
                                player_map[out['description']].append({"book": book['title'], "point": out['point']})

            for player, lines in player_map.items():
                if len(lines) > 1:
                    low = min(lines, key=lambda x: x['point'])
                    high = max(lines, key=lambda x: x['point'])
                    diff = high['point'] - low['point']

                    if diff >= GAP_THRESHOLD:
                        print(f"   🔥 Edge: {player} | {diff}pt gap")
                        avg = get_season_avg(player, market)
                        found_edges.append({
                            "player_name": player,
                            "game": f"{game_data.get('away_team')} vs {game_data.get('home_team')}",
                            "market": clean_market_name,
                            "low_line": float(low['point']),
                            "low_book": low['book'],
                            "high_line": float(high['point']),
                            "high_book": high['book'],
                            "edge_size": round(float(diff), 2),
                            "season_avg": avg, 
                            "created_at": datetime.now(timezone.utc).isoformat()
                        })
            # Slight delay between games to be safe
            time.sleep(1.0)
        
        # Cool down between markets
        time.sleep(5)

    if found_edges: 
        save_to_supabase(found_edges)
    else:
        print("Scan complete. No edges found.")

if __name__ == "__main__":
    # Runs once and exits (Perfect for GitHub Actions)
    run_cloud_scan()
