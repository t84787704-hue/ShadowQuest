import React from 'react';
import { motion } from 'motion/react';
import { Crown, Sparkles, Zap, Coins, Flame, CheckCircle2, X } from 'lucide-react';
import { SaveData } from '../types/game';
import { audioEngine } from '../game/audio/AudioEngine';

interface LegendaryRewardsModalProps {
  saveData: SaveData;
  onClose: () => void;
  onStartNewGamePlus?: () => void;
}

export const LegendaryRewardsModal: React.FC<LegendaryRewardsModalProps> = ({
  saveData,
  onClose,
  onStartNewGamePlus,
}) => {
  const handleClose = () => {
    audioEngine.playButtonClick();
    onClose();
  };

  const isUnlocked = Boolean(saveData.gameCompleted || saveData.legendaryTitleUnlocked);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-slate-900 border-2 border-amber-400 rounded-2xl p-4 sm:p-6 max-w-lg w-full text-slate-100 shadow-[0_0_60px_rgba(245,158,11,0.35)] relative flex flex-col my-auto max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 border-2 border-amber-300 rounded-2xl flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-bounce">
            <Crown className="w-9 h-9 stroke-[2.5]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 tracking-wider uppercase">
            LEGENDARY REWARDS
          </h2>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-[10px] font-black tracking-widest text-amber-300 uppercase mt-2">
            <Sparkles className="w-3.5 h-3.5" /> PERMANENT PRESTIGE UNLOCKS
          </div>
        </div>

        {/* Reward Cards List */}
        <div className="flex flex-col gap-2.5 mb-5">
          {/* Title */}
          <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-400 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-black text-amber-300 uppercase flex items-center gap-1.5">
                <span>LEGENDARY WARRIOR TITLE</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Prestige title earned by conquering all 6 campaign worlds.
              </p>
            </div>
          </div>

          {/* Aura */}
          <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-black text-amber-300 uppercase flex items-center gap-1.5">
                <span>LEGENDARY WARRIOR AURA</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Golden radiant energy ring with orbiting sparkles around your character in combat.
              </p>
            </div>
          </div>

          {/* Ability */}
          <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-black text-amber-300 uppercase flex items-center gap-1.5">
                <span>DRAGON SPIRIT SLASH</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Unleashes golden shockwave energy blades forward on every martial attack!
              </p>
            </div>
          </div>

          {/* Coins */}
          <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-400 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-black text-amber-300 uppercase flex items-center gap-1.5">
                <span>+1,000 COMPLETION COINS</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Grand victory coin bounty added permanently to your inventory.
              </p>
            </div>
          </div>

          {/* New Game+ */}
          <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-400 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-black text-rose-300 uppercase flex items-center gap-1.5">
                <span>NEW GAME+ UNLOCKED</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Restart the campaign with increased difficulty (+35% HP, +25% DMG) and +50% coin drops!
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          {onStartNewGamePlus && isUnlocked && (
            <button
              onClick={() => {
                audioEngine.playButtonClick();
                onStartNewGamePlus();
              }}
              className="w-full py-3 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 hover:from-rose-400 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-sm uppercase rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              START NEW GAME+
            </button>
          )}

          <button
            onClick={handleClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs uppercase rounded-xl border border-slate-700 transition cursor-pointer"
          >
            CLOSE REWARDS
          </button>
        </div>
      </motion.div>
    </div>
  );
};
