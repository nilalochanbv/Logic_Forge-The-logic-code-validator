import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function InteractiveMascot({ state = 'idle', textLength = 0, activeField = '' }) {
  // Eyes horizontal/vertical offset springs
  const pupilX = useSpring(0, { stiffness: 100, damping: 15 });
  const pupilY = useSpring(0, { stiffness: 100, damping: 15 });
  
  // Eyelid blinking animation state
  const [blink, setBlink] = useState(false);

  // Breathing & idle head sway loop
  const [time, setTime] = useState(0);
  const requestRef = useRef(null);

  // Blinking loop
  useEffect(() => {
    const triggerBlink = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
      
      // Schedule next blink randomly (between 2 to 6 seconds)
      const nextBlinkTime = Math.random() * 4000 + 2000;
      blinkTimerRef.current = setTimeout(triggerBlink, nextBlinkTime);
    };

    const blinkTimerRef = { current: setTimeout(triggerBlink, 3000) };

    return () => {
      clearTimeout(blinkTimerRef.current);
    };
  }, []);

  // Frame tick for breathing/floating effects (60 FPS loop)
  useEffect(() => {
    const tick = () => {
      setTime(prev => prev + 0.05);
      requestRef.current = requestAnimationFrame(tick);
    };
    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  // Sync pupil coordinates based on state & textLength
  useEffect(() => {
    if (state === 'coverEyes') {
      pupilX.set(0);
      pupilY.set(0);
    } else if (state === 'lookAtInput') {
      // Look towards the right (input area)
      pupilY.set(3); // Look down slightly
      // Look further right as text grows
      const lookLimit = Math.min(10, 4 + textLength * 0.25);
      pupilX.set(lookLimit);
    } else if (state === 'confused') {
      pupilX.set(0);
      pupilY.set(4); // Look downcast
    } else if (state === 'happy') {
      pupilX.set(0);
      pupilY.set(-2); // Look up joyfully
    } else {
      // Idle: look forward (with a slight organic float)
      pupilX.set(Math.sin(time * 0.5) * 1.5);
      pupilY.set(Math.cos(time * 0.5) * 0.8);
    }
  }, [state, textLength, time]);

  // Mascot SVG Variants
  const containerVariants = {
    idle: { y: 0 },
    happy: { y: [0, -10, 0], transition: { repeat: Infinity, duration: 0.6 } },
    confused: { rotate: [0, -2, 2, 0], transition: { repeat: Infinity, duration: 1.5 } }
  };

  const bodyVariants = {
    idle: { y: Math.sin(time) * 1.5 },
    happy: { y: [0, -6, 0] },
    coverEyes: { y: 2 }
  };

  const headVariants = {
    idle: { 
      rotate: Math.sin(time * 0.8) * 1.2, 
      y: Math.sin(time) * 0.8 
    },
    lookAtInput: { 
      rotate: 12, 
      x: 6, 
      y: 4 
    },
    coverEyes: { 
      rotate: 0, 
      x: 0, 
      y: 6 
    },
    happy: { 
      rotate: [0, -4, 4, 0], 
      y: [0, -3, 0] 
    },
    confused: { 
      rotate: -10, 
      y: 2 
    }
  };

  const leftArmVariants = {
    idle: { 
      rotate: Math.sin(time) * 2, 
      x: 0, 
      y: 0 
    },
    lookAtInput: { 
      rotate: -15, 
      x: -2, 
      y: 1 
    },
    coverEyes: { 
      rotate: 105, 
      x: 24, 
      y: -54 
    },
    happy: { 
      rotate: 125, 
      x: 16, 
      y: -35 
    },
    confused: { 
      rotate: 90, // Scratching head
      x: 20, 
      y: -44 
    }
  };

  const rightArmVariants = {
    idle: { 
      rotate: -Math.sin(time) * 2, 
      x: 0, 
      y: 0 
    },
    lookAtInput: { 
      // Point directly towards the input form!
      rotate: -65, 
      x: 22, 
      y: -22 
    },
    coverEyes: { 
      rotate: -105, 
      x: -24, 
      y: -54 
    },
    happy: { 
      rotate: -125, 
      x: -16, 
      y: -35 
    },
    confused: { 
      rotate: -15, 
      x: 0, 
      y: 0 
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      animate={state}
      className="w-full flex flex-col items-center justify-center select-none"
    >
      <svg width="280" height="280" viewBox="0 0 300 300" className="drop-shadow-[0_20px_35px_rgba(0,0,0,0.12)]">
        {/* Soft shadow below the character */}
        <ellipse cx="150" cy="265" rx="75" ry="10" fill="rgba(0,0,0,0.06)" />

        {/* --- Mascots Legs (Sitting Pose) --- */}
        <g id="mascot-legs">
          {/* Left leg/sneaker */}
          <path d="M 120 230 C 100 230, 85 240, 85 255 C 85 260, 95 265, 110 265 C 120 265, 130 255, 130 245 Z" fill="#b91c1c" />
          <path d="M 85 255 C 85 260, 95 265, 110 265 C 112 265, 115 263, 116 261 C 105 261, 95 256, 95 248 Z" fill="#e11d48" /> {/* Shoe details */}
          <circle cx="110" cy="245" r="14" fill="#ffffff" /> {/* Sole cap */}
          <circle cx="108" cy="245" r="10" fill="#b91c1c" />

          {/* Right leg/sneaker */}
          <path d="M 180 230 C 200 230, 215 240, 215 255 C 215 260, 205 265, 190 265 C 180 265, 170 255, 170 245 Z" fill="#b91c1c" />
          <path d="M 215 255 C 215 260, 205 265, 190 265 C 188 265, 185 263, 184 261 C 195 261, 205 256, 205 248 Z" fill="#e11d48" />
          <circle cx="190" cy="245" r="14" fill="#ffffff" />
          <circle cx="192" cy="245" r="10" fill="#b91c1c" />

          {/* Blue pants/jeans block */}
          <path d="M 115 220 C 115 245, 185 245, 185 220 Z" fill="#334155" />
        </g>

        {/* --- Mascot Body --- */}
        <motion.g id="mascot-body" variants={bodyVariants} animate={state}>
          {/* Blue Hoodie Torso */}
          <path d="M 105 160 C 105 160, 95 210, 105 235 C 120 240, 180 240, 195 235 C 205 210, 195 160, 195 160 Z" fill="#1e293b" />
          
          {/* Hoodie details (Zipper & pockets) */}
          <path d="M 148 165 L 148 230" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 118 205 C 128 200, 138 200, 148 205" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
          <path d="M 178 205 C 168 200, 158 200, 148 205" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
          
          {/* Hoodie Collar Hood */}
          <path d="M 105 160 C 120 170, 180 170, 195 160 C 185 150, 115 150, 105 160 Z" fill="#334155" />
        </motion.g>

        {/* --- Left Arm & Hand --- */}
        <motion.g 
          id="mascot-left-arm"
          variants={leftArmVariants}
          animate={state}
          style={{ originX: "100px", originY: "165px" }}
        >
          {/* Left sleeve */}
          <path d="M 100 165 C 80 170, 75 195, 82 212" stroke="#1e293b" strokeWidth="15" strokeLinecap="round" fill="none" />
          {/* Left hand (cute peachy circle) */}
          <circle cx="82" cy="212" r="8" fill="#fbcfe8" />
        </motion.g>

        {/* --- Right Arm & Hand --- */}
        <motion.g 
          id="mascot-right-arm"
          variants={rightArmVariants}
          animate={state}
          style={{ originX: "200px", originY: "165px" }}
        >
          {/* Right sleeve */}
          <path d="M 200 165 C 220 170, 225 195, 218 212" stroke="#1e293b" strokeWidth="15" strokeLinecap="round" fill="none" />
          {/* Right hand */}
          <circle cx="218" cy="212" r="8" fill="#fbcfe8" />
          
          {/* Pointing finger element (Appears when pointing) */}
          {state === 'lookAtInput' && (
            <path d="M 220 212 L 234 212" stroke="#fbcfe8" strokeWidth="4" strokeLinecap="round" />
          )}
        </motion.g>

        {/* --- Mascot Neck & Head --- */}
        <motion.g 
          id="mascot-head-group" 
          variants={headVariants}
          animate={state}
          style={{ originX: "150px", originY: "150px" }}
        >
          {/* Neck */}
          <rect x="138" y="132" width="24" height="20" rx="6" fill="#fbcfe8" />

          {/* Cute Face Base */}
          <circle cx="150" cy="110" r="46" fill="#fbcfe8" />

          {/* Ears */}
          <circle cx="102" cy="110" r="10" fill="#fbcfe8" />
          <circle cx="198" cy="110" r="10" fill="#fbcfe8" />
          <circle cx="102" cy="110" r="5" fill="#f472b6" fillOpacity="0.4" />
          <circle cx="198" cy="110" r="5" fill="#f472b6" fillOpacity="0.4" />

          {/* Blush Details on Cheeks */}
          <ellipse cx="118" cy="118" rx="8" ry="4" fill="#f472b6" fillOpacity="0.35" />
          <ellipse cx="182" cy="118" rx="8" ry="4" fill="#f472b6" fillOpacity="0.35" />

          {/* Eyes (Glassy Anime Style) */}
          {state === 'coverEyes' ? (
            // Curved closed lines (shy/hidden)
            <>
              <path d="M 118 108 Q 128 100 138 108" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M 162 108 Q 172 100 182 108" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          ) : (
            // Full Eyes
            <>
              {/* Left Eye */}
              <g>
                <ellipse cx="128" cy="106" rx="10" ry="13" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
                {/* Eyelid clip for blinking */}
                <motion.ellipse 
                  cx="128" 
                  cy="106" 
                  rx="11" 
                  ry="14" 
                  fill="#fbcfe8"
                  animate={{ scaleY: blink ? 1 : 0 }}
                  transition={{ duration: 0.1 }}
                  style={{ originY: "93px" }}
                />
                
                {/* Left Pupil (Animated dynamic positioning) */}
                <motion.circle 
                  cx="128" 
                  cy="106" 
                  r="6.5" 
                  fill="#1e293b" 
                  style={{ x: pupilX, y: pupilY }}
                />
                {/* Pupil highlight shines */}
                <motion.circle 
                  cx="125" 
                  cy="102" 
                  r="2.5" 
                  fill="#ffffff" 
                  style={{ x: pupilX, y: pupilY }}
                />
                <motion.circle 
                  cx="131" 
                  cy="110" 
                  r="1.2" 
                  fill="#ffffff" 
                  style={{ x: pupilX, y: pupilY }}
                />
              </g>

              {/* Right Eye */}
              <g>
                <ellipse cx="172" cy="106" rx="10" ry="13" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
                {/* Eyelid clip for blinking */}
                <motion.ellipse 
                  cx="172" 
                  cy="106" 
                  rx="11" 
                  ry="14" 
                  fill="#fbcfe8"
                  animate={{ scaleY: blink ? 1 : 0 }}
                  transition={{ duration: 0.1 }}
                  style={{ originY: "93px" }}
                />
                
                {/* Right Pupil (Animated dynamic positioning) */}
                <motion.circle 
                  cx="172" 
                  cy="106" 
                  r="6.5" 
                  fill="#1e293b" 
                  style={{ x: pupilX, y: pupilY }}
                />
                {/* Pupil highlight shines */}
                <motion.circle 
                  cx="169" 
                  cy="102" 
                  r="2.5" 
                  fill="#ffffff" 
                  style={{ x: pupilX, y: pupilY }}
                />
                <motion.circle 
                  cx="175" 
                  cy="110" 
                  r="1.2" 
                  fill="#ffffff" 
                  style={{ x: pupilX, y: pupilY }}
                />
              </g>
            </>
          )}

          {/* Eyebrows */}
          <path d="M 116 90 Q 128 85 138 90" stroke="#4a2e1b" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 162 90 Q 172 85 184 90" stroke="#4a2e1b" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Cute Nose */}
          <path d="M 148 114 Q 150 117 152 114" stroke="#e0a899" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Dynamic Mouth Expression */}
          {state === 'happy' ? (
            // Cheerful smile
            <path d="M 142 122 Q 150 134 158 122" stroke="#1e293b" strokeWidth="3" fill="#b91c1c" strokeLinecap="round" />
          ) : state === 'confused' ? (
            // Worried/unhappy squiggly mouth
            <path d="M 142 125 Q 146 120 150 125 T 158 125" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : (
            // Small happy line smile (default)
            <path d="M 144 122 Q 150 127 156 122" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
          )}

          {/* --- Beautiful Spiky Brown Hair --- */}
          <g id="mascot-hair">
            {/* Back Hair Underlay */}
            <path d="M 98 100 Q 85 70 120 62 Q 150 50 180 62 Q 215 70 202 100 C 205 125, 95 125, 98 100 Z" fill="#4a2e1b" />
            
            {/* Front Spiky Fringe Overlay */}
            <path d="M 96 90 Q 110 50 135 55" stroke="#4a2e1b" strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M 125 55 Q 150 40 175 55" stroke="#4a2e1b" strokeWidth="12" strokeLinecap="round" fill="none" />
            <path d="M 165 55 Q 190 50 204 90" stroke="#4a2e1b" strokeWidth="10" strokeLinecap="round" fill="none" />
            
            {/* Side bangs */}
            <path d="M 100 85 L 104 105 L 112 95 Z" fill="#4a2e1b" />
            <path d="M 200 85 L 196 105 L 188 95 Z" fill="#4a2e1b" />
            
            {/* Individual spikes for hair volume */}
            <path d="M 115 62 Q 120 40 135 48" stroke="#5c3d2e" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M 140 46 Q 150 28 160 46" stroke="#5c3d2e" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 165 48 Q 180 40 185 62" stroke="#5c3d2e" strokeWidth="6" strokeLinecap="round" fill="none" />
          </g>
        </motion.g>
      </svg>
    </motion.div>
  );
}
