import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { BarChart2, Award, Target, Flame, ArrowLeft } from 'lucide-react';

export default function Analytics({ user, token, apiUrl, onBackToDashboard }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${apiUrl}/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!json.error) {
          setData(json);
        }
      } catch (err) {
        console.error("Fetch analytics failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [token, apiUrl]);

  // Fallback / Mock chart data if user has no activities yet
  const defaultDifficultyData = [
    { name: 'Easy', value: 3, color: '#10B981' },
    { name: 'Intermediate', value: 2, color: '#F59E0B' },
    { name: 'Hard', value: 1, color: '#EF4444' }
  ];

  const radarData = [
    { subject: 'Sequence Order', A: 85, B: 100 },
    { subject: 'Clarity', A: 90, B: 100 },
    { subject: 'Efficiency', A: 75, B: 100 },
    { subject: 'Edge Cases', A: 60, B: 100 },
    { subject: 'Correctness', A: 95, B: 100 },
  ];

  const recentPerformanceData = [
    { name: 'Week 1', attempts: 4, solved: 2 },
    { name: 'Week 2', attempts: 6, solved: 4 },
    { name: 'Week 3', attempts: 3, solved: 3 },
    { name: 'Week 4', attempts: 5, solved: 4 }
  ];

  const isDataEmpty = !data || data.totalAttempts === 0;

  const difficultyBreakdown = isDataEmpty 
    ? defaultDifficultyData 
    : data.difficultyBreakdown.map(d => ({ ...d, value: d.value || 0 }));

  return (
    <div className="px-6 py-8 flex flex-col gap-8 max-w-6xl mx-auto w-full text-zinc-300">
      {/* Top breadcrumb */}
      <button 
        onClick={onBackToDashboard}
        className="flex items-center gap-2 text-zinc-400 hover:text-white font-semibold text-xs tracking-wider uppercase self-start"
      >
        <ArrowLeft size={12} />
        BACK TO DASHBOARD
      </button>

      <div>
        <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
          OPERATIONAL ANALYTICS
        </h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
          Detailed metrics of logic building performance. Real-time reasoning evaluation statistics.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 flex-grow flex flex-col items-center justify-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-zinc-500 text-xs">Compiling analytical charts...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20 text-blue-500 shadow-sm">
                <Target size={22} />
              </div>
              <div>
                <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider block">LOGIC ACCURACY</span>
                <span className="text-xl font-bold text-white mt-1 block">
                  {isDataEmpty ? '85%' : `${data.successRate}%`}
                </span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-indigo-600/10 rounded-xl border border-indigo-500/20 text-indigo-500 shadow-sm">
                <BarChart2 size={22} />
              </div>
              <div>
                <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider block">TOTAL ATTEMPTS</span>
                <span className="text-xl font-bold text-white mt-1 block">
                  {isDataEmpty ? '18 Runs' : `${data.totalAttempts} Runs`}
                </span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-emerald-600/10 rounded-xl border border-emerald-500/20 text-emerald-500 shadow-sm">
                <Flame size={22} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider block">PEAK STREAK</span>
                <span className="text-xl font-bold text-orange-400 mt-1 block">
                  {isDataEmpty ? '12 Days' : `${data.highestStreak || 0} Days`}
                </span>
              </div>
            </div>
          </div>

          {isDataEmpty && (
            <div className="bg-amber-950/20 border border-amber-500/20 text-amber-300 text-xs px-4 py-2.5 rounded-xl text-center font-semibold uppercase tracking-wider">
              Note: You have no active submissions. Showing simulated practice benchmark metrics.
            </div>
          )}

          {/* Charts Row 1: Radar & Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Radar Logic Skills */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center">
              <h3 className="font-bold text-xs tracking-widest text-white uppercase mb-6 self-start">
                ALGORITHMIC DIMENSIONS RADAR
              </h3>
              <div className="w-full h-72 flex justify-center text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" radius="70%" data={radarData}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#27272a" />
                    <Radar name="Target Level" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', fontSize: '11px', color: '#f4f4f5' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Difficulty Breakdown Pie */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col">
              <h3 className="font-bold text-xs tracking-widest text-white uppercase mb-6">
                SOLVED DIFFICULTY BREAKDOWN
              </h3>
              <div className="flex-grow w-full h-72 flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={difficultyBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {difficultyBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', fontSize: '11px', color: '#f4f4f5' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2.5 text-xs">
                  {difficultyBreakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                      <span className="font-bold uppercase tracking-wider text-zinc-400">{item.name}:</span>
                      <span className="text-white">{item.value} Solved</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Bar Chart */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <h3 className="font-bold text-xs tracking-widest text-white uppercase mb-6">
              WEEKLY ACTIVITY LOG
            </h3>
            <div className="w-full h-72 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', fontSize: '11px', color: '#f4f4f5' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Bar dataKey="attempts" name="Total Runs" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="solved" name="Successful Solves" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
