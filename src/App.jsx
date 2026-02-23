import React, { useState, useEffect } from 'react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Trophy,
  RefreshCcw,
  Zap,
  Target,
  Crown,
  Flame,
  Lock,
  ShieldCheck,
  LogOut
} from 'lucide-react';

const SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const whopLink = "https://whop.com/checkout/plan_EFF1P6AlgcidP";

export default function App() {
  const [edges, setEdges] = useState([]);
  const [baskets, setBaskets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('FirstBaskets'); 
  const [filter, setFilter] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // --- AUTH & PREMIUM STATE ---
  const [isPremium, setIsPremium] = useState(false); 
  const [accessKey, setAccessKey] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. FRESHNESS FILTER: Only grab data from the last 16 hours
      const cutoffTime = new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString();

      // Fetch Edges
      const { data: edgeData } = await supabase
        .from('nba_edges')
        .select('*')
        .gte('created_at', cutoffTime)
        .order('created_at', { ascending: false })
        .limit(200); // Increased limit to grab history before deduplicating

      if (edgeData) {
        // 2. DEDUPLICATION ENGINE: Keep only the newest row per Player per Market
        const uniqueEdges = [];
        const seenEdges = new Set();
        edgeData.forEach(edge => {
          const uniqueKey = `${edge.player_name}_${edge.market}`;
          if (!seenEdges.has(uniqueKey)) {
            seenEdges.add(uniqueKey);
            uniqueEdges.push(edge);
          }
        });
        setEdges(uniqueEdges);
      }

      // Fetch First Baskets
      const { data: basketData } = await supabase
        .from('first_baskets')
        .select('*')
        .gte('created_at', cutoffTime)
        .order('created_at', { ascending: false })
        .limit(300);

      if (basketData) {
        // 2. DEDUPLICATION ENGINE: Keep only the newest row per Player
        const uniqueBaskets = [];
        const seenPlayers = new Set();
        basketData.forEach(basket => {
          if (!seenPlayers.has(basket.player_name)) {
            seenPlayers.add(basket.player_name);
            uniqueBaskets.push(basket);
          }
        });
        setBaskets(uniqueBaskets);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- ACCESS KEY LOGIC ---
  useEffect(() => {
    if (accessKey === "PRO2026") {
      setIsPremium(true);
      localStorage.setItem('propSniperProAccess', 'true');
    }
    if (localStorage.getItem('propSniperProAccess') === 'true') {
      setIsPremium(true);
    }
  }, [accessKey]);

  const handleLogout = () => {
    setIsPremium(false);
    setAccessKey('');
    localStorage.removeItem('propSniperProAccess');
  };

  // --- GRADE CALCULATION (EV SCORE) ---
  const getSniperGrade = (usage) => {
    if (usage >= 30) return { grade: 'A+', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (usage >= 25) return { grade: 'A', color: 'text-green-400 bg-green-500/10 border-green-500/20' };
    if (usage >= 20) return { grade: 'B', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (usage >= 15) return { grade: 'C', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    return { grade: 'F', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
  };

  // --- ALPHA DOGS CALCULATION ---
  const getAlphaDogs = () => {
    const games = {};
    baskets.forEach(b => {
      if (!games[b.game]) games[b.game] = [];
      games[b.game].push(b);
    });

    let alphas = [];
    Object.values(games).forEach(gamePlayers => {
      gamePlayers.sort((a, b) => parseFloat(b.first_shot_prob) - parseFloat(a.first_shot_prob));
      if (gamePlayers.length >= 2) {
        const topDog = gamePlayers[0];
        const runnerUp = gamePlayers[1];
        const topDogUsage = parseFloat(topDog.first_shot_prob);
        const runnerUpUsage = parseFloat(runnerUp.first_shot_prob);
        const gap = topDogUsage - runnerUpUsage;

        if (topDogUsage >= 20.0 && gap >= 4.0) {
          alphas.push({ ...topDog, dominanceGap: gap.toFixed(1) });
        }
      }
    });
    return alphas.sort((a, b) => parseFloat(b.dominanceGap) - parseFloat(a.dominanceGap));
  };

  // --- STRICT PAYWALL LIMITS ---
  const filteredEdges = filter === 'All' ? edges : edges.filter(e => e.market === filter);
  
  const alphaDogsList = getAlphaDogs();
  const displayedAlphas = isPremium ? alphaDogsList : alphaDogsList.slice(0, 2);
  const displayedBaskets = isPremium ? baskets : baskets.slice(0, 3);
  const displayedEdges = isPremium ? filteredEdges : filteredEdges.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans selection:bg-indigo-500/30">
      <nav className="border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white italic hidden sm:block">PropSniper <span className="text-indigo-500">Pro</span></span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* TOP NAV ACCESS CONTROL */}
              {!isPremium ? (
                <input 
                  type="password" 
                  placeholder="Enter Access Key..." 
                  value={accessKey} 
                  onChange={(e) => setAccessKey(e.target.value)} 
                  className="bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 w-36 sm:w-48 transition-all" 
                />
              ) : (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-bold text-green-400 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={14} /> Pro Active</span>
                  <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors" title="Sign Out"><LogOut size={14} /></button>
                </div>
              )}

              <button onClick={fetchData} className="p-2 hover:bg-white/5 rounded-full transition-colors border border-white/5">
                <RefreshCcw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 text-left">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <button 
            onClick={() => setView('AlphaDogs')}
            className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-black italic uppercase tracking-widest text-xs ${
              view === 'AlphaDogs' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' : 'bg-[#0f0f0f] border-white/5 text-slate-500 hover:bg-white/5 hover:text-slate-300'
            }`}
          >
            <Crown className="w-4 h-4" /> Alpha Dogs
          </button>
          <button 
            onClick={() => setView('FirstBaskets')}
            className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-black italic uppercase tracking-widest text-xs ${
              view === 'FirstBaskets' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' : 'bg-[#0f0f0f] border-white/5 text-slate-500 hover:bg-white/5 hover:text-slate-300'
            }`}
          >
            <Trophy className="w-4 h-4" /> The Master Board
          </button>
          <button 
            onClick={() => setView('Edges')}
            className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-black italic uppercase tracking-widest text-xs ${
              view === 'Edges' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' : 'bg-[#0f0f0f] border-white/5 text-slate-500 hover:bg-white/5 hover:text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" /> Live Edges
          </button>
        </div>

        {/* VIEW 1: ALPHA DOGS */}
        {view === 'AlphaDogs' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2 flex items-center gap-3">
                  <Flame className="text-orange-500" size={32} /> Alpha Dog Targets
                </h2>
                <p className="text-slate-500 font-medium tracking-tight">Players who mathematically dominate their team's early usage based on live odds.</p>
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                <Clock className="w-3 h-3" /> Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {displayedAlphas.length > 0 ? (
                displayedAlphas.map((alpha, i) => (
                  <div key={i} className="bg-gradient-to-br from-[#0f0f0f] to-[#141414] border border-white/5 hover:border-indigo-500/50 rounded-3xl p-8 relative overflow-hidden group transition-all shadow-xl">
                    <div className="absolute right-0 top-0 opacity-[0.03] group-hover:opacity-10 transition-all transform translate-x-4 -translate-y-4">
                      <Crown size={180} />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-3xl font-black italic text-white uppercase mb-1 leading-none tracking-tighter">{alpha.player_name}</h4>
                          <span className="text-xs text-indigo-400 uppercase font-bold tracking-widest">{alpha.game}</span>
                        </div>
                        <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                          <Crown size={14} /> Alpha
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5">
                          <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Priced Odds</span>
                          <span className="text-2xl font-black text-green-400 italic">{alpha.best_odds}</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5">
                          <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">True Prob</span>
                          <span className="text-2xl font-black text-white">{alpha.tip_win_prob}%</span>
                        </div>
                        <div className="bg-indigo-600/10 p-4 rounded-2xl text-center border border-indigo-500/20">
                          <span className="block text-[10px] text-indigo-400 uppercase font-bold tracking-widest mb-1">Early Usage</span>
                          <span className="text-2xl font-black text-indigo-400">{alpha.first_shot_prob}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dominance Gap</span>
                        <div className="text-right">
                          <span className="text-lg font-black text-white italic">+{alpha.dominanceGap}%</span>
                          <span className="text-[9px] text-slate-500 uppercase font-bold block">vs 2nd Option</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : loading ? (
                <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-3xl">
                  <Crown className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-pulse" />
                  <p className="text-slate-500 uppercase font-black tracking-widest text-sm">Calculating Alphas...</p>
                </div>
              ) : (
                <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-3xl bg-black/20">
                  <Crown className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-300 uppercase font-black tracking-widest text-lg italic mb-2">No Alpha Dogs Qualify Today</p>
                  <p className="text-slate-500 text-sm max-w-lg mx-auto font-medium">The math shows no player has a dominant usage gap over their teammates on tonight's slate. Check the Master Board for standard targets.</p>
                </div>
              )}
            </div>

            {!isPremium && alphaDogsList.length > 2 && (
              <div className="mt-8 bg-gradient-to-r from-indigo-900/40 to-[#0a0a0a] border border-white/5 rounded-3xl p-12 text-center relative overflow-hidden">
                <div className="relative z-20 flex flex-col items-center">
                  <Lock className="text-indigo-500 mb-4" size={32} />
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Unlock {alphaDogsList.length - 2} More Alpha Dogs</h3>
                  <p className="text-slate-400 text-sm max-w-lg mb-8 font-medium">Upgrade to Pro to see the complete list of players dominating their team's early usage tonight.</p>
                  <button onClick={() => window.location.href = whopLink} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-black italic uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl">Upgrade to PropSniper Pro</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: FIRST BASKETS (MASTER BOARD) */}
        {view === 'FirstBaskets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                <Trophy className="text-indigo-500" /> First Basket Master Board
              </h2>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                <Clock className="w-3 h-3" /> Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedBaskets.length > 0 ? (
                displayedBaskets.map((basket, i) => {
                  const gradeInfo = getSniperGrade(basket.first_shot_prob);
                  return (
                    <div key={i} className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                      <div className="absolute -right-4 -top-4 text-white/[0.02] group-hover:text-white/[0.05] transition-colors"><Target size={120} /></div>
                      
                      <div className="relative z-10">
                        <div className="mb-4 pb-4 border-b border-white/5 flex justify-between items-start">
                          <div>
                            <h4 className="text-xl font-black italic text-white uppercase mb-1">{basket.player_name}</h4>
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{basket.game}</span>
                          </div>
                          <div className={`px-3 py-1.5 rounded-lg border flex flex-col items-center ${gradeInfo.color}`}>
                            <span className="text-[8px] uppercase font-black tracking-widest opacity-80 mb-0.5">Grade</span>
                            <span className="text-xl font-black italic leading-none">{gradeInfo.grade}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Best Odds</span>
                            <div className="text-right">
                               <span className="text-2xl font-black text-green-400 italic">{basket.best_odds}</span>
                               <p className="text-[9px] text-slate-500 uppercase font-bold">{basket.bookmaker}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 pt-2">
                              <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                  <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Implied Prob</span>
                                  <span className="text-lg font-black text-white">{basket.tip_win_prob}%</span>
                              </div>
                              <div className="bg-indigo-600/10 p-3 rounded-xl border border-indigo-500/20 text-center">
                                  <span className="block text-[9px] text-indigo-400 uppercase font-bold tracking-widest mb-1">Early Usage</span>
                                  <span className="text-lg font-black text-indigo-400">{basket.first_shot_prob}%</span>
                              </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-3xl">
                  <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 uppercase font-bold tracking-widest text-sm">Awaiting market odds...</p>
                </div>
              )}
            </div>

            {!isPremium && baskets.length > 3 && (
              <div className="mt-8 bg-gradient-to-r from-indigo-900/40 to-[#0a0a0a] border border-white/5 rounded-3xl p-12 text-center relative overflow-hidden">
                <div className="relative z-20 flex flex-col items-center">
                  <Lock className="text-indigo-500 mb-4" size={32} />
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Unlock {baskets.length - 3} More First Basket Targets</h3>
                  <button onClick={() => window.location.href = whopLink} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-black italic uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl">Upgrade to PropSniper Pro</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: LIVE EDGES (Legacy) */}
        {view === 'Edges' && (
          <div className="opacity-90">
            <div className="flex items-center justify-between mb-6">
              <div className="flex bg-white/5 p-1 rounded-xl">
                {['All', 'Points', 'Rebounds', 'Assists'].map((tab) => (
                  <button key={tab} onClick={() => setFilter(tab)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === tab ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {displayedEdges.length > 0 ? (
                displayedEdges.map((edge) => (
                  <div key={edge.id} className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-white">{edge.player_name}</h3>
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-black uppercase">{edge.market}</span>
                        </div>
                        <p className="text-sm text-slate-500">{edge.game}</p>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Low Line</p>
                          <p className="text-xl font-black text-white">{edge.low_line} <span className="text-xs font-normal text-slate-500">{edge.low_book}</span></p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">High Line</p>
                          <p className="text-xl font-black text-white">{edge.high_line} <span className="text-xs font-normal text-slate-500">{edge.high_book}</span></p>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl text-center">
                          <p className="text-[10px] text-slate-400 uppercase font-black">Gap</p>
                          <p className="text-xl font-black text-white">+{edge.edge_size}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
                  <p className="text-slate-500 uppercase font-bold tracking-widest text-sm">No edges found.</p>
                </div>
              )}
            </div>

            {!isPremium && filteredEdges.length > 3 && (
              <div className="mt-4 bg-gradient-to-r from-indigo-900/40 to-[#0a0a0a] border border-white/5 rounded-3xl p-12 text-center relative overflow-hidden">
                <div className="relative z-20 flex flex-col items-center">
                  <Lock className="text-indigo-500 mb-4" size={32} />
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Unlock {filteredEdges.length - 3} More Market Edges</h3>
                  <button onClick={() => window.location.href = whopLink} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-black italic uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl">Upgrade to PropSniper Pro</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
