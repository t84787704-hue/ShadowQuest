import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Lock, Trophy, Sparkles, ShieldCheck, X } from 'lucide-react';
import { SaveData } from '../types/game';
import { SaveSystem } from '../game/save/SaveSystem';
import { audioEngine } from '../game/audio/AudioEngine';
import { WORLD_NAMES } from '../game/world/LevelData';

interface CampaignProgressModalProps {
  saveData: SaveData;
  onClose: () => void;
}

export const CampaignProgressModal: React.FC<CampaignProgressModalProps> = ({ saveData, onClose }) => {
  const progress = SaveSystem.getCampaignProgress(saveData);

  const handleClose = () => {
    audioEngine.playButtonClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-6 max-w-lg w-full text-slate-100 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative flex flex-col my-auto max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 tracking-wide uppercase">
            CAMPAIGN PROGRESS
          </h2>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Conquer all 6 worlds and discover all secret rooms across the realm.
        </p>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-3 gap-2 mb-5 text-center">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Worlds Cleared</div>
            <div className="text-sm sm:text-base font-black text-amber-300 mt-0.5">
              {progress.completedWorldsCount} / {progress.totalWorlds}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Levels Conquered</div>
            <div className="text-sm sm:text-base font-black text-amber-300 mt-0.5">
              {progress.completedLevelsCount} / {progress.totalLevels}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Secret Rooms</div>
            <div className="text-sm sm:text-base font-black text-amber-300 mt-0.5">
              {progress.discoveredSecretRooms} / {progress.totalSecretRooms}
            </div>
          </div>
        </div>

        {/* World Progress Checklist */}
        <div className="mb-5">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> WORLD CLEAR CHECKLIST
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((wNum) => {
              const isDone = progress.worldStatus[wNum];
              return (
                <div
                  key={wNum}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                    isDone
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">
                      W{wNum}
                    </span>
                    <span className="text-xs font-bold">{WORLD_NAMES[wNum]}</span>
                  </div>

                  {isDone ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-black">
                      <CheckCircle2 className="w-4 h-4" /> CLEAR
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
                      <Lock className="w-3.5 h-3.5" /> INCOMPLETE
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Status / NG+ Status */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 rounded-xl p-3 mb-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-slate-200">
                CAMPAIGN STATUS:{' '}
                {progress.isAllWorldsCompleted ? (
                  <span className="text-emerald-400 font-black">🏆 GAME COMPLETED</span>
                ) : (
                  <span className="text-amber-300 font-black">⚔️ IN PROGRESS</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                New Game+ Cycle:{' '}
                <span className="text-amber-300 font-mono font-bold">
                  {progress.newGamePlusLevel > 0 ? `NG+${progress.newGamePlusLevel}` : 'Normal Mode'}
                </span>
              </div>
            </div>
          </div>

          {saveData.legendaryTitleUnlocked && (
            <div className="bg-amber-500/20 text-amber-300 border border-amber-400/50 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
              👑 LEGENDARY WARRIOR
            </div>
          )}
        </div>

        {/* Close Action */}
        <button
          onClick={handleClose}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black text-sm uppercase rounded-xl shadow-lg transition cursor-pointer"
        >
          CLOSE OVERVIEW
        </button>
      </motion.div>
    </div>
  );
};
