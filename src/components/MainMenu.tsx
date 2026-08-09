import React, { useState } from 'react';
import { Play, Map, ShieldAlert, Settings, Volume2, VolumeX, Flame, BookOpen, FastForward, LogOut } from 'lucide-react';
import { GameScreen, SaveData } from '../types/game';
import { audioEngine } from '../game/audio/AudioEngine';
import { SaveSystem } from '../game/save/SaveSystem';

interface MainMenuProps {
  saveData: SaveData;
  onNavigate: (screen: GameScreen) => void;
  onSelectLevel: (levelId: string) => void;
  onSoundToggle: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  onNavigate,
  onSelectLevel,
  onSoundToggle,
}) => {
  const isSoundOn = audioEngine.isSoundEnabled();
  const latestUnlockedLevel = SaveSystem.getLatestUnlockedLevel();
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const handleBtnClick = (screen: GameScreen) => {
    audioEngine.playButtonClick();
    onNavigate(screen);
  };

  const handleContinue = () => {
    audioEngine.playButtonClick();
    onSelectLevel(latestUnlockedLevel);
    onNavigate('PLAYING');
  };

  const handleStartPlay = () => {
    audioEngine.playButtonClick();
    onSelectLevel('1-1');
    onNavigate('PLAYING');
  };

  return (
    <div className="relative w-full h-full min-h-[450px] bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden select-none">
      {/* Background Heroic Sparks & Light Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Top Header Row */}
      <div className="w-full max-w-2xl flex justify-between items-center z-10">
        <div className="flex items-center gap-2 bg-slate-900/80 border border-amber-500/40 rounded-full px-4 py-1.5 shadow-lg">
          <span className="text-amber-400 font-bold text-sm">🪙 Coins:</span>
          <span className="text-amber-300 font-black text-base">{saveData.coins}</span>
        </div>

        <button
          onClick={onSoundToggle}
          className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-200 transition shadow-lg"
          title="Toggle Sound FX"
        >
          {isSoundOn ? (
            <Volume2 className="w-5 h-5 text-sky-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-rose-400" />
          )}
        </button>
      </div>

      {/* Main Title & Hero Banner */}
      <div className="flex flex-col items-center z-10 text-center my-auto w-full max-w-md">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-6 h-6 text-amber-500 animate-pulse fill-amber-500" />
          <span className="text-xs font-black tracking-widest text-amber-400 uppercase">
            EPIC 2D ACTION ADVENTURE
          </span>
          <Flame className="w-6 h-6 text-amber-500 animate-pulse fill-amber-500" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-300 to-rose-400 tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-2">
          BLAZE ADVENTURE
        </h1>

        {/* Primary Action Navigation Buttons */}
        <div className="flex flex-col gap-2.5 mt-4 w-full">
          {/* CONTINUE BUTTON */}
          <button
            onClick={handleContinue}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-95 text-slate-950 font-black text-base tracking-wider uppercase rounded-xl border border-amber-300/60 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition"
          >
            <FastForward className="w-5 h-5 fill-slate-950" />
            CONTINUE ({latestUnlockedLevel})
          </button>

          <div className="flex gap-2.5 w-full">
            {/* NEW GAME / PLAY */}
            <button
              onClick={handleStartPlay}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 font-bold text-sm tracking-wider uppercase rounded-xl border border-slate-600 flex items-center justify-center gap-2 transition shadow-lg"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              PLAY (1-1)
            </button>

            {/* WORLD MAP / LEVEL SELECT */}
            <button
              onClick={() => handleBtnClick('WORLD_MAP')}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 font-bold text-sm tracking-wider uppercase rounded-xl border border-slate-600 flex items-center justify-center gap-2 transition shadow-lg"
            >
              <Map className="w-4 h-4 text-sky-400" />
              WORLD MAP
            </button>
          </div>

          <div className="flex gap-2.5 w-full">
            {/* STORY INTRO */}
            <button
              onClick={() => handleBtnClick('STORY')}
              className="flex-1 py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 font-semibold text-xs tracking-wide rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              STORY
            </button>

            {/* UPGRADES */}
            <button
              onClick={() => handleBtnClick('UPGRADES')}
              className="flex-1 py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 font-semibold text-xs tracking-wide rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              UPGRADES
            </button>

            {/* SETTINGS */}
            <button
              onClick={() => handleBtnClick('SETTINGS')}
              className="flex-1 py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 font-semibold text-xs tracking-wide rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <Settings className="w-4 h-4 text-sky-400" />
              SETTINGS
            </button>

            {/* EXIT */}
            <button
              onClick={() => {
                audioEngine.playButtonClick();
                setShowExitConfirm(true);
              }}
              className="py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-rose-400 font-semibold text-xs tracking-wide rounded-xl border border-slate-700 flex items-center justify-center transition"
              title="Exit Game"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xs text-center shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-2">EXIT GAME</h3>
            <p className="text-xs text-slate-400 mb-4">
              Your run progress & unlocked worlds are saved locally!
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200"
              >
                STAY
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  window.scrollTo(0, 0);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-bold text-white"
              >
                EXIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="w-full max-w-2xl flex justify-between items-center text-[10px] text-slate-500 font-mono z-10">
        <span>6 WORLDS • 30 LEVELS</span>
        <span>SAVED OFFLINE</span>
      </div>
    </div>
  );
};

