import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Terminal, Sparkles, Globe, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login({ onLoginSuccess, apiUrl }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // States to track Mascot interactions
  const [activeFieldName, setActiveFieldName] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [mascotState, setMascotState] = useState('idle');

  // Sync mascot state machine
  useEffect(() => {
    if (loading) {
      setMascotState('happy');
    } else if (error) {
      setMascotState('confused');
    } else if (isPasswordFocused) {
      setMascotState('coverEyes');
    } else if (activeFieldName === 'email' || activeFieldName === 'username') {
      setMascotState('lookAtInput');
    } else {
      setMascotState('idle');
    }
  }, [activeFieldName, isPasswordFocused, loading, error]);

  // Handle Google Credential Response (Google Sign-In Callback)
  const handleCredentialResponse = async (response) => {
    setError(null);
    setLoading(true);
    try {
      const jwtToken = response.credential;
      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      const googleUser = {
        email: payload.email,
        username: payload.name || payload.given_name || 'Google Learner',
        googleId: payload.sub
      };

      const res = await fetch(`${apiUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleUser)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Google login failed');
      }
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Google Mock Authentication login simulation (kept for local test fallback)
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const googleMock = {
        email: 'learner@logicforge.dev',
        username: 'LogicPioneer',
        googleId: 'g_mock_' + Math.random().toString(36).substr(2, 9)
      };

      const res = await fetch(`${apiUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleMock)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Google login failed');
      }
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initGoogleSignIn = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '838175244728-vgdsd877nj5dc20qmu7a7m4ecq3a1583.apps.googleusercontent.com',
          callback: handleCredentialResponse
        });
        
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInBtn'),
          { 
            theme: 'outline', 
            size: 'large', 
            text: 'continue_with', 
            shape: 'rectangular', 
            width: 320
          }
        );
      }
    };

    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogleSignIn;
      document.body.appendChild(script);
    } else {
      initGoogleSignIn();
    }
  }, [isSignUp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isSignUp ? '/auth/signup' : '/auth/login';
    const payload = isSignUp ? { username, email, password } : { email, password };

    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine active text length
  const getActiveTextLength = () => {
    if (activeFieldName === 'email') return email.length;
    if (activeFieldName === 'username') return username.length;
    return 0;
  };

  return (
    <div className="relative w-screen h-screen flex overflow-hidden bg-[#09090b] font-sans">
      
      {/* LEFT SIDE: Large Promo Text Block (Visible only on md/lg screens) */}
      <div className="hidden md:flex md:w-[55%] h-full bg-[#f8f9fa] flex-col justify-center px-16 xl:px-24 relative select-none">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />
        
        <div className="z-10 max-w-lg">
          <motion.div 
            initial={{ opacity: 0, x: -35 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col"
          >
            {/* Logo and Brand Title */}
            <h1 className="text-6xl lg:text-7xl font-extrabold tracking-tight leading-none text-zinc-950 mb-4 flex flex-col">
              <span className="text-blue-600">Logic</span>
              <span>Forge</span>
            </h1>
            <div className="h-[4px] w-20 bg-blue-600 mb-8 rounded-full" />

            <p className="text-zinc-500 text-sm lg:text-base leading-relaxed font-medium">
              Master programming logic without syntax constraints. Solve step-by-step interactive puzzles to build strong algorithmic thinking.
            </p>
          </motion.div>
        </div>

        {/* Branding Terminal Tag */}
        <div className="absolute bottom-10 left-16 xl:left-24 text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
          <Terminal size={14} className="text-blue-600" />
          LOGICFORGE SYSTEM V2.0
        </div>
      </div>

      {/* RIGHT SIDE: Cyberpunk Glassmorphic Sign In Card */}
      <div className="w-full md:w-[45%] h-full flex flex-col justify-center items-center px-6 relative bg-gradient-to-br from-zinc-950 to-zinc-900 border-l border-zinc-800/10">
        
        {/* Glowing Background Blur Balls */}
        <motion.div 
          animate={{ x: [0, 30, -20, 0], y: [0, -30, 30, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          className="absolute -top-10 -right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"
        />
        <motion.div 
          animate={{ x: [0, -40, 20, 0], y: [0, 40, -40, 0] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          className="absolute -bottom-10 -left-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none"
        />

        <div className="w-full max-w-sm z-10">
          
          {/* Glass Form Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full bg-[#161616]/40 backdrop-blur-xl border border-white/5 p-8 rounded-2xl shadow-2xl flex flex-col items-center"
          >
            {/* Greeting */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Hello!</h2>
              <p className="text-zinc-550 text-xs font-semibold">We are really happy to see you again!</p>
            </div>

            {error && (
              <div className="w-full bg-red-950/30 border border-red-500/20 text-red-300 text-[11px] px-3 py-2.5 rounded-lg mb-4 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              
              <AnimatePresence mode="popLayout">
                {isSignUp && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative overflow-hidden"
                  >
                    <input 
                      type="text" 
                      placeholder="Username" 
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError(null);
                      }}
                      onFocus={() => {
                        setActiveFieldName('username');
                        setIsPasswordFocused(false);
                      }}
                      onBlur={() => setActiveFieldName('')}
                      required={isSignUp}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all duration-200"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  onFocus={() => {
                    setActiveFieldName('email');
                    setIsPasswordFocused(false);
                  }}
                  onBlur={() => setActiveFieldName('')}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all duration-200"
                />
              </div>

              <div className="relative w-full">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  onFocus={() => {
                    setIsPasswordFocused(true);
                    setActiveFieldName('');
                  }}
                  onBlur={() => setIsPasswordFocused(false)}
                  required
                  className="w-full pl-4 pr-10 py-3 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white placeholder-white/30 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/30 hover:text-white transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {!isSignUp && (
                <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-zinc-500">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors duration-200">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-blue-500 bg-zinc-900 border-zinc-800 rounded"
                    />
                    REMEMBER ME
                  </label>
                  <button 
                    type="button"
                    onClick={() => setError('Password retrieval is simulated. Please use Google mock bypass.')} 
                    className="hover:text-blue-400 transition-colors duration-200"
                  >
                    FORGOT KEY?
                  </button>
                </div>
              )}

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit" 
                disabled={loading}
                className="w-full py-3 mt-2 bg-blue-600 text-white font-bold tracking-widest text-xs rounded-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:bg-blue-500"
              >
                {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign in')}
              </motion.button>
            </form>

            {/* Separator */}
            <div className="w-full flex items-center my-6 gap-2">
              <div className="flex-grow h-[1px] bg-white/5"></div>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">or sign in with</span>
              <div className="flex-grow h-[1px] bg-white/5"></div>
            </div>

            {/* Google OAuth Button */}
            <div id="googleSignInBtn" className="w-full flex justify-center mb-4 min-h-[40px] hover:opacity-90 transition-opacity duration-200"></div>

            {/* Google Mock Bypass (Smaller link style) */}
            <button 
              onClick={handleGoogleLogin}
              type="button"
              className="w-full py-2 bg-white/5 border border-white/10 text-white/50 hover:text-white text-[10px] font-bold tracking-wider rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mb-2"
            >
              <Globe size={11} />
              Bypass with Google Mock
            </button>

            {/* Swap Sign In/Sign Up */}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-[10px] text-zinc-500 hover:text-blue-400 font-bold tracking-widest transition-colors duration-200 mt-4 uppercase"
            >
              {isSignUp ? 'Already registered? Sign in' : 'Create an Account'}
            </button>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
