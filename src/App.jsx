import React, { useState, useEffect } from 'react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { 
  Clock, 
  Trophy,
  RefreshCcw,
  Target,
  Crown,
  Flame,
  Lock,
  ShieldCheck,
  LogOut,
  BrainCircuit,
  ShieldAlert,
  Swords,
  Activity
} from 'lucide-react';

const SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const whopLink = "https://whop.com/checkout/plan_EFF1P6AlgcidP";

export default function App() {
  const [baskets, setBaskets] = useState([]);
  const [defense, setDefense] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('FirstBaskets'); 
  const [basketSort, setBasketSort] = useState('EV');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const [isPremium, setIsPremium] = useState(false); 
  const [accessKey, setAccessKey] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const cutoffTime = new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString();

      // Fetch First Baskets
      const { data: basketData } = await supabase
        .from('first_baskets')
        .select('*')
        .gte('created_at', cutoffTime)
        .order('created_at', { ascending: false })
        .limit(300);

      if (basketData) {
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

      // Fetch Defense Data
      const { data: defenseData } = await supabase
        .from('team_defense')
        .select('*');
      if (defenseData) setDefense(defenseData);

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

  const getSniperGrade = (usage) => {
    if (usage >= 30) return { grade: 'A+', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (usage >= 25) return { grade: 'A', color: 'text-green-400 bg-green-500/10 border-green-500/20' };
    if (usage >= 20) return { grade: 'B', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (usage >= 15) return { grade: 'C', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    return { grade: 'F', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
  };

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
        const gap = parseFloat(topDog.first_shot_prob) - parseFloat(runnerUp.first_shot_prob);

        if (parseFloat(topDog.first_shot_prob) >= 20.0 && gap >= 4.0) {
          alphas.push({ ...topDog, dominanceGap: gap.toFixed(1) });
        }
      }
    });
    return alphas.sort((a, b) => parseFloat(b.dominanceGap) - parseFloat(a.dominanceGap));
  };

  const alphaDogsList = getAlphaDogs();
  
  const sortedBaskets = [...baskets].sort((a, b) => {
    if (basketSort === 'Grade') return parseFloat(b.first_shot_prob) - parseFloat(a.first_shot_prob);
    if (basketSort === 'EV') return parseFloat(b.einstein_ev || 0) - parseFloat(a.einstein_ev || 0);
    return a.game.localeCompare(b.game);
  });

  const displayedAlphas = isPremium ? alphaDogsList : alphaDogsList.slice(0, 2);
  const displayedBaskets = isPremium ? sortedBaskets : sortedBaskets.slice(0, 3);

  const EVBox = ({ ev }) => {
    const isPositive = parseFloat(ev) > 0;
    return (
      <div className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center ${isPositive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
        <span className={`block text-[8px] uppercase font-black tracking-widest mb-1 flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-slate-500'}`}>
          {isPositive && <BrainCircuit size={10} />} Einstein EV
        </span>
        <span className={`text-lg font-black ${isPositive ? 'text-emerald-400' : 'text-white'}`}>
          {isPositive ? '+' : ''}{ev || '0.0'}%
        </span>
      </div>
    );
  };

  // Defense sorting logic
  const topPaint = [...defense].sort((a, b) => b.paint - a.paint).slice(0, 5);
  const topRebounds = [...defense].sort((a, b) => b.rebounds - a.rebounds).slice(0, 5);
  const topAssists = [...defense].sort((a, b) => b.assists - a.assists).slice(0, 5);
  const topThrees = [...defense].sort((a, b) => b.threes - a.threes).slice(0, 5);

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
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <button onClick={() => setView('AlphaDogs')} className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-black italic uppercase tracking-widest text-xs ${view === 'AlphaDogs' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' : 'bg-[#0f0f0f] border-white/5 text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
            <Crown className="w-4 h-4" /> Alpha Dogs
          </button>
          <button onClick={() => setView('FirstBaskets')} className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-black italic uppercase tracking-widest text-xs ${view === 'FirstBaskets' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' : 'bg-[#0f0f0f] border-white/5 text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
            <Trophy className="w-4 h-4" /> The Master Board
          </button>
          <button onClick={() => setView('Defense')} className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-black italic uppercase tracking-widest text-xs ${view === 'Defense' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' : 'bg-[#0f0f0f] border-white/5 text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}>
            <ShieldAlert className="w-4 h-4" /> Defensive Vulnerabilities
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

                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5 flex flex-col justify-center">
                          <span className="block text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Odds</span>
                          <span className="text-xl font-black text-green-400 italic">{alpha.best_odds}</span>
                        </div>
                        <div className="bg-indigo-600/10 p-3 rounded-xl text-center border border-indigo-500/20 flex flex-col justify-center">
                          <span className="block text-[9px] text-indigo-400 uppercase font-bold tracking-widest mb-1">Early Usage</span>
                          <span className="text-xl font-black text-indigo-400">{alpha.first_shot_prob}%</span>
                        </div>
                        <EVBox ev={alpha.einstein_ev} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-3xl">
                  <Crown className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 uppercase font-black tracking-widest text-sm">Calculating...</p>
                </div>
              )}
            </div>
            
            {!isPremium && alphaDogsList.length > 2 && (
              <div className="mt-8 bg-gradient-to-r from-indigo-900/40 to-[#0a0a0a] border border-white/5 rounded-3xl p-12 text-center">
                <Lock className="text-indigo-500 mx-auto mb-4" size={32} />
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Unlock {alphaDogsList.length - 2} More Alpha Dogs</h3>
                <button onClick={() => window.location.href = whopLink} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-black italic uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl">Upgrade to PropSniper Pro</button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: FIRST BASKETS */}
        {view === 'FirstBaskets' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                  <Trophy className="text-indigo-500" /> First Basket Master Board
                </h2>
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                  <button onClick={() => setBasketSort('EV')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${basketSort === 'EV' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>By EV</button>
                  <button onClick={() => setBasketSort('Grade')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${basketSort === 'Grade' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>By Grade</button>
                  <button onClick={() => setBasketSort('Game')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${basketSort === 'Game' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>By Game</button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedBaskets.length > 0 ? (
                displayedBaskets.map((basket, i) => {
                  const gradeInfo = getSniperGrade(basket.first_shot_prob);
                  return (
                    <div key={i} className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
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
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Best Market Odds</span>
                          <div className="text-right">
                             <span className="text-xl font-black text-green-400 italic">{basket.best_odds}</span>
                             <p className="text-[8px] text-slate-500 uppercase font-bold">{basket.bookmaker}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center flex flex-col justify-center">
                                <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-widest mb-1">True Prob</span>
                                <span className="text-sm font-black text-white">{basket.tip_win_prob}%</span>
                            </div>
                            <div className="bg-indigo-600/10 p-2 rounded-xl border border-indigo-500/20 text-center flex flex-col justify-center">
                                <span className="block text-[8px] text-indigo-400 uppercase font-bold tracking-widest mb-1">Usage</span>
                                <span className="text-sm font-black text-indigo-400">{basket.first_shot_prob}%</span>
                            </div>
                            <EVBox ev={basket.einstein_ev} />
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
              <div className="mt-8 bg-gradient-to-r from-indigo-900/40 to-[#0a0a0a] border border-white/5 rounded-3xl p-12 text-center">
                <Lock className="text-indigo-500 mx-auto mb-4" size={32} />
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Unlock {baskets.length - 3} More First Basket Targets</h3>
                <button onClick={() => window.location.href = whopLink} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-black italic uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl">Upgrade to PropSniper Pro</button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: DEFENSIVE VULNERABILITIES */}
        {view === 'Defense' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2 flex items-center gap-3">
                  <Swords className="text-red-500" size={32} /> Matchup Intelligence Matrix
                </h2>
                <p className="text-slate-500 font-medium tracking-tight">The absolute worst defenses in the NBA. Use this to target specific player props.</p>
              </div>
            </div>

            {defense.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Paint Vulnerability */}
                <div className="bg-[#0f0f0f] border border-red-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-[0.02] transform translate-x-4 -translate-y-4"><Activity size={180} /></div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span> Paint Defense (Worst)
                  </h3>
                  <div className="space-y-3 relative z-10">
                    {topPaint.map((team, i) => (
                      <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                        <span className="font-bold text-slate-300 flex items-center gap-3"><span className="text-red-500 font-black">#{i+1}</span> {team.team}</span>
                        <span className="text-red-400 font-black italic">{team.paint} <span className="text-[10px] text-slate-500 not-italic uppercase">pts allowed</span></span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-6 text-center">🎯 Target: Centers & Power Forwards Over Points</p>
                </div>

                {/* 3PT Vulnerability */}
                <div className="bg-[#0f0f0f] border border-orange-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-[0.02] transform translate-x-4 -translate-y-4"><Activity size={180} /></div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span> 3PT Defense (Worst)
                  </h3>
                  <div className="space-y-3 relative z-10">
                    {topThrees.map((team, i) => (
                      <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                        <span className="font-bold text-slate-300 flex items-center gap-3"><span className="text-orange-500 font-black">#{i+1}</span> {team.team}</span>
                        <span className="text-orange-400 font-black italic">{team.threes}% <span className="text-[10px] text-slate-500 not-italic uppercase">allowed</span></span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-6 text-center">🎯 Target: Shooters Over 3PT Made</p>
                </div>

                {/* Rebound Vulnerability */}
                <div className="bg-[#0f0f0f] border border-blue-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-[0.02] transform translate-x-4 -translate-y-4"><Activity size={180} /></div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span> Rebounding (Worst)
                  </h3>
                  <div className="space-y-3 relative z-10">
                    {topRebounds.map((team, i) => (
                      <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                        <span className="font-bold text-slate-300 flex items-center gap-3"><span className="text-blue-500 font-black">#{i+1}</span> {team.team}</span>
                        <span className="text-blue-400 font-black italic">{team.rebounds} <span className="text-[10px] text-slate-500 not-italic uppercase">allowed</span></span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-6 text-center">🎯 Target: Centers Over Rebounds</p>
                </div>

                {/* Assist Vulnerability */}
                <div className="bg-[#0f0f0f] border border-emerald-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-[0.02] transform translate-x-4 -translate-y-4"><Activity size={180} /></div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Assist Defense (Worst)
                  </h3>
                  <div className="space-y-3 relative z-10">
                    {topAssists.map((team, i) => (
                      <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                        <span className="font-bold text-slate-300 flex items-center gap-3"><span className="text-emerald-500 font-black">#{i+1}</span> {team.team}</span>
                        <span className="text-emerald-400 font-black italic">{team.assists} <span className="text-[10px] text-slate-500 not-italic uppercase">allowed</span></span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-6 text-center">🎯 Target: Point Guards Over Assists</p>
                </div>

              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
                <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-pulse" />
                <p className="text-slate-500 uppercase font-black tracking-widest text-sm">Loading Matchup Intelligence...</p>
              </div>
            )}

            {!isPremium && (
              <div className="mt-8 bg-gradient-to-r from-indigo-900/40 to-[#0a0a0a] border border-white/5 rounded-3xl p-12 text-center">
                <Lock className="text-indigo-500 mx-auto mb-4" size={32} />
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Unlock Full Market Matchups</h3>
                <p className="text-slate-400 font-medium mb-6 max-w-lg mx-auto">Knowing who bleeds points in the paint is how sharps beat the books. Upgrade to see the full data.</p>
                <button onClick={() => window.location.href = whopLink} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-black italic uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl">Upgrade to PropSniper Pro</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
