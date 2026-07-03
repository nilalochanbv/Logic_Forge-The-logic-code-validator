import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ProblemSolver from './components/ProblemSolver';
import Profile from './components/Profile';
import BadgeCabinet from './components/BadgeCabinet';
import Analytics from './components/Analytics';
import AdminPanel from './components/AdminPanel';
import { Shield, User as UserIcon, BarChart2, Award, Layout, LogOut, MessageSquare, Send, X, Mic, Paperclip } from 'lucide-react';
import robotAvatar from './assets/robot.png';

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://logic-forge-the-logic-code-validator.onrender.com/api'
);

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [view, setView] = useState(token ? 'dashboard' : 'login');
  const [selectedQuestionNumber, setSelectedQuestionNumber] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Sync theme with document class list
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // Sync token and user with localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Fetch current user details on load if token exists
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Session invalid');
          return res.json();
        })
        .then(data => {
          setUser(data);
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const logout = () => {
    setToken(null);
    setUser(null);
    setView('login');
    localStorage.clear();
  };

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setView('dashboard');
  };

  const navigateToSolver = (questionNum) => {
    setSelectedQuestionNumber(questionNum);
    setView('solver');
  };

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'bot',
      text: `Welcome back!\n\nI am LogicBot, your personal logic-building mentor.\n\nI can help you understand problems, review your logic, provide hints, and track your progress.\n\nRemember:\nI help you think.\nI do not write code.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResponding, setChatResponding] = useState(false);

  const handleSendChat = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatInput('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg, timestamp: time }]);
    setChatLoading(true);

    try {
      const chatHistoryForAPI = chatHistory.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch(`${API_URL}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMsg,
          chatHistory: chatHistoryForAPI
        })
      });
      const data = await res.json();
      
      setChatResponding(true);
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: data.reply || "I am here to guide your logical thinking step-by-step. What inputs do we need first?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      
      // Keep responding glow for 1.5 seconds
      setTimeout(() => {
        setChatResponding(false);
      }, 1500);
    } catch (err) {
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: "My neural link is experiencing latency. Let's focus on defining the inputs and logical flow for your current challenge.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Main Page Router
  const renderView = () => {
    if (!token || view === 'login') {
      return <Login onLoginSuccess={handleLoginSuccess} apiUrl={API_URL} />;
    }

    switch (view) {
      case 'dashboard':
        return (
          <Dashboard 
            user={user} 
            token={token} 
            apiUrl={API_URL} 
            onNavigateToSolver={navigateToSolver}
            onNavigateProfile={() => setView('profile')}
            onNavigateAnalytics={() => setView('analytics')}
            onNavigateBadges={() => setView('badges')}
          />
        );

      case 'solver':
        return (
          <ProblemSolver 
            questionNumber={selectedQuestionNumber} 
            token={token} 
            apiUrl={API_URL} 
            onBackToDashboard={() => setView('dashboard')}
            onUserUpdate={(newUserData) => setUser({ ...user, ...newUserData })}
          />
        );
      case 'profile':
        return (
          <Profile 
            user={user} 
            token={token} 
            apiUrl={API_URL} 
            onBackToDashboard={() => setView('dashboard')}
            onNavigateToSolver={navigateToSolver}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        );
      case 'badges':
        return (
          <BadgeCabinet 
            user={user} 
            token={token} 
            apiUrl={API_URL}
            onBackToDashboard={() => setView('dashboard')}
          />
        );
      case 'analytics':
        return (
          <Analytics 
            user={user} 
            token={token} 
            apiUrl={API_URL} 
            onBackToDashboard={() => setView('dashboard')}
          />
        );
      case 'admin':
        return (
          <AdminPanel 
            token={token} 
            apiUrl={API_URL} 
            onBackToDashboard={() => setView('dashboard')}
          />
        );
      default:
        return <Dashboard user={user} token={token} apiUrl={API_URL} onNavigateToSolver={navigateToSolver} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-zinc-50 dark:bg-[#09090b] text-zinc-800 dark:text-zinc-300 transition-colors duration-250">
      {/* Main Header / Navigation Bar */}
      {token && user && (
        <header className="bg-white dark:bg-[#18181b] border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm transition-colors duration-250">
          <div 
            onClick={() => setView('dashboard')} 
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="bg-blue-650 p-2 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-lg leading-none">LF</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide text-zinc-850 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                LogicForge
              </h1>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Algorithmic Sandbox</p>
            </div>
          </div>

          <nav className="flex items-center gap-4 text-xs font-semibold">
            <button 
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${view === 'dashboard' ? 'text-zinc-900 bg-zinc-100 border border-zinc-300 dark:text-white dark:bg-zinc-800 dark:border-zinc-700' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}`}
            >
              <Layout size={14} />
              DASHBOARD
            </button>
            <button 
              onClick={() => setView('badges')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${view === 'badges' ? 'text-zinc-900 bg-zinc-100 border border-zinc-300 dark:text-white dark:bg-zinc-800 dark:border-zinc-700' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}`}
            >
              <Award size={14} />
              BADGES
            </button>
            <button 
              onClick={() => setView('analytics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${view === 'analytics' ? 'text-zinc-900 bg-zinc-100 border border-zinc-300 dark:text-white dark:bg-zinc-800 dark:border-zinc-700' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}`}
            >
              <BarChart2 size={14} />
              ANALYTICS
            </button>
            <button 
              onClick={() => setView('profile')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${view === 'profile' ? 'text-zinc-900 bg-zinc-100 border border-zinc-300 dark:text-white dark:bg-zinc-800 dark:border-zinc-700' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}`}
            >
              <UserIcon size={14} />
              PROFILE
            </button>
            {user.role === 'admin' && (
              <button 
                onClick={() => setView('admin')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all ${view === 'admin' ? 'text-red-650 bg-red-50 dark:text-red-400 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30' : 'text-zinc-555 hover:text-red-650 dark:text-zinc-400 dark:hover:text-red-400'}`}
              >
                <Shield size={14} />
                ADMIN
              </button>
            )}
            <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
            <button 
              onClick={logout}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all py-1.5 px-3 rounded hover:bg-zinc-100 border border-transparent hover:border-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-zinc-700"
            >
              <LogOut size={14} />
              LOGOUT
            </button>
          </nav>
        </header>
      )}

      {/* View Wrapper */}
      <main className="flex-grow flex flex-col relative z-10 w-full">
        {renderView()}
      </main>

      {/* LogicBot Floating AI Chatbot Assistant */}
      {token && user && (
        <>
          {/* Chat Window Panel */}
          {chatOpen && (
            <div className="fixed bottom-24 right-6 w-96 h-[500px] z-50 flex flex-col rounded-2xl overflow-hidden logicbot-chat-window border border-zinc-800">
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 bg-[#18181b] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={robotAvatar} alt="LogicBot" className="w-10 h-10 rounded-full border border-zinc-700 bg-zinc-800 object-cover" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-black rounded-full animate-ping"></span>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-black rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white tracking-wide">LogicBot</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-blue-500 uppercase font-semibold tracking-wider">ONLINE</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Conversation Area */}
              <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-4 bg-zinc-950/20">
                {chatHistory.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600/10 text-white self-end border border-blue-500/20 rounded-tr-none'
                        : 'bg-zinc-900/80 text-zinc-200 self-start border border-zinc-800 rounded-tl-none'
                    }`}
                  >
                    <div className="text-[8px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
                      {msg.sender === 'user' ? 'OPERATOR' : 'LOGICBOT'}
                    </div>
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <div className="text-[8px] text-zinc-500 text-right mt-1">
                      {msg.timestamp}
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs rounded-2xl rounded-tl-none p-3 self-start max-w-[80%] animate-pulse flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                )}
                
                <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
              </div>

              {/* Input Footer Area */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-zinc-800 bg-[#18181b] flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  title="Attach Logic File"
                  onClick={() => alert("LogicBot accepts text descriptions and sequences of steps in the chat box directly.")}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all"
                >
                  <Paperclip size={16} />
                </button>
                <button
                  type="button"
                  title="Voice Input (Conceptual)"
                  onClick={() => alert("Voice transcription active in simulation. Speak your query.")}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all"
                >
                  <Mic size={16} />
                </button>
                
                <input 
                  type="text"
                  placeholder="EXPLAIN PROBLEM OR REVIEWS STEP LOGIC..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-grow bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500 font-medium"
                />
                
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="p-2.5 bg-blue-600 text-white hover:bg-blue-500 rounded-lg active:scale-95 disabled:opacity-50 shadow shrink-0 transition-all"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}

          {/* Floating Robot Assistant Toggle Button */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`fixed bottom-6 right-6 w-16 h-16 rounded-full z-50 flex items-center justify-center p-0 overflow-hidden logicbot-float logicbot-glow-cyan border border-zinc-700 bg-zinc-900`}
            title="Interact with LogicBot Mentor"
          >
            <img 
              src={robotAvatar} 
              alt="LogicBot Avatar" 
              className="w-full h-full object-cover select-none transition-transform duration-300 hover:rotate-6 scale-105" 
            />
          </button>
        </>
      )}

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-zinc-500 border-t border-zinc-900 bg-zinc-950 z-10">
        &copy; {new Date().getFullYear()} LogicForge Platform • Pure logic builder sandbox. Code-Free Area.
      </footer>
    </div>
  );
}
