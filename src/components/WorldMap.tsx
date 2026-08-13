import React, { useState } from 'react';
import { ArrowLeft, Lock, Star, Play, CheckCircle2, Shield, Compass, Mountain, Flame, Skull, Trophy, Crown, Layers } from 'lucide-react';
import { GameScreen, SaveData } from '../types/game';
import { audioEngine } from '../game/audio/AudioEngine';
import { LevelRegistry, WorldDefinition } from '../game/world/LevelRegistry';

interface WorldMapProps {
  saveData: SaveData;
  onNavigate: (screen: GameScreen) => void;
  onSelectLevel: (levelId: string) => void;
}

const WORLD_ICONS: Record<number, React.ReactNode> = {
  1: <Compass className="w-5 h-5 text-emerald-400" />,
  2: <Mountain className="w-5 h-5 text-amber-400" />,
  3: <Shield className="w-5 h-5 text-sky-400" />,
  4: <Flame className="w-5 h-5 text-orange-500" />,
  5: <Crown className="w-5 h-5 text-yellow-400" />,
  6: <Flame className="w-5 h-5 text-emerald-600" />,
  7: <Shield className="w-5 h-5 text-cyan-400" />,
  8: <Compass className="w-5 h-5 text-purple-400" />,
  9: <Flame className="w-5 h-5 text-rose-500" />,
  10: <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />,
};

export const WorldMap: React.FC<WorldMapProps> = ({
  saveData,
  onNavigate,
  onSelectLevel,
}) => {
  const [selectedWorldId, setSelectedWorldId] = useState<number | 'ALL'>(1);
  const unlockedWorlds = saveData.unlockedWorlds || [1];

  const allWorldDefs = LevelRegistry.getWorlds();

  // Calculate total stars earned across all worlds
  const totalStars = Object.values(saveData.levelStars || {}).reduce((a: number, b: number) => a + b, 0);

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

  const worldsToDisplay = selectedWorldId === 'ALL'
    ? allWorldDefs
    : allWorldDefs.filter((w) => w.id === selectedWorldId);

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 flex flex-col p-4 sm:p-6 text-slate-100 select-none overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold transition text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" />
          MAIN MENU
        </button>

        <h2 className="text-lg sm:text-xl font-black text-amber-400 tracking-wider">
          CAMPAIGN WORLD MAP (10 WORLDS / 100 LEVELS)
        </h2>

        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          <button
            onClick={() => {
              audioEngine.playButtonClick();
              onNavigate('ACHIEVEMENTS');
            }}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 rounded-lg text-amber-400 flex items-center gap-1 transition"
            title="Achievements"
          >
            <Trophy className="w-4 h-4" />
          </button>
          <span className="text-amber-300">🪙 {saveData.coins}</span>
          <span className="text-amber-400 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400" /> {totalStars}
          </span>
        </div>
      </div>

      {/* World Selection Tabs / Grid */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            SELECT REALM WORLD
          </span>
          <button
            onClick={() => {
              audioEngine.playButtonClick();
              setSelectedWorldId('ALL');
            }}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition flex items-center gap-1 ${
              selectedWorldId === 'ALL'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" /> SHOW ALL 10 WORLDS
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {allWorldDefs.map((world) => {
            const isUnlocked = unlockedWorlds.includes(world.id);
            const isSelected = selectedWorldId === world.id;

            const completedInWorld = world.levels.filter((l) =>
              saveData.completedLevels.includes(l.id)
            ).length;

            return (
              <button
                key={world.id}
                onClick={() => {
                  audioEngine.playButtonClick();
                  if (isUnlocked) setSelectedWorldId(world.id);
                }}
                className={`relative p-2.5 rounded-xl border text-left transition flex flex-col justify-between h-24 overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-br ' + world.bgGradient + ' ' + world.borderColor + ' ring-2 ring-amber-400 shadow-xl'
                    : isUnlocked
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 opacity-90'
                    : 'bg-slate-950 border-slate-900 opacity-50 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-mono font-black text-amber-400 uppercase">
                      W{world.id}
                    </span>
                    {!isUnlocked ? (
                      <Lock className="w-3 h-3 text-slate-600" />
                    ) : (
                      WORLD_ICONS[world.id]
                    )}
                  </div>
                  <h4 className="text-[11px] font-black text-slate-100 truncate leading-snug">
                    {world.shortTitle}
                  </h4>
                </div>

                <div className="text-[9px] font-mono text-slate-400">
                  {isUnlocked ? `${completedInWorld}/10` : 'LOCKED'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* World & Levels Display */}
      <div className="space-y-6">
        {worldsToDisplay.map((world: WorldDefinition) => {
          const isWorldUnlocked = unlockedWorlds.includes(world.id);

          return (
            <div key={world.id} className="space-y-3">
              {/* World Header Banner */}
              <div className={`bg-gradient-to-r ${world.bgGradient} border ${world.borderColor} rounded-xl p-3 sm:p-4 flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                    {WORLD_ICONS[world.id]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-amber-400 uppercase tracking-wide">
                        {world.name}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900/80 border border-slate-700 rounded text-slate-300">
                        {world.levelRangeStr}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {world.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-xs text-slate-400">
                  {isWorldUnlocked ? (
                    <span className="text-emerald-400 font-bold">REALM UNLOCKED</span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> CLEAR W{world.id - 1} TO UNLOCK
                    </span>
                  )}
                </div>
              </div>

              {/* Grid of 10 Levels for this World */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {world.levels.map((lvl) => {
                  const isCompleted = saveData.completedLevels.includes(lvl.id);

                  // Unlocked if 1-1 or if previous level in sequence is completed
                  let isUnlocked = lvl.id === '1-1';
                  if (!isUnlocked) {
                    const [wStr, lStr] = lvl.id.split('-');
                    const w = parseInt(wStr, 10);
                    const l = parseInt(lStr, 10);
                    if (l === 1) {
                      isUnlocked = unlockedWorlds.includes(w);
                    } else {
                      const prevLvlId = `${w}-${l - 1}`;
                      isUnlocked = saveData.completedLevels.includes(prevLvlId);
                    }
                  }

                  const stars = saveData.levelStars[lvl.id] || 0;
                  const isBoss = lvl.isBossLevel || lvl.levelNum === 10;

                  return (
                    <div
                      key={lvl.id}
                      onClick={() => handleLevelClick(lvl.id, isUnlocked)}
                      className={`p-3 rounded-xl border transition flex flex-col justify-between relative overflow-hidden ${
                        isBoss
                          ? isUnlocked
                            ? 'bg-gradient-to-br from-rose-950/80 to-slate-900 border-rose-500/60 cursor-pointer shadow-lg hover:border-amber-400'
                            : 'bg-slate-950 border-slate-900 opacity-50 cursor-not-allowed'
                          : isUnlocked
                          ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 cursor-pointer shadow-lg hover:border-amber-400/60'
                          : 'bg-slate-950 border-slate-900 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[10px] font-mono font-black ${isBoss ? 'text-rose-400' : 'text-amber-400'}`}>
                            {isBoss ? `BOSS ${lvl.worldId}-10` : `LEVEL ${lvl.worldId}-${lvl.levelNum}`}
                          </span>
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : !isUnlocked ? (
                            <Lock className="w-3.5 h-3.5 text-slate-600" />
                          ) : null}
                        </div>

                        <h4 className="font-bold text-xs text-slate-100 mb-1 leading-tight">
                          {lvl.title}
                        </h4>

                        {isBoss && isUnlocked && !isCompleted && (
                          <div className="mt-1 text-[9px] font-black text-rose-300 bg-rose-500/20 border border-rose-500/50 px-1.5 py-0.5 rounded tracking-wide animate-pulse flex items-center gap-1 w-fit">
                            <Crown className="w-3 h-3 text-amber-400 fill-amber-400" /> BOSS ENCOUNTER
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800/80">
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= stars
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-800 fill-slate-800'
                              }`}
                            />
                          ))}
                        </div>

                        {isUnlocked && (
                          <button className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                            <Play className="w-2.5 h-2.5 fill-amber-400" /> PLAY
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

