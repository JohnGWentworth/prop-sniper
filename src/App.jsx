import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  ChevronRight, 
  Search, 
  BarChart3, 
  DollarSign, 
  Zap,
  Target,
  Award,
  RefreshCw,
  Lock,
  CheckCircle2
} from 'lucide-react';

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('edges'); 
  const [propEdges, setPropEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- PAYWALL STATE ---
  // Defaults to false so everyone sees the Paywall first
  const [isPremium, setIsPremium] = useState(false); 

  // --- CONFIGURATION ---
  const SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A';

  const fetchEdges = async () => {
    setLoading(true);
    try {
      // Fetch real data, ordered by newest first
      const response = await fetch(`${SUPABASE_URL}/rest/v1/nba_edges?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      const data = await response.json();

      if (data && data.length > 0) {
        const formattedData = data.map(item => ({
          id: item.id,
          player: item.player_name,
          team: item.game ? item.game.split('@')[0].trim() : 'NBA',
          opponent: item.game ? item.game.split('@')[1].trim() : 'GAME',
          market: "Points",
          bestOver: { book: item.low_book || "Low Line", line: item.low_line },
          bestUnder: { book: item.high_book || "High Line", line: item.high_line },
          discrepancy: item.edge_size,
          forecast: item.season_avg || "N/A",
          confidence: "Live",
          status: "Real Data"
        }));
        setPropEdges(formattedData);
      } else {
        setPropEdges([]); 
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setPropEdges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEdges();
  }, []);

 const handleSubscribe = () => {
      // Replace with your ACTUAL Whop link
      window.open('https://whop.com/johngwentworth/propsniper-pro/', '_blank');
  };

  const filteredEdges = propEdges.filter(edge => 
    edge.player.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (edge.team && edge.team.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- FREEMIUM LOGIC ---
  // If not premium, only show top 2 edges. If premium, show all.
  const displayedEdges = isPremium ? filteredEdges : filteredEdges.slice(0, 2);
  const hiddenCount = filteredEdges.length - displayedEdges.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Sidebar Navigation */}
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 p-6 hidden lg:block">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Target className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">PROP<span className="text-indigo-500">SNIPER</span></h1>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => setActiveTab('edges')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'edges' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Zap size={18} />
            <span className="font-medium">Market Edges</span>
          </button>
          <button 
             onClick={() => setActiveTab('forecasts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'forecasts' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <BarChart3 size={18} />
            <span className="font-medium">Game Forecasts</span>
          </button>
        </nav>

        {!isPremium && (
            <div className="absolute bottom-10 left-6 right-6 p-4 bg-gradient-to-br from-indigo-900/40 to-slate-800 rounded-2xl border border-indigo-500/20">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Free Trial</p>
            <p className="text-sm text-slate-300 mb-4 font-light">Unlock all {filteredEdges.length} edges free for 7 days.</p>
            <button 
                onClick={handleSubscribe}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-900/20"
            >
                Start 7-Day Trial
            </button>
            </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="lg:ml-64 p-4 md:p-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold">NBA Prop Dashboard</h2>
            <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
                <p className="text-slate-400 text-sm">
                    {loading ? "Scanning Live Odds..." : "Live Data Active"}
                </p>
            </div>
          </div>
          
          <div className="flex gap-3">
              <button 
                onClick={fetchEdges}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
                title="Refresh Data"
              >
                  <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                type="text" 
                placeholder="Search player or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-sm"
                />
            </div>
          </div>
        </header>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                <DollarSign size={20} />
              </div>
              <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">+12.4%</span>
            </div>
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg. ROI (Last 30d)</h3>
            <p className="text-2xl font-bold mt-1 text-white">24.5%</p>
          </div>
          
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                <AlertCircle size={20} />
              </div>
            </div>
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Edges</h3>
            <p className="text-2xl font-bold mt-1 text-white">{propEdges.length} Found</p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                <Award size={20} />
              </div>
            </div>
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Sharp Forecast Accuracy</h3>
            <p className="text-2xl font-bold mt-1 text-white">68.2%</p>
          </div>
        </div>

        {/* Edges Table */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden min-h-[400px]">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 text-lg">
              <Zap className="text-amber-400 fill-amber-400" size={18} />
              Live Market Gaps
            </h3>
            <div className="flex gap-2">
              <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700">Prop Value {'>'} 1.0</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-800/50">
                  <th className="px-6 py-4">Player</th>
                  <th className="px-6 py-4">Market</th>
                  <th className="px-6 py-4 text-center">Low Line (Best Over)</th>
                  <th className="px-6 py-4 text-center">High Line (Best Under)</th>
                  <th className="px-6 py-4 text-center">Season Avg</th>
                  <th className="px-6 py-4 text-right">The Edge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan="6" className="p-12 text-center text-slate-400 animate-pulse">Connecting to Database...</td></tr>
                ) : filteredEdges.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
                                    <Search className="text-slate-500" size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-300 font-bold mb-1">No Discrepancies Found Yet</p>
                                    <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                        The script is scanning, but sportsbooks are currently aligned. 
                                        Run the python script again in 15 minutes.
                                    </p>
                                </div>
                            </div>
                        </td>
                    </tr>
                ) : (
                  <>
                  {displayedEdges.map((edge) => (
                  <tr key={edge.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">{edge.player}</span>
                        <span className="text-xs text-slate-500">{edge.team} vs {edge.opponent}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className="bg-slate-800 px-2 py-1 rounded text-slate-300 font-medium">{edge.market}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-mono text-green-400 font-bold">{edge.bestOver.line}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{edge.bestOver.book}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-mono text-red-400 font-bold">{edge.bestUnder.line}</span>
                         <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{edge.bestUnder.book}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 font-bold text-sm">
                         {edge.forecast}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-bold flex items-center gap-1 ${edge.discrepancy >= 2 ? 'text-amber-400' : 'text-slate-400'}`}>
                          {edge.discrepancy >= 2 && <Zap size={14} className="fill-amber-400" />}
                          {edge.discrepancy} pts Gap
                        </span>
                        <button className="mt-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          View Analysis <ChevronRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))}

                  {/* PAYWALL OVERLAY - Shows if NOT Premium and there are hidden edges */}
                  {!isPremium && hiddenCount > 0 && (
                      <tr>
                          <td colSpan="6" className="relative p-0 border-t border-slate-800">
                             <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900/95 backdrop-blur-[2px] z-10"></div>
                             
                             <div className="relative z-20 flex flex-col items-center justify-center py-24 gap-6 text-center">
                                <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center shadow-2xl border border-white/5 mb-2 ring-1 ring-white/10">
                                    <Lock className="text-indigo-500" size={32} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white mb-2">Unlock {hiddenCount} More Edges</h3>
                                    <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                                        You are missing out on <span className="text-white font-bold">{hiddenCount} high-value discrepancies</span> found in the last 15 minutes. Pro members get full access instantly.
                                    </p>
                                </div>
                                
                                <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                                    <button 
                                        onClick={handleSubscribe}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-indigo-900/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Start 7-Day Free Trial
                                        <ChevronRight size={20} />
                                    </button>
                                    <p className="text-xs text-slate-500 font-medium">Then $14.99/mo • Cancel anytime</p>
                                </div>
                                
                                <div className="flex items-center gap-6 mt-4 text-xs text-slate-500 font-medium">
                                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500"/> Real-time Alerts</span>
                                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500"/> Historical Data</span>
                                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500"/> Cancel Anytime</span>
                                </div>
                             </div>
                          </td>
                      </tr>
                  )}
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-800/20 p-4 text-center">
            <p className="text-slate-500 text-xs italic">Market data refreshes when you run the sniper script. PropSniper identifies lines where sportsbooks have over 1.0% variance.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
