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
  User,
  LogOut,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

const App = () => {
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('edges'); 
  
  // --- AUTH & PREMIUM STATE ---
  const [isPremium, setIsPremium] = useState(false); 
  const [accessKey, setAccessKey] = useState(''); 

  // --- CONFIGURATION ---
  const whopLink = "https://whop.com/checkout/plan_EFF1P6AlgcidP";
  const SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A';

  // 1. SIMPLE SESSION MEMORY (Browser Storage)
  useEffect(() => {
    // Check if user already entered key previously
    const savedSession = localStorage.getItem('propSniperProAccess');
    if (savedSession === 'true') {
      setIsPremium(true);
    }
  }, []);

  // 2. KEY ENTRY LOGIC
  useEffect(() => {
    if (accessKey === "PRO2026") {
      setIsPremium(true);
      // Save to browser memory so they stay logged in
      localStorage.setItem('propSniperProAccess', 'true');
    }
  }, [accessKey]);

  const handleLogout = () => {
    setIsPremium(false);
    setAccessKey('');
    localStorage.removeItem('propSniperProAccess');
  };

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

  const filteredEdges = edges.filter(edge => 
    edge.player_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedEdges = isPremium ? filteredEdges : filteredEdges.slice(0, 3);
  const lockedCount = Math.max(0, filteredEdges.length - displayedEdges.length);

  // Helper for dynamic market badges
  const getMarketStyle = (market) => {
      switch(market) {
          case 'Rebounds': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
          case 'Assists': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          default: return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      }
  };

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
                <span className="text-sm font-bold tracking-tight">Player Forecasts</span>
            </button>
            <button 
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Activity size={18}/>
                <span className="text-sm font-bold tracking-tight">Market Analytics</span>
            </button>
          </nav>

          <div className="mt-auto space-y-4">
            {isPremium ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-left">Pro Status Active</span>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 text-slate-500 hover:text-white text-xs font-bold transition-all"><LogOut size={14} /> Sign Out</button>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-br from-indigo-900/20 to-slate-800/40 rounded-2xl border border-indigo-500/20 text-left">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Already a member?</p>
                <button onClick={() => window.location.href = whopLink} className="w-full py-2.5 bg-white text-black hover:bg-slate-200 rounded-xl text-xs font-bold transition-all mb-3 flex items-center justify-center gap-2"><User size={14} /> Verify Whop Access</button>
                <input type="password" placeholder="Enter Access Key..." value={accessKey} onChange={(e) => setAccessKey(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-lg py-1.5 px-3 text-[10px] focus:outline-none focus:border-indigo-500/50 text-white" />
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto text-left">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="text-left">
              <h2 className="text-5xl font-black text-white tracking-tight mb-2 italic uppercase">
                {activeTab === 'edges' ? 'PropSniper Pro' : activeTab === 'projections' ? 'Forecasts' : 'Analytics'}
              </h2>
              <p className="text-slate-500 font-medium tracking-tight">Real-time discrepancy engine for NBA player props.</p>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={fetchEdges} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-slate-400 transition-all"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" placeholder="Search markets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-sm font-medium" />
                </div>
            </div>
          </header>

          {activeTab === 'edges' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-12">
                <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 text-center shadow-lg">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Live Sniper Edges</span>
                    <span className="text-4xl font-black text-white tracking-tighter italic block leading-none">{edges.length}</span>
                </div>
                <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 text-center shadow-lg">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Avg. Discrepancy</span>
                    <span className="text-4xl font-black text-white tracking-tighter italic block leading-none">1.4 <span className="text-lg text-slate-500 not-italic uppercase font-bold">pts</span></span>
                </div>
                <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 text-center shadow-lg">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-indigo-400">Market Power</span>
                    <span className="text-4xl font-black text-indigo-500 tracking-tighter italic uppercase block leading-none">High</span>
                </div>
                <div className="bg-[#0f0f0f] p-6 rounded-3xl border border-white/5 text-center shadow-lg">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-green-400">Feed Status</span>
                    <span className="text-4xl font-black text-green-500 tracking-tighter italic uppercase block leading-none">Active</span>
                </div>
              </div>

              <div className="bg-[#0f0f0f] rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
                <div className="overflow-x-auto text-left">
                  <table className="w-full border-collapse">
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
                          <tr><td colSpan="6" className="py-24 text-center text-slate-400 animate-pulse uppercase tracking-widest text-xs font-bold font-mono">Syncing Proprietary Markets...</td></tr>
                      ) : edges.length === 0 ? (
                          <tr><td colSpan="6" className="py-24 text-center text-slate-500 uppercase tracking-widest text-xs font-bold italic">No gaps detected.</td></tr>
                      ) : (
                        <>
                        {displayedEdges.map((edge, i) => {
                            const isHighGap = parseFloat(edge.edge_size) >= 2.0;
                            return (
                                <tr key={i} className={`transition-colors group ${isHighGap ? 'bg-amber-500/5' : 'hover:bg-white/[0.02]'}`}>
                                <td className="px-8 py-7">
                                    <div className="flex flex-col text-white text-left">
                                    <span className={`font-black text-xl uppercase italic tracking-tighter leading-none ${isHighGap ? 'text-amber-400' : 'group-hover:text-indigo-400'}`}>{edge.player_name}</span>
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1.5">{edge.game}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-7 text-center">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest italic ${getMarketStyle(edge.market)}`}>
                                        {edge.market}
                                    </span>
                                </td>
                                <td className="px-8 py-7 text-center">
                                    <div className="flex flex-col">
                                        <span className="text-xl font-mono font-black text-white italic">{edge.season_avg || '24.5'}</span>
                                        <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">Avg/Proj</span>
                                    </div>
                                </td>
                                <td className="px-8 py-7 text-center">
                                    <div className={`flex flex-col py-2 rounded-xl border ${isHighGap ? 'bg-amber-500/10 border-amber-500/20 shadow-lg shadow-amber-900/20' : 'bg-green-500/5 border-green-500/10'}`}>
                                        <span className={`text-2xl font-mono font-black italic ${isHighGap ? 'text-amber-400' : 'text-green-400'}`}>{edge.low_line}</span>
                                        <span className={`text-[9px] uppercase font-bold tracking-wider ${isHighGap ? 'text-amber-600' : 'text-green-600/60'}`}>{edge.low_book}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-7 text-center">
                                    <div className={`flex flex-col py-2 rounded-xl border ${isHighGap ? 'bg-amber-500/10 border-amber-500/20 shadow-lg shadow-amber-900/20' : 'bg-red-500/5 border-red-500/10'}`}>
                                        <span className={`text-2xl font-mono font-black italic ${isHighGap ? 'text-amber-400' : 'text-red-400'}`}>{edge.high_line}</span>
                                        <span className={`text-[9px] uppercase font-bold tracking-wider ${isHighGap ? 'text-amber-600' : 'text-red-600/60'}`}>{edge.high_book}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-7 text-right">
                                    <div className="inline-flex flex-col items-end">
                                        <span className={`text-lg font-black italic leading-none ${isHighGap ? 'text-amber-400' : 'text-white'}`}>{edge.edge_size} PTS</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isHighGap ? 'text-amber-600' : 'text-indigo-500'}`}>Gap</span>
                                    </div>
                                </td>
                                </tr>
                            )
                        })}

                        {!isPremium && lockedCount > 0 && (
                            <tr>
                                <td colSpan="6" className="relative py-32 bg-black/40 border-t border-white/5 overflow-hidden text-center">
                                    <div className="absolute inset-0 bg-[#050505]/60 backdrop-blur-[6px] z-10"></div>
                                    <div className="relative z-20 flex flex-col items-center justify-center px-6">
                                        <div className="w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20 shadow-2xl shadow-indigo-600/20">
                                            <Lock className="text-indigo-500" size={32} />
                                        </div>
                                        <h3 className="text-4xl font-black text-white mb-3 italic uppercase tracking-tighter underline decoration-indigo-600 decoration-8 underline-offset-4">Unlock {lockedCount} PropSniper Edges</h3>
                                        <p className="text-slate-400 text-sm mb-10 max-w-md font-medium leading-relaxed">Upgrade to PropSniper Pro to see the full market board, projections, and receive real-time sniper alerts in Discord.</p>
                                        <button onClick={() => window.location.href = whopLink} className="px-14 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.2em] text-xs italic flex items-center gap-2">Access PropSniper Pro <ChevronRight size={18} /></button>
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

          {activeTab === 'projections' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedEdges.map((edge, i) => (
                      <div key={i} className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 text-left hover:border-indigo-500/30 transition-all group">
                          <div className="flex justify-between items-start mb-6">
                              <div>
                                <h4 className="text-2xl font-black italic text-white uppercase mb-1 leading-none group-hover:text-indigo-400">{edge.player_name}</h4>
                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-6">{edge.game}</span>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest italic ${getMarketStyle(edge.market)}`}>
                                  {edge.market}
                              </span>
                          </div>
                          <div className="space-y-4">
                              <div className="flex justify-between py-2 border-b border-white/5">
                                  <span className="text-xs font-bold text-slate-500 uppercase">Season Avg</span>
                                  <span className="text-lg font-black text-white italic">{edge.season_avg || '--'}</span>
                              </div>
                              <div className="flex justify-between py-2">
                                  <span className="text-xs font-bold text-slate-500 uppercase">Market Bias</span>
                                  <span className="text-lg font-black text-green-400 italic flex items-center gap-1 uppercase tracking-tighter">OVER <ArrowUpRight size={16} /></span>
                              </div>
                          </div>
                      </div>
                  ))}
                  {!isPremium && <div className="col-span-full py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 text-center uppercase font-black text-slate-500 tracking-widest italic flex flex-col items-center gap-4">
                      <Lock size={24} className="text-indigo-500" />
                      Upgrade to unlock all Forecasts
                  </div>}
              </div>
          )}

          {activeTab === 'analytics' && (
              <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-10 shadow-lg text-left">
                          <h4 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-8 flex items-center gap-4">
                              <TrendingUp className="text-indigo-500" /> Market Momentum
                          </h4>
                          <div className="space-y-8">
                              {[
                                  { label: 'DraftKings Volatility', value: 'High', color: 'text-red-400' },
                                  { label: 'FanDuel Sharp Action', value: 'Active', color: 'text-green-400' },
                                  { label: 'Market Mean Variance', value: '0.82', color: 'text-white' }
                              ].map((stat, i) => (
                                  <div key={i} className="flex justify-between border-b border-white/5 pb-4">
                                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{stat.label}</span>
                                      <span className={`text-xl font-black italic uppercase tracking-tighter ${stat.color}`}>{stat.value}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                      <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-10 shadow-lg text-left">
                          <h4 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-8 flex items-center gap-4">
                              <Activity className="text-green-500" /> Network Distribution
                          </h4>
                          <div className="grid grid-cols-2 gap-6">
                              {['PrizePicks', 'Underdog', 'Fliff', 'Sleeper'].map((app, i) => (
                                  <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center group hover:border-indigo-500/50 transition-all">
                                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{app}</p>
                                      <p className="text-2xl font-black text-white italic uppercase tracking-tighter">Synced</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
                  {!isPremium && (
                      <div className="bg-gradient-to-r from-indigo-900/40 to-[#0a0a0a] border border-white/5 rounded-3xl p-16 text-center relative overflow-hidden group">
                           <div className="relative z-20 flex flex-col items-center">
                              <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4 underline decoration-indigo-600 decoration-8 underline-offset-8">PropSniper Intelligence Engine</h3>
                              <p className="text-slate-400 text-sm max-w-lg mb-10 font-medium leading-relaxed">Access cross-platform heatmaps, line movement tracking, and professional sharp signals only available to Pro members.</p>
                              <button onClick={() => window.location.href = whopLink} className="px-16 py-4 bg-white text-black rounded-2xl font-black italic uppercase tracking-[0.2em] text-xs hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-2xl">Go Pro Today</button>
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
