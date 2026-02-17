import React, { useState, useEffect } from 'react';
import { Zap, Target, Search, BarChart3, TrendingUp, AlertCircle, ChevronRight, LayoutDashboard, Lock } from 'lucide-react';

/**
 * NBA Prop Sniper Dashboard
 * Features:
 * - Robust error handling for database responses
 * - Real-time market discrepancy scanning
 * - Premium paywall logic for locked edges
 * - Whop integration for seamless checkout
 */
const App = () => {
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false); 

  // --- 1. CONFIGURATION ---
  // Your Whop checkout link is correctly implemented here
  const whopLink = "https://whop.com/checkout/plan_EFF1P6AlgcidP";

  const fetchEdges = async () => {
    try {
      const response = await fetch('https://lmljhlxpaamemdngvair.supabase.co/rest/v1/nba_edges?select=*&order=updated_at.desc', {
        headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A'
        }
      });
      
      const data = await response.json();

      // CRITICAL FIX: Ensure 'data' is an array before setting state
      // If Supabase returns an error object {code, message}, we default to an empty list []
      if (Array.isArray(data)) {
        setEdges(data);
      } else {
        console.error("Database error or unexpected format:", data);
        setEdges([]);
      }
    } catch (err) {
      console.error("Network or parsing error:", err);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEdges();
    // Auto-refresh data every 30 seconds
    const interval = setInterval(fetchEdges, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleUpgrade = () => {
    if (whopLink === "YOUR_WHOP_LINK_HERE" || whopLink === "") {
        console.log("Setup needed: Paste Whop link in code.");
    } else {
        window.location.href = whopLink;
    }
  };

  // Safe slicing: displayedEdges will now always be an array
  const safeEdges = Array.isArray(edges) ? edges : [];
  const displayedEdges = isPremium ? safeEdges : safeEdges.slice(0, 2);
  const lockedCount = Math.max(0, safeEdges.length - displayedEdges.length);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Top Banner */}
      <div className="bg-indigo-600 px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-white">
        NBA Live Intelligence • Prop Sniper Pro Active
      </div>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="w-64 border-r border-white/5 h-screen sticky top-0 bg-[#0a0a0a] p-6 hidden lg:flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Target className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">Prop<span className="text-indigo-500">Sniper</span></h1>
          </div>

          <nav className="space-y-1 flex-1 text-left">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 transition-all">
                <LayoutDashboard size={18}/>
                <span className="text-sm font-bold tracking-tight text-left">Market Sniper</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-slate-300 transition-colors">
                <BarChart3 size={18}/>
                <span className="text-sm font-bold tracking-tight text-left">Player Forecasts</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-slate-300 transition-colors">
                <TrendingUp size={18}/>
                <span className="text-sm font-bold tracking-tight text-left">Bankroll Tracker</span>
            </button>
          </nav>

          {/* Upsell Widget */}
          {!isPremium && (
            <div className="p-4 bg-gradient-to-br from-indigo-900/20 to-slate-800/40 rounded-2xl border border-indigo-500/20 mt-auto">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Membership</p>
                <p className="text-xs text-slate-400 mb-3 text-left font-medium tracking-tight">Unlock all {safeEdges.length} active edges.</p>
                <button 
                onClick={handleUpgrade}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-900/20"
                >
                Upgrade to Pro
                </button>
            </div>
          )}
        </aside>

        {/* Main Feed */}
        <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="text-left">
              <h2 className="text-5xl font-black text-white tracking-tight mb-2 uppercase italic">Market Sniper</h2>
              <p className="text-slate-500 font-medium tracking-tight">Real-time discrepancies found across US books.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></div>
                {loading ? 'Updating...' : 'Live Feed'}
            </div>
          </header>

          {/* Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
             <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Live Edges</span>
                <span className="text-3xl font-black text-white tracking-tighter">{safeEdges.length}</span>
            </div>
             <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Avg. Edge</span>
                <span className="text-3xl font-black text-white tracking-tighter italic">1.9 pts</span>
            </div>
             <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</span>
                <span className="text-3xl font-black text-white tracking-tighter italic text-green-500 uppercase">Live</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-[#0f0f0f] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.15em] border-b border-white/5 bg-[#0a0a0a]">
                    <th className="px-8 py-4">Player</th>
                    <th className="px-8 py-4 text-center">Best Under</th>
                    <th className="px-8 py-4 text-center">Best Over</th>
                    <th className="px-8 py-4 text-right">The Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading && safeEdges.length === 0 ? (
                      <tr><td colSpan="4" className="py-20 text-center text-slate-400 animate-pulse uppercase tracking-widest text-xs font-bold">Scanning Markets...</td></tr>
                  ) : safeEdges.length === 0 ? (
                      <tr><td colSpan="4" className="py-20 text-center text-slate-500 uppercase tracking-widest text-xs font-bold italic">No gaps detected at this time.</td></tr>
                  ) : (
                    <>
                    {displayedEdges.map((edge, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-6">
                            <div className="flex flex-col text-white">
                            <span className="font-bold text-lg group-hover:text-indigo-400 transition-colors">{edge.player_name || 'Unknown'}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{edge.game || 'NBA Game'}</span>
                            </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                            <div className="flex flex-col">
                                <span className="text-xl font-mono font-black text-red-400">{edge.high_line || '--'}</span>
                                <span className="text-[9px] uppercase font-bold text-slate-600">{edge.high_book || 'Book'}</span>
                            </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                            <div className="flex flex-col">
                                <span className="text-xl font-mono font-black text-green-400">{edge.low_line || '--'}</span>
                                <span className="text-[9px] uppercase font-bold text-slate-600">{edge.low_book || 'Book'}</span>
                            </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                            <span className="text-sm font-black text-white italic">{edge.edge_size || '0'} PT GAP</span>
                        </td>
                        </tr>
                    ))}

                    {/* Locked Rows Paywall */}
                    {!isPremium && lockedCount > 0 && (
                        <tr>
                            <td colSpan="4" className="relative py-24 bg-black/40 border-t border-white/5">
                                <div className="flex flex-col items-center justify-center text-center px-6">
                                    <div className="w-12 h-12 bg-indigo-600/10 rounded-full flex items-center justify-center mb-4">
                                        <Lock className="text-indigo-500" size={24} />
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-2 italic uppercase tracking-tight">Unlock {lockedCount} More Live Gaps</h3>
                                    <p className="text-slate-400 text-sm mb-8 max-w-md font-medium">Upgrade to Pro to see the full board and receive real-time sniper alerts in Discord.</p>
                                    <button 
                                        onClick={handleUpgrade}
                                        className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-xs"
                                    >
                                        Access Pro Sniper
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
