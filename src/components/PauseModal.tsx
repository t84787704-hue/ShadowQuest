import React, { useState } from 'react';
import { Play, RotateCcw, Home, Pause, HelpCircle, Volume2, VolumeX, Music } from 'lucide-react';
import { audioEngine } from '../game/audio/AudioEngine';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMainMenu,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(audioEngine.isSoundEnabled());
  const [musicEnabled, setMusicEnabled] = useState(audioEngine.isMusicEnabled());

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

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex items-center justify-center p-4 select-none overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl flex flex-col items-center my-auto">
        <div className="w-12 h-12 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl flex items-center justify-center mb-2">
          <Pause className="w-6 h-6 fill-amber-400" />
        </div>

        <h2 className="text-2xl font-black text-slate-100 tracking-wider mb-0.5">
          GAME PAUSED
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Take a breath, Warrior Blaze!
        </p>

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
            onClick={() => {
              audioEngine.playButtonClick();
              onMainMenu();
            }}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-slate-200 font-semibold text-xs uppercase rounded-xl border border-slate-800 flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </button>
        </div>
      </div>

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
    </div>
  );
};

