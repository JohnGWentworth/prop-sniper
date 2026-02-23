import React, { useState, useEffect } from 'react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { 
  TrendingUp, 
  Clock, 
  AlertCircle,
  Trophy,
  RefreshCcw,
  Zap,
  Target
} from 'lucide-react';

const SUPABASE_URL = 'https://lmljhlxpaamemdngvair.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbGpobHhwYWFtZW1kbmd2YWlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTMyNDg4MiwiZXhwIjoyMDg2OTAwODgyfQ.cWDT8iW8nhr98S0WBfb-e9fjZXEJig9SYp1pnVrA20A';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [edges, setEdges] = useState([]);
  const [baskets, setBaskets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('Edges'); 
  const [filter, setFilter] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Edges
      const { data: edgeData, error: edgeError } = await supabase
        .from('nba_edges')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (!edgeError) setEdges(edgeData || []);

      // Fetch First Baskets
      const { data: basketData, error: basketError } = await supabase
        .from('first_baskets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);
      if (!basketError) setBaskets(basketData || []);

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

  const filteredEdges = filter === 'All' ? edges : edges.filter(e => e.market === filter);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans">
      <nav className="border-b border-white/5 bg-[#0d0d0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">PropSniper <span className="text-indigo-500">Pro</span></span>
            </div>
            <button onClick={fetchData} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <RefreshCcw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setView('Edges')}
            className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold ${
              view === 'Edges' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <Zap className="w-5 h-5" /> Live Market Edges
          </button>
          <button 
            onClick={() => setView('FirstBaskets')}
            className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold ${
              view === 'FirstBaskets' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <Trophy className="w-5 h-5" /> First Baskets
          </button>
        </div>

        {view === 'Edges' ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex bg-white/5 p-1 rounded-xl">
                {['All', 'Points', 'Rebounds', 'Assists'].map((tab) => (
                  <button key={tab} onClick={() => setFilter(tab)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === tab ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                    {tab}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                <Clock className="w-3 h-3" /> Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>

            <div className="space-y-4">
              {filteredEdges.length > 0 ? (
                filteredEdges.map((edge) => (
                  <div key={edge.id} className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
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
                        <div className="bg-indigo-600 px-6 py-2 rounded-xl text-center shadow-lg shadow-indigo-600/20">
                          <p className="text-[10px] text-indigo-200 uppercase font-black">Gap</p>
                          <p className="text-xl font-black text-white">+{edge.edge_size}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
                  <AlertCircle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">No edges found in the current scan.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Premium First Basket Targets</h2>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                <Clock className="w-3 h-3" /> Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {baskets.length > 0 ? (
                baskets.map((basket, i) => (
                  <div key={i} className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                    <div className="absolute -right-4 -top-4 text-white/[0.02] group-hover:text-white/[0.05] transition-colors"><Target size={120} /></div>
                    
                    <div className="relative z-10">
                      <div className="mb-4 pb-4 border-b border-white/5">
                        <h4 className="text-xl font-black italic text-white uppercase mb-1">{basket.player_name}</h4>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{basket.game}</span>
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
                                <span className="block text-[9px] text-indigo-400 uppercase font-bold tracking-widest mb-1">Baseline Usage</span>
                                <span className="text-lg font-black text-indigo-400">{basket.first_shot_prob}%</span>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-3xl">
                  <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">Awaiting market odds from sportsbooks...</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
