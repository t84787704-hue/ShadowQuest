import React from 'react';
import { motion } from 'motion/react';
import { Play, Compass, Mountain, Shield, Flame, Skull, X } from 'lucide-react';
import { WORLD_NAMES } from '../game/world/LevelData';
import { audioEngine } from '../game/audio/AudioEngine';

interface WorldIntroModalProps {
  levelId?: string;
  worldId?: number;
  levelNum?: number;
  onStart: () => void;
  onBack?: () => void;
}

const WORLD_DESCRIPTIONS: Record<number, { desc: string; icon: React.ReactNode; color: string }> = {
  1: {
    desc: 'Deep in Green Valley, Forest Goblins lurk among wooden platforms and ancient ruins. Retrieve the Earth Orb!',
    icon: <Compass className="w-10 h-10 text-emerald-400" />,
    color: 'from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/40',
  },
  2: {
    desc: 'Scorching desert sands, crumbling temple bridges, and venomous desert beasts await in the Ancient Ruins.',
    icon: <Mountain className="w-10 h-10 text-amber-400" />,
    color: 'from-amber-950 via-slate-900 to-slate-950 border-amber-500/40',
  },
  3: {
    desc: 'Icy cliffs and slippery glaciers! Navigating these frozen peaks requires precise jumping and swift blade slashes.',
    icon: <Shield className="w-10 h-10 text-sky-400" />,
    color: 'from-sky-950 via-slate-900 to-slate-950 border-sky-500/40',
  },
  4: {
    desc: 'Pitch-black caverns with razor-sharp stalactite spikes and shadow beasts lurking in the dark depths.',
    icon: <Skull className="w-10 h-10 text-purple-400" />,
    color: 'from-purple-950 via-slate-900 to-slate-950 border-purple-500/40',
  },
  5: {
    desc: 'Floating cloud islands high above Aetheria! One wrong step means falling into the abyss.',
    icon: <Compass className="w-10 h-10 text-cyan-300" />,
    color: 'from-cyan-950 via-slate-900 to-slate-950 border-cyan-500/40',
  },
  6: {
    desc: 'The royal stronghold of the Goblin King! Iron gates, heavy catapults, and elite citadel guards.',
    icon: <Flame className="w-10 h-10 text-rose-500 animate-pulse" />,
    color: 'from-rose-950 via-slate-900 to-slate-950 border-rose-500/40',
  },
  7: {
    desc: 'Glittering crystal chasms and prismatic reflection platforms! Defeat the Prismatic Crystal Golem.',
    icon: <Shield className="w-10 h-10 text-cyan-400" />,
    color: 'from-cyan-950 via-slate-900 to-slate-950 border-cyan-500/40',
  },
  8: {
    desc: 'Sky sanctuary floating above thunderous clouds! Dodge gale winds and strike the Storm Lord.',
    icon: <Compass className="w-10 h-10 text-sky-300" />,
    color: 'from-sky-950 via-slate-900 to-slate-950 border-sky-500/40',
  },
  9: {
    desc: 'Sunken temple submerged in ancient aquatic ruins! Beware the Kraken Basin Monarch.',
    icon: <Flame className="w-10 h-10 text-teal-400" />,
    color: 'from-teal-950 via-slate-900 to-slate-950 border-teal-500/40',
  },
  10: {
    desc: 'The Ultimate Celestial Peak! Face the Ultimate Overlord Sovereign in the ultimate finale of Aetheria!',
    icon: <Skull className="w-10 h-10 text-amber-400 animate-bounce" />,
    color: 'from-indigo-950 via-slate-900 to-slate-950 border-amber-500/60',
  },
};

export const WorldIntroModal: React.FC<WorldIntroModalProps> = ({
  levelId,
  worldId,
  levelNum,
  onStart,
  onBack,
}) => {
  let effectiveWorldId = worldId ?? 1;
  let effectiveLevelNum = levelNum ?? 1;

  if (levelId) {
    const parts = levelId.split('-').map((p) => parseInt(p, 10));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      effectiveWorldId = parts[0];
      effectiveLevelNum = parts[1];
    }
  }

  const worldInfo = WORLD_DESCRIPTIONS[effectiveWorldId] || WORLD_DESCRIPTIONS[1];
  const worldName = WORLD_NAMES[effectiveWorldId] || `WORLD ${effectiveWorldId}`;
  const isBoss = effectiveLevelNum === 10;

  const handleStartLevel = () => {
    audioEngine.playButtonClick();
    onStart();
  };

  const handleBack = () => {
    audioEngine.playButtonClick();
    if (onBack) onBack();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-40 flex items-center justify-center p-4 select-none"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`w-full max-w-sm bg-gradient-to-b ${worldInfo.color} border-2 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center relative`}
      >
        {onBack && (
          <button
            onClick={handleBack}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-700 flex items-center justify-center mb-3 shadow-lg">
          {worldInfo.icon}
        </div>

        <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-black mb-1">
          {worldName}
        </span>

        <h2 className="text-xl font-black text-slate-100 tracking-wider mb-1">
          {isBoss ? `LEVEL ${effectiveWorldId}-5 • BOSS BATTLE` : `LEVEL ${effectiveWorldId}-${effectiveLevelNum}`}
        </h2>

        <p className="text-xs text-slate-300 bg-slate-900/80 border border-slate-800 rounded-xl p-3 my-4 leading-relaxed">
          {worldInfo.desc}
        </p>

        <div className="w-full flex gap-2">
          {onBack && (
            <button
              onClick={handleBack}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 transition"
            >
              BACK
            </button>
          )}

          <button
            onClick={handleStartLevel}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl border border-amber-300/40 shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            START LEVEL
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
