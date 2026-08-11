import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, Home, ArrowRight, Crown, Sparkles, Award } from 'lucide-react';
import { audioEngine } from '../game/audio/AudioEngine';
import { SaveSystem } from '../game/save/SaveSystem';

interface VictoryModalProps {
  levelTitle?: string;
  coinsCollected: number;
  starsEarned?: number;
  hasNextLevel?: boolean;
  onNextLevel: () => void;
  onMainMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  levelTitle,
  coinsCollected,
  starsEarned = 3,
  hasNextLevel = true,
  onNextLevel,
  onMainMenu,
}) => {
  const handleNextLevelClick = () => {
    audioEngine.playButtonClick();
    onNextLevel();
  };

  const saveData = SaveSystem.load();
  const totalStarsEarned = Object.values(saveData.levelStars || {}).reduce((a, b) => a + b, 0);
  const totalCompletedCount = saveData.completedLevels?.length || 0;

  const isGrandVictory = !hasNextLevel || levelTitle?.includes('6-5') || levelTitle?.includes('THRONE');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 flex items-center justify-center p-4 select-none"
    >
      {isGrandVictory ? (
        /* GRAND FINAL ADVENTURE COMPLETE MODAL */
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-400 rounded-2xl p-6 max-w-md w-full text-center shadow-[0_0_60px_rgba(245,158,11,0.5)] flex flex-col items-center relative overflow-hidden"
        >
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />

          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 border-2 border-amber-300 rounded-2xl flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-bounce">
            <Crown className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-[10px] font-black tracking-widest text-amber-300 uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" /> 30 / 30 LEVELS CONQUERED!
          </div>

          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tracking-wider mb-1">
            GRAND ADVENTURE COMPLETE!
          </h2>
          <p className="text-xs text-amber-100/90 font-medium mb-4 max-w-xs leading-relaxed">
            The Goblin King has been defeated! You have restored peace and harmony across all 6 kingdoms of the realm!
          </p>

          {/* Grand Campaign Stats Box */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3.5 w-full mb-5 grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Coins</span>
              <span className="text-amber-300 font-black text-sm mt-0.5">🪙 {saveData.coins}</span>
            </div>
            <div className="flex flex-col items-center border-x border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Stars</span>
              <span className="text-amber-300 font-black text-sm mt-0.5">⭐ {totalStarsEarned} / 90</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Worlds Clear</span>
              <span className="text-emerald-400 font-black text-sm mt-0.5">🏆 6 / 6</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full">
            <button
              onClick={() => {
                audioEngine.playButtonClick();
                onMainMenu();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-sm uppercase rounded-xl flex items-center justify-center gap-2 shadow-xl transition"
            >
              <Home className="w-4 h-4 stroke-[3]" />
              RETURN TO MAIN MENU
            </button>
          </div>
        </motion.div>
      ) : (
        /* NORMAL / BOSS LEVEL COMPLETE MODAL */
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`bg-slate-900 border-2 ${
            levelTitle?.includes('-5') || levelTitle?.toLowerCase().includes('boss')
              ? 'border-emerald-400 shadow-[0_0_50px_rgba(34,197,94,0.4)]'
              : 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.3)]'
          } rounded-2xl p-6 max-w-sm w-full text-center flex flex-col items-center`}
        >
          {levelTitle?.includes('-5') || levelTitle?.toLowerCase().includes('boss') ? (
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-emerald-500/30 animate-bounce">
              <Crown className="w-9 h-9 stroke-[2.5]" />
            </div>
          ) : (
            <div className="w-14 h-14 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl flex items-center justify-center mb-3">
              <Trophy className="w-8 h-8 fill-amber-400" />
            </div>
          )}

          {(levelTitle?.includes('-5') || levelTitle?.toLowerCase().includes('boss')) && (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-2">
              <Award className="w-3.5 h-3.5" /> WORLD CLEAR — NEXT WORLD UNLOCKED!
            </div>
          )}

          <h2 className="text-2xl font-black text-amber-400 tracking-wider mb-1">
            {levelTitle?.includes('-5') || levelTitle?.toLowerCase().includes('boss')
              ? '👑 BOSS DEFEATED!'
              : 'LEVEL COMPLETE!'}
          </h2>
          <p className="text-xs text-slate-300 font-medium mb-4">
            {levelTitle ? `${levelTitle} Conquered!` : 'Level Conquered!'}
          </p>

          {/* Dynamic Stars */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map((starIndex) => {
              const isEarned = starIndex <= starsEarned;
              return (
                <Star
                  key={starIndex}
                  className={`w-9 h-9 transition-all duration-300 ${
                    isEarned
                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] animate-bounce'
                      : 'text-slate-700 fill-slate-800'
                  }`}
                  style={{ animationDelay: `${starIndex * 0.15}s` }}
                />
              );
            })}
          </div>

          {/* Stats */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 w-full mb-6 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Gold Coins Earned:</span>
            <span className="text-amber-300 font-black text-sm">🪙 +{coinsCollected}</span>
          </div>

          <div className="flex flex-col gap-3 w-full">
            {hasNextLevel && (
              <button
                onClick={handleNextLevelClick}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black text-sm uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
              >
                <ArrowRight className="w-4 h-4 stroke-[3]" />
                NEXT LEVEL
              </button>
            )}

            <button
              onClick={() => {
                audioEngine.playButtonClick();
                onMainMenu();
              }}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-sm uppercase rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
            >
              <Home className="w-4 h-4" />
              MAIN MENU
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

