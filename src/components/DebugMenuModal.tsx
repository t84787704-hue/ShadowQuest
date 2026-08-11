import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Play, RefreshCw, Zap, Shield, Heart, Coins, Skull, Plus, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { DebugManager } from '../game/debug/DebugManager';
import { SaveSystem } from '../game/save/SaveSystem';
import { EnemyClass } from '../game/entities/Enemy';

interface DebugMenuModalProps {
  onClose: () => void;
  onStartLevel: (levelId: string) => void;
  onRestartLevel: () => void;
  onSetHpFull?: () => void;
  onSetHpLow?: () => void;
  onAddCoins?: (amount: number) => void;
  onKillNearestEnemy?: () => void;
  onKillAllEnemies?: () => void;
  onSpawnEnemy?: (enemyClass?: EnemyClass) => void;
  onSpawnMultipleEnemies?: (count: number) => void;
  onSpawnBoss?: () => void;
  onSetEnemyHp?: (hp: number) => void;
  onSetEnemyDamage?: (damage: number) => void;
  onForceEnemyBlock?: () => void;
  onForceEnemyDodge?: () => void;
  onForceEnemyCounterattack?: () => void;
  onToggleGodMode?: () => boolean;
  onSkipLevel?: () => void;
  onResetProgress?: () => void;
  onBackToMainMenu?: () => void;
  currentLevelId?: string;
  isPlaying?: boolean;
}

export const DebugMenuModal: React.FC<DebugMenuModalProps> = ({
  onClose,
  onStartLevel,
  onRestartLevel,
  onSetHpFull,
  onSetHpLow,
  onAddCoins,
  onKillNearestEnemy,
  onKillAllEnemies,
  onSpawnEnemy,
  onSpawnMultipleEnemies,
  onSpawnBoss,
  onSetEnemyHp,
  onSetEnemyDamage,
  onForceEnemyBlock,
  onForceEnemyDodge,
  onForceEnemyCounterattack,
  onToggleGodMode,
  onSkipLevel,
  onResetProgress,
  onBackToMainMenu,
  currentLevelId = '1-1',
  isPlaying = false,
}) => {
  const [activeTab, setActiveTab] = useState<'LEVELS' | 'PLAYER' | 'ENEMIES' | 'FLOW'>('LEVELS');
  const [isGodMode, setIsGodMode] = useState<boolean>(DebugManager.isGodMode());
  const [message, setMessage] = useState<string | null>(null);

  const showToast = (txt: string) => {
    setMessage(txt);
    setTimeout(() => setMessage(null), 2000);
  };

  const handleToggleGod = () => {
    if (onToggleGodMode) {
      const state = onToggleGodMode();
      setIsGodMode(state);
      showToast(state ? '⚡ GOD MODE ACTIVATED!' : '🛡️ GOD MODE DISABLED');
    }
  };

  const worlds = [1, 2, 3, 4, 5, 6];
  const levels = [1, 2, 3, 4, 5];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
    >
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-5 py-3.5 flex items-center justify-between text-slate-950 font-black">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <div>
              <h2 className="text-base font-extrabold tracking-wider leading-tight">DEVELOPER TEST & DEBUG MENU</h2>
              <p className="text-[10px] font-semibold text-slate-900/80">Dev Environment Active • Current: {currentLevelId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-950/20 rounded-lg text-slate-950 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast */}
        {message && (
          <div className="bg-amber-400 text-slate-950 font-bold text-center text-xs py-1.5 px-3 animate-pulse">
            {message}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('LEVELS')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'LEVELS' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> SELECT LEVEL (1-1 to 6-5)
          </button>
          <button
            onClick={() => setActiveTab('PLAYER')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'PLAYER' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Heart className="w-3.5 h-3.5" /> PLAYER & CHEATS
          </button>
          <button
            onClick={() => setActiveTab('ENEMIES')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'ENEMIES' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Skull className="w-3.5 h-3.5" /> SPAWN ENEMIES
          </button>
          <button
            onClick={() => setActiveTab('FLOW')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'FLOW' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> GAME FLOW
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-slate-950/90 border-b border-slate-800 p-2.5 px-4">
          <span className="text-[10px] font-black tracking-wider text-amber-400 uppercase block mb-1.5">⚡ QUICK TEST ACTIONS</span>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            <button
              onClick={() => {
                if (onSetHpFull) onSetHpFull();
                showToast('❤️ Full HP Restored!');
              }}
              className="py-1.5 px-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 rounded-lg text-emerald-300 font-extrabold text-[10px] transition cursor-pointer text-center"
            >
              Full HP
            </button>
            <button
              onClick={() => {
                if (onAddCoins) onAddCoins(1000);
                showToast('💰 +1000 Coins Added!');
              }}
              className="py-1.5 px-2 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 rounded-lg text-amber-300 font-extrabold text-[10px] transition cursor-pointer text-center"
            >
              +1000 Coins
            </button>
            <button
              onClick={() => {
                onRestartLevel();
                showToast('🔄 Level Restarted');
              }}
              className="py-1.5 px-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-600/60 rounded-lg text-blue-300 font-extrabold text-[10px] transition cursor-pointer text-center"
            >
              Restart
            </button>
            <button
              onClick={() => {
                if (onSkipLevel) onSkipLevel();
                showToast('🏆 Level Completed!');
              }}
              className="py-1.5 px-2 bg-teal-950/80 hover:bg-teal-900 border border-teal-500/60 rounded-lg text-teal-200 font-extrabold text-[10px] transition cursor-pointer text-center"
            >
              Complete
            </button>
            <button
              onClick={() => {
                if (onSpawnMultipleEnemies) onSpawnMultipleEnemies(1);
                showToast('🥊 Spawned 1 Enemy');
              }}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 font-extrabold text-[10px] transition cursor-pointer text-center"
            >
              Spawn 1 Enemy
            </button>
            <button
              onClick={() => {
                if (onSpawnMultipleEnemies) onSpawnMultipleEnemies(3);
                showToast('🥊 Spawned 3 Enemies');
              }}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 font-extrabold text-[10px] transition cursor-pointer text-center"
            >
              Spawn 3 Enemies
            </button>
            <button
              onClick={() => {
                if (onSpawnMultipleEnemies) onSpawnMultipleEnemies(5);
                showToast('🥊 Spawned 5 Enemies');
              }}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 font-extrabold text-[10px] transition cursor-pointer text-center"
            >
              Spawn 5 Enemies
            </button>
            <button
              onClick={() => {
                if (onSpawnBoss) onSpawnBoss();
                showToast('👑 World Boss Spawned!');
              }}
              className="py-1.5 px-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 rounded-lg text-rose-200 font-extrabold text-[10px] transition cursor-pointer text-center"
            >
              Spawn Boss
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* 1. LEVEL SELECTOR */}
          {activeTab === 'LEVELS' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-medium">
                Tap any level below to instantly launch it in test mode without completing previous levels:
              </p>
              {worlds.map((w) => (
                <div key={w} className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-2">
                    <span>WORLD {w}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {w === 1 && 'Forest Realm'}
                      {w === 2 && 'Desert Citadel'}
                      {w === 3 && 'Glacier Fortress'}
                      {w === 4 && 'Volcano Warlords'}
                      {w === 5 && 'Void Shadow Realm'}
                      {w === 6 && 'Imperial Citadel'}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {levels.map((l) => {
                      const lvlId = `${w}-${l}`;
                      const isCurrent = currentLevelId === lvlId;
                      const isBoss = l === 5;
                      return (
                        <button
                          key={lvlId}
                          onClick={() => {
                            onStartLevel(lvlId);
                            showToast(`Launching Level ${lvlId}...`);
                          }}
                          className={`py-2.5 px-2 rounded-lg text-xs font-black transition cursor-pointer flex flex-col items-center justify-center border ${
                            isCurrent
                              ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400'
                              : isBoss
                              ? 'bg-red-950/60 hover:bg-red-900/80 text-red-300 border-red-700/60'
                              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                        >
                          <span>{lvlId}</span>
                          <span className="text-[9px] font-normal opacity-80">
                            {isBoss ? 'BOSS' : `Lvl ${l}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. PLAYER & COINS */}
          {activeTab === 'PLAYER' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    if (onSetHpFull) onSetHpFull();
                    showToast('❤️ Player HP set to FULL (100%)');
                  }}
                  className="p-3 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/50 rounded-xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400" /> FULL HP
                </button>

                <button
                  onClick={() => {
                    if (onSetHpLow) onSetHpLow();
                    showToast('⚠️ Player HP set to LOW (10 HP)');
                  }}
                  className="p-3 bg-red-950/60 hover:bg-red-900/80 border border-red-600/50 rounded-xl text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400" /> LOW HP (10)
                </button>

                <button
                  onClick={() => {
                    if (onAddCoins) onAddCoins(100);
                    showToast('🪙 +100 Coins Added');
                  }}
                  className="p-3 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/50 rounded-xl text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Coins className="w-4 h-4 text-amber-400" /> +100 COINS
                </button>

                <button
                  onClick={() => {
                    if (onAddCoins) onAddCoins(1000);
                    showToast('💰 +1000 Coins Added');
                  }}
                  className="p-3 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/50 rounded-xl text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Coins className="w-4 h-4 text-amber-300" /> +1000 COINS
                </button>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-yellow-400" /> GOD MODE (INVINCIBILITY)
                  </h4>
                  <p className="text-[11px] text-slate-400">Player takes no damage from enemies or hazards</p>
                </div>
                <button
                  onClick={handleToggleGod}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    isGodMode ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {isGodMode ? 'ACTIVE ⚡' : 'OFF'}
                </button>
              </div>
            </div>
          )}

          {/* 3. ENEMIES */}
          {activeTab === 'ENEMIES' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    if (onKillNearestEnemy) onKillNearestEnemy();
                    showToast('☠️ Nearest Enemy Defeated');
                  }}
                  className="p-3 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/50 rounded-xl text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Skull className="w-4 h-4 text-rose-400" /> KILL NEAREST ENEMY
                </button>

                <button
                  onClick={() => {
                    if (onKillAllEnemies) onKillAllEnemies();
                    showToast('⚡ ALL Enemies Cleared');
                  }}
                  className="p-3 bg-red-950/80 hover:bg-red-900 border border-red-500 rounded-xl text-red-200 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-red-400" /> KILL ALL ENEMIES
                </button>

                <button
                  onClick={() => {
                    if (onSpawnEnemy) onSpawnEnemy('MARTIAL_ARTIST');
                    showToast('🥊 Normal Martial Artist Spawned');
                  }}
                  className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-400" /> SPAWN NORMAL FIGHTER
                </button>

                <button
                  onClick={() => {
                    if (onSpawnEnemy) onSpawnEnemy('ELITE_FIGHTER');
                    showToast('🔥 Elite Fighter Spawned');
                  }}
                  className="p-3 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-600/50 rounded-xl text-purple-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-purple-400" /> SPAWN ELITE FIGHTER
                </button>

                <button
                  onClick={() => {
                    if (onSpawnBoss) onSpawnBoss();
                    showToast('👑 World Boss Spawned!');
                  }}
                  className="col-span-2 p-3 bg-amber-950/80 hover:bg-amber-900 border border-amber-500 rounded-xl text-amber-200 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <CrownIcon className="w-4 h-4 text-amber-400" /> SPAWN WORLD BOSS MONSTER
                </button>
              </div>

              {/* Multiple Enemy Spawning */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300 block mb-2">SPAWN MULTIPLE ENEMIES AT ONCE:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      if (onSpawnMultipleEnemies) onSpawnMultipleEnemies(1);
                      showToast('Spawned 1 Enemy');
                    }}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                  >
                    +1 ENEMY
                  </button>
                  <button
                    onClick={() => {
                      if (onSpawnMultipleEnemies) onSpawnMultipleEnemies(3);
                      showToast('Spawned 3 Enemies');
                    }}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                  >
                    +3 ENEMIES
                  </button>
                  <button
                    onClick={() => {
                      if (onSpawnMultipleEnemies) onSpawnMultipleEnemies(5);
                      showToast('Spawned 5 Enemies');
                    }}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                  >
                    +5 ENEMIES
                  </button>
                </div>
              </div>

              {/* Enemy Stat Overrides */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">SET ENEMY HEALTH (HP):</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      if (onSetEnemyHp) onSetEnemyHp(1);
                      showToast('Enemy HP set to 1 (1-Hit Kill)');
                    }}
                    className="py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700 font-semibold cursor-pointer"
                  >
                    1 HP (1 Hit)
                  </button>
                  <button
                    onClick={() => {
                      if (onSetEnemyHp) onSetEnemyHp(100);
                      showToast('Enemy HP set to 100');
                    }}
                    className="py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700 font-semibold cursor-pointer"
                  >
                    100 HP
                  </button>
                  <button
                    onClick={() => {
                      if (onSetEnemyHp) onSetEnemyHp(300);
                      showToast('Enemy HP set to 300 (Tank)');
                    }}
                    className="py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700 font-semibold cursor-pointer"
                  >
                    300 HP
                  </button>
                </div>
              </div>

              {/* Force AI Defense Actions */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-amber-400 block">FORCE ENEMY AI DEFENSE ACTIONS:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      if (onForceEnemyBlock) onForceEnemyBlock();
                      showToast('🛡️ Enemy Guard Forced!');
                    }}
                    className="py-2 bg-amber-950/70 hover:bg-amber-900 border border-amber-600/60 text-xs text-amber-300 rounded-lg font-bold transition cursor-pointer"
                  >
                    🛡️ Force Block
                  </button>
                  <button
                    onClick={() => {
                      if (onForceEnemyDodge) onForceEnemyDodge();
                      showToast('💨 Enemy Dodge Forced!');
                    }}
                    className="py-2 bg-sky-950/70 hover:bg-sky-900 border border-sky-600/60 text-xs text-sky-300 rounded-lg font-bold transition cursor-pointer"
                  >
                    💨 Force Dodge
                  </button>
                  <button
                    onClick={() => {
                      if (onForceEnemyCounterattack) onForceEnemyCounterattack();
                      showToast('⚡ Enemy Counter Forced!');
                    }}
                    className="py-2 bg-rose-950/70 hover:bg-rose-900 border border-rose-600/60 text-xs text-rose-300 rounded-lg font-bold transition cursor-pointer"
                  >
                    ⚡ Counterattack
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. FLOW & RESET */}
          {activeTab === 'FLOW' && (
            <div className="space-y-3">
              {isPlaying && (
                <>
                  <button
                    onClick={() => {
                      onRestartLevel();
                      onClose();
                    }}
                    className="w-full p-3 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-600/50 rounded-xl text-blue-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-blue-400" /> RESTART CURRENT LEVEL ({currentLevelId})
                  </button>

                  <button
                    onClick={() => {
                      if (onSkipLevel) onSkipLevel();
                      onClose();
                    }}
                    className="w-full p-3 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500 rounded-xl text-emerald-200 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> COMPLETE CURRENT LEVEL (TRIGGER VICTORY)
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to RESET ALL SAVE PROGRESS? This resets unlocked levels, coins and upgrades.')) {
                    SaveSystem.resetSaveData();
                    if (onResetProgress) onResetProgress();
                    if (onBackToMainMenu) onBackToMainMenu();
                    showToast('🔄 Save Data Progress Reset!');
                    onClose();
                  }
                }}
                className="w-full p-3.5 bg-red-950/80 hover:bg-red-900 border border-red-600 rounded-xl text-red-200 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
              >
                <RotateCcw className="w-4 h-4 text-red-400" /> RESET ALL GAME PROGRESS (FULL RESET)
              </button>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-amber-400 block">Keyboard Shortcuts during gameplay:</span>
                <p>• Press <code className="bg-slate-800 text-slate-200 px-1 py-0.5 rounded">~</code> (Backquote) or <code className="bg-slate-800 text-slate-200 px-1 py-0.5 rounded">F12</code> to open this debug menu</p>
                <p>• Tap version number "v1.0.4" 7 times in Main Menu to toggle menu access</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <span>DEVELOPER DEBUGGER v1.0.4</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg transition cursor-pointer"
          >
            CLOSE DEBUGGER
          </button>
        </div>
      </div>
    </motion.div>
  );
};

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}
