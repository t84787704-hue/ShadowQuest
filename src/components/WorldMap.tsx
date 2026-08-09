import React, { useState } from 'react';
import { ArrowLeft, Lock, Star, Play, CheckCircle2, Shield, Compass, Mountain, Flame, Skull } from 'lucide-react';
import { WORLD_NAMES, getLevelsForWorld } from '../game/world/LevelData';
import { GameScreen, SaveData } from '../types/game';
import { audioEngine } from '../game/audio/AudioEngine';

interface WorldMapProps {
  saveData: SaveData;
  onNavigate: (screen: GameScreen) => void;
  onSelectLevel: (levelId: string) => void;
}

interface WorldNode {
  id: number;
  name: string;
  shortTitle: string;
  subtitle: string;
  icon: React.ReactNode;
  bgGradient: string;
  borderColor: string;
}

const WORLDS: WorldNode[] = [
  {
    id: 1,
    name: 'WORLD 1',
    shortTitle: 'Green Forest',
    subtitle: 'Lush valley & ancient ruins',
    icon: <Compass className="w-6 h-6 text-emerald-400" />,
    bgGradient: 'from-emerald-900/60 to-slate-900',
    borderColor: 'border-emerald-500/50',
  },
  {
    id: 2,
    name: 'WORLD 2',
    shortTitle: 'Desert Ruins',
    subtitle: 'Sunbaked temples & quicksand',
    icon: <Mountain className="w-6 h-6 text-amber-400" />,
    bgGradient: 'from-amber-900/60 to-slate-900',
    borderColor: 'border-amber-500/50',
  },
  {
    id: 3,
    name: 'WORLD 3',
    shortTitle: 'Frozen Mountains',
    subtitle: 'Snowy peaks & icy glaciers',
    icon: <Shield className="w-6 h-6 text-sky-400" />,
    bgGradient: 'from-sky-900/60 to-slate-900',
    borderColor: 'border-sky-500/50',
  },
  {
    id: 4,
    name: 'WORLD 4',
    shortTitle: 'Dark Cave',
    subtitle: 'Shadow caverns & stalactites',
    icon: <Skull className="w-6 h-6 text-purple-400" />,
    bgGradient: 'from-purple-900/60 to-slate-900',
    borderColor: 'border-purple-500/50',
  },
  {
    id: 5,
    name: 'WORLD 5',
    shortTitle: 'Sky Kingdom',
    subtitle: 'Floating cloud islands',
    icon: <Compass className="w-6 h-6 text-cyan-300" />,
    bgGradient: 'from-cyan-900/60 to-slate-900',
    borderColor: 'border-cyan-500/50',
  },
  {
    id: 6,
    name: 'WORLD 6',
    shortTitle: 'Lava Fortress',
    subtitle: 'Volcanic stronghold & Goblin King',
    icon: <Flame className="w-6 h-6 text-rose-500" />,
    bgGradient: 'from-rose-900/60 to-slate-900',
    borderColor: 'border-rose-500/50',
  },
];

export const WorldMap: React.FC<WorldMapProps> = ({
  saveData,
  onNavigate,
  onSelectLevel,
}) => {
  const [selectedWorldId, setSelectedWorldId] = useState<number>(1);
  const unlockedWorlds = saveData.unlockedWorlds || [1];

  // Calculate total stars earned across all worlds
  const totalStars = Object.values(saveData.levelStars || {}).reduce((a, b) => a + b, 0);

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

  const currentWorldLevels = getLevelsForWorld(selectedWorldId);

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
          WORLD MAP
        </h2>

        <div className="flex items-center gap-3 text-xs font-mono font-bold">
          <span className="text-amber-300">🪙 {saveData.coins}</span>
          <span className="text-amber-400 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400" /> {totalStars}
          </span>
        </div>
      </div>

      {/* World Nodes Carousel / Path View */}
      <div className="mb-4">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">
          SELECT REALM WORLD
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {WORLDS.map((world) => {
            const isUnlocked = unlockedWorlds.includes(world.id);
            const isSelected = selectedWorldId === world.id;

            // Calculate completed levels for this world
            const worldLevels = getLevelsForWorld(world.id);
            const completedInWorld = worldLevels.filter((l) =>
              saveData.completedLevels.includes(l.id)
            ).length;

            return (
              <button
                key={world.id}
                onClick={() => {
                  audioEngine.playButtonClick();
                  if (isUnlocked) setSelectedWorldId(world.id);
                }}
                className={`relative p-3 rounded-xl border text-left transition flex flex-col justify-between h-28 overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-br ' + world.bgGradient + ' ' + world.borderColor + ' ring-2 ring-amber-400 shadow-xl'
                    : isUnlocked
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 opacity-90'
                    : 'bg-slate-950 border-slate-900 opacity-50 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono font-black text-amber-400 uppercase">
                      {world.name}
                    </span>
                    {!isUnlocked ? (
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                    ) : (
                      world.icon
                    )}
                  </div>
                  <h4 className="text-xs font-black text-slate-100 truncate">
                    {world.shortTitle}
                  </h4>
                </div>

                <div className="text-[9px] font-mono text-slate-400">
                  {isUnlocked ? `${completedInWorld}/5 Levels` : 'LOCKED'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected World Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-sm sm:text-base font-black text-amber-400 uppercase tracking-wide">
            {WORLD_NAMES[selectedWorldId]}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Clear all 5 levels in sequence to defeat the world boss and unlock the next realm!
          </p>
        </div>
      </div>

      {/* Level Selection Grid for Selected World */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {currentWorldLevels.map((lvl) => {
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
          const isBoss = lvl.isBossLevel || lvl.levelNum === 5;

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
                    {isBoss ? 'BOSS LEVEL' : `LEVEL ${lvl.worldId}-${lvl.levelNum}`}
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
};
