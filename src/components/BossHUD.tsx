import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Zap, Skull, Flame } from 'lucide-react';

interface BossHUDProps {
  bossName: string;
  worldId: number;
  hp: number;
  maxHp: number;
  phase: number;
  maxPhases: number;
  state: string;
  isTriggered: boolean;
}

export const BossHUD: React.FC<BossHUDProps> = ({
  bossName,
  worldId,
  hp,
  maxHp,
  phase,
  maxPhases,
  state,
  isTriggered,
}) => {
  if (!isTriggered || hp <= 0) {
    return null;
  }

  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  const getTheme = (w: number) => {
    switch (w) {
      case 1:
        return {
          barBg: 'from-emerald-500 via-green-500 to-lime-400',
          badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50',
          glow: 'shadow-emerald-500/40',
        };
      case 2:
        return {
          barBg: 'from-amber-500 via-yellow-500 to-amber-300',
          badge: 'bg-amber-950/90 text-amber-300 border-amber-500/50',
          glow: 'shadow-amber-500/40',
        };
      case 3:
        return {
          barBg: 'from-sky-500 via-cyan-400 to-blue-500',
          badge: 'bg-sky-950/90 text-sky-300 border-sky-500/50',
          glow: 'shadow-sky-500/40',
        };
      case 4:
        return {
          barBg: 'from-rose-600 via-red-500 to-orange-400',
          badge: 'bg-rose-950/90 text-rose-300 border-rose-500/50',
          glow: 'shadow-rose-500/50',
        };
      case 5:
        return {
          barBg: 'from-purple-600 via-fuchsia-500 to-pink-500',
          badge: 'bg-purple-950/90 text-fuchsia-300 border-purple-500/50',
          glow: 'shadow-purple-500/50',
        };
      case 6:
      default:
        return {
          barBg: 'from-amber-400 via-red-500 to-yellow-300',
          badge: 'bg-slate-950/90 text-yellow-300 border-amber-400',
          glow: 'shadow-amber-500/60',
        };
    }
  };

  const theme = getTheme(worldId);

  return (
    <div className="absolute top-2 left-0 right-0 z-30 pointer-events-none flex flex-col items-center px-3 sm:px-6 select-none">
      {/* Intro Banner */}
      <AnimatePresence>
        {state === 'INTRO' && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -10 }}
            className="mb-2 bg-gradient-to-r from-red-950/90 via-slate-950/95 to-red-950/90 border-2 border-red-500/80 px-6 py-2.5 rounded-2xl shadow-2xl shadow-red-500/50 text-center backdrop-blur-md"
          >
            <div className="flex items-center justify-center gap-2 text-red-400 font-black text-xs sm:text-sm tracking-widest uppercase">
              <Skull className="w-5 h-5 text-red-500 animate-bounce" />
              <span>BOSS ENCOUNTER</span>
              <Skull className="w-5 h-5 text-red-500 animate-bounce" />
            </div>
            <h2 className="text-xl sm:text-3xl font-black italic tracking-tight text-white drop-shadow-md mt-0.5">
              {bossName}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Top Health Bar */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-xl flex flex-col items-center gap-1"
      >
        {/* Header Badges */}
        <div className="w-full flex items-center justify-between text-[11px] sm:text-xs font-black">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${theme.badge} shadow-md backdrop-blur-md`}>
            <Flame className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span className="tracking-wide uppercase">{bossName}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${theme.badge} shadow-md backdrop-blur-md`}>
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>
              PHASE {phase} / {maxPhases} {phase > 1 ? '• ENRAGED' : ''}
            </span>
          </div>
        </div>

        {/* Health Bar Outer Track */}
        <div className={`w-full h-4 sm:h-5 bg-slate-950/90 border-2 border-slate-700/80 rounded-full p-0.5 shadow-xl ${theme.glow} relative overflow-hidden backdrop-blur-md`}>
          {/* Animated Fill Bar */}
          <div
            className={`h-full rounded-full bg-gradient-to-r ${theme.barBg} transition-all duration-150 ease-out`}
            style={{ width: `${hpPercent}%` }}
          />

          {/* Text inside bar */}
          <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-black tracking-widest text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.9)]">
            {hp} / {maxHp} HP ({Math.round(hpPercent)}%)
          </div>
        </div>

        {/* Tactical Strategy Hints / Warning Callouts */}
        {state === 'VULNERABLE' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 bg-yellow-400 text-slate-950 font-black text-xs px-3 py-0.5 rounded-full shadow-lg border border-amber-300 animate-pulse mt-0.5"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>OPENING DETECTED! STRIKE NOW WITH COMBOS!</span>
          </motion.div>
        )}

        {state === 'WINDUP' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 bg-red-600 text-white font-black text-xs px-3 py-0.5 rounded-full shadow-lg border border-red-400 mt-0.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>WARNING! HEAVY ATTACK INCOMING — JUMP OR DODGE!</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
