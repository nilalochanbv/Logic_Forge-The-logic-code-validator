import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function InteractiveMascot({ state = 'idle', textLength = 0 }) {
  // Springs for smooth pupil tracking
  const pupilX = useSpring(0, { stiffness: 120, damping: 14 });
  const pupilY = useSpring(0, { stiffness: 120, damping: 14 });

  const [blink, setBlink] = useState(false);
  const [time, setTime] = useState(0);
  const requestRef = useRef(null);

  // Blinking loop (2s to 6s interval)
  useEffect(() => {
    const triggerBlink = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
      const nextBlink = Math.random() * 4000 + 2000;
      blinkTimer.current = setTimeout(triggerBlink, nextBlink);
    };
    const blinkTimer = { current: setTimeout(triggerBlink, 3000) };
    return () => clearTimeout(blinkTimer.current);
  }, []);

  // 60 FPS update loop for breathing/floating
  useEffect(() => {
    const tick = () => {
      setTime(prev => prev + 0.05);
      requestRef.current = requestAnimationFrame(tick);
    };
    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  // Sync pupil coordinates
  useEffect(() => {
    if (state === 'coverEyes') {
      pupilX.set(0);
      pupilY.set(0);
    } else if (state === 'lookAtInput') {
      // Look slightly down and to the right
      pupilY.set(3.5);
      // Track input typing position
      const limit = Math.min(8, 3 + textLength * 0.25);
      pupilX.set(limit);
    } else if (state === 'confused') {
      pupilX.set(0);
      pupilY.set(4);
    } else if (state === 'happy') {
      pupilX.set(0);
      pupilY.set(-2);
    } else {
      // Idle random look
      pupilX.set(Math.sin(time * 0.4) * 1.8);
      pupilY.set(Math.cos(time * 0.4) * 0.8);
    }
  }, [state, textLength, time]);

  // Framer Motion Variants matching the requested animations
  const bodyVariants = {
    idle: { 
      y: Math.sin(time) * 1.5, 
      transition: { duration: 0.3 }
    },
    lookAtInput: { 
      y: 1, 
      rotate: 2, 
      transition: { duration: 0.3 }
    },
    coverEyes: { 
      y: [0, -1, 1, -1, 1, 0], // Shaking animation
      transition: { repeat: Infinity, duration: 0.4 } 
    },
    happy: { 
      y: [0, -5, 0], 
      transition: { repeat: Infinity, duration: 0.5 }
    },
    confused: { 
      y: 0, 
      transition: { duration: 0.3 }
    }
  };

  const headVariants = {
    idle: { 
      rotate: Math.sin(time * 0.8) * 1.0, 
      y: Math.sin(time) * 0.8,
      transition: { duration: 0.3 }
    },
    lookAtInput: { 
      rotate: 8, // Head tilt towards input
      x: 3, 
      y: 2,
      transition: { duration: 0.3 } 
    },
    coverEyes: { 
      rotate: -4, // Head turns slightly away
      x: -1, 
      y: 4,
      transition: { duration: 0.3 } 
    },
    happy: { 
      rotate: [0, -3, 3, 0], 
      y: [0, -2, 0],
      transition: { repeat: Infinity, duration: 0.6 } 
    },
    confused: { 
      rotate: -12, 
      y: 2,
      transition: { duration: 0.3 } 
    }
  };

  const leftArmVariants = {
    idle: { 
      rotate: Math.sin(time) * 1.5, 
      x: 0, 
      y: 0,
      transition: { duration: 0.3 }
    },
    lookAtInput: { 
      rotate: -10, 
      x: -1, 
      y: 1,
      transition: { duration: 0.3 } 
    },
    coverEyes: { 
      // Raise left arm to cover the left eye
      rotate: 110, 
      x: 23, 
      y: -54,
      transition: { type: "spring", stiffness: 140, damping: 12 } 
    },
    happy: { 
      rotate: 130, 
      x: 18, 
      y: -32,
      transition: { duration: 0.3 } 
    },
    confused: { 
      rotate: 85, // Scratch head
      x: 18, 
      y: -42,
      transition: { duration: 0.3 } 
    }
  };

  const rightArmVariants = {
    idle: { 
      rotate: -Math.sin(time) * 1.5, 
      x: 0, 
      y: 0,
      transition: { duration: 0.3 }
    },
    lookAtInput: { 
      rotate: -20, 
      x: 1, 
      y: 1,
      transition: { duration: 0.3 } 
    },
    coverEyes: { 
      // Raise right arm to cover the right eye
      rotate: -110, 
      x: -23, 
      y: -54,
      transition: { type: "spring", stiffness: 140, damping: 12 } 
    },
    happy: { 
      rotate: -130, 
      x: -18, 
      y: -32,
      transition: { duration: 0.3 } 
    },
    confused: { 
      rotate: -10, 
      x: 0, 
      y: 0,
      transition: { duration: 0.3 } 
    }
  };

  const feetVariants = {
    idle: { rotate: 0 },
    coverEyes: { 
      // Feet wiggle slightly
      rotate: [0, -3, 3, -3, 3, 0],
      transition: { repeat: Infinity, duration: 0.6 }
    }
  };

  return (
    <div className="w-full flex justify-center h-[120px] select-none pointer-events-none mb-3">
      <svg width="120" height="120" viewBox="0 0 300 300" className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.18)]">
        {/* Shadow */}
        <ellipse cx="150" cy="265" rx="72" ry="9" fill="rgba(0,0,0,0.08)" />

        {/* --- Legs / Sneakers --- */}
        <motion.g id="mascot-legs" variants={feetVariants} animate={state} style={{ originX: "150px", originY: "230px" }}>
          {/* Left leg/sneaker */}
          <path d="M 120 230 C 100 230, 85 240, 85 255 C 85 260, 95 265, 110 265 C 120 265, 130 255, 130 245 Z" fill="#c2410c" />
          <circle cx="110" cy="245" r="14" fill="#ffffff" />
          <circle cx="108" cy="245" r="10" fill="#c2410c" />

          {/* Right leg/sneaker */}
          <path d="M 180 230 C 200 230, 215 240, 215 255 C 215 260, 205 265, 190 265 C 180 265, 170 255, 170 245 Z" fill="#c2410c" />
          <circle cx="190" cy="245" r="14" fill="#ffffff" />
          <circle cx="192" cy="245" r="10" fill="#c2410c" />

          {/* Jeans base */}
          <path d="M 115 220 C 115 245, 185 245, 185 220 Z" fill="#334155" />
        </motion.g>

        {/* --- Torso Body --- */}
        <motion.g id="mascot-body" variants={bodyVariants} animate={state}>
          {/* Blue Hoodie */}
          <path d="M 105 160 C 105 160, 95 210, 105 235 C 120 240, 180 240, 195 235 C 205 210, 195 160, 195 160 Z" fill="#2563eb" />
          <path d="M 148 165 L 148 230" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 105 160 C 120 170, 180 170, 195 160 C 185 150, 115 150, 105 160 Z" fill="#1d4ed8" />
        </motion.g>

        {/* --- Left Arm --- */}
        <motion.g 
          id="mascot-left-arm"
          variants={leftArmVariants}
          animate={state}
          style={{ originX: "100px", originY: "165px" }}
        >
          <path d="M 100 165 C 80 170, 75 195, 82 212" stroke="#2563eb" strokeWidth="15" strokeLinecap="round" fill="none" />
          <circle cx="82" cy="212" r="8" fill="#fed7aa" />
        </motion.g>

        {/* --- Right Arm --- */}
        <motion.g 
          id="mascot-right-arm"
          variants={rightArmVariants}
          animate={state}
          style={{ originX: "200px", originY: "165px" }}
        >
          <path d="M 200 165 C 220 170, 225 195, 218 212" stroke="#2563eb" strokeWidth="15" strokeLinecap="round" fill="none" />
          <circle cx="218" cy="212" r="8" fill="#fed7aa" />
        </motion.g>

        {/* --- Head & Face --- */}
        <motion.g 
          id="mascot-head-group" 
          variants={headVariants}
          animate={state}
          style={{ originX: "150px", originY: "150px" }}
        >
          {/* Neck */}
          <rect x="138" y="132" width="24" height="20" rx="6" fill="#fed7aa" />

          {/* Face casing */}
          <circle cx="150" cy="110" r="46" fill="#fed7aa" />

          {/* Ears */}
          <circle cx="102" cy="110" r="10" fill="#fed7aa" />
          <circle cx="198" cy="110" r="10" fill="#fed7aa" />

          {/* Blush */}
          <ellipse cx="118" cy="118" rx="8" ry="4" fill="#fb7185" fillOpacity="0.4" />
          <ellipse cx="182" cy="118" rx="8" ry="4" fill="#fb7185" fillOpacity="0.4" />

          {/* Eyes */}
          {state === 'coverEyes' ? (
            // Closed/Shy Eyes
            <>
              <path d="M 118 108 Q 128 100 138 108" stroke="#1e293b" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <path d="M 162 108 Q 172 100 182 108" stroke="#1e293b" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            // Open/Blinking Eyes
            <>
              {/* Left Eye */}
              <g>
                <ellipse cx="128" cy="106" rx="10" ry="13" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
                <motion.ellipse 
                  cx="128" 
                  cy="106" 
                  rx="11" 
                  ry="14" 
                  fill="#fed7aa"
                  animate={{ scaleY: blink ? 1 : 0 }}
                  transition={{ duration: 0.1 }}
                  style={{ originY: "93px" }}
                />
                <motion.circle 
                  cx="128" 
                  cy="106" 
                  r="6.5" 
                  fill="#1e293b" 
                  style={{ x: pupilX, y: pupilY }}
                />
                <motion.circle 
                  cx="125" 
                  cy="102" 
                  r="2.5" 
                  fill="#ffffff" 
                  style={{ x: pupilX, y: pupilY }}
                />
              </g>

              {/* Right Eye */}
              <g>
                <ellipse cx="172" cy="106" rx="10" ry="13" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
                <motion.ellipse 
                  cx="172" 
                  cy="106" 
                  rx="11" 
                  ry="14" 
                  fill="#fed7aa"
                  animate={{ scaleY: blink ? 1 : 0 }}
                  transition={{ duration: 0.1 }}
                  style={{ originY: "93px" }}
                />
                <motion.circle 
                  cx="172" 
                  cy="106" 
                  r="6.5" 
                  fill="#1e293b" 
                  style={{ x: pupilX, y: pupilY }}
                />
                <motion.circle 
                  cx="169" 
                  cy="102" 
                  r="2.5" 
                  fill="#ffffff" 
                  style={{ x: pupilX, y: pupilY }}
                />
              </g>
            </>
          )}

          {/* Eyebrows */}
          <path d="M 116 90 Q 128 85 138 90" stroke="#5c3d2e" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 162 90 Q 172 85 184 90" stroke="#5c3d2e" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Nose */}
          <path d="M 148 114 Q 150 117 152 114" stroke="#f43f5e" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* Mouth smile (Smile becomes larger when lookAtInput is active) */}
          {state === 'happy' ? (
            <path d="M 142 122 Q 150 134 158 122" stroke="#1e293b" strokeWidth="3" fill="#b91c1c" strokeLinecap="round" />
          ) : state === 'lookAtInput' ? (
            // Larger smile when looking at input
            <path d="M 141 121 Q 150 132 159 121" stroke="#1e293b" strokeWidth="3.5" fill="#f43f5e" strokeLinecap="round" />
          ) : state === 'confused' ? (
            <path d="M 142 125 Q 146 120 150 125 T 158 125" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : (
            // Default smile
            <path d="M 144 122 Q 150 127 156 122" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
          )}

          {/* --- Fluffy Brown Hair --- */}
          <g id="mascot-hair">
            <path d="M 98 100 Q 85 70 120 62 Q 150 50 180 62 Q 215 70 202 100 C 205 125, 95 125, 98 100 Z" fill="#5c3d2e" />
            <path d="M 96 90 Q 110 50 135 55" stroke="#5c3d2e" strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M 125 55 Q 150 40 175 55" stroke="#5c3d2e" strokeWidth="12" strokeLinecap="round" fill="none" />
            <path d="M 165 55 Q 190 50 204 90" stroke="#5c3d2e" strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M 100 85 L 104 105 L 112 95 Z" fill="#5c3d2e" />
            <path d="M 200 85 L 196 105 L 188 95 Z" fill="#5c3d2e" />
            <path d="M 115 62 Q 120 40 135 48" stroke="#865439" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M 140 46 Q 150 28 160 46" stroke="#865439" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 165 48 Q 180 40 185 62" stroke="#865439" strokeWidth="6" strokeLinecap="round" fill="none" />
          </g>
        </motion.g>
      </svg>
    </div>
  );
}
