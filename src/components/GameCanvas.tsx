import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameEngine } from '../game/core/GameEngine';
import { GameStateStatus, SaveData } from '../types/game';
import { HUD } from './HUD';
import { ComboOverlay } from './ComboOverlay';
import { BossHUD } from './BossHUD';
import { MobileControls } from './MobileControls';
import { PauseModal } from './PauseModal';
import { GameOverModal } from './GameOverModal';
import { VictoryModal } from './VictoryModal';
import { LevelStartOverlay } from './LevelStartOverlay';
import { DebugMenuModal } from './DebugMenuModal';
import { SaveSystem } from '../game/save/SaveSystem';
import { DebugManager } from '../game/debug/DebugManager';

interface GameCanvasProps {
  saveData: SaveData;
  levelId?: string;
  isResume?: boolean;
  onSaveUpdate: (updatedSave: SaveData) => void;
  onSelectNextLevel?: (nextLevelId: string) => void;
  onReturnToMainMenu: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  saveData,
  levelId = '1-1',
  isResume = false,
  onSaveUpdate,
  onSelectNextLevel,
  onReturnToMainMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameStatus, setGameStatus] = useState<GameStateStatus>('RUNNING');
  const [playerHp, setPlayerHp] = useState<{ current: number; max: number }>({
    current: 100,
    max: 100,
  });
  const [levelCoins, setLevelCoins] = useState<number>(0);
  const [totalCoins, setTotalCoins] = useState<number>(saveData.coins || 0);
  const [secretRoomsState, setSecretRoomsState] = useState<{ discovered: number; total: number }>({
    discovered: 0,
    total: 0,
  });
  const [comboState, setComboState] = useState<{ hits: number; timer: number; maxTimer: number }>({
    hits: 0,
    timer: 0,
    maxTimer: 2.5,
  });
  const [bossData, setBossData] = useState<{
    bossName: string;
    worldId: number;
    hp: number;
    maxHp: number;
    phase: number;
    maxPhases: number;
    state: string;
    isTriggered: boolean;
  } | null>(null);

  const [impactEffect, setImpactEffect] = useState<{ id: number; type: 'HEAVY' | 'BOSS' | 'LIGHT' } | null>(null);
  const [showDebugMenu, setShowDebugMenu] = useState<boolean>(false);
  const [showLevelStartOverlay, setShowLevelStartOverlay] = useState<boolean>(true);
  const [isGodMode, setIsGodMode] = useState<boolean>(DebugManager.isGodMode());
  const impactTimeoutRef = useRef<number | null>(null);

  const handleToggleGodMode = () => {
    if (engineRef.current) {
      const nextState = !engineRef.current.player.isGodMode;
      engineRef.current.player.isGodMode = nextState;
      DebugManager.setGodMode(nextState);
      setIsGodMode(nextState);
    } else {
      const nextState = !DebugManager.isGodMode();
      DebugManager.setGodMode(nextState);
      setIsGodMode(nextState);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '`' || e.key === '~' || e.key === 'F12') && DebugManager.isUnlocked()) {
        e.preventDefault();
        setShowDebugMenu((prev) => !prev);
      }
      if ((e.key === 'g' || e.key === 'G') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        handleToggleGodMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setShowLevelStartOverlay(true);

    // Set logical internal resolution
    canvas.width = 800;
    canvas.height = 450;

    // Load save data & create game engine
    const currentSave = SaveSystem.load();
    const engine = new GameEngine(canvas, currentSave, levelId, isResume);
    engineRef.current = engine;

    audioEngine.resetTriggerFlags();
    audioEngine.playMusic(engine.isBossLevel ? 'BOSS' : 'GAMEPLAY');

    engine.onImpactCallback = (type) => {
      if (type === 'HEAVY' || type === 'BOSS') {
        if (impactTimeoutRef.current) {
          window.clearTimeout(impactTimeoutRef.current);
        }
        setImpactEffect({ id: Date.now(), type });
        impactTimeoutRef.current = window.setTimeout(() => {
          setImpactEffect(null);
        }, type === 'BOSS' ? 300 : 200);
      }
    };

    setPlayerHp({
      current: engine.player.stats.currentHp,
      max: engine.player.stats.maxHp,
    });
    setTotalCoins(engine.totalCoins);
    setLevelCoins(engine.collectedCoinsCount);

    engine.setOnStateChange((status, lCoins, tCoins) => {
      setGameStatus(status);
      setLevelCoins(lCoins);
      setTotalCoins(tCoins);
      const updatedSave = SaveSystem.load();
      onSaveUpdate(updatedSave);
    });

    engine.start();

    // Stats sync ticker
    const statsInterval = setInterval(() => {
      if (engineRef.current) {
        setPlayerHp({
          current: engineRef.current.player.stats.currentHp,
          max: engineRef.current.player.stats.maxHp,
        });
        setLevelCoins(engineRef.current.collectedCoinsCount);
        setTotalCoins(engineRef.current.totalCoins);
        setIsGodMode(engineRef.current.player.isGodMode);
        setComboState({
          hits: engineRef.current.comboHits,
          timer: engineRef.current.comboTimer,
          maxTimer: engineRef.current.maxComboTimer,
        });

        if (engineRef.current.secretRoomManager) {
          setSecretRoomsState({
            discovered: engineRef.current.secretRoomManager.discoveredCount,
            total: engineRef.current.secretRoomManager.totalRooms,
          });
        }

        if (engineRef.current.bossMonster) {
          const b = engineRef.current.bossMonster;
          setBossData({
            bossName: b.bossName,
            worldId: b.worldId,
            hp: b.hp,
            maxHp: b.maxHp,
            phase: b.currentPhase,
            maxPhases: b.maxPhases,
            state: b.state,
            isTriggered: b.isTriggered,
          });
        } else {
          setBossData(null);
        }
      }
    }, 50);

    return () => {
      if (impactTimeoutRef.current) {
        window.clearTimeout(impactTimeoutRef.current);
      }
      clearInterval(statsInterval);
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
      audioEngine.playMusic('MENU');
    };
  }, []);

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
    }
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resume();
    }
  };

  const handleQuickSave = () => {
    if (engineRef.current) {
      const updatedSave = engineRef.current.saveQuickSave();
      onSaveUpdate(updatedSave);
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.restart();
      setGameStatus('RUNNING');
      setShowLevelStartOverlay(true);
      setLevelCoins(0);
      setTotalCoins(engineRef.current.totalCoins);
      setPlayerHp({
        current: engineRef.current.player.stats.currentHp,
        max: engineRef.current.player.stats.maxHp,
      });
    }
  };

  const handleRespawnCheckpoint = () => {
    if (engineRef.current) {
      engineRef.current.respawnAtCheckpoint();
      setGameStatus('RUNNING');
      setLevelCoins(engineRef.current.collectedCoinsCount);
      setTotalCoins(engineRef.current.totalCoins);
      setPlayerHp({
        current: engineRef.current.player.stats.currentHp,
        max: engineRef.current.player.stats.maxHp,
      });
    }
  };

  const hasActiveCheckpoint = Boolean(engineRef.current?.checkpoint?.isActive);
  const currentLevelTitle = engineRef.current?.levelDef?.config?.title || `${levelId} LEVEL`;

  const getNextLevelId = (currentId: string): string | null => {
    const [wStr, lStr] = currentId.split('-');
    const w = parseInt(wStr, 10) || 1;
    const l = parseInt(lStr, 10) || 1;
    if (l < 5) return `${w}-${l + 1}`;
    if (w < 6) return `${w + 1}-1`;
    return null;
  };

  const nextLevelId = getNextLevelId(levelId);

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 flex items-center justify-center overflow-hidden select-none">
      {/* 800x450 Scaled Canvas Wrapper */}
      <div className="relative w-full max-w-[900px] aspect-[16/9] bg-slate-900 border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <motion.div
          animate={
            impactEffect?.type === 'BOSS'
              ? {
                  x: [0, -12, 12, -8, 8, -4, 4, 0],
                  y: [0, 8, -8, 5, -5, 2, 0],
                  scale: [1, 1.025, 1],
                }
              : impactEffect?.type === 'HEAVY'
              ? {
                  x: [0, -8, 8, -5, 5, -2, 2, 0],
                  y: [0, 5, -5, 3, -3, 0],
                  scale: [1, 1.015, 1],
                }
              : { x: 0, y: 0, scale: 1 }
          }
          transition={{ duration: impactEffect?.type === 'BOSS' ? 0.3 : 0.2, ease: 'easeOut' }}
          className="w-full h-full relative"
        >
          <canvas ref={canvasRef} className="w-full h-full block bg-sky-900" />
        </motion.div>

        {/* Impact Flash Effect Overlay */}
        <AnimatePresence>
          {impactEffect && (
            <motion.div
              key={`flash-${impactEffect.id}`}
              initial={{ opacity: impactEffect.type === 'BOSS' ? 0.85 : 0.6 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: impactEffect.type === 'BOSS' ? 0.28 : 0.2, ease: 'easeOut' }}
              className={`absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden ${
                impactEffect.type === 'BOSS'
                  ? 'bg-amber-400/25 backdrop-brightness-125'
                  : 'bg-red-500/20 backdrop-brightness-110'
              }`}
            >
              {/* Shockwave Radial Ring */}
              <motion.div
                initial={{ scale: 0.2, opacity: 1 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: impactEffect.type === 'BOSS' ? 0.32 : 0.22, ease: 'easeOut' }}
                className={`w-72 h-72 rounded-full border-4 ${
                  impactEffect.type === 'BOSS'
                    ? 'border-amber-300 shadow-[0_0_60px_#facc15]'
                    : 'border-red-400 shadow-[0_0_40px_#f87171]'
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level Fade-In Transition Curtain */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute inset-0 bg-slate-950 pointer-events-none z-20 flex items-center justify-center"
        >
          <div className="text-amber-400 text-xs font-mono font-bold tracking-widest uppercase animate-pulse">
            LOADING {currentLevelTitle}...
          </div>
        </motion.div>

        {/* HUD Bar */}
        <HUD
          currentHp={playerHp.current}
          maxHp={playerHp.max}
          coins={totalCoins}
          levelTitle={currentLevelTitle}
          weaponName={engineRef.current?.player?.equippedWeapon?.name}
          weaponIcon={engineRef.current?.player?.equippedWeapon?.icon}
          isGodMode={isGodMode}
          secretRoomsDiscovered={secretRoomsState.discovered}
          totalSecretRooms={secretRoomsState.total}
          onGodModeToggle={handleToggleGodMode}
          onPauseClick={handlePause}
          onDebugClick={DebugManager.isUnlocked() ? () => setShowDebugMenu(true) : undefined}
        />

        {/* Boss Health Bar HUD */}
        {bossData && (
          <BossHUD
            bossName={bossData.bossName}
            worldId={bossData.worldId}
            hp={bossData.hp}
            maxHp={bossData.maxHp}
            phase={bossData.phase}
            maxPhases={bossData.maxPhases}
            state={bossData.state}
            isTriggered={bossData.isTriggered}
          />
        )}

        {/* Combat Combo Overlay */}
        <ComboOverlay
          comboHits={comboState.hits}
          comboTimer={comboState.timer}
          maxComboTimer={comboState.maxTimer}
        />

        {/* On-Screen Mobile Touch Controls Overlay */}
        {engineRef.current && (
          <MobileControls
            inputManager={engineRef.current.input}
            opacity={saveData.settings.touchControlsOpacity || 0.85}
          />
        )}

        {/* Modals based on Game Engine Status */}
        <AnimatePresence>
          {showLevelStartOverlay && (
            <LevelStartOverlay
              key={`start-overlay-${levelId}`}
              levelId={levelId}
              levelTitle={currentLevelTitle}
              isBossLevel={Boolean(engineRef.current?.isBossLevel)}
              onComplete={() => setShowLevelStartOverlay(false)}
            />
          )}

          {showDebugMenu && (
            <DebugMenuModal
              key="debug-modal"
              onClose={() => setShowDebugMenu(false)}
              onStartLevel={(newLvlId) => {
                setShowDebugMenu(false);
                if (onSelectNextLevel) onSelectNextLevel(newLvlId);
              }}
              onRestartLevel={handleRestart}
              onSetHpFull={() => {
                if (engineRef.current?.player?.stats) {
                  engineRef.current.setPlayerHp(engineRef.current.player.stats.maxHp);
                }
              }}
              onSetHpLow={() => engineRef.current?.setPlayerLowHp()}
              onAddCoins={(amt) => engineRef.current?.addCoins(amt)}
              onKillNearestEnemy={() => engineRef.current?.killNearestEnemy()}
              onKillAllEnemies={() => engineRef.current?.killAllEnemies()}
              onSpawnEnemy={(cls) => engineRef.current?.spawnEnemy(cls)}
              onSpawnMultipleEnemies={(cnt) => engineRef.current?.spawnMultipleEnemies(cnt)}
              onSpawnBoss={() => engineRef.current?.spawnBoss()}
              onSetEnemyHp={(hp) => engineRef.current?.setEnemyHp(hp)}
              onSetEnemyDamage={(dmg) => engineRef.current?.setEnemyDamage(dmg)}
              onForceEnemyBlock={() => engineRef.current?.forceEnemyBlock()}
              onForceEnemyDodge={() => engineRef.current?.forceEnemyDodge()}
              onForceEnemyCounterattack={() => engineRef.current?.forceEnemyCounterattack()}
              onToggleGodMode={() => {
                if (!engineRef.current?.player) return false;
                const next = !engineRef.current.player.isGodMode;
                engineRef.current.player.isGodMode = next;
                DebugManager.setGodMode(next);
                setIsGodMode(next);
                return next;
              }}
              onSkipLevel={() => engineRef.current?.triggerVictory()}
              onResetProgress={() => {
                SaveSystem.resetSaveData();
                onReturnToMainMenu();
              }}
              onBackToMainMenu={onReturnToMainMenu}
              currentLevelId={levelId}
              isPlaying={true}
            />
          )}

          {gameStatus === 'PAUSED' && (
            <PauseModal
              onResume={handleResume}
              onQuickSave={handleQuickSave}
              onRestart={handleRestart}
              onMainMenu={onReturnToMainMenu}
              onOpenDebug={DebugManager.isUnlocked() ? () => setShowDebugMenu(true) : undefined}
            />
          )}

          {gameStatus === 'GAME_OVER' && (
            <GameOverModal
              coinsCollected={totalCoins}
              hasCheckpoint={hasActiveCheckpoint}
              onRespawnCheckpoint={handleRespawnCheckpoint}
              onRetry={handleRestart}
              onMainMenu={onReturnToMainMenu}
            />
          )}

          {gameStatus === 'VICTORY' && (
            <VictoryModal
              levelTitle={currentLevelTitle}
              levelId={levelId}
              coinsCollected={levelCoins}
              totalCoinsInLevel={engineRef.current?.totalCoinsInLevel || 1}
              enemiesDefeated={engineRef.current?.totalEnemiesDefeated || 0}
              totalEnemies={engineRef.current?.totalEnemiesInLevel || 50}
              timeSeconds={engineRef.current?.levelTime || 0}
              damageTaken={engineRef.current?.player.totalDamageTaken || 0}
              maxCombo={engineRef.current?.maxComboAchieved || 0}
              playerMaxHp={engineRef.current?.player.stats.maxHp || 100}
              hasNextLevel={Boolean(nextLevelId)}
              onNextLevel={() => {
                if (nextLevelId && onSelectNextLevel) {
                  onSelectNextLevel(nextLevelId);
                } else {
                  onReturnToMainMenu();
                }
              }}
              onReplay={handleRestart}
              onMainMenu={onReturnToMainMenu}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
