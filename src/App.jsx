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
  User,
  LogOut,
  ShieldCheck
} from 'lucide-react';

const App = () => {
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- AUTH & PREMIUM STATE ---
  const [isPremium, setIsPremium] = useState(false); 
  const [user, setUser] = useState(null); // Stores Whop User info
  const [accessKey, setAccessKey] = useState(''); // Manual bypass for testing

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
      if (Array.isArray(data)) setEdges(data);
    } catch (err) {
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

  // --- ACCESS LOGIC ---
  // For testing: You can type "PRO2026" into the access key field to unlock the site immediately
  useEffect(() => {
    if (accessKey === "PRO2026") {
      setIsPremium(true);
    }
  }, [accessKey]);

  const handleWhopLogin = () => {
    // This would typically redirect to Whop OAuth
    // For this environment, we'll simulate the "Unlock" to show you the UI works
    console.log("Redirecting to Whop for verification...");
    // Mocking a successful login for the user to see the unlocked state
    setUser({ name: "Pro Member", email: "member@propsniper.pro" });
    setIsPremium(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsPremium(false);
    setAccessKey('');
  };

  const filteredEdges = edges.filter(edge => 
    edge.player_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Premium Logic: Free users see 2, Pro users see all
  const displayedEdges = isPremium ? filteredEdges : filteredEdges.slice(0, 2);
  const lockedCount = Math.max(0, filteredEdges.length - displayedEdges.length);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Top Professional Banner */}
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
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 transition-all text-left">
                <LayoutDashboard size={18}/>
                <span className="text-sm font-bold tracking-tight">PropSniper Pro Dashboard</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-slate-300 transition-colors text-left">
                <BarChart3 size={18}/>
                <span className="text-sm font-bold tracking-tight">Player Forecasts</span>
            </button>
          </nav>

          {/* User Section / Login */}
          <div className="mt-auto space-y-4">
            {isPremium ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Pro Status Active</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 text-slate-500 hover:text-white text-xs font-bold transition-all"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-br from-indigo-900/20 to-slate-800/40 rounded-2xl border border-indigo-500/20 text-left">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Already a member?</p>
                <button 
                  onClick={handleWhopLogin}
                  className="w-full py-2.5 bg-white text-black hover:bg-slate-200 rounded-xl text-xs font-bold transition-all mb-3 flex items-center justify-center gap-2"
                >
                  <User size={14} /> Verify Whop Access
                </button>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="Enter Access Key..."
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-lg py-1.5 px-3 text-[10px] focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto text-left">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="text-left">
              <h2 className="text-5xl font-black text-white tracking-tight mb-2 italic">PropSniper Pro</h2>
              <p className="text-slate-500 font-medium tracking-tight">Real-time market discrepancies found across major US books.</p>
            </div>
            
            <div className="flex items-center gap-4">
                <button onClick={fetchEdges} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-slate-400">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Filter players..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-sm font-medium"
                    />
                </div>
            </div>
          </header>

          {/* Table Container */}
          <div className="bg-[#0f0f0f] rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
            <div className="overflow-x-auto text-left">
              <table className="w-full">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-white/5 bg-[#0a0a0a]">
                    <th className="px-8 py-5">Player</th>
                    <th className="px-8 py-5 text-center">Best Under</th>
                    <th className="px-8 py-5 text-center">Best Over</th>
                    <th className="px-8 py-5 text-right">Market Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading && edges.length === 0 ? (
                      <tr><td colSpan="4" className="py-24 text-center text-slate-400 animate-pulse uppercase tracking-widest text-xs font-bold">Connecting to Proprietary Feed...</td></tr>
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
                            <div className="flex flex-col">
                                <span className="text-2xl font-mono font-black text-red-400 italic">{edge.high_line}</span>
                                <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">{edge.high_book}</span>
                            </div>
                        </td>
                        <td className="px-8 py-7 text-center">
                            <div className="flex flex-col">
                                <span className="text-2xl font-mono font-black text-green-400 italic">{edge.low_line}</span>
                                <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">{edge.low_book}</span>
                            </div>
                        </td>
                        <td className="px-8 py-7 text-right">
                            <span className="text-sm font-black text-white italic bg-indigo-600/10 px-4 py-1.5 rounded-lg border border-indigo-600/20">{edge.edge_size} PT GAP</span>
                        </td>
                        </tr>
                    ))}

                    {!isPremium && lockedCount > 0 && (
                        <tr>
                            <td colSpan="4" className="relative py-28 bg-black/40 border-t border-white/5 overflow-hidden">
                                <div className="absolute inset-0 bg-[#050505]/60 backdrop-blur-[6px] z-10"></div>
                                <div className="relative z-20 flex flex-col items-center justify-center text-center px-6">
                                    <div className="w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20 shadow-xl shadow-indigo-600/10">
                                        <Lock className="text-indigo-500" size={32} />
                                    </div>
                                    <h3 className="text-4xl font-black text-white mb-3 italic uppercase tracking-tighter underline decoration-indigo-600 decoration-8 underline-offset-4">Unlock {lockedCount} Sharp Gaps</h3>
                                    <p className="text-slate-400 text-sm mb-10 max-w-sm font-medium leading-relaxed">Upgrade to PropSniper Pro to see the full market board and receive real-time sniper alerts in Discord.</p>
                                    <button 
                                        onClick={() => window.location.href = whopLink}
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
        </main>
      </div>
    </div>
  );
};

export default App;
