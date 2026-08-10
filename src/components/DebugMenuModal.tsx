import React, { useState } from 'react';
import { X, Play, RotateCcw, Heart, Coins, Shield, FastForward, Home, CheckCircle2, Sparkles } from 'lucide-react';
import { WORLD_NAMES } from '../game/world/LevelData';
import { DebugManager } from '../game/debug/DebugManager';
import { audioEngine } from '../game/audio/AudioEngine';

interface DebugMenuModalProps {
  onClose: () => void;
  onStartLevel: (levelId: string) => void;
  onRestartLevel: () => void;
  onSetHp100: () => void;
  onAddCoins1000: () => void;
  onToggleGodMode: () => boolean;
  onSkipLevel: () => void;
  onBackToMainMenu: () => void;
  currentLevelId?: string;
  isPlaying?: boolean;
}

export const DebugMenuModal: React.FC<DebugMenuModalProps> = ({
  onClose,
  onStartLevel,
  onRestartLevel,
  onSetHp100,
  onAddCoins1000,
  onToggleGodMode,
  onSkipLevel,
  onBackToMainMenu,
  currentLevelId = '1-1',
  isPlaying = false,
}) => {
  const [wStr, lStr] = currentLevelId.split('-');
  const initialWorld = parseInt(wStr, 10) || 1;

  const [selectedWorld, setSelectedWorld] = useState<number>(initialWorld);
  const [selectedLevelId, setSelectedLevelId] = useState<string>(currentLevelId);
  const [godModeActive, setGodModeActive] = useState<boolean>(DebugManager.isGodMode());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2200);
  };

  const handleWorldSelect = (worldId: number) => {
    audioEngine.playButtonClick();
    setSelectedWorld(worldId);
    setSelectedLevelId(`${worldId}-1`);
  };

  const handleLevelSelect = (levelId: string) => {
    audioEngine.playButtonClick();
    setSelectedLevelId(levelId);
  };

  const handleStartLevel = () => {
    audioEngine.playButtonClick();
    showToast(`🚀 Launching Level ${selectedLevelId}...`);
    setTimeout(() => {
      onStartLevel(selectedLevelId);
    }, 150);
  };

  const handleRestart = () => {
    audioEngine.playButtonClick();
    showToast(`🔄 Restarting Level ${selectedLevelId}...`);
    onRestartLevel();
  };

  const handleSetHp = () => {
    audioEngine.playButtonClick();
    onSetHp100();
    showToast('❤️ Player HP Set to 100!');
  };

  const handleAddCoins = () => {
    audioEngine.playButtonClick();
    onAddCoins1000();
    showToast('🪙 +1000 Coins Added!');
  };

  const handleToggleGodMode = () => {
    audioEngine.playButtonClick();
    const newState = onToggleGodMode();
    setGodModeActive(newState);
    showToast(newState ? '🛡️ God Mode Enabled (Invulnerable)!' : '❌ God Mode Disabled');
  };

  const handleSkipLevel = () => {
    audioEngine.playButtonClick();
    onSkipLevel();
    showToast('🏆 Level Skipped - Instant Victory!');
  };

  const handleBackToMenu = () => {
    audioEngine.playButtonClick();
    onBackToMainMenu();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-6 shadow-[0_0_40px_rgba(245,158,11,0.25)] flex flex-col gap-4 max-h-[92vh] overflow-y-auto text-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/20 rounded-lg text-amber-400 text-lg">🛠️</span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-amber-400 flex items-center gap-2">
                DEVELOPMENT DEBUG MENU
                <span className="text-[10px] bg-amber-500/30 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-400/40">
                  DEV TOOL
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Select any level 1-1 to 6-5 or adjust live testing flags
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
            title="Close Debug Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toast Feedback Banner */}
        {toastMsg && (
          <div className="bg-amber-500/20 border border-amber-400/50 text-amber-200 px-3 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* 1. World Selector */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            1. Select World (1 to 6)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((wId) => {
              const isSelected = selectedWorld === wId;
              return (
                <button
                  key={`world-btn-${wId}`}
                  onClick={() => handleWorldSelect(wId)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700'
                  }`}
                >
                  <span>World {wId}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 fill-slate-950 text-amber-300" />}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 font-medium px-1">
            {WORLD_NAMES[selectedWorld] || `WORLD ${selectedWorld}`}
          </p>
        </div>

        {/* 2. Level Selector */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            2. Select Level (World {selectedWorld})
          </span>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((lNum) => {
              const levelId = `${selectedWorld}-${lNum}`;
              const isSelected = selectedLevelId === levelId;
              const isBoss = lNum === 5;
              return (
                <button
                  key={`lvl-btn-${levelId}`}
                  onClick={() => handleLevelSelect(levelId)}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 border-sky-300 font-black shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                      : isBoss
                      ? 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-800'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700'
                  }`}
                >
                  <span className="text-sm font-black">{levelId}</span>
                  <span className="text-[9px] opacity-80 uppercase tracking-tighter">
                    {isBoss ? 'BOSS' : `STAGE ${lNum}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Level Jump Selector (All 30 Levels) */}
        <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Direct Level Jump:</span>
          <select
            value={selectedLevelId}
            onChange={(e) => {
              const val = e.target.value;
              const [w] = val.split('-');
              setSelectedWorld(parseInt(w, 10) || 1);
              setSelectedLevelId(val);
            }}
            className="flex-1 bg-slate-900 border border-slate-700 text-sky-300 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-400"
          >
            {[1, 2, 3, 4, 5, 6].map((w) =>
              [1, 2, 3, 4, 5].map((l) => {
                const id = `${w}-${l}`;
                return (
                  <option key={`opt-${id}`} value={id}>
                    Level {id} {l === 5 ? '(BOSS)' : ''}
                  </option>
                );
              })
            )}
          </select>
        </div>

        {/* 3. Debug Controls Grid */}
        <div className="flex flex-col gap-2 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            3. Debug Controls & Testing Actions
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* START LEVEL */}
            <button
              onClick={handleStartLevel}
              className="py-3 px-3 bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl border border-emerald-300 flex items-center justify-center gap-2 transition shadow-md col-span-2 sm:col-span-1"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>START LEVEL {selectedLevelId}</span>
            </button>

            {/* RESTART LEVEL */}
            <button
              onClick={handleRestart}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-amber-500/40 flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>RESTART LEVEL</span>
            </button>

            {/* SET HP TO 100 */}
            <button
              onClick={handleSetHp}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-rose-500/40 flex items-center justify-center gap-2 transition"
            >
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
              <span>SET HP TO 100</span>
            </button>

            {/* ADD 1000 COINS */}
            <button
              onClick={handleAddCoins}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-amber-500/40 flex items-center justify-center gap-2 transition"
            >
              <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>ADD 1000 COINS</span>
            </button>

            {/* GOD MODE ON/OFF */}
            <button
              onClick={handleToggleGodMode}
              className={`py-3 px-3 rounded-xl border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                godModeActive
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Shield className={`w-4 h-4 ${godModeActive ? 'fill-slate-950' : 'text-slate-400'}`} />
              <span>GOD MODE: {godModeActive ? 'ON 🛡️' : 'OFF'}</span>
            </button>

            {/* SKIP LEVEL */}
            <button
              onClick={handleSkipLevel}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-sky-500/40 flex items-center justify-center gap-2 transition"
            >
              <FastForward className="w-4 h-4 text-sky-400" />
              <span>SKIP LEVEL</span>
            </button>
          </div>
        </div>

        {/* Footer / Back to Main Menu */}
        <div className="flex justify-between items-center border-t border-slate-800 pt-3 mt-1">
          <button
            onClick={handleBackToMenu}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>BACK TO MAIN MENU</span>
          </button>

          <span className="text-[10px] text-slate-500 font-mono">
            Debug settings apply live during testing
          </span>
        </div>

      </div>
    </div>
  );
};
