import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, RefreshCw, Smartphone, ShieldCheck, Zap } from 'lucide-react';
import { GameScreen, SaveData } from '../types/game';
import { SaveSystem } from '../game/save/SaveSystem';
import { audioEngine } from '../game/audio/AudioEngine';
import { DebugManager } from '../game/debug/DebugManager';

interface SettingsMenuProps {
  saveData: SaveData;
  onNavigate: (screen: GameScreen) => void;
  onSaveUpdate: (updatedSave: SaveData) => void;
  onSoundToggle: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  saveData,
  onNavigate,
  onSaveUpdate,
  onSoundToggle,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [debugModeActive, setDebugModeActive] = useState<boolean>(DebugManager.isDebugMode());
  const isSoundOn = audioEngine.isSoundEnabled();

  const handleBack = () => {
    audioEngine.playButtonClick();
    onNavigate('MAIN_MENU');
  };

  const handleResetData = () => {
    const fresh = SaveSystem.resetSaveData();
    onSaveUpdate(fresh);
    setShowResetConfirm(false);
    audioEngine.playEnemyHit();
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
          GAME SETTINGS
        </h2>

        <div className="w-16" />
      </div>

      <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
        {/* Audio Toggles & Sliders */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">AUDIO MASTER TOGGLE</h4>
                <p className="text-xs text-slate-400">Synthesized offline retro sound FX & music</p>
              </div>
            </div>

            <button
              onClick={onSoundToggle}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                isSoundOn
                  ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {isSoundOn ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
            {/* Music Volume */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span>🎶 MUSIC VOLUME</span>
                <span className="text-amber-400">{Math.round(audioEngine.getMusicVolume() * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(audioEngine.getMusicVolume() * 100)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) / 100;
                  audioEngine.setMusicVolume(val);
                  const updated = {
                    ...saveData,
                    settings: {
                      ...saveData.settings,
                      musicVolume: val,
                    },
                  };
                  SaveSystem.save(updated);
                  onSaveUpdate(updated);
                }}
                className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* SFX Volume */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span>💥 SFX VOLUME</span>
                <span className="text-sky-400">{Math.round(audioEngine.getSfxVolume() * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(audioEngine.getSfxVolume() * 100)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) / 100;
                  audioEngine.setSfxVolume(val);
                  const updated = {
                    ...saveData,
                    settings: {
                      ...saveData.settings,
                      sfxVolume: val,
                    },
                  };
                  SaveSystem.save(updated);
                  onSaveUpdate(updated);
                }}
                className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Offline & Android Platform Info */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">ANDROID APK & OFFLINE READY</h4>
              <p className="text-xs text-slate-400">100% Offline-first architecture</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mt-2 pl-12">
            This project contains the complete Android Studio Gradle configuration and GitHub Actions workflow (`.github/workflows/android-build.yml`). Pushing to GitHub builds a standalone Android APK automatically!
          </p>
        </div>

        {/* Developer Debug Mode */}
        {DebugManager.isUnlocked() && (
          <div className="p-4 bg-slate-900/80 border border-amber-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  DEVELOPER DEBUG MODE
                </h4>
                <p className="text-xs text-slate-400">Unlock all 10 Worlds & 100 levels for instant testing</p>
              </div>
            </div>

            <button
              onClick={() => {
                const next = DebugManager.toggleDebugMode();
                audioEngine.playButtonClick();
                setDebugModeActive(next);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                DebugManager.isDebugMode()
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {DebugManager.isDebugMode() ? 'ACTIVE ⚡' : 'OFF'}
            </button>
          </div>
        )}

        {/* Save Data Management */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">RESET PROGRESS</h4>
              <p className="text-xs text-slate-400">Clear coins, unlocked levels, and upgrades</p>
            </div>
          </div>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition"
            >
              RESET DATA
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleResetData}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition"
              >
                CONFIRM
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition"
              >
                CANCEL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
