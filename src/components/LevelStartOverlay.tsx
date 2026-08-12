import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Skull, Zap } from 'lucide-react';
import { audioEngine } from '../game/audio/AudioEngine';

interface LevelStartOverlayProps {
  levelId: string;
  levelTitle?: string;
  isBossLevel?: boolean;
  onComplete: () => void;
}

export const LevelStartOverlay: React.FC<LevelStartOverlayProps> = ({
  levelId,
  levelTitle,
  isBossLevel = false,
  onComplete,
}) => {
  // Parse World and Level numbers from levelId (e.g., '2-3' -> World 2, Level 3)
  const [worldNum, levelNum] = levelId.split('-').map((val) => parseInt(val, 10) || 1);

  // Intro steps: 0 = WORLD/LEVEL TITLE, 1 = READY!, 2 = FIGHT! / BOSS LEVEL!
  const [step, setStep] = useState<number>(0);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Play intro sound
    audioEngine.playButtonClick();

    // Timer timeline
    const timer1 = setTimeout(() => {
      setStep(1); // READY!
      audioEngine.playCustomSFX('punch');
    }, 800);

    const timer2 = setTimeout(() => {
      setStep(2); // FIGHT! / BOSS LEVEL!
      audioEngine.playCustomSFX('finisher');
    }, 1500);

    const timer3 = setTimeout(() => {
      handleFinish();
    }, 2300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleFinish = () => {
    if (!isDismissed) {
      setIsDismissed(true);
      onComplete();
    }
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="level-start-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.2 }}
        onClick={handleFinish}
        className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-[2px] cursor-pointer select-none overflow-hidden"
      >
        {/* Dynamic Animated Background Rays */}
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-slate-950/80 pointer-events-none" />

        {/* STEP 0: WORLD & LEVEL BANNER */}
        {step === 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col items-center text-center p-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-300 text-xs sm:text-sm font-black tracking-widest uppercase mb-3 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              {isBossLevel ? <Skull className="w-4 h-4 text-red-400 animate-pulse" /> : <Swords className="w-4 h-4 text-amber-400" />}
              WORLD {worldNum}
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 tracking-wider uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              LEVEL {levelNum}
            </h1>

            {levelTitle && (
              <p className="text-sm sm:text-lg font-bold text-slate-300 tracking-widest uppercase mt-2 drop-shadow">
                {levelTitle}
              </p>
            )}
          </motion.div>
        )}

        {/* STEP 1: READY! */}
        {step === 1 && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'backOut' }}
            className="flex flex-col items-center text-center"
          >
            <div className="text-5xl sm:text-7xl font-black text-amber-400 tracking-widest uppercase italic drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] flex items-center gap-3">
              <Zap className="w-10 h-10 sm:w-14 sm:h-14 text-amber-300 animate-bounce" />
              READY!
              <Zap className="w-10 h-10 sm:w-14 sm:h-14 text-amber-300 animate-bounce" />
            </div>
          </motion.div>
        )}

        {/* STEP 2: FIGHT! / BOSS LEVEL! */}
        {step === 2 && (
          <motion.div
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col items-center text-center"
          >
            {isBossLevel ? (
              <div className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-red-600 tracking-wider uppercase italic drop-shadow-[0_0_40px_rgba(239,68,68,0.9)] flex items-center gap-3">
                <Skull className="w-12 h-12 text-red-500 animate-pulse" />
                BOSS LEVEL!
                <Skull className="w-12 h-12 text-red-500 animate-pulse" />
              </div>
            ) : (
              <div className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 tracking-widest uppercase italic drop-shadow-[0_0_50px_rgba(245,158,11,1)]">
                FIGHT!
              </div>
            )}
          </motion.div>
        )}

        {/* Skip Hint */}
        <div className="absolute bottom-4 text-[10px] text-slate-400 font-mono tracking-widest uppercase animate-pulse">
          TAP OR CLICK TO START IMMEDIATELY
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
