import React from 'react';
import { Trophy, Star, Home, ArrowRight } from 'lucide-react';
import { audioEngine } from '../game/audio/AudioEngine';

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

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-[0_0_40px_rgba(245,158,11,0.3)] flex flex-col items-center">
        <div className="w-14 h-14 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl flex items-center justify-center mb-3">
          <Trophy className="w-8 h-8 fill-amber-400" />
        </div>

        <h2 className="text-2xl font-black text-amber-400 tracking-wider mb-1">
          LEVEL COMPLETE!
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
      </div>
    </div>
  );
};

