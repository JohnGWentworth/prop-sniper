import requests
from bs4 import BeautifulSoup
import json

# --- CONFIGURATION ---
SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A'

# The 4 critical vulnerabilities we are tracking
TARGETS = {
    'paint': 'https://www.teamrankings.com/nba/stat/opponent-points-in-paint-per-game',
    'rebounds': 'https://www.teamrankings.com/nba/stat/opponent-total-rebounds-per-game',
    'assists': 'https://www.teamrankings.com/nba/stat/opponent-assists-per-game',
    'threes': 'https://www.teamrankings.com/nba/stat/opponent-three-point-pct'
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def scrape_stat(url):
    """Scrapes TeamRankings and returns a dictionary of {Team: Value}"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        table = soup.find('table', {'class': 'tr-table'})
        
        if not table: return {}
            
        rows = table.find('tbody').find_all('tr')
        stat_dict = {}
        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 3:
                team_name = cols[1].text.strip()
                val = float(cols[2].text.strip().replace('%', ''))
                stat_dict[team_name] = val
        return stat_dict
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return {}

def run_daily_defense_scan():
    print("🕵️‍♂️ Initiating Daily Vulnerability Scan...")
    
    # 1. Scrape all 4 endpoints
    print("   📊 Fetching Paint Defense...")
    paint_data = scrape_stat(TARGETS['paint'])
    print("   📊 Fetching Rebound Defense...")
    reb_data = scrape_stat(TARGETS['rebounds'])
    print("   📊 Fetching Assist Defense...")
    ast_data = scrape_stat(TARGETS['assists'])
    print("   📊 Fetching 3PT Defense...")
    three_data = scrape_stat(TARGETS['threes'])

    # 2. Compile into a single master database list
    master_data = []
    for team in paint_data.keys():
        master_data.append({
            "team": team,
            "paint": paint_data.get(team, 0),
            "rebounds": reb_data.get(team, 0),
            "assists": ast_data.get(team, 0),
            "threes": three_data.get(team, 0)
        })

    # 3. Push to Supabase
    print("🚀 Pushing Intelligence to Database...")
    url = f"{SUPABASE_URL}/rest/v1/team_defense"
    headers = {
        "apikey": SUPABASE_KEY, 
        "Authorization": f"Bearer {SUPABASE_KEY}", 
        "Content-Type": "application/json", 
        "Prefer": "resolution=merge-duplicates" # Overwrites existing teams daily
    }
    
    r = requests.post(url, headers=headers, json=master_data)
    if r.status_code in [200, 201, 204]:
        print("✅ SUCCESS: Defense Matrix updated in Supabase.")
    else:
        print(f"❌ DB Error: {r.text}")

if __name__ == "__main__":
    run_daily_defense_scan()
