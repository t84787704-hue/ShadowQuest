import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameEngine } from '../game/core/GameEngine';
import { GameStateStatus, SaveData } from '../types/game';
import { HUD } from './HUD';
import { ComboOverlay } from './ComboOverlay';
import { MobileControls } from './MobileControls';
import { PauseModal } from './PauseModal';
import { GameOverModal } from './GameOverModal';
import { VictoryModal } from './VictoryModal';
import { SaveSystem } from '../game/save/SaveSystem';

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
  const [comboState, setComboState] = useState<{ hits: number; timer: number; maxTimer: number }>({
    hits: 0,
    timer: 0,
    maxTimer: 2.5,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set logical internal resolution
    canvas.width = 800;
    canvas.height = 450;

    // Load save data & create game engine
    const currentSave = SaveSystem.load();
    const engine = new GameEngine(canvas, currentSave, levelId, isResume);
    engineRef.current = engine;

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
        setComboState({
          hits: engineRef.current.comboHits,
          timer: engineRef.current.comboTimer,
          maxTimer: engineRef.current.maxComboTimer,
        });
      }
    }, 50);

    return () => {
      clearInterval(statsInterval);
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
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
        <canvas ref={canvasRef} className="w-full h-full block bg-sky-900" />

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
          onPauseClick={handlePause}
        />

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
          {gameStatus === 'PAUSED' && (
            <PauseModal
              onResume={handleResume}
              onQuickSave={handleQuickSave}
              onRestart={handleRestart}
              onMainMenu={onReturnToMainMenu}
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
              coinsCollected={levelCoins}
              starsEarned={
                (() => {
                  const total = engineRef.current?.totalCoinsInLevel || 1;
                  const ratio = levelCoins / total;
                  return ratio >= 0.8 ? 3 : ratio >= 0.4 ? 2 : 1;
                })()
              }
              hasNextLevel={Boolean(nextLevelId)}
              onNextLevel={() => {
                if (nextLevelId && onSelectNextLevel) {
                  onSelectNextLevel(nextLevelId);
                } else {
                  onReturnToMainMenu();
                }
              }}
              onMainMenu={onReturnToMainMenu}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
