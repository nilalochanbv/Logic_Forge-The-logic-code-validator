import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Terminal, HelpCircle, AlertCircle, Plus, Trash2, 
  ArrowUp, ArrowDown, Send, CheckCircle2, XCircle, Star, Sparkles, MessageSquare 
} from 'lucide-react';

export default function ProblemSolver({ 
  questionNumber, 
  token, 
  apiUrl, 
  onBackToDashboard,
  onUserUpdate 
}) {
  const [question, setQuestion] = useState(null);
  const [steps, setSteps] = useState(["Store input 1 in variable A", "Store input 2 in variable B"]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [activeHintIndex, setActiveHintIndex] = useState(-1);
  
  // AI Mentor Chat states
  const [mentorOpen, setMentorOpen] = useState(false);
  const [mentorInput, setMentorInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [mentorLoading, setMentorLoading] = useState(false);

  const chatEndRef = useRef(null);

  // Fetch question details
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const isDaily = questionNumber === 'daily';
        const url = isDaily ? `${apiUrl}/daily-challenge` : `${apiUrl}/questions/${questionNumber}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const qData = isDaily ? data.question : data;
        
        if (qData && !qData.error) {
          setQuestion(qData);
          // Set initial steps template
          if (qData.title.toLowerCase().includes("sum")) {
            setSteps([
              "Get the first number from the user input and label it A",
              "Get the second number from the user input and label it B",
              "Add A and B together",
              "Store the result in a sum container",
              "Display the sum container to the user"
            ]);
          } else {
            setSteps(["Read input values", "Analyze relationship between values", "Formulate decision logic", "Output final conclusion"]);
          }
        }
      } catch (err) {
        console.error("Fetch question error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, [questionNumber, token, apiUrl]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, mentorOpen]);

  // Handle step adjustments
  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleStepChange = (index, value) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const handleDeleteStep = (index) => {
    if (steps.length <= 1) return;
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index - 1];
    newSteps[index - 1] = temp;
    setSteps(newSteps);
  };

  const handleMoveDown = (index) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index + 1];
    newSteps[index + 1] = temp;
    setSteps(newSteps);
  };

  // Submit Logic API handler
  const handleSubmitLogic = async () => {
    const filteredSteps = steps.map(s => s.trim()).filter(s => s.length > 0);
    if (filteredSteps.length === 0) {
      alert("Please write at least one valid logic step.");
      return;
    }

    setSubmitting(true);
    setEvaluation(null);

    try {
      const isDaily = questionNumber === 'daily';
      const submitUrl = isDaily ? `${apiUrl}/daily-challenge/submit` : `${apiUrl}/submissions`;
      const submitBody = isDaily 
        ? { logicSteps: filteredSteps }
        : { questionId: question._id, logicSteps: filteredSteps };

      const res = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submitBody)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }
      setEvaluation(data);
      if (data.user) {
        onUserUpdate(data.user);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Ask AI Mentor API handler
  const handleAskMentor = async (e) => {
    e.preventDefault();
    if (!mentorInput.trim()) return;

    const userMsg = mentorInput;
    setMentorInput('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setMentorLoading(true);

    try {
      const res = await fetch(`${apiUrl}/questions/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          questionTitle: question.title,
          questionDescription: question.description,
          userQuestion: userMsg,
          chatHistory: chatHistory
        })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { sender: 'mentor', text: data.reply || "Think about what input we need to store first." }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'mentor', text: "Connection error. Focus on inputs and step progression." }]);
    } finally {
      setMentorLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center py-12">
        <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-zinc-500 text-xs uppercase tracking-wider">Loading question details...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center text-center p-8">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h3 className="text-white font-bold text-lg">CHALLENGE NOT FOUND</h3>
        <button onClick={onBackToDashboard} className="mt-4 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-350 text-xs font-semibold uppercase rounded hover:bg-zinc-800 transition">
          BACK TO DASHBOARD
        </button>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col xl:flex-row relative text-zinc-300">
      
      {/* LEFT COLUMN: Problem Details & Constraints */}
      <div className="flex-1 border-r border-zinc-900 p-6 flex flex-col gap-6 max-h-[85vh] overflow-y-auto bg-zinc-950/20">
        <button 
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-zinc-400 hover:text-white font-semibold text-xs tracking-wider uppercase self-start"
        >
          <ArrowLeft size={14} />
          BACK TO DASHBOARD
        </button>

        <div>
          <span className="text-[10px] text-blue-500 font-bold tracking-widest uppercase px-2 py-0.5 border border-blue-500/20 bg-blue-500/10 rounded">
            LEVEL: {question.difficulty.toUpperCase()}
          </span>
          <h2 className="text-2xl font-bold text-white mt-3 uppercase tracking-wide">
            {question.title}
          </h2>
          <p className="text-xs text-zinc-400 mt-4 leading-relaxed font-light whitespace-pre-line">
            {question.description}
          </p>
        </div>

        {/* Input/Output Examples */}
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-xs uppercase text-white tracking-widest flex items-center gap-1.5">
            <Terminal size={14} className="text-blue-500" />
            INPUT / OUTPUT EXAMPLES
          </h3>
          <div className="flex flex-col gap-2">
            {question.inputExamples.map((ex, idx) => (
              <div key={idx} className="bg-zinc-900 p-3 rounded-lg border border-zinc-850 text-xs font-mono flex flex-col gap-1">
                <div><span className="text-blue-500 font-semibold">INPUT:</span> {ex.input}</div>
                <div><span className="text-rose-500 font-semibold">OUTPUT:</span> {ex.output}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Logical Constraints */}
        {question.constraints && question.constraints.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-xs uppercase text-white tracking-widest flex items-center gap-1.5">
              <AlertCircle size={14} className="text-rose-500" />
              LOGICAL CONSTRAINTS
            </h3>
            <ul className="list-disc list-inside text-xs text-zinc-400 leading-relaxed flex flex-col gap-1 pl-1">
              {question.constraints.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Hints Accordion */}
        {question.hints && question.hints.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h3 className="font-bold text-xs uppercase text-white tracking-widest flex items-center gap-1.5">
              <HelpCircle size={14} className="text-zinc-500" />
              HINTS
            </h3>
            <div className="flex flex-col gap-2">
              {question.hints.map((hint, idx) => (
                <div 
                  key={idx} 
                  className="bg-zinc-900 rounded-lg border border-zinc-850 overflow-hidden text-xs"
                >
                  <button
                    onClick={() => setActiveHintIndex(activeHintIndex === idx ? -1 : idx)}
                    className="w-full text-left py-2 px-4 font-semibold bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 transition flex justify-between items-center"
                  >
                    <span>REVEAL HINT #{idx + 1}</span>
                    <span className="text-zinc-500">{activeHintIndex === idx ? '▲' : '▼'}</span>
                  </button>
                  {activeHintIndex === idx && (
                    <div className="p-3 text-zinc-400 bg-zinc-950/80 border-t border-zinc-850 leading-relaxed">
                      {hint}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Mentor Drawer toggle */}
        <button 
          onClick={() => setMentorOpen(!mentorOpen)}
          className="mt-2 py-2.5 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-300 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition"
        >
          <MessageSquare size={14} />
          {mentorOpen ? "CLOSE MENTOR CONSOLE" : "INITIALIZE AI MENTOR"}
        </button>
      </div>

      {/* RIGHT COLUMN: Interactive Logic Editor */}
      <div className="flex-1 p-6 flex flex-col gap-6 max-h-[85vh] overflow-y-auto bg-zinc-950/40">
        <div>
          <h3 className="font-bold text-sm text-white tracking-wider uppercase">
            LOGICAL STEP SEQUENCE EDITOR
          </h3>
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">
            Build your algorithm. Plain English instructions only. No program syntax.
          </p>
        </div>

        {/* Interactive Step List */}
        <div className="flex flex-col gap-3">
          {steps.map((step, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-850 rounded-xl hover:border-zinc-750 transition-all group"
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <button 
                  disabled={idx === 0}
                  onClick={() => handleMoveUp(idx)}
                  className={`p-0.5 rounded hover:bg-zinc-800 ${idx === 0 ? 'text-zinc-700 cursor-not-allowed' : 'text-blue-500'}`}
                >
                  <ArrowUp size={12} />
                </button>
                <button 
                  disabled={idx === steps.length - 1}
                  onClick={() => handleMoveDown(idx)}
                  className={`p-0.5 rounded hover:bg-zinc-800 ${idx === steps.length - 1 ? 'text-zinc-700 cursor-not-allowed' : 'text-blue-500'}`}
                >
                  <ArrowDown size={12} />
                </button>
              </div>

              <div className="font-bold text-xs text-zinc-500 min-w-[50px]">
                STEP {idx + 1}
              </div>

              <input 
                type="text" 
                value={step}
                onChange={(e) => handleStepChange(idx, e.target.value)}
                placeholder="e.g. Prompt user for number..."
                className="flex-grow bg-zinc-950 border border-zinc-850 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              />

              <button 
                onClick={() => handleDeleteStep(idx)}
                disabled={steps.length <= 1}
                className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg shrink-0 disabled:text-zinc-700 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleAddStep}
            className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-300 font-bold text-xs tracking-wider rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Plus size={14} />
            ADD STEP
          </button>
          
          <button 
            onClick={handleSubmitLogic}
            disabled={submitting}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest text-xs rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {submitting ? 'COMPILING EVALUATION...' : 'SUBMIT LOGIC'}
          </button>
        </div>

        {/* AI HUD EVALUATION REPORT */}
        {evaluation && (
          <div className={`mt-2 p-5 rounded-2xl border ${
            evaluation.evaluation.correctnessStatus === 'correct' 
              ? 'bg-zinc-900 border-emerald-500/20 shadow' 
              : 'bg-zinc-900 border-rose-500/20 shadow'
          } relative`}>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider">AI EVALUATOR REPORT</span>
                <h4 className={`font-bold text-md mt-1 tracking-wide ${
                  evaluation.evaluation.correctnessStatus === 'correct' ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {evaluation.evaluation.correctnessStatus === 'correct' ? 'correct logic' : 'incorrect logic'}
                </h4>
                {evaluation.evaluation.correctnessStatus !== 'correct' && (
                  <p className="text-rose-500 font-bold text-xs mt-1">incorrect</p>
                )}
              </div>

              <div className="flex gap-0.5 bg-zinc-950 px-2 py-1 rounded border border-zinc-850">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={12} 
                    className={i < evaluation.evaluation.stars ? "text-yellow-400 fill-yellow-400" : "text-zinc-700"} 
                  />
                ))}
              </div>
            </div>

            {/* Quality Score HUD */}
            <div className="flex gap-4 items-center mb-5 bg-zinc-950 p-4 rounded-xl border border-zinc-855">
              <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {evaluation.evaluation.logicQualityScore}%
              </div>
              <div className="text-xs">
                <span className="text-[9px] text-zinc-500 uppercase font-semibold">LOGIC QUALITY SCORE</span>
                <p className="text-zinc-300 mt-0.5">Points Awarded: <span className="font-bold text-blue-500">+{evaluation.pointsAwarded} PTS</span></p>
                {evaluation.newStreak && (
                  <p className="text-[9px] text-orange-400 mt-0.5">Daily Streak Updated: {evaluation.newStreak} Days!</p>
                )}
                {evaluation.newBadge && (
                  <p className="text-[9px] text-purple-400 font-bold mt-0.5">NEW BADGE EARNED: {evaluation.newBadge.toUpperCase()}</p>
                )}
              </div>
            </div>

            {/* AI critique text info */}
            <div className="flex flex-col gap-3 text-xs leading-relaxed">
              <div>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">AI CRITIQUE:</span>
                <p className="text-zinc-350 mt-1 bg-zinc-950 p-3 rounded border border-zinc-850">
                  {evaluation.evaluation.explanation}
                </p>
              </div>

              {evaluation.evaluation.missingSteps && evaluation.evaluation.missingSteps.length > 0 && (
                <div>
                  <span className="text-[9px] text-rose-500 font-bold uppercase tracking-wider block">MISSING BLOCKS:</span>
                  <ul className="list-disc list-inside text-zinc-400 mt-1 pl-1 flex flex-col gap-0.5">
                    {evaluation.evaluation.missingSteps.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.evaluation.flaws && evaluation.evaluation.flaws.length > 0 && (
                <div>
                  <span className="text-[9px] text-rose-500 font-bold uppercase tracking-wider block">LOGICAL FLAWS:</span>
                  <ul className="list-disc list-inside text-zinc-400 mt-1 pl-1 flex flex-col gap-0.5">
                    {evaluation.evaluation.flaws.map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.evaluation.suggestions && evaluation.evaluation.suggestions.length > 0 && (
                <div>
                  <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider block">REASONING SUGGESTIONS:</span>
                  <ul className="list-disc list-inside text-zinc-400 mt-1 pl-1 flex flex-col gap-0.5">
                    {evaluation.evaluation.suggestions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI MENTOR DRAWER SIDEBAR PANEL */}
      {mentorOpen && (
        <div className="w-full xl:w-[350px] border-t xl:border-t-0 xl:border-l border-zinc-900 bg-zinc-950 flex flex-col max-h-[85vh] xl:max-h-full shrink-0">
          <div className="p-4 border-b border-zinc-900 bg-zinc-900/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-blue-500" />
              <span className="font-bold text-xs uppercase tracking-wider text-white">AI MENTOR CONSOLE</span>
            </div>
            <button 
              onClick={() => setMentorOpen(false)}
              className="text-xs font-bold text-zinc-500 hover:text-white uppercase"
            >
              CLOSE
            </button>
          </div>

          <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-4 min-h-[250px]">
            <div className="text-xs bg-zinc-900/50 border border-zinc-900 rounded-xl p-3 text-zinc-400 leading-relaxed font-light">
              Hello! I'm your logic mentor. Ask me questions about <span className="text-blue-500 font-medium">"{question.title}"</span>. 
              I will never write code or give final answers. I am here to guide your logical thinking step-by-step.
            </div>

            {chatHistory.map((msg, index) => (
              <div 
                key={index}
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600/10 text-white self-end border border-blue-500/20' 
                    : 'bg-zinc-900/80 text-zinc-300 self-start border border-zinc-850'
                }`}
              >
                <div className="text-[8px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
                  {msg.sender === 'user' ? 'OPERATOR' : 'AI MENTOR'}
                </div>
                {msg.text}
              </div>
            ))}

            {mentorLoading && (
              <div className="bg-zinc-900/80 border border-zinc-850 text-zinc-500 text-xs rounded-2xl p-3 self-start max-w-[85%] animate-pulse">
                MENTOR THINKING...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleAskMentor} className="p-3 border-t border-zinc-900 bg-zinc-900/30 flex gap-2">
            <input 
              type="text" 
              placeholder="Ask for hints..."
              value={mentorInput}
              onChange={(e) => setMentorInput(e.target.value)}
              className="flex-grow bg-zinc-950 border border-zinc-850 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-blue-500 text-white font-medium"
            />
            <button 
              type="submit"
              className="p-2 bg-blue-600 text-white hover:bg-blue-500 rounded-lg active:scale-95 transition-all shadow shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
