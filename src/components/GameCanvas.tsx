import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/core/GameEngine';
import { GameStateStatus, SaveData } from '../types/game';
import { HUD } from './HUD';
import { MobileControls } from './MobileControls';
import { PauseModal } from './PauseModal';
import { GameOverModal } from './GameOverModal';
import { VictoryModal } from './VictoryModal';
import { SaveSystem } from '../game/save/SaveSystem';

interface GameCanvasProps {
  saveData: SaveData;
  onSaveUpdate: (updatedSave: SaveData) => void;
  onReturnToMainMenu: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  saveData,
  onSaveUpdate,
  onReturnToMainMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameStatus, setGameStatus] = useState<GameStateStatus>('RUNNING');
  const [playerHp, setPlayerHp] = useState<{ current: number; max: number }>({
    current: 100,
    max: 100,
  });
  const [coinsCollected, setCoinsCollected] = useState<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set logical internal resolution
    canvas.width = 800;
    canvas.height = 450;

    // Load save data & create game engine
    const currentSave = SaveSystem.load();
    const engine = new GameEngine(canvas, currentSave);
    engineRef.current = engine;

    setPlayerHp({
      current: engine.player.stats.currentHp,
      max: engine.player.stats.maxHp,
    });

    engine.setOnStateChange((status, coins) => {
      setGameStatus(status);
      setCoinsCollected(coins);
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
        setCoinsCollected(engineRef.current.collectedCoinsCount);
      }
    }, 100);

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

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.restart();
      setGameStatus('RUNNING');
      setCoinsCollected(0);
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
      setPlayerHp({
        current: engineRef.current.player.stats.currentHp,
        max: engineRef.current.player.stats.maxHp,
      });
    }
  };

  const hasActiveCheckpoint = Boolean(engineRef.current?.checkpoint?.isActive);

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 flex items-center justify-center overflow-hidden select-none">
      {/* 800x450 Scaled Canvas Wrapper */}
      <div className="relative w-full max-w-[900px] aspect-[16/9] bg-slate-900 border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} className="w-full h-full block bg-sky-900" />

        {/* HUD Bar */}
        <HUD
          currentHp={playerHp.current}
          maxHp={playerHp.max}
          coins={coinsCollected}
          levelTitle="1-1 GREEN FOREST"
          onPauseClick={handlePause}
        />

        {/* On-Screen Mobile Touch Controls Overlay */}
        {engineRef.current && (
          <MobileControls
            inputManager={engineRef.current.input}
            opacity={saveData.settings.touchControlsOpacity || 0.85}
          />
        )}

        {/* Modals based on Game Engine Status */}
        {gameStatus === 'PAUSED' && (
          <PauseModal
            onResume={handleResume}
            onRestart={handleRestart}
            onMainMenu={onReturnToMainMenu}
          />
        )}

        {gameStatus === 'GAME_OVER' && (
          <GameOverModal
            coinsCollected={coinsCollected}
            hasCheckpoint={hasActiveCheckpoint}
            onRespawnCheckpoint={handleRespawnCheckpoint}
            onRetry={handleRestart}
            onMainMenu={onReturnToMainMenu}
          />
        )}

        {gameStatus === 'VICTORY' && (
          <VictoryModal
            coinsCollected={coinsCollected}
            starsEarned={
              (() => {
                const total = engineRef.current?.totalCoinsInLevel || 1;
                const ratio = coinsCollected / total;
                return ratio >= 0.8 ? 3 : ratio >= 0.4 ? 2 : 1;
              })()
            }
            onNextLevel={() => {
              // Level victory next action
            }}
            onMainMenu={onReturnToMainMenu}
          />
        )}
      </div>
    </div>
  );
};
