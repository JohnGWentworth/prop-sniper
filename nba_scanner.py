import requests
import time
import json
from datetime import datetime, timezone

# --- CONFIGURATION ---
THE_ODDS_API_KEY = 'b8ad6f2ea05156239ed9f4c67a315eff'
BDL_API_KEY = '34a924cc-1a40-4386-89e6-3701418c4132'
SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A'

GAP_THRESHOLD = 1.0 
GAME_LIMIT = 10
MARKETS_TO_SCAN = ['player_points', 'player_rebounds', 'player_assists']
BOOKS_TO_IGNORE = ['Bovada', 'MyBookie.ag', 'BetOnline.ag']
STATS_CACHE = {}

def get_season_avg(player_name, market_type):
    cache_key = f"{player_name}_{market_type}"
    if cache_key in STATS_CACHE: return STATS_CACHE[cache_key]
    
    # Simple retry logic for stats
    headers = {'Authorization': BDL_API_KEY}
    for attempt in range(2):
        try:
            time.sleep(1) # Polite delay
            search = requests.get("https://api.balldontlie.io/v1/players", headers=headers, params={'search': player_name}, timeout=5).json()
            if not search.get('data'): return 0
            
            p_id = search['data'][0]['id']
            avg = requests.get("https://api.balldontlie.io/v1/season_averages", headers=headers, params={'season': 2025, 'player_ids[]': p_id}, timeout=5).json()
            
            val = 0
            if avg.get('data'):
                s = avg['data'][0]
                if 'points' in market_type: val = s.get('pts', 0)
                elif 'rebounds' in market_type: val = s.get('reb', 0)
                elif 'assists' in market_type: val = s.get('ast', 0)
            
            STATS_CACHE[cache_key] = val
            return val
        except:
            time.sleep(1)
    return 0

def save_to_supabase(edges):
    url = f"{SUPABASE_URL}/rest/v1/nba_edges"
    headers = {
        "apikey": SUPABASE_KEY, 
        "Authorization": f"Bearer {SUPABASE_KEY}", 
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    requests.post(url, headers=headers, json=edges)

def run_cloud_scan():
    print("☁️ Starting Cloud Scan...")
    
    # 1. Get Games
    try:
        games = requests.get(f"https://api.the-odds-api.com/v4/sports/basketball_nba/events?apiKey={THE_ODDS_API_KEY}").json()
        if not isinstance(games, list): return
    except: return

    found_edges = []
    
    for game in games[:GAME_LIMIT]:
        game_id = game['id']
        for market in MARKETS_TO_SCAN:
            # 2. Fetch Odds
            try:
                odds = requests.get(f"https://api.the-odds-api.com/v4/sports/basketball_nba/events/{game_id}/odds?apiKey={THE_ODDS_API_KEY}&regions=us&markets={market}&oddsFormat=american").json()
            except: continue
            
            if not odds or 'bookmakers' not in odds: continue

            # 3. Analyze
            player_map = {}
            for book in odds.get('bookmakers', []):
                if any(x in book['title'] for x in BOOKS_TO_IGNORE): continue
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
                        print(f"   🔥 Edge: {player} ({diff})")
                        clean_market = market.replace('player_', '').capitalize()
                        avg = get_season_avg(player, market)
                        
                        found_edges.append({
                            "player_name": player,
                            "game": f"{game['away_team']} vs {game['home_team']}",
                            "market": clean_market,
                            "low_line": float(low['point']),
                            "low_book": low['book'],
                            "high_line": float(high['point']),
                            "high_book": high['book'],
                            "edge_size": round(float(diff), 2),
                            "season_avg": avg,
                            "created_at": datetime.now(timezone.utc).isoformat()
                        })
    
    if found_edges:
        save_to_supabase(found_edges)
        print(f"✅ Uploaded {len(found_edges)} edges.")
    else:
        print("✅ No edges found.")

if __name__ == "__main__":
    run_cloud_scan()