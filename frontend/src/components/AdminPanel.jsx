import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, ArrowLeft, Users, FileText, Check } from 'lucide-react';

export default function AdminPanel({ token, apiUrl, onBackToDashboard }) {
  const [activeTab, setActiveTab] = useState('questions');
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for creating/editing a question
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [description, setDescription] = useState('');
  const [inputExs, setInputExs] = useState([{ input: '', output: '' }]);
  const [constraints, setConstraints] = useState(['']);
  const [hints, setHints] = useState(['']);
  const [tags, setTags] = useState(['']);

  // Fetch admin data
  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch Questions
      const qRes = await fetch(`${apiUrl}/questions`, { headers });
      const qData = await qRes.json();
      if (Array.isArray(qData)) {
        setQuestions(qData);
      }

      // Fetch Users
      const uRes = await fetch(`${apiUrl}/admin/users`, { headers });
      const uData = await uRes.json();
      if (Array.isArray(uData)) {
        setUsers(uData);
      }
    } catch (err) {
      console.error("Admin fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // User role modifier
  const handleToggleRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`${apiUrl}/admin/users/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: nextRole })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: nextRole } : u));
      }
    } catch (err) {
      alert("Failed to modify user role authority.");
    }
  };

  // Question array state helpers
  const handleAddInputEx = () => setInputExs([...inputExs, { input: '', output: '' }]);
  const handleInputExChange = (idx, field, val) => {
    const list = [...inputExs];
    list[idx][field] = val;
    setInputExs(list);
  };
  const handleAddConstraint = () => setConstraints([...constraints, '']);
  const handleConstraintChange = (idx, val) => {
    const list = [...constraints];
    list[idx] = val;
    setConstraints(list);
  };
  const handleAddHint = () => setHints([...hints, '']);
  const handleHintChange = (idx, val) => {
    const list = [...hints];
    list[idx] = val;
    setHints(list);
  };
  const handleAddTag = () => setTags([...tags, '']);
  const handleTagChange = (idx, val) => {
    const list = [...tags];
    list[idx] = val;
    setTags(list);
  };

  // Clear Form State
  const resetForm = () => {
    setEditingQuestionId(null);
    setTitle('');
    setDifficulty('easy');
    setDescription('');
    setInputExs([{ input: '', output: '' }]);
    setConstraints(['']);
    setHints(['']);
    setTags(['']);
  };

  // Trigger edit question form loader
  const handleStartEdit = (q) => {
    setEditingQuestionId(q._id);
    setTitle(q.title);
    setDifficulty(q.difficulty);
    setDescription(q.description);
    setInputExs(q.inputExamples.length > 0 ? q.inputExamples.map(e => ({ input: e.input, output: e.output })) : [{ input: '', output: '' }]);
    setConstraints(q.constraints.length > 0 ? [...q.constraints] : ['']);
    setHints(q.hints.length > 0 ? [...q.hints] : ['']);
    setTags(q.tags && q.tags.length > 0 ? [...q.tags] : ['']);
  };

  // Create/Update submit handler
  const handleSaveQuestion = async (e) => {
    e.preventDefault();

    const payload = {
      title,
      difficulty,
      description,
      inputExamples: inputExs.filter(ex => ex.input.trim().length > 0),
      constraints: constraints.filter(c => c.trim().length > 0),
      hints: hints.filter(h => h.trim().length > 0),
      tags: tags.filter(t => t.trim().length > 0)
    };

    try {
      let res;
      if (editingQuestionId) {
        // Update
        res = await fetch(`${apiUrl}/admin/questions/${editingQuestionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        res = await fetch(`${apiUrl}/admin/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        resetForm();
        fetchAdminData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Save operation failed.");
      }
    } catch (err) {
      alert("Error saving question.");
    }
  };

  // Delete Question handler
  const handleDeleteQuestion = async (qId) => {
    if (!confirm("Are you sure you want to delete this logical problem from database?")) return;
    try {
      const res = await fetch(`${apiUrl}/admin/questions/${qId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      alert("Delete question failed.");
    }
  };

  return (
    <div className="px-6 py-8 flex flex-col gap-8 max-w-7xl mx-auto w-full text-zinc-300">
      {/* Back button */}
      <button 
        onClick={onBackToDashboard}
        className="flex items-center gap-2 text-zinc-400 hover:text-white font-semibold text-xs tracking-wider uppercase self-start"
      >
        <ArrowLeft size={12} />
        BACK TO DASHBOARD
      </button>

      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-zinc-805 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <Shield className="text-red-500" size={24} />
            ADMIN PANEL
          </h2>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
            Manage question bank database and user authorizations.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
          <button 
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg transition-all ${
              activeTab === 'questions' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <FileText size={14} />
            PROBLEMS
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg transition-all ${
              activeTab === 'users' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Users size={14} />
            USER ACCESS
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 flex-grow flex flex-col items-center justify-center">
          <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-zinc-500 text-xs">Loading database console...</p>
        </div>
      ) : activeTab === 'users' ? (
        
        // MANAGE USERS PANEL
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white uppercase mb-5 pb-2 border-b border-zinc-800">
            REGISTERED OPERATORS
          </h3>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase">
                  <th className="py-2.5 px-3">USERNAME</th>
                  <th className="py-2.5 px-3">EMAIL</th>
                  <th className="py-2.5 px-3 text-center">ROLE</th>
                  <th className="py-2.5 px-3 text-center">POINTS</th>
                  <th className="py-2.5 px-3 text-center">STREAK</th>
                  <th className="py-2.5 px-3 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 text-zinc-350">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-zinc-850/35 transition">
                    <td className="py-3 px-3 font-semibold text-white">{u.username}</td>
                    <td className="py-3 px-3 font-mono">{u.email}</td>
                    <td className="py-3 px-3 text-center uppercase">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-950 text-zinc-500 border border-zinc-850'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-blue-500 font-semibold">{u.points} PTS</td>
                    <td className="py-3 px-3 text-center text-orange-400">{u.currentStreak} Days</td>
                    <td className="py-3 px-3 text-center">
                      <button 
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className={`py-1 px-3 border rounded text-[10px] uppercase font-semibold transition ${
                          u.role === 'admin' 
                            ? 'border-red-900/40 text-red-400 hover:bg-red-950/20' 
                            : 'border-blue-800/40 text-blue-500 hover:bg-blue-500/10'
                        }`}
                      >
                        {u.role === 'admin' ? 'DEMOTE' : 'MAKE ADMIN'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        
        // MANAGE QUESTIONS CRUD PANEL
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          
          {/* Create/Edit Question Form */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <h3 className="text-xs font-bold text-white uppercase mb-5 pb-2 border-b border-zinc-800">
              {editingQuestionId ? 'EDIT PROBLEM SCHEMATICS' : 'CREATE LOGIC PROBLEM'}
            </h3>

            <form onSubmit={handleSaveQuestion} className="flex flex-col gap-4 text-xs">
              
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">CHALLENGE TITLE</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required
                  placeholder="e.g. Find even index items..."
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 text-white" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">DIFFICULTY SCHEME</label>
                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 text-white font-semibold cursor-pointer"
                >
                  <option value="easy">EASY</option>
                  <option value='medium'>INTERMEDIATE (MEDIUM)</option>
                  <option value="hard">HARD</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">PROBLEM DESCRIPTION</label>
                <textarea 
                  rows={4} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  required
                  placeholder="Objective, variables, and logic guidelines..."
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 text-white"
                />
              </div>

              {/* Input Examples */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">TEST CASES (INPUT/OUTPUT)</label>
                  <button type="button" onClick={handleAddInputEx} className="text-blue-500 font-bold text-[10px] hover:underline">+ ADD CASE</button>
                </div>
                <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                  {inputExs.map((ex, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Input value" 
                        value={ex.input} 
                        onChange={(e) => handleInputExChange(idx, 'input', e.target.value)}
                        className="w-1/2 bg-zinc-950 border border-zinc-850 rounded-lg py-1.5 px-2.5 text-[11px] text-white focus:outline-none focus:border-blue-500" 
                      />
                      <input 
                        type="text" 
                        placeholder="Expected output" 
                        value={ex.output} 
                        onChange={(e) => handleInputExChange(idx, 'output', e.target.value)}
                        className="w-1/2 bg-zinc-950 border border-zinc-850 rounded-lg py-1.5 px-2.5 text-[11px] text-white focus:outline-none focus:border-blue-500" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Logical Constraints */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">CONSTRAINTS</label>
                  <button type="button" onClick={handleAddConstraint} className="text-blue-500 font-bold text-[10px] hover:underline">+ ADD RULE</button>
                </div>
                <div className="flex flex-col gap-2 max-h-28 overflow-y-auto pr-1">
                  {constraints.map((c, idx) => (
                    <input 
                      key={idx}
                      type="text" 
                      placeholder="e.g. Inputs are positive integers only" 
                      value={c}
                      onChange={(e) => handleConstraintChange(idx, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-1.5 px-2.5 text-[11px] text-white focus:outline-none focus:border-blue-500"
                    />
                  ))}
                </div>
              </div>

              {/* Hints */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">HINTS</label>
                  <button type="button" onClick={handleAddHint} className="text-blue-500 font-bold text-[10px] hover:underline">+ ADD HINT</button>
                </div>
                <div className="flex flex-col gap-2 max-h-28 overflow-y-auto pr-1">
                  {hints.map((h, idx) => (
                    <input 
                      key={idx}
                      type="text" 
                      placeholder="e.g. Remainder checks or modulo calculations..." 
                      value={h}
                      onChange={(e) => handleHintChange(idx, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-1.5 px-2.5 text-[11px] text-white focus:outline-none focus:border-blue-500"
                    />
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">TAGS</label>
                  <button type="button" onClick={handleAddTag} className="text-blue-500 font-bold text-[10px] hover:underline">+ ADD TAG</button>
                </div>
                <div className="flex flex-col gap-2 max-h-28 overflow-y-auto pr-1">
                  {tags.map((t, idx) => (
                    <input 
                      key={idx}
                      type="text" 
                      placeholder="e.g. math, arrays, search" 
                      value={t}
                      onChange={(e) => handleTagChange(idx, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-1.5 px-2.5 text-[11px] text-white focus:outline-none focus:border-blue-500"
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button 
                  type="submit"
                  className="flex-grow py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg tracking-wider transition"
                >
                  SAVE PROBLEM
                </button>
                {editingQuestionId && (
                  <button 
                    type="button" 
                    onClick={resetForm}
                    className="py-2 px-4 bg-zinc-955 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-bold text-[11px] rounded-lg transition"
                  >
                    CANCEL
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List of current Questions */}
          <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <h3 className="text-xs font-bold text-white uppercase mb-5 pb-2 border-b border-zinc-800">
              EXISTING PROBLEM MODULES
            </h3>
            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
              {questions.map(q => (
                <div 
                  key={q._id} 
                  className="bg-zinc-950/45 border border-zinc-850 p-4 rounded-xl flex items-center justify-between gap-4 hover:border-zinc-750 transition text-xs"
                >
                  <div>
                    <span className="text-[9px] text-zinc-550 font-bold tracking-widest uppercase">
                      CHALLENGE #{q.questionNumber}
                    </span>
                    <h4 className="font-semibold text-sm text-white mt-0.5">{q.title}</h4>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">
                      {q.difficulty} • {q.inputExamples?.length || 0} cases
                    </span>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => handleStartEdit(q)}
                      className="p-2 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteQuestion(q._id)}
                      className="p-2 bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
