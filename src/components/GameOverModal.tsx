import React from 'react';
import { RotateCcw, Home, Skull, Flag } from 'lucide-react';
import { audioEngine } from '../game/audio/AudioEngine';

interface GameOverModalProps {
  coinsCollected: number;
  hasCheckpoint?: boolean;
  onRespawnCheckpoint?: () => void;
  onRetry: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  coinsCollected,
  hasCheckpoint,
  onRespawnCheckpoint,
  onRetry,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border-2 border-rose-600/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-[0_0_40px_rgba(225,29,72,0.3)] flex flex-col items-center">
        <div className="w-14 h-14 bg-rose-500/20 text-rose-500 border border-rose-500/40 rounded-2xl flex items-center justify-center mb-3 animate-bounce">
          <Skull className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-black text-rose-500 tracking-wider mb-1">
          GAME OVER
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Blaze was defeated in the forest...
        </p>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 w-full mb-6 flex justify-between items-center text-xs">
          <span className="text-slate-400">Coins Kept:</span>
          <span className="text-amber-400 font-bold">🪙 {coinsCollected}</span>
        </div>

        <div className="flex flex-col gap-2.5 w-full">
          {hasCheckpoint && onRespawnCheckpoint && (
            <button
              onClick={() => {
                audioEngine.playButtonClick();
                onRespawnCheckpoint();
              }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50 transition border border-emerald-400/30 animate-pulse"
            >
              <Flag className="w-4 h-4 text-amber-300 fill-amber-300" />
              RESPAWN AT CHECKPOINT
            </button>
          )}

          <button
            onClick={() => {
              audioEngine.playButtonClick();
              onRetry();
            }}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART LEVEL FROM START
          </button>

          <button
            onClick={() => {
              audioEngine.playButtonClick();
              onMainMenu();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs uppercase rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
