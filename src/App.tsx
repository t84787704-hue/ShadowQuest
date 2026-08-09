import { useState, useEffect } from 'react';
import { GameScreen, SaveData } from './types/game';
import { SaveSystem } from './game/save/SaveSystem';
import { audioEngine } from './game/audio/AudioEngine';
import { MainMenu } from './components/MainMenu';
import { LevelsMenu } from './components/LevelsMenu';
import { UpgradesMenu } from './components/UpgradesMenu';
import { SettingsMenu } from './components/SettingsMenu';
import { GameCanvas } from './components/GameCanvas';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('MAIN_MENU');
  const [saveData, setSaveData] = useState<SaveData>(() => SaveSystem.load());
  const [selectedLevelId, setSelectedLevelId] = useState<string>('1-1');

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

  return (
    <div className="w-screen h-screen bg-slate-950 flex items-center justify-center overflow-hidden font-sans">
      <div className="w-full h-full max-w-[1280px] max-h-[720px] relative flex flex-col bg-slate-950">
        {currentScreen === 'MAIN_MENU' && (
          <MainMenu
            saveData={saveData}
            onNavigate={setCurrentScreen}
            onSoundToggle={handleSoundToggle}
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
            key={selectedLevelId}
            saveData={saveData}
            onSaveUpdate={handleSaveUpdate}
            onReturnToMainMenu={() => {
              const freshSave = SaveSystem.load();
              setSaveData(freshSave);
              setCurrentScreen('MAIN_MENU');
            }}
          />
        )}
      </div>
    </div>
  );
}
