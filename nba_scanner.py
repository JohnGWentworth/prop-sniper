import requests
import time
from datetime import datetime, timezone

# --- 1. CONFIGURATION ---
THE_ODDS_API_KEY = 'b8ad6f2ea05156239ed9f4c67a315eff'
PROP_ODDS_API_KEY = '5f628a5b66f578a4bea36edba378dac4' # Paste your key from the $59 plan here

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
    r = requests.post(url, headers=headers, json=data)
    if r.status_code in [200, 201, 204]:
        print(f"✅ DB Update: {len(data)} rows sent to {table_name}.")
    else:
        print(f"❌ DB Error: {r.text}")

def get_nba_game_ids():
    """Gets Game IDs for PropOdds/Odds API."""
    try:
        r = requests.get(f"https://api.the-odds-api.com/v4/sports/basketball_nba/events?apiKey={THE_ODDS_API_KEY}")
        return [e['id'] for e in r.json()] if r.status_code == 200 else []
    except: return []

def run_cloud_scan():
    game_ids = get_nba_game_ids()
    if not game_ids: return

    # --- PART 1: LIVE MARKET EDGES (The Odds API) ---
    # (Existing logic omitted here for brevity, keep your current loop from nba_scanner.py)
    # ... Your existing Edge scanning code ...

    # --- PART 2: FIRST BASKETS (PropOdds API) ---
    print("\n🏆 SCANNING: First Baskets (PropOdds)...")
    first_baskets = []
    
    # PropOdds requires their own Game IDs. We fetch the current NBA slate from them.
    try:
        po_games_url = f"https://api.prop-odds.com/v4/nba/games?api_key={PROP_ODDS_API_KEY}"
        game_response = requests.get(po_games_url).json()
        
        # Look for today's games
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        po_games = [g for g in game_response.get('games', []) if today in g.get('start_time', '')]

        for game in po_games[:GAME_LIMIT]:
            game_id = game['game_id']
            # Fetch the specific First Basket Scorer market
            market_url = f"https://api.prop-odds.com/v4/markets/{game_id}?api_key={PROP_ODDS_API_KEY}&market=first_basket_scorer"
            market_data = requests.get(market_url).json()
            
            player_odds = {}
            for market in market_data.get('markets', []):
                for book in market.get('bookmakers', []):
                    book_name = book.get('bookmaker_name')
                    if any(ignored in book_name for ignored in BOOKS_TO_IGNORE): continue
                    
                    for outcome in book.get('outcomes', []):
                        player = outcome.get('participant_name')
                        price = outcome.get('price') # e.g. 650
                        
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
            time.sleep(1.0) # Respect rate limits

        if first_baskets:
            save_to_supabase(first_baskets, "first_baskets")
        else:
            print("No First Basket odds found yet.")

    except Exception as e:
        print(f"❌ PropOdds Error: {e}")

if __name__ == "__main__":
    run_cloud_scan()
