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
  Trophy,
  Zap
} from 'lucide-react';

const App = () => {
  const [edges, setEdges] = useState([]);
  const [firstBaskets, setFirstBaskets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('first_baskets'); 
  
  // --- AUTH & PREMIUM STATE ---
  const [isPremium, setIsPremium] = useState(false); 
  const [accessKey, setAccessKey] = useState(''); 

  // --- CONFIGURATION ---
  const whopLink = "https://whop.com/checkout/plan_EFF1P6AlgcidP";
  const SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A';

  const fetchData = async () => {
    setLoading(true);
    const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };
    try {
      // Fetch Edges
      const edgeRes = await fetch(`${SUPABASE_URL}/rest/v1/nba_edges?select=*&order=created_at.desc`, { headers });
      const edgeData = await edgeRes.json();
      if (Array.isArray(edgeData)) setEdges(edgeData);

      // Fetch First Baskets
      const fbRes = await fetch(`${SUPABASE_URL}/rest/v1/first_baskets?select=*&order=created_at.desc`, { headers });
      const fbData = await fbRes.json();
      if (Array.isArray(fbData)) setFirstBaskets(fbData);

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (accessKey === "PRO2026") {
      setIsPremium(true);
      localStorage.setItem('propSniperProAccess', 'true');
    }
    if (localStorage.getItem('propSniperProAccess') === 'true') setIsPremium(true);
  }, [accessKey]);

  const handleLogout = () => {
    setIsPremium(false);
    setAccessKey('');
    localStorage.removeItem('propSniperProAccess');
  };

  // Filter Logic
  const filteredEdges = edges.filter(e => e.player_name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredBaskets = firstBaskets.filter(b => b.player_name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const displayedEdges = isPremium ? filteredEdges : filteredEdges.slice(0, 3);
  const displayedBaskets = isPremium ? filteredBaskets : filteredBaskets.slice(0, 3);

  const getMarketStyle = (market) => {
      switch(market) {
          case 'Rebounds': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
          case 'Assists': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          default: return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-indigo-500/30">
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
            <h1 className="text-xl font-black tracking-tighter text-white italic">PropSniper <span className="text-indigo-500">Pro</span></h1>
          </div>

          <nav className="space-y-1 flex-1">
            <button onClick={() => setActiveTab('first_baskets')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'first_baskets' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}>
                <Trophy size={18}/><span className="text-sm font-bold tracking-tight">First Baskets</span>
            </button>
            <button onClick={() => setActiveTab('edges')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'edges' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}>
                <Zap size={18}/><span className="text-sm font-bold tracking-tight">Live Market Edges</span>
            </button>
          </nav>

          <div className="mt-auto space-y-4">
            {isPremium ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                <div className="flex items-center gap-2 text-green-400 mb-2"><ShieldCheck size={16} /><span className="text-[10px] font-bold uppercase tracking-widest">Pro Status Active</span></div>
                <button onClick={handleLogout} className="w-full py-2 text-slate-500 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2"><LogOut size={14} /> Sign Out</button>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-br from-indigo-900/20 to-slate-800/40 rounded-2xl border border-indigo-500/20 text-left">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Already a member?</p>
                <button onClick={() => window.location.href = whopLink} className="w-full py-2.5 bg-white text-black hover:bg-slate-200 rounded-xl text-xs font-bold transition-all mb-3 flex items-center justify-center gap-2"><User size={14} /> Verify Whop Access</button>
                <input type="password" placeholder="Enter Access Key..." value={accessKey} onChange={(e) => setAccessKey(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-lg py-1.5 px-3 text-[10px] text-white" />
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto text-left">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="text-left">
              <h2 className="text-5xl font-black text-white tracking-tight mb-2 italic uppercase">
                {activeTab === 'first_baskets' ? 'First Baskets' : 'Market Edges'}
              </h2>
              <p className="text-slate-500 font-medium tracking-tight">
                {activeTab === 'first_baskets' ? 'Real-time First Basket Scorer odds from major sportsbooks.' : 'Live price discrepancies in NBA player props.'}
              </p>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={fetchData} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-slate-400 transition-all"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input type="text" placeholder="Search players..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 w-64 text-sm font-medium" />
                </div>
            </div>
          </header>

          {activeTab === 'first_baskets' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedBaskets.length > 0 ? (
                      displayedBaskets.map((basket, i) => (
                          <div key={i} className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 hover:border-indigo-500/30 transition-all relative overflow-hidden group">
                              <div className="absolute -right-4 -top-4 text-white/[0.02] group-hover:text-white/[0.05] transition-colors"><Trophy size={140} /></div>
                              <div className="relative z-10">
                                  <div className="mb-6">
                                      <h4 className="text-2xl font-black italic text-white uppercase mb-1 leading-none group-hover:text-indigo-400">{basket.player_name}</h4>
                                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{basket.game}</span>
                                  </div>
                                  <div className="space-y-4">
                                      <div className="flex justify-between items-center py-3 border-b border-white/5">
                                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Best Odds</span>
                                          <span className="text-3xl font-black text-green-400 italic">{basket.best_odds}</span>
                                      </div>
                                      <div className="flex justify-between items-center py-2">
                                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bookmaker</span>
                                          <span className="text-sm font-black text-white italic bg-white/5 px-3 py-1 rounded-lg">{basket.bookmaker}</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="col-span-full py-40 text-center border border-dashed border-white/10 rounded-3xl">
                          <Trophy className="mx-auto mb-4 text-slate-800" size={48} />
                          <p className="uppercase font-black text-xl italic tracking-widest text-slate-600">Awaiting Market Odds...</p>
                      </div>
                  )}
                  {!isPremium && filteredBaskets.length > 3 && (
                    <div className="col-span-full mt-6 p-12 bg-indigo-600/5 border border-indigo-500/20 rounded-3xl text-center">
                        <Lock className="mx-auto mb-4 text-indigo-500" size={32} />
                        <h3 className="text-2xl font-black text-white italic uppercase mb-2">Unlock {filteredBaskets.length - 3} More Targets</h3>
                        <button onClick={() => window.location.href = whopLink} className="mt-4 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest">Access PropSniper Pro</button>
                    </div>
                  )}
              </div>
          )}

          {activeTab === 'edges' && (
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
                        {displayedEdges.map((edge, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-8 py-7 text-left">
                                    <div className="flex flex-col">
                                        <span className="font-black text-xl uppercase italic tracking-tighter text-white group-hover:text-indigo-400">{edge.player_name}</span>
                                        <span className="text-[10px] text-slate-500 uppercase font-black mt-1">{edge.game}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-7 text-center">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest italic ${getMarketStyle(edge.market)}`}>{edge.market}</span>
                                </td>
                                <td className="px-8 py-7 text-center">
                                    <div className="flex flex-col py-2 rounded-xl border bg-green-500/5 border-green-500/10">
                                        <span className="text-2xl font-mono font-black italic text-green-400">{edge.low_line}</span>
                                        <span className="text-[9px] uppercase font-bold text-green-600/60">{edge.low_book}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-7 text-center">
                                    <div className="flex flex-col py-2 rounded-xl border bg-red-500/5 border-red-500/10">
                                        <span className="text-2xl font-mono font-black italic text-red-400">{edge.high_line}</span>
                                        <span className="text-[9px] uppercase font-bold text-red-600/60">{edge.high_book}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-7 text-right">
                                    <div className="inline-flex flex-col items-end">
                                        <span className="text-lg font-black italic text-white leading-none">{edge.edge_size} PTS</span>
                                        <span className="text-[10px] font-black uppercase text-indigo-500 mt-1">Market Gap</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {!isPremium && filteredEdges.length > 3 && (
                    <div className="relative py-32 bg-black/60 backdrop-blur-md border-t border-white/5 text-center">
                        <Lock className="mx-auto mb-6 text-indigo-500" size={40} />
                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Unlock Premium Market Gaps</h3>
                        <button onClick={() => window.location.href = whopLink} className="px-14 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs italic transition-all hover:scale-105">Upgrade to Pro</button>
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
