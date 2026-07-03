import React from 'react';
import { Award, Lock, ArrowLeft, Calendar } from 'lucide-react';

const BADGE_LIST = [
  { id: 'iron_age', title: 'Iron Age', days: 10, desc: 'Constructed your first logical steps.', color: 'from-zinc-700 to-zinc-800' },
  { id: 'bronze', title: 'Bronze Age', days: 25, desc: 'Refined conditional logic checks.', color: 'from-amber-700 to-amber-900' },
  { id: 'silver', title: 'Silver Age', days: 50, desc: 'Mastered iterative sequences and loops.', color: 'from-slate-400 to-slate-600' },
  { id: 'gold', title: 'Gold System', days: 100, desc: 'Optimized complex logical flows.', color: 'from-yellow-500 to-yellow-600' },
  { id: 'platinum', title: 'Platinum Core', days: 150, desc: 'Engineered high-efficiency algorithmic steps.', color: 'from-blue-500 to-blue-600' },
  { id: 'diamond', title: 'Diamond Logic', days: 200, desc: 'Synthesized pure logic structures.', color: 'from-indigo-400 to-indigo-600' },
  { id: 'master', title: 'Master Mind', days: 250, desc: 'Commanded maximum computational logic loops.', color: 'from-purple-500 to-purple-600' },
  { id: 'grand_master', title: 'Grand Master', days: 350, desc: 'Supreme architect of syntax-free logic.', color: 'from-red-500 to-red-600' },
  { id: 'titan', title: 'Titan Legend', days: 500, desc: 'God of logic-building, syntax-free.', color: 'from-orange-500 to-orange-600' }
];

export default function BadgeCabinet({ user, onBackToDashboard }) {
  const userBadges = user.badges || [];
  const highestStreak = user.highestStreak || 0;

  // Check if user has unlocked a badge
  const isUnlocked = (badgeId) => {
    return userBadges.some(b => b.badgeId === badgeId);
  };

  // Find unlock date for a badge
  const getUnlockDate = (badgeId) => {
    const earned = userBadges.find(b => b.badgeId === badgeId);
    return earned ? new Date(earned.dateEarned).toLocaleDateString() : null;
  };

  return (
    <div className="px-6 py-8 flex flex-col gap-8 max-w-6xl mx-auto w-full text-zinc-300">
      {/* Top Navigation */}
      <button 
        onClick={onBackToDashboard}
        className="flex items-center gap-2 text-zinc-400 hover:text-white font-semibold text-xs tracking-wider uppercase self-start"
      >
        <ArrowLeft size={12} />
        BACK TO DASHBOARD
      </button>

      <div>
        <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
          SYSTEM BADGE CABINET
        </h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
          Algorithmic collectibles. Hover over a card to view unlock criteria.
        </p>
      </div>

      {/* Stats HUD */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider block">COLLECTION SCORE</span>
          <p className="text-md font-bold text-white mt-1">
            {userBadges.length} / {BADGE_LIST.length} UNLOCKED
          </p>
        </div>
        <div>
          <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider block">PEAK STREAK LEVEL</span>
          <p className="text-md font-bold text-orange-400 mt-1">
            {highestStreak} DAYS
          </p>
        </div>
        <div className="w-full sm:w-64">
          <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">NEXT BADGE PROGRESS</span>
          {(() => {
            const nextBadge = BADGE_LIST.find(b => !isUnlocked(b.id));
            if (!nextBadge) {
              return <p className="text-xs text-emerald-400 font-bold">ALL COLLECTIBLES OBTAINED</p>;
            }
            const pct = Math.min((highestStreak / nextBadge.days) * 100, 100);
            return (
              <div>
                <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-[9px] font-semibold uppercase text-zinc-500 mt-1">
                  <span>{nextBadge.title}</span>
                  <span>{highestStreak}/{nextBadge.days} DAYS</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Collectibles 3D Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
        {BADGE_LIST.map((badge) => {
          const unlocked = isUnlocked(badge.id);
          const dateUnlocked = getUnlockDate(badge.id);

          return (
            <div 
              key={badge.id}
              className="w-full h-80 group perspective-1000"
            >
              {/* Double-sided card structure */}
              <div className="relative w-full h-full text-center transition-transform duration-700 preserve-3d group-hover:rotate-y-180 cursor-pointer">
                
                {/* FRONT OF BADGE CARD */}
                <div className={`absolute w-full h-full backface-hidden rounded-2xl flex flex-col items-center justify-between p-6 border ${
                  unlocked 
                    ? `bg-zinc-900 border-zinc-800 shadow-md` 
                    : 'bg-zinc-905 border-zinc-800 opacity-40'
                }`}>
                  {/* Lock Indicator */}
                  {!unlocked && (
                    <div className="absolute top-4 right-4 bg-zinc-950 p-1.5 rounded-full border border-zinc-800">
                      <Lock size={12} className="text-zinc-600" />
                    </div>
                  )}

                  <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-widest">
                    {unlocked ? 'COLLECTIBLE UNLOCKED' : `UNLOCKS AT ${badge.days} DAYS`}
                  </span>

                  {/* Metallic Badge Container */}
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-tr ${badge.color} p-[2px] shadow-lg relative flex items-center justify-center`}>
                    <div className="absolute inset-1 rounded-full border border-white/5"></div>
                    <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                      <Award className={`w-10 h-10 ${unlocked ? 'text-white' : 'text-zinc-700'}`} />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-md text-white uppercase tracking-wider">
                      {badge.title}
                    </h3>
                    <p className="text-[9px] text-zinc-550 font-semibold mt-1 uppercase">
                      {unlocked ? `STREAK TARGET REACHED` : `REQUIREMENT: ${badge.days} DAYS`}
                    </p>
                  </div>
                </div>

                {/* BACK OF BADGE CARD (Detail Reveal) */}
                <div className={`absolute w-full h-full rotate-y-180 backface-hidden rounded-2xl flex flex-col justify-between p-6 border bg-zinc-900 ${
                  unlocked ? 'border-zinc-800 shadow-md' : 'border-zinc-800 opacity-50'
                }`}>
                  <div>
                    <span className="text-[9px] text-zinc-550 font-semibold uppercase tracking-wider block text-left">
                      ACHIEVEMENT DETAILS
                    </span>
                    <h3 className="font-bold text-md text-white uppercase text-left mt-1 tracking-wider border-b border-zinc-800 pb-2">
                      {badge.title}
                    </h3>
                    
                    <p className="text-xs text-zinc-400 text-left mt-4 leading-relaxed font-light">
                      {badge.desc}
                    </p>
                  </div>

                  {unlocked ? (
                    <div className="flex items-center gap-2 text-xs text-blue-500 font-semibold text-left bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                      <Calendar size={14} />
                      <div>
                        <div className="text-[8px] text-zinc-500 uppercase">UNLOCKED ON</div>
                        <div className="text-zinc-300 font-mono mt-0.5">{dateUnlocked}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-zinc-500 text-left bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                      <Lock size={14} className="text-zinc-650" />
                      <div>
                        <div className="text-[8px] text-zinc-600 uppercase">STATUS ACCESS</div>
                        <div className="text-zinc-400 mt-0.5">LOCKED ({badge.days - highestStreak} days left)</div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
