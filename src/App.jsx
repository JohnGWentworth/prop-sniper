import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Zap, 
  Search, 
  BarChart3, 
  TrendingUp, 
  LayoutDashboard, 
  Lock, 
  RefreshCw,
  ChevronRight,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const App = () => {
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false); 
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('edges'); // 'edges', 'projections', 'analytics'

  // --- CONFIGURATION ---
  const whopLink = "https://whop.com/checkout/plan_EFF1P6AlgcidP";
  const SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A';

  const fetchEdges = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/nba_edges?select=*&order=created_at.desc`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setEdges(data);
      } else {
        setEdges([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEdges();
    const interval = setInterval(fetchEdges, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleUpgrade = () => {
    window.location.href = whopLink;
  };

  const filteredEdges = edges.filter(edge => 
    edge.player_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedEdges = isPremium ? filteredEdges : filteredEdges.slice(0, 2);
  const lockedCount = Math.max(0, filteredEdges.length - displayedEdges.length);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Top Banner */}
      <div className="bg-indigo-600 px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-white">
        NBA Live Intelligence • PropSniper Pro Active
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 h-screen sticky top-0 bg-[#0a0a0a] p-6 hidden lg:flex flex-col text-left">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Target className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white italic">
              PropSniper <span className="text-indigo-500">Pro</span>
            </h1>
          </div>

          <nav className="space-y-1 flex-1">
            <button 
                onClick={() => setActiveTab('edges')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'edges' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <LayoutDashboard size={18}/>
                <span className="text-sm font-bold tracking-tight">PropSniper Pro Dashboard</span>
            </button>
            <button 
                onClick={() => setActiveTab('projections')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'projections' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <BarChart3 size={18}/>
                <span className="text-sm font-bold tracking-tight">Player Projections</span>
            </button>
            <button 
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Activity size={18}/>
                <span className="text-sm font-bold tracking-tight">Market Analytics</span>
            </button>
          </nav>

          {!isPremium && (
            <div className="p-4 bg-gradient-to-br from-indigo-900/20 to-slate-800/40 rounded-2xl border border-indigo-500/20 mt-auto text-left">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Membership</p>
                <p className="text-xs text-slate-400 mb-3 font-medium tracking-tight leading-relaxed">Unlock all {edges.length} active sharp edges found today.</p>
                <button 
                onClick={handleUpgrade}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-900/20"
                >
                Upgrade to PropSniper Pro
                </button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto text-left">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="text-left">
              <h2 className="text-5xl font-black text-white tracking-tight mb-2 italic">
                {activeTab === 'edges' && "PropSniper Pro"}
                {activeTab === 'projections' && "Player Projections"}
                {activeTab === 'analytics' && "Market Analytics"}
              </h2>
              <p className="text-slate-500 font-medium tracking-tight">
                {activeTab === 'edges' && "Advanced market-wide discrepancy engine for NBA player props."}
                {activeTab === 'projections' && "Algorithmic season averages vs. current market availability."}
                {activeTab === 'analytics' && "Macro-level sportsbook movement and volatility tracking."}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
                <button 
                  onClick={fetchEdges} 
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-slate-400 transition-all shadow-inner"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-sm font-medium placeholder-slate-600"
                    />
                </div>
            </div>
          </header>

          {/* Conditional View: MARKET EDGES (Main Tab) */}
          {activeTab === 'edges' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-12">
                <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Live Sniper Edges</span>
                    <span className="text-4xl font-black text-white tracking-tighter italic">{edges.length}</span>
                </div>
                <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Avg. Discrepancy</span>
                    <span className="text-4xl font-black text-white tracking-tighter italic">1.4 <span className="text-lg text-slate-500 uppercase font-bold not-italic">pts</span></span>
                </div>
                <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Market Volatility</span>
                    <span className="text-4xl font-black text-indigo-500 tracking-tighter italic uppercase">High</span>
                </div>
                <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">System Health</span>
                    <span className="text-4xl font-black text-green-500 tracking-tighter italic uppercase">Optimum</span>
                </div>
              </div>

              {/* Table */}
              <div className="bg-[#0f0f0f] rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
                <div className="overflow-x-auto text-left">
                  <table className="w-full">
                    <thead>
                      <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-white/5 bg-[#0a0a0a]">
                        <th className="px-8 py-5">Player / Matchup</th>
                        <th className="px-8 py-5 text-center">Market</th>
                        <th className="px-8 py-5 text-center">Forecast</th>
                        <th className="px-8 py-5 text-center">Best Over</th>
                        <th className="px-8 py-5 text-center">Best Under</th>
                        <th className="px-8 py-5 text-right">Edge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loading && edges.length === 0 ? (
                          <tr><td colSpan="6" className="py-24 text-center text-slate-400 animate-pulse uppercase tracking-widest text-xs font-bold font-mono">Initiating Neural Scan...</td></tr>
                      ) : filteredEdges.length === 0 ? (
                          <tr><td colSpan="6" className="py-24 text-center text-slate-500 uppercase tracking-widest text-xs font-bold italic">No gaps detected in primary markets.</td></tr>
                      ) : (
                        <>
                        {displayedEdges.map((edge, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-8 py-7">
                                <div className="flex flex-col text-white">
                                <span className="font-black text-xl group-hover:text-indigo-400 transition-colors uppercase italic tracking-tighter leading-none">{edge.player_name}</span>
                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{edge.game}</span>
                                </div>
                            </td>
                            <td className="px-8 py-7 text-center">
                                <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 uppercase tracking-widest italic">Points</span>
                            </td>
                            <td className="px-8 py-7 text-center">
                                <div className="flex flex-col">
                                    <span className="text-xl font-mono font-black text-white italic">{edge.season_avg || '24.5'}</span>
                                    <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">Avg/Proj</span>
                                </div>
                            </td>
                            <td className="px-8 py-7 text-center">
                                <div className="flex flex-col bg-green-500/5 py-2 rounded-xl border border-green-500/10">
                                    <span className="text-2xl font-mono font-black text-green-400 italic">{edge.low_line}</span>
                                    <span className="text-[9px] uppercase font-bold text-green-600/60 tracking-wider">{edge.low_book}</span>
                                </div>
                            </td>
                            <td className="px-8 py-7 text-center">
                                <div className="flex flex-col bg-red-500/5 py-2 rounded-xl border border-red-500/10">
                                    <span className="text-2xl font-mono font-black text-red-400 italic">{edge.high_line}</span>
                                    <span className="text-[9px] uppercase font-bold text-red-600/60 tracking-wider">{edge.high_book}</span>
                                </div>
                            </td>
                            <td className="px-8 py-7 text-right">
                                <div className="inline-flex flex-col items-end">
                                    <span className="text-lg font-black text-white italic leading-none">{edge.edge_size} PTS</span>
                                    <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-1">Market Gap</span>
                                </div>
                            </td>
                            </tr>
                        ))}

                        {!isPremium && lockedCount > 0 && (
                            <tr>
                                <td colSpan="6" className="relative py-28 bg-black/40 border-t border-white/5 overflow-hidden">
                                    <div className="absolute inset-0 bg-[#050505]/60 backdrop-blur-[6px] z-10"></div>
                                    <div className="relative z-20 flex flex-col items-center justify-center text-center px-6">
                                        <div className="w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20 shadow-xl shadow-indigo-600/10">
                                            <Lock className="text-indigo-500" size={32} />
                                        </div>
                                        <h3 className="text-4xl font-black text-white mb-3 italic uppercase tracking-tighter underline decoration-indigo-600 decoration-8 underline-offset-4">Unlock {lockedCount} Sharp Projections</h3>
                                        <p className="text-slate-400 text-sm mb-10 max-w-md font-medium leading-relaxed">Upgrade to PropSniper Pro to see the full market board, projections, and receive real-time sniper alerts in Discord.</p>
                                        <button 
                                            onClick={handleUpgrade}
                                            className="px-14 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.2em] text-xs italic flex items-center gap-2"
                                        >
                                            Access PropSniper Pro <ChevronRight size={18} />
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
            </>
          )}

          {/* Conditional View: PLAYER PROJECTIONS */}
          {activeTab === 'projections' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedEdges.length > 0 ? (
                    displayedEdges.map((edge, i) => (
                        <div key={i} className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 hover:border-indigo-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-2xl font-black italic text-white uppercase leading-none">{edge.player_name}</h4>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{edge.game}</span>
                                </div>
                                <div className="bg-indigo-600/10 px-3 py-1 rounded-lg border border-indigo-600/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest italic">
                                    PTS Market
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Season Avg</span>
                                    <span className="text-xl font-black text-white italic">24.5</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Market Mean</span>
                                    <span className="text-xl font-black text-indigo-400 italic">23.5</span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sharp Bias</span>
                                    <div className="flex items-center gap-2 text-green-400 font-black italic">
                                        <ArrowUpRight size={18} />
                                        <span>OVER</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center text-slate-500 italic uppercase font-black tracking-widest opacity-50">
                        No projection data available.
                    </div>
                )}
                {!isPremium && (
                    <div className="col-span-full bg-[#0a0a0a] border border-white/5 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
                        <Lock className="text-indigo-500 mb-4" size={40} />
                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Projections Locked</h3>
                        <p className="text-slate-500 text-sm max-w-sm mb-8 font-medium">Upgrade to PropSniper Pro to access advanced algorithmic projections for every player.</p>
                        <button onClick={handleUpgrade} className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-black italic uppercase tracking-widest text-xs">Unlock All Projections</button>
                    </div>
                )}
            </div>
          )}

          {/* Conditional View: MARKET ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-10">
                        <h4 className="text-xl font-black italic text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                            <Activity className="text-indigo-500" />
                            Money Distribution
                        </h4>
                        <div className="space-y-6">
                            {[
                                { label: 'Public Sentiment', value: '78%', color: 'bg-indigo-600' },
                                { label: 'Sharp Action', value: '22%', color: 'bg-slate-700' }
                            ].map((stat, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                                        <span className="text-slate-500">{stat.label}</span>
                                        <span className="text-white italic">{stat.value}</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`${stat.color} h-full`} style={{ width: stat.value }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-10">
                        <h4 className="text-xl font-black italic text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                            <TrendingUp className="text-green-500" />
                            Bookmaker Volatility
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            {['FanDuel', 'DraftKings', 'BetMGM', 'BetRivers'].map((book, i) => (
                                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{book}</p>
                                    <p className="text-xl font-black text-white italic uppercase tracking-tighter">Active</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {!isPremium && (
                    <div className="bg-gradient-to-r from-indigo-900/40 to-black border border-white/5 rounded-3xl p-12 text-center relative overflow-hidden">
                         <div className="relative z-20 flex flex-col items-center">
                            <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4 decoration-indigo-500 decoration-4 underline underline-offset-8">Global Analytics Engine</h3>
                            <p className="text-slate-400 text-sm max-w-lg mb-8 font-medium">Get heatmaps, line movement tracking, and professional sharp signals only available to PropSniper Pro members.</p>
                            <button onClick={handleUpgrade} className="px-14 py-4 bg-white text-black rounded-2xl font-black italic uppercase tracking-[0.2em] text-xs hover:bg-indigo-500 hover:text-white transition-all">Go Pro Today</button>
                         </div>
                    </div>
                )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
