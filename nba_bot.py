import requests
from datetime import datetime, timedelta, timezone

# --- CONFIGURATION ---
# PASTE YOUR WEBHOOK URL HERE
DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1473430586302529629/cp9Gap9O59Ck-wiyIQTigool0tthtp3IDQFAkB9NiQOkvwQygDEqqia3U61UHrHHpVmf"

SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A'

def send_alert(edge):
	if "YOUR_WEBHOOK" in DISCORD_WEBHOOK_URL: return

    color = 5814783
    if edge.get('market') == 'Rebounds': color = 16753920
    if edge.get('market') == 'Assists': color = 5763719

    embed = {
        "title": f"🎯 {edge.get('market', 'Points')} Edge: {edge['player_name']}",
        "description": f"**{edge['game']}**\nTotal Gap: **{edge['edge_size']}**",
        "color": color, 
        "fields": [
            {"name": "📈 Over", "value": f"{edge['low_line']} ({edge['low_book']})", "inline": True},
            {"name": "📉 Under", "value": f"{edge['high_line']} ({edge['high_book']})", "inline": True},
            {"name": "📊 Avg", "value": str(edge.get('season_avg', '--')), "inline": True}
        ],
        "footer": {"text": "PropSniper Pro • Cloud Alert"},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    try:
        requests.post(DISCORD_WEBHOOK_URL, json={"embeds": [embed]})
    except: pass

def run_cloud_bot():
    print("🤖 Checking DB for fresh edges...")
    
    # Get edges created in the last 20 minutes
    # We use 20 mins to cover the 15 min scan interval + buffer
    time_threshold = (datetime.now(timezone.utc) - timedelta(minutes=120)).isoformat()
    
    url = f"{SUPABASE_URL}/rest/v1/nba_edges?select=*&created_at=gt.{time_threshold}"
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    
    try:
        r = requests.get(url, headers=headers)
        edges = r.json()
        
        if isinstance(edges, list) and len(edges) > 0:
            print(f"🔥 Found {len(edges)} recent edges. Sending alerts...")
            for edge in edges:
                send_alert(edge)
        else:
            print("✅ No new edges in the last 120 mins.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_cloud_bot()
