import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Search, 
  LayoutDashboard, 
  Lock, 
  RefreshCw,
  ChevronRight,
  User,
  LogOut,
  ShieldCheck,
  Trophy
} from 'lucide-react';

const App = () => {
  const [edges, setEdges] = useState([]);
  const [firstBaskets, setFirstBaskets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- STRATEGIC PIVOT: First Baskets is now the default home page ---
  const [activeTab, setActiveTab] = useState('first_baskets'); 
  
  // --- AUTH & PREMIUM STATE ---
  const [isPremium, setIsPremium] = useState(false); 
  const [accessKey, setAccessKey] = useState(''); 

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

  const fetchFirstBaskets = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/first_baskets?select=*&order=created_at.desc`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) setFirstBaskets(data);
    } catch (err) {
      console.error("Fetch FB error:", err);
    }
  };

  useEffect(() => {
    const fetchAll = () => {
      fetchEdges();
      fetchFirstBaskets();
    };
    fetchAll();
    const interval = setInterval(fetchAll, 30000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check session memory
    const savedSession = localStorage.getItem('propSniperProAccess');
    if (savedSession === 'true') setIsPremium(true);
    
    // Check manual key
    if (accessKey === "PRO2026") {
      setIsPremium(true);
      localStorage.setItem('propSniperProAccess', 'true');
    }
  }, [accessKey]);

  const handleLogout = () => {
    setIsPremium(false);
    setAccessKey('');
    localStorage.removeItem('propSniperProAccess');
  };

  const filteredEdges = edges.filter(edge => 
    edge.player_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedEdges = isPremium ? filteredEdges : filteredEdges.slice(0, 3);
  const lockedCount = Math.max(0, filteredEdges.length - displayedEdges.length);

  const filteredBaskets = firstBaskets.filter(fb => 
    fb.player_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const displayedBaskets = isPremium ? filteredBaskets : filteredBaskets.slice(0, 3);
  const lockedBasketsCount = Math.max(0, filteredBaskets.length - displayedBaskets.length);

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
            {/* Swapped order: First Baskets is now at the top of the sidebar */}
            <button 
                onClick={() => setActiveTab('first_baskets')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'first_baskets' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Trophy size={18}/>
                <span className="text-sm font-bold tracking-tight">First Baskets</span>
            </button>
            <button 
                onClick={() => setActiveTab('edges')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'edges' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <LayoutDashboard size={18}/>
                <span className="text-sm font-bold tracking-tight">Live Market Edges</span>
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
                {activeTab === 'first_baskets' ? 'First Baskets' : 'Live Market Edges'}
              </h2>
              <p className="text-slate-500 font-medium tracking-tight">
                {activeTab === 'first_baskets' ? 'Predictive modeling for NBA tip-off winners and first possession usage.' : 'Real-time discrepancy engine for NBA player props.'}
              </p>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={fetchEdges} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-slate-400 transition-all"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" placeholder="Search players..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-sm font-medium" />
                </div>
            </div>
          </header>

         {/* VIEW 1: FIRST BASKETS (Now the default view) */}
          {activeTab === 'first_baskets' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading && firstBaskets.length === 0 ? (
                      <div className="col-span-full py-24 text-center text-slate-400 animate-pulse uppercase tracking-widest text-xs font-bold font-mono">Syncing First Baskets...</div>
                  ) : firstBaskets.length === 0 ? (
                      <div className="col-span-full py-24 text-center text-slate-500 uppercase tracking-widest text-xs font-bold italic">No First Baskets found. Run your scanner.</div>
                  ) : (
                      <>
                      {displayedBaskets.map((basket, i) => (
                          <div key={i} className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 text-left hover:border-indigo-500/30 transition-all group relative overflow-hidden shadow-lg">
                              <div className="absolute -right-6 -top-6 text-white/5 group-hover:text-indigo-500/10 transition-colors transform rotate-12">
                                  <Trophy size={120} />
                              </div>
                              <div className="relative z-10">
                                  <div className="flex justify-between items-start mb-6">
                                      <div>
                                        <h4 className="text-2xl font-black italic text-white uppercase mb-1 leading-none group-hover:text-indigo-400">{basket.player_name}</h4>
                                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">{basket.game}</span>
                                      </div>
                                      <span className="text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest italic text-amber-400 bg-amber-500/10 border-amber-500/20">
                                          1st Basket
                                      </span>
                                  </div>
                                  <div className="space-y-4">
                                      <div className="flex justify-between items-center py-3 border-b border-white/5">
                                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Best Price</span>
                                          <span className="text-3xl font-black text-green-400 italic">{basket.best_odds}</span>
                                      </div>
                                      <div className="flex justify-between items-center py-2">
                                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sportsbook</span>
                                          <span className="text-sm font-black text-white italic bg-white/10 px-3 py-1 rounded-lg">{basket.bookmaker}</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                      {!isPremium && lockedBasketsCount > 0 && (
                          <div className="col-span-full py-20 bg-black/40 border border-white/5 rounded-3xl text-center relative overflow-hidden mt-4">
                              <div className="absolute inset-0 bg-[#050505]/60 backdrop-blur-[6px] z-10"></div>
                              <div className="relative z-20 flex flex-col items-center justify-center px-6">
                                  <div className="w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20 shadow-2xl shadow-indigo-600/20">
                                      <Lock className="text-indigo-500" size={32} />
                                  </div>
                                  <h3 className="text-3xl font-black text-white mb-3 italic uppercase tracking-tighter">Unlock {lockedBasketsCount} More Lotto Tickets</h3>
                                  <p className="text-slate-400 text-sm mb-8 font-medium max-w-md">Upgrade to Pro to see the complete list of First Basket targets and the best market odds.</p>
                                  <button onClick={() => window.location.href = whopLink} className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-2xl transition-all uppercase tracking-widest text-xs italic flex items-center gap-2 hover:scale-105 active:scale-95">Access Pro <ChevronRight size={16} /></button>
                              </div>
                          </div>
                      )}
                      </>
                  )}
              </div>
          )}

          {/* VIEW 2: EDGES */}
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
                        <th className="px-8 py-5 text-center">Best Over</th>
                        <th className="px-8 py-5 text-center">Best Under</th>
                        <th className="px-8 py-5 text-right">Edge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loading && edges.length === 0 ? (
                          <tr><td colSpan="5" className="py-24 text-center text-slate-400 animate-pulse uppercase tracking-widest text-xs font-bold font-mono">Syncing Proprietary Markets...</td></tr>
                      ) : edges.length === 0 ? (
                          <tr><td colSpan="5" className="py-24 text-center text-slate-500 uppercase tracking-widest text-xs font-bold italic">No gaps detected. Run your scanner.</td></tr>
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
                                <td colSpan="5" className="relative py-32 bg-black/40 border-t border-white/5 overflow-hidden text-center">
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

        </main>
      </div>
    </div>
  );
};

export default App;
