import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Zap, Swords, Trophy } from 'lucide-react';

interface ComboOverlayProps {
  comboHits: number;
  comboTimer: number;
  maxComboTimer: number;
}

export const ComboOverlay: React.FC<ComboOverlayProps> = ({
  comboHits,
  comboTimer,
  maxComboTimer,
}) => {
  if (comboHits < 2 || comboTimer <= 0) {
    return null;
  }

  const timerPercent = Math.max(0, Math.min(100, (comboTimer / maxComboTimer) * 100));

  const getComboTier = (hits: number) => {
    if (hits >= 12) {
      return {
        badge: 'GODLIKE FEVER',
        gradient: 'from-fuchsia-400 via-purple-500 to-pink-500',
        textColor: 'text-fuchsia-300',
        glowColor: 'shadow-fuchsia-500/50',
        borderColor: 'border-fuchsia-400',
        icon: <Zap className="w-5 h-5 text-fuchsia-400 fill-fuchsia-400 animate-bounce" />,
        scaleMultiplier: 1.15,
      };
    }
    if (hits >= 8) {
      return {
        badge: 'MONSTER STRIKE',
        gradient: 'from-rose-500 via-red-500 to-orange-500',
        textColor: 'text-rose-300',
        glowColor: 'shadow-rose-500/50',
        borderColor: 'border-rose-400',
        icon: <Flame className="w-5 h-5 text-rose-400 fill-rose-400 animate-pulse" />,
        scaleMultiplier: 1.1,
      };
    }
    if (hits >= 5) {
      return {
        badge: 'HYPER COMBO',
        gradient: 'from-amber-400 via-orange-500 to-amber-600',
        textColor: 'text-amber-300',
        glowColor: 'shadow-amber-500/40',
        borderColor: 'border-amber-400',
        icon: <Trophy className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />,
        scaleMultiplier: 1.05,
      };
    }
    if (hits >= 3) {
      return {
        badge: 'SUPER STRIKE',
        gradient: 'from-yellow-400 via-amber-500 to-orange-400',
        textColor: 'text-yellow-300',
        glowColor: 'shadow-amber-500/30',
        borderColor: 'border-amber-400/80',
        icon: <Swords className="w-5 h-5 text-amber-300" />,
        scaleMultiplier: 1.0,
      };
    }
    return {
      badge: 'DOUBLE HIT',
      gradient: 'from-sky-400 via-blue-500 to-indigo-500',
      textColor: 'text-sky-300',
      glowColor: 'shadow-sky-500/30',
      borderColor: 'border-sky-400/60',
      icon: <Swords className="w-4 h-4 text-sky-300" />,
      scaleMultiplier: 0.95,
    };
  };

  const tier = getComboTier(comboHits);

  return (
    <div className="absolute top-16 right-3 sm:top-14 sm:right-5 pointer-events-none z-20 flex flex-col items-end select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={`combo-hits-${comboHits}`}
          initial={{ scale: 0.4, opacity: 0, y: -12, rotate: -8 }}
          animate={{ scale: tier.scaleMultiplier, opacity: 1, y: 0, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.12 } }}
          transition={{ type: 'spring', stiffness: 550, damping: 18 }}
          className="flex flex-col items-end gap-1"
        >
          {/* Main Combo Card */}
          <div
            className={`relative flex items-center gap-2.5 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border ${tier.borderColor} shadow-xl ${tier.glowColor}`}
          >
            {tier.icon}

            <div className="flex flex-col items-end leading-none">
              <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${tier.textColor}`}>
                {tier.badge}
              </span>

              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-2xl sm:text-4xl font-black italic tracking-tighter bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent drop-shadow-md`}
                >
                  x{comboHits}
                </span>
                <span className="text-[10px] sm:text-xs font-black text-slate-200 uppercase tracking-wider italic">
                  COMBO
                </span>
              </div>
            </div>
          </div>

          {/* Shrinking Inactivity Bar */}
          <div className="w-28 sm:w-36 h-2 bg-slate-900/90 rounded-full overflow-hidden border border-slate-700/80 p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-75 ease-linear`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
