import React, { useState } from 'react';
import { ArrowLeft, Lock, Star, Play, CheckCircle2 } from 'lucide-react';
import { ALL_LEVELS_METADATA, WORLD_NAMES } from '../game/world/LevelData';
import { GameScreen, SaveData } from '../types/game';
import { audioEngine } from '../game/audio/AudioEngine';

interface LevelsMenuProps {
  saveData: SaveData;
  onNavigate: (screen: GameScreen) => void;
  onSelectLevel: (levelId: string) => void;
}

export const LevelsMenu: React.FC<LevelsMenuProps> = ({
  saveData,
  onNavigate,
  onSelectLevel,
}) => {
  const [selectedWorld, setSelectedWorld] = useState<number>(1);

  const handleBack = () => {
    audioEngine.playButtonClick();
    onNavigate('MAIN_MENU');
  };

  const handleLevelClick = (levelId: string, unlocked: boolean) => {
    audioEngine.playButtonClick();
    if (unlocked) {
      onSelectLevel(levelId);
      onNavigate('PLAYING');
    }
  };

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 flex flex-col p-6 text-slate-100 select-none overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold transition text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK TO MENU
        </button>

        <h2 className="text-xl font-black text-amber-400 tracking-wider">
          SELECT LEVEL
        </h2>

        <div className="text-xs text-amber-300 font-mono font-bold">
          🪙 {saveData.coins}
        </div>
      </div>

      {/* World Navigation Tabs (World 1 to World 6) */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {[1, 2, 3, 4, 5, 6].map((worldNum) => {
          const isActive = selectedWorld === worldNum;
          return (
            <button
              key={worldNum}
              onClick={() => {
                audioEngine.playButtonClick();
                setSelectedWorld(worldNum);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              World {worldNum}
            </button>
          );
        })}
      </div>

      {/* Active World Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-black text-sky-400 uppercase tracking-wide">
          {WORLD_NAMES[selectedWorld]}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {selectedWorld === 1
            ? 'Defeat the Forest Goblins across Green Valley to reach the chief fortress!'
            : 'Unlocks in Phase 2 Expansion. Conquer World 1 first!'}
        </p>
      </div>

      {/* Levels Grid */}
      {selectedWorld === 1 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ALL_LEVELS_METADATA.map((lvl) => {
            const isCompleted = saveData.completedLevels.includes(lvl.id);
            const isUnlocked = lvl.id === '1-1' || isCompleted;
            const stars = saveData.levelStars[lvl.id] || 0;

            return (
              <div
                key={lvl.id}
                onClick={() => handleLevelClick(lvl.id, isUnlocked)}
                className={`relative p-4 rounded-xl border transition flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-slate-900 hover:bg-slate-800/90 border-slate-700 cursor-pointer shadow-lg hover:border-amber-500/50'
                    : 'bg-slate-950/60 border-slate-800 opacity-60 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      LEVEL {lvl.levelNum}
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : !isUnlocked ? (
                      <Lock className="w-4 h-4 text-slate-500" />
                    ) : null}
                  </div>

                  <h4 className="font-black text-sm text-slate-100 mb-1">
                    {lvl.title}
                  </h4>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= stars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  {isUnlocked && (
                    <button className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                      <Play className="w-3 h-3 fill-amber-400" /> PLAY
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-xl">
          <Lock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-300">
            WORLD {selectedWorld} LOCKED
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Complete World 1 levels in Phase 2 to unlock {WORLD_NAMES[selectedWorld]}.
          </p>
        </div>
      )}
    </div>
  );
};
