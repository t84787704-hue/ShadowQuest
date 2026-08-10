import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameScreen, SaveData } from './types/game';
import { SaveSystem } from './game/save/SaveSystem';
import { audioEngine } from './game/audio/AudioEngine';
import { MainMenu } from './components/MainMenu';
import { LevelsMenu } from './components/LevelsMenu';
import { UpgradesMenu } from './components/UpgradesMenu';
import { SettingsMenu } from './components/SettingsMenu';
import { GameCanvas } from './components/GameCanvas';
import { WorldMap } from './components/WorldMap';
import { StoryModal } from './components/StoryModal';
import { WorldIntroModal } from './components/WorldIntroModal';
import { AchievementsMenu } from './components/AchievementsMenu';
import { DebugMenuModal } from './components/DebugMenuModal';
import { DebugManager } from './game/debug/DebugManager';
import { GameEngine } from './game/core/GameEngine';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('MAIN_MENU');
  const [saveData, setSaveData] = useState<SaveData>(() => SaveSystem.load());
  const [selectedLevelId, setSelectedLevelId] = useState<string>('1-1');
  const [pendingLevelId, setPendingLevelId] = useState<string | null>(null);
  const [isResumeRun, setIsResumeRun] = useState<boolean>(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState<boolean>(false);
  const activeEngineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    // Synchronize sound settings on initial load
    audioEngine.setSoundFxEnabled(saveData.settings.soundFxEnabled);
    audioEngine.setMusicEnabled(saveData.settings.musicEnabled);
  }, []);

  const handleSaveUpdate = (updated: SaveData) => {
    setSaveData(updated);
    audioEngine.setSoundFxEnabled(updated.settings.soundFxEnabled);
    audioEngine.setMusicEnabled(updated.settings.musicEnabled);
  };

  const handleClearQuickSave = () => {
    const updated = SaveSystem.clearQuickSave();
    setSaveData(updated);
  };

  const handleSoundToggle = () => {
    const isNowOn = !audioEngine.isSoundEnabled();
    audioEngine.setSoundFxEnabled(isNowOn);
    audioEngine.setMusicEnabled(isNowOn);

    const updated = {
      ...saveData,
      settings: {
        ...saveData.settings,
        soundFxEnabled: isNowOn,
        musicEnabled: isNowOn,
      },
    };
    SaveSystem.save(updated);
    setSaveData(updated);
  };

  const handleLevelSelect = (levelId: string) => {
    setPendingLevelId(levelId);
  };

  const handleConfirmStartLevel = () => {
    if (pendingLevelId) {
      setSelectedLevelId(pendingLevelId);
      setIsResumeRun(false);
      setPendingLevelId(null);
      setCurrentScreen('PLAYING');
    }
  };

  // Debug Actions Handlers
  const handleDebugStartLevel = (levelId: string) => {
    setSelectedLevelId(levelId);
    setIsResumeRun(false);
    setCurrentScreen('PLAYING');
    setIsDebugModalOpen(false);
  };

  const handleDebugRestartLevel = () => {
    if (activeEngineRef.current) {
      activeEngineRef.current.restart();
    } else {
      setIsResumeRun(false);
      setCurrentScreen('PLAYING');
    }
    setIsDebugModalOpen(false);
  };

  const handleDebugSetHp100 = () => {
    if (activeEngineRef.current) {
      activeEngineRef.current.setPlayerHp(100);
    }
  };

  const handleDebugAddCoins1000 = () => {
    SaveSystem.addCoins(1000);
    const updated = SaveSystem.load();
    setSaveData(updated);
    if (activeEngineRef.current) {
      activeEngineRef.current.addCoins(1000);
    }
  };

  const handleDebugToggleGodMode = (): boolean => {
    const newState = DebugManager.toggleGodMode();
    if (activeEngineRef.current) {
      activeEngineRef.current.setGodMode(newState);
    }
    return newState;
  };

  const handleDebugSkipLevel = () => {
    if (activeEngineRef.current) {
      activeEngineRef.current.triggerVictory();
    }
    setIsDebugModalOpen(false);
  };

  const handleDebugBackToMainMenu = () => {
    setCurrentScreen('MAIN_MENU');
    setIsDebugModalOpen(false);
  };

  return (
    <div className="w-screen h-screen bg-slate-950 flex items-center justify-center overflow-hidden font-sans">
      <div className="w-full h-full max-w-[1280px] max-h-[720px] relative flex flex-col bg-slate-950">
        <AnimatePresence mode="wait">
          {currentScreen === 'MAIN_MENU' && (
            <motion.div
              key="MAIN_MENU"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full h-full relative"
            >
              <MainMenu
                saveData={saveData}
                onNavigate={setCurrentScreen}
                onSelectLevel={(lvl, isResume) => {
                  setSelectedLevelId(lvl);
                  setIsResumeRun(Boolean(isResume));
                  setCurrentScreen('PLAYING');
                }}
                onClearQuickSave={handleClearQuickSave}
                onSoundToggle={handleSoundToggle}
                onOpenDebugMenu={() => setIsDebugModalOpen(true)}
              />
            </motion.div>
          )}

          {currentScreen === 'WORLD_MAP' && (
            <motion.div
              key="WORLD_MAP"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full h-full relative"
            >
              <WorldMap
                saveData={saveData}
                onNavigate={setCurrentScreen}
                onSelectLevel={handleLevelSelect}
              />
            </motion.div>
          )}

          {currentScreen === 'STORY' && (
            <motion.div
              key="STORY"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full h-full relative"
            >
              <StoryModal
                onComplete={() => {
                  SaveSystem.markStorySeen();
                  setSaveData(SaveSystem.load());
                  setCurrentScreen('WORLD_MAP');
                }}
                onClose={() => {
                  SaveSystem.markStorySeen();
                  setSaveData(SaveSystem.load());
                  setCurrentScreen('WORLD_MAP');
                }}
              />
            </motion.div>
          )}

          {currentScreen === 'LEVELS' && (
            <motion.div
              key="LEVELS"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full h-full relative"
            >
              <LevelsMenu
                saveData={saveData}
                onNavigate={setCurrentScreen}
                onSelectLevel={(levelId) => {
                  setSelectedLevelId(levelId);
                  setCurrentScreen('PLAYING');
                }}
              />
            </motion.div>
          )}

          {currentScreen === 'UPGRADES' && (
            <motion.div
              key="UPGRADES"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full h-full relative"
            >
              <UpgradesMenu
                saveData={saveData}
                onNavigate={setCurrentScreen}
                onSaveUpdate={handleSaveUpdate}
              />
            </motion.div>
          )}

          {currentScreen === 'SETTINGS' && (
            <motion.div
              key="SETTINGS"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full h-full relative"
            >
              <SettingsMenu
                saveData={saveData}
                onNavigate={setCurrentScreen}
                onSaveUpdate={handleSaveUpdate}
                onSoundToggle={handleSoundToggle}
              />
            </motion.div>
          )}

          {currentScreen === 'ACHIEVEMENTS' && (
            <motion.div
              key="ACHIEVEMENTS"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full h-full relative"
            >
              <AchievementsMenu
                saveData={saveData}
                onNavigate={setCurrentScreen}
                onSaveUpdate={handleSaveUpdate}
              />
            </motion.div>
          )}

          {currentScreen === 'PLAYING' && (
            <motion.div
              key={`PLAYING-${selectedLevelId}-${isResumeRun}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full h-full relative"
            >
              <GameCanvas
                key={`${selectedLevelId}-${isResumeRun}`}
                saveData={saveData}
                levelId={selectedLevelId}
                isResume={isResumeRun}
                onSaveUpdate={handleSaveUpdate}
                onSelectNextLevel={(nextLevelId) => {
                  setIsResumeRun(false);
                  const freshSave = SaveSystem.load();
                  setSaveData(freshSave);
                  setSelectedLevelId(nextLevelId);
                }}
                onReturnToMainMenu={() => {
                  setIsResumeRun(false);
                  const freshSave = SaveSystem.load();
                  setSaveData(freshSave);
                  setCurrentScreen('WORLD_MAP');
                }}
                onOpenDebugMenu={() => setIsDebugModalOpen(true)}
                onEngineReady={(engine) => {
                  activeEngineRef.current = engine;
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* World Intro Modal overlay when selecting level from World Map */}
        <AnimatePresence>
          {pendingLevelId && (
            <WorldIntroModal
              key="intro-modal"
              levelId={pendingLevelId}
              onStart={handleConfirmStartLevel}
              onBack={() => setPendingLevelId(null)}
            />
          )}
        </AnimatePresence>

        {/* Development Debug Menu Overlay */}
        <AnimatePresence>
          {isDebugModalOpen && (
            <DebugMenuModal
              key="debug-menu-modal"
              onClose={() => setIsDebugModalOpen(false)}
              onStartLevel={handleDebugStartLevel}
              onRestartLevel={handleDebugRestartLevel}
              onSetHp100={handleDebugSetHp100}
              onAddCoins1000={handleDebugAddCoins1000}
              onToggleGodMode={handleDebugToggleGodMode}
              onSkipLevel={handleDebugSkipLevel}
              onBackToMainMenu={handleDebugBackToMainMenu}
              currentLevelId={selectedLevelId}
              isPlaying={currentScreen === 'PLAYING'}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

