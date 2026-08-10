import { useState, useEffect } from 'react';
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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('MAIN_MENU');
  const [saveData, setSaveData] = useState<SaveData>(() => SaveSystem.load());
  const [selectedLevelId, setSelectedLevelId] = useState<string>('1-1');
  const [pendingLevelId, setPendingLevelId] = useState<string | null>(null);
  const [isResumeRun, setIsResumeRun] = useState<boolean>(false);

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

  return (
    <div className="w-screen h-screen bg-slate-950 flex items-center justify-center overflow-hidden font-sans">
      <div className="w-full h-full max-w-[1280px] max-h-[720px] relative flex flex-col bg-slate-950">
        {currentScreen === 'MAIN_MENU' && (
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
          />
        )}

        {currentScreen === 'WORLD_MAP' && (
          <WorldMap
            saveData={saveData}
            onNavigate={setCurrentScreen}
            onSelectLevel={handleLevelSelect}
          />
        )}

        {currentScreen === 'STORY' && (
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
        )}

        {currentScreen === 'LEVELS' && (
          <LevelsMenu
            saveData={saveData}
            onNavigate={setCurrentScreen}
            onSelectLevel={(levelId) => {
              setSelectedLevelId(levelId);
              setCurrentScreen('PLAYING');
            }}
          />
        )}

        {currentScreen === 'UPGRADES' && (
          <UpgradesMenu
            saveData={saveData}
            onNavigate={setCurrentScreen}
            onSaveUpdate={handleSaveUpdate}
          />
        )}

        {currentScreen === 'SETTINGS' && (
          <SettingsMenu
            saveData={saveData}
            onNavigate={setCurrentScreen}
            onSaveUpdate={handleSaveUpdate}
            onSoundToggle={handleSoundToggle}
          />
        )}

        {currentScreen === 'PLAYING' && (
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
          />
        )}

        {/* World Intro Modal overlay when selecting level from World Map */}
        {pendingLevelId && (
          <WorldIntroModal
            levelId={pendingLevelId}
            onStart={handleConfirmStartLevel}
            onBack={() => setPendingLevelId(null)}
          />
        )}
      </div>
    </div>
  );
}

