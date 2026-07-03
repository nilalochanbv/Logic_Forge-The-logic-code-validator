import React, { useState, useEffect } from 'react';
import { 
  Search, Flame, BookOpen, Compass, FileText, ChevronDown, ChevronUp, Plus, 
  Lock, CheckCircle2, Circle, ArrowUpDown, Filter, Terminal, Cpu, Database, 
  Layers, ChevronLeft, ChevronRight, Play, Info, Sparkles, Clock, Star
} from 'lucide-react';

export default function Dashboard({ 
  user, 
  token, 
  apiUrl, 
  onNavigateToSolver, 
  onNavigateProfile,
  onNavigateAnalytics,
  onNavigateBadges
}) {
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState({
    points: user.points || 0,
    currentStreak: user.currentStreak || 0,
    highestStreak: user.highestStreak || 0,
    currentBadge: 'Novice',
    recentActivities: [],
    progress: { total: { easy: 0, medium: 0, hard: 0 }, solved: { easy: 0, medium: 0, hard: 0 } }
  });
  const [loading, setLoading] = useState(true);

  // Daily Challenge states
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [dailySolved, setDailySolved] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(user.dailyStreak || 0);

  // Filtering / Sorting / Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All'); // 'All' | 'Algorithms' | 'Database' | 'Shell'
  const [selectedDifficulty, setSelectedDifficulty] = useState('All'); // 'All' | 'Easy' | 'Medium' | 'Hard'
  const [selectedStatus, setSelectedStatus] = useState('All'); // 'All' | 'Solved' | 'Todo'
  const [selectedTag, setSelectedTag] = useState('All');
  const [sortField, setSortField] = useState('questionNumber'); // 'questionNumber' | 'title' | 'difficulty'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Left Sidebar Collapsibles & Lists
  const [myListsExpanded, setMyListsExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [customLists, setCustomLists] = useState([
    { name: 'Favorites', count: 0, locked: true },
  ]);
  const [newListName, setNewListName] = useState('');
  const [showAddList, setShowAddList] = useState(false);

  // Right Sidebar Countdown & Company Search
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 0, seconds: 0 });
  const [companySearch, setCompanySearch] = useState('');

  // Fetch data on mount / state changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch questions
        const qRes = await fetch(`${apiUrl}/questions`, { headers });
        const qData = await qRes.json();
        if (Array.isArray(qData)) {
          setQuestions(qData);
        }

        // Fetch stats
        const sRes = await fetch(`${apiUrl}/dashboard/stats`, { headers });
        const sData = await sRes.json();
        if (!sData.error) {
          setStats(sData);
        }

        // Fetch daily challenge
        const dRes = await fetch(`${apiUrl}/daily-challenge`, { headers });
        const dData = await dRes.json();
        if (!dData.error) {
          setDailyChallenge(dData.question);
          setDailySolved(dData.solvedToday);
          setDailyStreak(dData.dailyStreak);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, user, apiUrl]);

  // Midnight countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight - now;

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (t) => {
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(t.hours)}:${pad(t.minutes)}:${pad(t.seconds)}`;
  };

  // Helper to categorize questions dynamically based on tags
  const getQuestionCategory = (q) => {
    const tagsStr = (q.tags || []).join(' ').toLowerCase();
    if (tagsStr.includes('database') || tagsStr.includes('sql')) {
      return 'Database';
    }
    if (tagsStr.includes('shell') || tagsStr.includes('bash')) {
      return 'Shell';
    }
    return 'Algorithms';
  };

  // Dynamically extract unique tags from question database
  const dynamicTags = Array.from(new Set(questions.flatMap(q => q.tags || [])))
    .filter(t => t && t.length > 0)
    .sort();

  // Filter Logic
  const filteredQuestions = questions.filter(q => {
    // 1. Search text filter (by title, tag, or number)
    const matchesSearch = 
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.questionNumber.toString().includes(searchQuery) ||
      (q.tags && q.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    // 2. Category tab filter
    const matchesCategory = 
      selectedCategory === 'All' || 
      getQuestionCategory(q) === selectedCategory;

    // 3. Difficulty dropdown filter
    const matchesDifficulty = 
      selectedDifficulty === 'All' || 
      q.difficulty.toLowerCase() === selectedDifficulty.toLowerCase() ||
      (selectedDifficulty === 'Medium' && q.difficulty.toLowerCase() === 'medium');

    // 4. Status checkbox/dropdown filter
    const matchesStatus = 
      selectedStatus === 'All' || 
      (selectedStatus === 'Solved' && q.completed) ||
      (selectedStatus === 'Todo' && !q.completed);

    // 5. Left sidebar Tag cloud filter
    const matchesTag = 
      selectedTag === 'All' || 
      (q.tags && q.tags.includes(selectedTag));

    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus && matchesTag;
  });

  // Sorting Logic
  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'difficulty') {
      const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
      valA = difficultyOrder[a.difficulty] || 0;
      valB = difficultyOrder[b.difficulty] || 0;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination bounds
  const totalItems = sortedQuestions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQuestions = sortedQuestions.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDifficulty('All');
    setSelectedStatus('All');
    setSelectedTag('All');
    setCurrentPage(1);
  };

  // Add custom list
  const handleAddCustomList = (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCustomLists(prev => [...prev, { name: newListName.trim(), count: 0, locked: false }]);
    setNewListName('');
    setShowAddList(false);
  };

  // Get difficulty color classes
  const getDiffColor = (diff) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'text-emerald-500';
      case 'medium':
      case 'medium': 
        return 'text-amber-500';
      case 'hard': return 'text-rose-500';
      default: return 'text-zinc-600 dark:text-zinc-400';
    }
  };

  // Companies List mock for trending section
  const companiesList = [
    { name: 'Google', count: 242 },
    { name: 'Amazon', count: 184 },
    { name: 'Microsoft', count: 145 },
    { name: 'Meta', count: 112 },
    { name: 'Bloomberg', count: 88 },
    { name: 'Apple', count: 72 },
    { name: 'Uber', count: 54 },
    { name: 'Netflix', count: 32 }
  ];

  // Calendar solved date highlights (June 2026 starting on Monday)
  // Let's parse user activities to find solved days in the current month
  const getSolvedDaysInJune = () => {
    const solvedDays = new Set();
    if (stats.recentActivities) {
      stats.recentActivities.forEach(act => {
        if (act.type === 'solve') {
          // act.date format is YYYY-MM-DD
          const parts = act.date.split('-');
          if (parts[1] === '06') { // June
            solvedDays.add(parseInt(parts[2]));
          }
        }
      });
    }
    // Seed default solved days if empty so calendar doesn't look completely bare initially
    if (solvedDays.size === 0) {
      return new Set([2, 5, 8, 10]);
    }
    return solvedDays;
  };

  const solvedDays = getSolvedDaysInJune();
  const calendarDays = [null]; // 1 empty slot since June 1, 2026 is Monday
  for (let d = 1; d <= 30; d++) {
    calendarDays.push(d);
  }

  // Active filter count
  const activeFiltersCount = 
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedDifficulty !== 'All' ? 1 : 0) +
    (selectedStatus !== 'All' ? 1 : 0) +
    (selectedTag !== 'All' ? 1 : 0);

  // Dynamic tag counts calculation for LeetCode horizontal bar
  const tagCounts = {};
  questions.forEach(q => {
    if (q.tags) {
      q.tags.forEach(t => {
        if (t) {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        }
      });
    }
  });

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-6 lg:p-8 w-full flex-grow flex flex-col gap-6 text-zinc-700 dark:text-zinc-300">
      
      {/* 1. WELCOME PROGRESS HEADER BANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Profile overview card */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-450 uppercase font-semibold tracking-wider">MEMBER OPERATOR</span>
            <h2 className="text-xl font-bold text-zinc-850 dark:text-white mt-1">{user.username}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{user.email}</p>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-3 py-2 rounded-lg">
              <span className="text-[9px] text-zinc-500 dark:text-zinc-450 uppercase font-semibold tracking-wider block">XP POINTS</span>
              <span className="text-md font-bold text-zinc-850 dark:text-white mt-0.5 block">{stats.points} PTS</span>
            </div>
            <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-3 py-2 rounded-lg">
              <span className="text-[9px] text-zinc-500 dark:text-zinc-450 uppercase font-semibold tracking-wider block">STREAK VALUE</span>
              <span className="text-md font-bold text-orange-600 dark:text-orange-400 mt-0.5 block flex items-center gap-1">
                <Flame size={16} className="fill-orange-400/20" />
                {stats.currentStreak} DAYS
              </span>
            </div>
          </div>
        </div>

        {/* Current badge card */}
        <div 
          onClick={onNavigateBadges}
          className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-zinc-700 transition"
        >
          <span className="text-[9px] text-zinc-500 dark:text-zinc-450 uppercase font-semibold tracking-wider">CURRENT BADGE</span>
          <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 flex items-center justify-center text-blue-500 mt-2 hover:scale-105 transition duration-300">
            <Star size={24} className="fill-current" />
          </div>
          <span className="font-bold text-zinc-850 dark:text-white text-sm mt-3">{stats.currentBadge}</span>
          <span className="text-[9px] text-blue-500 font-semibold mt-1">VIEW ALL BADGES →</span>
        </div>

        {/* Analytics bar chart stats card */}
        <div 
          onClick={onNavigateAnalytics}
          className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm rounded-xl p-5 flex flex-col justify-between cursor-pointer hover:border-zinc-700 transition"
        >
          <div>
            <span className="text-[9px] text-zinc-500 dark:text-zinc-450 uppercase font-semibold tracking-wider block">SOLVED MATRIX</span>
            <div className="mt-3 flex flex-col gap-2">
              {['easy', 'medium', 'hard'].map(diff => {
                const solved = stats.progress.solved[diff] || 0;
                const total = stats.progress.total[diff] || 0;
                const pct = total > 0 ? (solved / total) * 100 : 0;
                const diffLabel = diff === 'medium' ? 'Medium' : diff.charAt(0).toUpperCase() + diff.slice(1);
                
                return (
                  <div key={diff} className="text-[10px]">
                    <div className="flex justify-between text-zinc-550 dark:text-zinc-400 font-medium mb-0.5">
                      <span>{diffLabel}</span>
                      <span className="text-zinc-800 dark:text-white font-semibold">{solved}/{total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-150 dark:bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          diff === 'easy' ? 'bg-emerald-500' : diff === 'medium' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <span className="text-[9px] text-blue-500 font-semibold mt-2 block">ANALYTICS SUMMARY →</span>
        </div>
      </div>

      {/* Info helper alert */}
      <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm rounded-xl p-4 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <Info size={16} className="text-blue-500" />
          <p className="text-zinc-600 dark:text-zinc-400">
            Select logic tasks below. Build logical steps in plain English. No coding syntax required.
          </p>
        </div>
        {activeFiltersCount > 0 && (
          <button onClick={resetFilters} className="text-blue-500 font-semibold hover:underline">
            Reset Filters
          </button>
        )}
      </div>

      {/* 2. THREE-COLUMN CORE BODY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ==================== LEFT SIDEBAR ==================== */}
        <aside className="lg:col-span-3 xl:col-span-2 flex flex-col gap-5">
          {/* Main sections */}
          <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm rounded-xl p-2 flex flex-col gap-0.5">
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-left">
              <BookOpen size={14} className="text-zinc-600 dark:text-zinc-400" />
              <span>Library</span>
            </button>
            <button 
              onClick={() => alert("Daily quests loading. Solve daily problems to earn badge multipliers!")}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition text-left"
            >
              <div className="flex items-center gap-3">
                <Compass size={14} className="text-zinc-600 dark:text-zinc-400" />
                <span>Quests</span>
              </div>
              <span className="text-[9px] bg-blue-50 dark:bg-blue-600/10 text-blue-650 dark:text-blue-500 border border-blue-500/20 px-1 rounded">Daily</span>
            </button>
            <button 
              onClick={onNavigateAnalytics}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition text-left"
            >
              <FileText size={14} className="text-zinc-600 dark:text-zinc-400" />
              <span>Study Plans</span>
            </button>
          </div>

          {/* User playlists */}
          <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setMyListsExpanded(!myListsExpanded)}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 transition"
              >
                {myListsExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                <span>My Playlists</span>
              </button>
              <button 
                onClick={() => setShowAddList(!showAddList)}
                className="p-0.5 rounded hover:bg-zinc-800 text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 transition"
                title="Create List"
              >
                <Plus size={12} />
              </button>
            </div>

            {showAddList && (
              <form onSubmit={handleAddCustomList} className="flex flex-col gap-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-850">
                <input 
                  type="text" 
                  placeholder="Playlist Name..." 
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end gap-1 text-[9px] mt-1">
                  <button 
                    type="button" 
                    onClick={() => setShowAddList(false)}
                    className="px-1.5 py-0.5 text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-2 py-0.5 bg-blue-600 text-white rounded font-semibold"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {myListsExpanded && (
              <div className="flex flex-col gap-1 mt-1">
                {customLists.map((lst, idx) => (
                  <div 
                    key={idx}
                    onClick={() => alert(`Playlists are local to session. Add challenges to "${lst.name}" to organize.`)}
                    className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-white transition"
                  >
                    <div className="flex items-center gap-2">
                      <Lock size={10} className="text-zinc-400 dark:text-zinc-650" />
                      <span className="truncate">{lst.name}</span>
                    </div>
                    <span className="text-[9px] bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded">{lst.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ==================== CENTER MAIN SECTION ==================== */}
        <section className="lg:col-span-6 xl:col-span-7 flex flex-col gap-5">
          
          {/* Promos / Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => alert("Logic building mobile application simulator active. Coming soon to mobile app stores.")}
              className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm rounded-xl p-4 flex flex-col justify-between h-32 cursor-pointer hover:border-zinc-700 transition"
            >
              <div>
                <h4 className="text-zinc-850 dark:text-white font-bold text-sm">LogicForge Mobile</h4>
                <p className="text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 text-xs mt-1">Review steps on the go. Available for iOS & Android.</p>
              </div>
              <span className="text-[10px] font-semibold text-blue-500 hover:underline flex items-center gap-1">
                Details →
              </span>
            </div>

            <div 
              onClick={() => alert("System Design logic modules loading. Formulate distributed systems architecture steps.")}
              className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm rounded-xl p-4 flex flex-col justify-between h-32 cursor-pointer hover:border-zinc-700 transition"
            >
              <div>
                <span className="bg-blue-650/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase block w-max mb-1.5">New</span>
                <h4 className="text-zinc-850 dark:text-white font-bold text-sm">System Design Logic</h4>
                <p className="text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 text-xs mt-1">Master scalable architectures using step flow reasoning templates.</p>
              </div>
              <span className="text-[10px] font-semibold text-blue-500 hover:underline">
                Start Learning →
              </span>
            </div>
          </div>



          {/* Search, filters, counts bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-grow max-w-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 pointer-events-none">
                <Search size={14} />
              </span>
              <input 
                type="text" 
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-zinc-900 border border-zinc-200 dark:border-zinc-850 focus:border-blue-500 rounded-full py-1.5 pl-8 pr-4 text-xs placeholder-zinc-700 text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <select
                value={selectedDifficulty}
                onChange={(e) => { setSelectedDifficulty(e.target.value); setCurrentPage(1); }}
                className="bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded px-2.5 py-1.5 text-zinc-600 dark:text-zinc-400 focus:outline-none cursor-pointer"
              >
                <option value="All">Difficulty: All</option>
                <option value="Easy" className="text-emerald-500">Easy</option>
                <option value="Medium" className="text-amber-500">Medium</option>
                <option value="Hard" className="text-rose-500">Hard</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded px-2.5 py-1.5 text-zinc-600 dark:text-zinc-400 focus:outline-none cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="Solved">Solved</option>
                <option value="Todo">Todo</option>
              </select>

              <div className="bg-zinc-900 border border-zinc-200 dark:border-zinc-850 px-2.5 py-1.5 rounded font-mono text-[11px] text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                {totalItems} challenges
              </div>
            </div>
          </div>

          {/* Practice challenges table */}
          <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm rounded-xl overflow-hidden shadow">
            {loading ? (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs text-zinc-500 dark:text-zinc-450">Loading problem library...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-805 text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-950/20 font-semibold">
                      <th className="py-2.5 px-3 w-10 text-center">Status</th>
                      <th 
                        onClick={() => handleSort('questionNumber')}
                        className="py-2.5 px-3 w-16 cursor-pointer hover:text-white transition select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>No</span>
                          {sortField === 'questionNumber' && (
                            <ArrowUpDown size={10} className="text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('title')}
                        className="py-2.5 px-3 cursor-pointer hover:text-white transition select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Title</span>
                          {sortField === 'title' && (
                            <ArrowUpDown size={10} className="text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th className="py-2.5 px-3 w-20 text-right">Acceptance</th>
                      <th 
                        onClick={() => handleSort('difficulty')}
                        className="py-2.5 px-3 w-20 cursor-pointer hover:text-white transition select-none"
                      >
                        <div className="flex items-center gap-1">
                          <span>Difficulty</span>
                          {sortField === 'difficulty' && (
                            <ArrowUpDown size={10} className="text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th className="py-2.5 px-3 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedQuestions.length > 0 ? (
                      paginatedQuestions.map((q) => {
                        // Real challenges are numbers 1 to 18. Everything above 18 is marked as locked (simulated premium)
                        const isPremium = q.questionNumber > 18;
                        const acceptanceVal = `${(45 + (q.questionNumber % 40)).toFixed(1)}%`;
                        
                        return (
                          <tr 
                            key={q._id}
                            onClick={() => {
                              if (isPremium) {
                                alert(`"${q.title}" is a locked simulated premium question. Please solve Challenges #1-18 first!`);
                              } else {
                                onNavigateToSolver(q.questionNumber);
                              }
                            }}
                            className="border-b border-zinc-200 dark:border-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer transition text-zinc-700 dark:text-zinc-300"
                          >
                            {/* Status */}
                            <td className="py-3 px-3 text-center">
                              {q.completed ? (
                                <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-500/10 mx-auto" />
                              ) : (
                                <Circle size={14} className="text-zinc-700 mx-auto" />
                              )}
                            </td>

                            {/* No */}
                            <td className="py-3 px-3 font-mono text-zinc-500 dark:text-zinc-400">
                              {q.questionNumber}
                            </td>

                            {/* Title */}
                            <td className="py-3 px-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-zinc-850 dark:text-zinc-200 hover:text-blue-500 transition line-clamp-1">
                                  {q.title}
                                </span>
                                {q.tags && q.tags.length > 0 && (
                                  <div className="flex gap-1">
                                    {q.tags.slice(0, 3).map((t, idx) => (
                                      <span key={idx} className="text-[9px] bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Acceptance */}
                            <td className="py-3 px-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                              {acceptanceVal}
                            </td>

                            {/* Difficulty */}
                            <td className="py-3 px-3 font-bold">
                              <span className={getDiffColor(q.difficulty)}>
                                {q.difficulty === 'medium' ? 'Medium' : q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
                              </span>
                            </td>

                            {/* Action */}
                            <td className="py-3 px-3 text-center">
                              {isPremium ? (
                                <Lock size={12} className="text-amber-500 mx-auto" />
                              ) : (
                                <span className="text-[9px] font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  Solve
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-zinc-500 dark:text-zinc-400 italic">
                          <p>No challenges found matching filters</p>
                          <button 
                            onClick={resetFilters} 
                            className="mt-2 text-xs font-semibold text-blue-500 hover:underline"
                          >
                            Clear Filters
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="bg-zinc-50 dark:bg-zinc-950/20 border-t border-zinc-800 px-4 py-3 flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-450">
                <span className="hidden sm:inline">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} challenges
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-50 dark:disabled:hover:bg-zinc-950 disabled:cursor-not-allowed text-zinc-700 dark:text-zinc-300 transition"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <div className="flex items-center gap-1 font-mono">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-6 h-6 rounded flex items-center justify-center transition ${
                              currentPage === pageNum 
                                ? 'bg-blue-600 text-white font-bold' 
                                : 'hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (pageNum === 2 || pageNum === totalPages - 1) {
                        return <span key={pageNum} className="px-0.5 text-zinc-400 dark:text-zinc-650">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-50 dark:disabled:hover:bg-zinc-950 disabled:cursor-not-allowed text-zinc-700 dark:text-zinc-300 transition"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ==================== RIGHT SIDEBAR ==================== */}
        <aside className="lg:col-span-3 flex flex-col gap-5">
          
          {/* Calendar solved stats widget */}
          <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm rounded-xl p-4 flex flex-col gap-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className="text-orange-400 fill-orange-400/15" />
                  <span>June 2026</span>
                </h4>
                <div className="text-[9px] text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 font-semibold uppercase mt-0.5">
                  Streak Tracker
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                  <span>{formatTime(timeLeft)}</span>
                  <span className="text-[8px] font-sans font-normal text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">left</span>
                </div>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-7 text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-650">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-mono mt-1">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-6"></div>;
                  }
                  
                  const isCompleted = solvedDays.has(day);
                  const isToday = day === 12; // Current simulated date: 12th
                  
                  return (
                    <div 
                      key={day}
                      onClick={() => alert(`June ${day} practices. Solve questions to fill calendar tracker.`)}
                      className={`h-6 rounded flex items-center justify-center cursor-pointer transition relative ${
                        isCompleted 
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-500 font-extrabold border border-emerald-500/20' 
                          : isToday 
                          ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-650 dark:text-blue-500 font-bold border border-blue-500/20'
                          : 'text-zinc-450 dark:text-zinc-550 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                      }`}
                      title={isCompleted ? `Day ${day} solved!` : `Day ${day}`}
                    >
                      <span>{day}</span>
                      {isCompleted && (
                        <span className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-emerald-500 rounded-full"></span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily challenge highlight button card */}
            {dailyChallenge && (
              <div 
                onClick={() => onNavigateToSolver('daily')}
                className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-750 rounded-lg p-3 cursor-pointer transition flex justify-between items-center group"
              >
                <div>
                  <div className="text-[8px] text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">DAILY CHALLENGE</div>
                  <h5 className="text-xs font-bold text-zinc-850 dark:text-white leading-tight mt-0.5 group-hover:text-blue-500 transition truncate w-36">
                    {dailyChallenge.title}
                  </h5>
                  <span className={`text-[8px] font-bold block mt-1 uppercase ${getDiffColor(dailyChallenge.difficulty)}`}>
                    {dailyChallenge.difficulty}
                  </span>
                </div>
                <div>
                  {dailySolved ? (
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                      COMPLETED
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded shadow transition">
                      SOLVE
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Trending Companies List */}
          <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm rounded-xl p-4 flex flex-col gap-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 pb-1.5 border-b border-zinc-200 dark:border-zinc-850">
              Trending Tag Searches
            </h4>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 pointer-events-none">
                <Search size={12} />
              </span>
              <input 
                type="text" 
                placeholder="Search tags..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded py-1 pl-7 pr-2.5 text-[11px] placeholder-zinc-700 text-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1 mt-1">
              {companiesList
                .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
                .map((comp) => (
                  <button
                    key={comp.name}
                    onClick={() => {
                      setSearchQuery(comp.name);
                      setCurrentPage(1);
                    }}
                    className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-700 transition rounded-full pl-2.5 pr-1.5 py-0.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-white"
                  >
                    <span className="font-semibold text-[10px]">{comp.name}</span>
                    <span className="text-[8px] font-bold font-mono px-1 rounded-full bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {comp.count}
                    </span>
                  </button>
                ))}
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
}
