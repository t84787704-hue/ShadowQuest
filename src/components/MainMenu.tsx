import React from 'react';
import { Play, Grid, ShieldAlert, Settings, Volume2, VolumeX, Flame } from 'lucide-react';
import { GameScreen, SaveData } from '../types/game';
import { audioEngine } from '../game/audio/AudioEngine';

interface MainMenuProps {
  saveData: SaveData;
  onNavigate: (screen: GameScreen) => void;
  onSoundToggle: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  onNavigate,
  onSoundToggle,
}) => {
  const isSoundOn = audioEngine.isSoundEnabled();

  const handleBtnClick = (screen: GameScreen) => {
    audioEngine.playButtonClick();
    onNavigate(screen);
  };

  return (
    <div className="relative w-full h-full min-h-[450px] bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 flex flex-col items-center justify-between p-6 overflow-hidden select-none">
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
      <div className="flex flex-col items-center z-10 text-center my-auto">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-8 h-8 text-amber-500 animate-pulse fill-amber-500" />
          <span className="text-xs font-black tracking-widest text-amber-400 uppercase">
            2D Offline Action Adventure
          </span>
          <Flame className="w-8 h-8 text-amber-500 animate-pulse fill-amber-500" />
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-300 to-rose-400 tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          BLAZE ADVENTURE
        </h1>

        <p className="text-slate-400 text-xs sm:text-sm max-w-md mt-2 font-medium">
          Hero BLAZE enters the Green Valley. Defeat Forest Goblins, collect gold coins, and conquer the realm!
        </p>

        {/* Action Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-md">
          <button
            onClick={() => handleBtnClick('PLAYING')}
            className="flex-1 py-3.5 px-6 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-95 text-white font-black text-base tracking-wider uppercase rounded-xl border border-amber-300/50 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition"
          >
            <Play className="w-5 h-5 fill-white" />
            PLAY
          </button>

          <button
            onClick={() => handleBtnClick('LEVELS')}
            className="flex-1 py-3.5 px-6 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 font-bold text-base tracking-wider uppercase rounded-xl border border-slate-600 flex items-center justify-center gap-2 transition shadow-lg"
          >
            <Grid className="w-5 h-5 text-sky-400" />
            LEVELS
          </button>
        </div>

        <div className="flex gap-3 mt-3 w-full max-w-md">
          <button
            onClick={() => handleBtnClick('UPGRADES')}
            className="flex-1 py-3 px-4 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 font-semibold text-sm tracking-wide rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            UPGRADES
          </button>

          <button
            onClick={() => handleBtnClick('SETTINGS')}
            className="flex-1 py-3 px-4 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 font-semibold text-sm tracking-wide rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Settings className="w-4 h-4 text-sky-400" />
            SETTINGS
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-2xl flex justify-between items-center text-[10px] text-slate-500 font-mono z-10">
        <span>PHASE 1 v1.0 • OFFLINE FOUNDATION</span>
        <span>WORLD 1 — GREEN VALLEY</span>
      </div>
    </div>
  );
};
