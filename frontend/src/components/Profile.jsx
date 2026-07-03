import React, { useState, useEffect } from 'react';
import { Award, Zap, Flame, BarChart2, Star, CheckCircle, XCircle, Calendar, ArrowLeft, Sun, Moon } from 'lucide-react';

export default function Profile({ 
  user, 
  token, 
  apiUrl, 
  onBackToDashboard, 
  onNavigateToSolver,
  theme,
  onToggleTheme
}) {
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);

  // Fetch submissions and analytics
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        const subRes = await fetch(`${apiUrl}/submissions/user`, { headers });
        const subData = await subRes.json();
        if (Array.isArray(subData)) {
          setSubmissions(subData);
        }

        const analRes = await fetch(`${apiUrl}/analytics`, { headers });
        const analData = await analRes.json();
        if (!analData.error) {
          setAnalytics(analData);
        }
      } catch (err) {
        console.error("Profile data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [token, user, apiUrl]);

  // Compute stats
  const totalAttempts = submissions.length;
  const correctAttempts = submissions.filter(s => s.correctnessStatus === 'correct');
  const totalSolved = [...new Set(correctAttempts.map(s => s.questionId?._id || s.questionId?.questionNumber || s.questionId))].length;
  const successRate = totalAttempts > 0 ? Math.round((correctAttempts.length / totalAttempts) * 100) : 0;

  // Build GitHub-style Contribution Calendar Grid
  const generateCalendarData = () => {
    const data = [];
    const today = new Date();
    
    // Map existing activity dates for quick lookup
    const activityMap = {};
    if (analytics && analytics.contributions) {
      analytics.contributions.forEach(item => {
        activityMap[item.date] = item.count;
      });
    }

    // Go back 147 days (21 full weeks)
    for (let i = 146; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = activityMap[dateStr] || 0;

      // Find if user solved or attempted on this day
      const daySubs = submissions.filter(s => new Date(s.date).toISOString().split('T')[0] === dateStr);
      let status = 'none'; // 'none' | 'solved' | 'attempted'
      if (daySubs.some(s => s.correctnessStatus === 'correct')) {
        status = 'solved';
      } else if (daySubs.length > 0) {
        status = 'attempted';
      }

      data.push({
        date: dateStr,
        dayOfWeek: date.getDay(),
        month: date.toLocaleString('default', { month: 'short' }),
        count: count || daySubs.length,
        status
      });
    }
    return data;
  };

  const calendarData = generateCalendarData();

  // Group columns (weeks)
  const weeks = [];
  let currentWeek = [];
  calendarData.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || day === calendarData[calendarData.length - 1]) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Color Intensity Heatmap Mapper (Supports both Light and Dark mode)
  const getCalendarBlockColor = (day) => {
    if (day.status === 'solved') {
      const count = day.count || 1;
      if (count === 1) return 'bg-emerald-500/20 dark:bg-emerald-950/40 border border-emerald-500/10 dark:border-emerald-500/5';
      if (count === 2) return 'bg-emerald-500/45 dark:bg-emerald-900/40 border border-emerald-500/20';
      if (count === 3) return 'bg-emerald-500/70 dark:bg-emerald-800/60';
      return 'bg-emerald-500 text-white';
    }
    if (day.status === 'attempted') {
      const count = day.count || 1;
      if (count === 1) return 'bg-rose-500/20 dark:bg-rose-950/40 border border-rose-500/10';
      if (count === 2) return 'bg-rose-500/45 dark:bg-rose-900/40 border border-rose-500/20';
      if (count === 3) return 'bg-rose-500/70 dark:bg-rose-800/60';
      return 'bg-rose-500 text-white';
    }
    return 'bg-zinc-150 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700';
  };

  return (
    <div className="px-6 py-8 flex flex-col gap-8 max-w-6xl mx-auto w-full text-zinc-850 dark:text-zinc-300 transition-colors duration-200">
      
      {/* Top Header Control Area */}
      <div className="flex justify-between items-center w-full">
        {/* Top Breadcrumb */}
        <button 
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white font-semibold text-xs tracking-wider uppercase transition-colors"
        >
          <ArrowLeft size={12} />
          BACK TO DASHBOARD
        </button>

        {/* Premium Theme Switch Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition font-semibold text-xs shadow-sm"
        >
          {theme === 'dark' ? (
            <>
              <Sun size={14} className="text-amber-500 fill-amber-500/10" />
              <span>Light Theme</span>
            </>
          ) : (
            <>
              <Moon size={14} className="text-blue-500 fill-blue-500/10" />
              <span>Dark Theme</span>
            </>
          )}
        </button>
      </div>

      {/* Profile HUD Profile details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm transition-colors duration-200">
          <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-800 dark:text-white mb-4 shadow-inner">
            {user.username.substring(0, 2).toUpperCase()}
          </div>
          <h3 className="font-bold text-zinc-850 dark:text-white text-md tracking-wider uppercase">{user.username}</h3>
          <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase mt-1">{user.role} Member</span>
          <p className="text-xs text-zinc-400 dark:text-zinc-505 mt-0.5">{user.email}</p>
        </div>

        {/* Analytics stats row */}
        <div className="md:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm transition-colors duration-200">
            <span className="text-[9px] text-zinc-455 dark:text-zinc-550 font-semibold uppercase tracking-widest block">SUCCESS RATE</span>
            <div className="mt-4">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">{successRate}%</span>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-550 mt-1 uppercase font-semibold">Verification index</p>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm transition-colors duration-200">
            <span className="text-[9px] text-zinc-455 dark:text-zinc-550 font-semibold uppercase tracking-widest block">SOLVED CHALLENGES</span>
            <div className="mt-4">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">{totalSolved}</span>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-550 mt-1 uppercase font-semibold">Correct submissions</p>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm transition-colors duration-200">
            <span className="text-[9px] text-zinc-455 dark:text-zinc-550 font-semibold uppercase tracking-widest block">ATTEMPTS LOGGED</span>
            <div className="mt-4">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">{totalAttempts}</span>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-550 mt-1 uppercase font-semibold">Sandbox executions</p>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm transition-colors duration-200">
            <span className="text-[9px] text-zinc-455 dark:text-zinc-550 font-semibold uppercase tracking-widest block">HIGHEST STREAK</span>
            <div className="mt-4">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                <Flame className="text-orange-500 fill-orange-500/10 animate-pulse" size={20} />
                {analytics?.highestStreak || user.highestStreak || 0}
              </span>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-550 mt-1 uppercase font-semibold">Peak consecutive days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Style Contribution Calendar Heatmap */}
      <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-6 rounded-2xl shadow-sm transition-colors duration-200">
        <h3 className="font-bold text-xs tracking-widest text-zinc-850 dark:text-white uppercase mb-5 flex items-center gap-2">
          <Calendar size={14} className="text-blue-500" />
          SYSTEM ACTIVITY CONTRIBUTIONS
        </h3>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-6 bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 transition-colors duration-200">
          <div className="flex gap-4">
            <div>Total Actions: <span className="font-bold text-zinc-900 dark:text-white">{analytics?.totalAttempts || totalAttempts || 0}</span></div>
            <div>Success Rate: <span className="font-bold text-blue-500">{successRate}%</span></div>
          </div>
          <div className="flex items-center gap-2 text-[10px] select-none">
            <span>NO ACTIVITY</span>
            <div className="w-3.5 h-3.5 bg-zinc-150 dark:bg-zinc-800 rounded-[2px]" title="No contributions"></div>
            <div className="w-3.5 h-3.5 bg-rose-500/30 rounded-[2px]" title="Attempt level 1"></div>
            <div className="w-3.5 h-3.5 bg-rose-500/60 rounded-[2px]" title="Attempt level 2"></div>
            <div className="w-3.5 h-3.5 bg-rose-500 rounded-[2px]" title="Attempt level 3"></div>
            <span>LOGICAL FLAW</span>
            <div className="w-3.5 h-3.5 bg-emerald-500/30 rounded-[2px]" title="Solve level 1"></div>
            <div className="w-3.5 h-3.5 bg-emerald-500/60 rounded-[2px]" title="Solve level 2"></div>
            <div className="w-3.5 h-3.5 bg-emerald-500 rounded-[2px]" title="Solve level 3"></div>
            <span>SOLVED</span>
          </div>
        </div>

        {/* Calendar Block Grid */}
        <div className="w-full overflow-x-auto pb-1">
          <div className="flex gap-[3px] min-w-[700px] justify-between">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[3px]">
                {week.map((day, dIdx) => (
                  <div 
                    key={dIdx}
                    title={`${day.date}: ${day.count} Activity Runs (${day.status})`}
                    className={`w-[12px] h-[12px] rounded-[2px] transition-all cursor-crosshair ${getCalendarBlockColor(day)}`}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUBMISSION HISTORY DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Submissions List */}
        <div className="lg:col-span-1 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-6 rounded-2xl flex flex-col gap-4 shadow-sm transition-colors duration-200">
          <h3 className="font-bold text-xs tracking-widest text-zinc-850 dark:text-white uppercase pb-2 border-b border-zinc-200 dark:border-zinc-800">
            LOGIC SUBMISSIONS HISTORY
          </h3>

          <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-xs text-zinc-400 italic py-4 text-center">Loading submissions...</p>
            ) : submissions.length > 0 ? (
              submissions.map((sub) => (
                <div 
                  key={sub._id}
                  onClick={() => setSelectedSub(sub)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedSub?._id === sub._id 
                      ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700' 
                      : 'bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] text-zinc-550 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      #{sub.questionId?.questionNumber || "?"} - {sub.questionId?.title || "Custom Log"}
                    </span>
                    {sub.correctnessStatus === 'correct' ? (
                      <CheckCircle className="text-emerald-500" size={12} />
                    ) : (
                      <XCircle className="text-rose-500" size={12} />
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2.5">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={8} className={i < sub.stars ? "text-yellow-500 fill-yellow-500" : "text-zinc-300 dark:text-zinc-700"} />
                      ))}
                    </div>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold">
                      {new Date(sub.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 italic text-center py-6">No submission history found</p>
            )}
          </div>
        </div>

        {/* Selected Submission Critique HUD */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-6 rounded-2xl min-h-[300px] shadow-sm transition-colors duration-200">
          {selectedSub ? (
            <div className="flex flex-col gap-5">
              <div>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest">
                  CHALLENGE LOG DETAILS
                </span>
                <h4 className="text-lg font-bold text-zinc-850 dark:text-white mt-1 uppercase tracking-wide">
                  {selectedSub.questionId?.title || "Custom Logic Build"}
                </h4>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
                  SUBMITTED ON {new Date(selectedSub.date).toLocaleString()}
                </p>
              </div>

              {/* Submitted Logic Steps */}
              <div>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">
                  SUBMITTED LOGIC STEPS:
                </span>
                <div className="mt-2 flex flex-col gap-2">
                  {selectedSub.logicSubmitted.map((step, idx) => (
                    <div key={idx} className="flex gap-2 text-xs py-1.5 px-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 font-mono">
                      <span className="text-blue-500 font-bold">#{idx + 1}</span>
                      <span className="text-zinc-700 dark:text-zinc-350">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Feedback */}
              <div className="border-t border-zinc-250 dark:border-zinc-800 pt-4">
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">
                  AI EVALUATOR CRITIQUE:
                </span>
                <p className="text-xs text-zinc-800 dark:text-zinc-300 mt-2 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-855">
                  {selectedSub.aiFeedback}
                </p>
              </div>

              {selectedSub.questionId?.questionNumber && (
                <button 
                  onClick={() => onNavigateToSolver(selectedSub.questionId.questionNumber)}
                  className="mt-2 py-1.5 px-3 border border-zinc-300 dark:border-zinc-700 text-zinc-750 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-xs tracking-wider rounded-lg self-start transition shadow-sm"
                >
                  RE-SOLVE CHALLENGE
                </button>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-zinc-400 dark:text-zinc-550">
              <Award className="text-zinc-200 dark:text-zinc-800 mb-4 animate-pulse" size={48} />
              <p className="text-xs font-semibold uppercase tracking-wider">SELECT A HISTORICAL SUBMISSION</p>
              <p className="text-[11px] mt-1 text-zinc-405 dark:text-zinc-650">Select a log entry on the left panel to display evaluation feedback.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
