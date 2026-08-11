import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Home, Pause, HelpCircle, Volume2, VolumeX, Music, Save, CheckCircle2 } from 'lucide-react';
import { audioEngine } from '../game/audio/AudioEngine';

interface PauseModalProps {
  onResume: () => void;
  onQuickSave: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onOpenDebug?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onQuickSave,
  onRestart,
  onMainMenu,
  onOpenDebug,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(audioEngine.isSoundEnabled());
  const [musicEnabled, setMusicEnabled] = useState(audioEngine.isMusicEnabled());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioEngine.setSoundFxEnabled(next);
  };

  const toggleMusic = () => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    audioEngine.setMusicEnabled(next);
  };

  const handleTriggerQuickSave = () => {
    audioEngine.playButtonClick();
    onQuickSave();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleQuickSaveAndExit = () => {
    audioEngine.playButtonClick();
    onQuickSave();
    onMainMenu();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex items-center justify-center p-4 select-none overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl flex flex-col items-center my-auto"
      >
        <div className="w-12 h-12 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl flex items-center justify-center mb-2">
          <Pause className="w-6 h-6 fill-amber-400" />
        </div>

        <h2 className="text-2xl font-black text-slate-100 tracking-wider mb-0.5">
          GAME PAUSED
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Take a breath, Warrior Blaze!
        </p>

        {savedSuccess && (
          <div className="w-full mb-3 p-2.5 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center justify-center gap-2 text-emerald-300 font-bold text-xs animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            MID-LEVEL PROGRESS QUICK-SAVED!
          </div>
        )}

        {/* Audio Quick Toggles */}
        <div className="flex gap-2 w-full mb-4">
          <button
            onClick={toggleSound}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              soundEnabled
                ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            SFX: {soundEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={toggleMusic}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              musicEnabled
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <Music className="w-4 h-4" />
            BGM: {musicEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={() => {
              audioEngine.playButtonClick();
              onResume();
            }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-sm uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            RESUME
          </button>

          {onOpenDebug && (
            <button
              onClick={() => {
                audioEngine.playButtonClick();
                onOpenDebug();
              }}
              className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 font-extrabold text-xs uppercase rounded-xl border border-amber-500/50 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>🛠️</span> DEVELOPER DEBUG MENU
            </button>
          )}

          <button
            onClick={handleTriggerQuickSave}
            className="w-full py-2.5 bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs uppercase rounded-xl border border-emerald-400/40 flex items-center justify-center gap-2 transition shadow-md"
          >
            <Save className="w-4 h-4 text-emerald-200" />
            QUICK SAVE PROGRESS
          </button>

          <button
            onClick={() => {
              audioEngine.playButtonClick();
              setShowHowToPlay(true);
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 font-bold text-xs uppercase rounded-xl border border-amber-500/30 flex items-center justify-center gap-2 transition"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            HOW TO PLAY
          </button>

          <button
            onClick={() => {
              audioEngine.playButtonClick();
              onRestart();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs uppercase rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4 text-sky-400" />
            RESTART LEVEL
          </button>

          <button
            onClick={handleQuickSaveAndExit}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-white font-semibold text-xs uppercase rounded-xl border border-slate-800 flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4 text-slate-400" />
            SAVE & MAIN MENU
          </button>
        </div>
      </motion.div>

      {/* How to Play Modal Overlay */}
      {showHowToPlay && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-5 max-w-sm w-full text-left shadow-2xl flex flex-col">
            <h3 className="text-lg font-black text-amber-400 mb-2 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              HOW TO PLAY BLAZE
            </h3>

            <div className="space-y-2 text-xs text-slate-300 mb-4 overflow-y-auto max-h-[220px] pr-1">
              <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-bold text-amber-300">🎮 Controls:</span> Use D-Pad buttons or Arrow/A-D keys to Move. Tap Jump or W/Up to Leap.
              </div>

              <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-bold text-sky-300">⚔️ Sword Slash:</span> Tap Attack or Spacebar to swing Blaze's Radiant Blade at Goblins.
              </div>

              <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-bold text-yellow-300">🪙 Gold & Hearts:</span> Collect coins for upgrades. Grab Health Hearts (+25 HP) to heal.
              </div>

              <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="font-bold text-emerald-300">🚩 Checkpoints & Goal:</span> Touch green shrine flags to save spawn points. Reach the golden victory flag to clear World 1-1!
              </div>
            </div>

            <button
              onClick={() => {
                audioEngine.playButtonClick();
                setShowHowToPlay(false);
              }}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl transition"
            >
              GOT IT!
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

