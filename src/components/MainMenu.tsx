import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Map,
  ShieldAlert,
  Settings,
  Volume2,
  VolumeX,
  Flame,
  FastForward,
  LogOut,
  BookmarkCheck,
  Trash2,
  Trophy,
  Crown,
  Sparkles,
  Award,
  Lock,
  ChevronRight,
  X,
  Coins,
  Skull,
  Compass,
  CheckCircle2,
  Swords,
  HelpCircle,
} from 'lucide-react';
import { GameScreen, SaveData } from '../types/game';
import { audioEngine } from '../game/audio/AudioEngine';
import { SaveSystem } from '../game/save/SaveSystem';
import { getUnclaimedCount } from '../data/achievements';
import { CampaignProgressModal } from './CampaignProgressModal';
import { LegendaryRewardsModal } from './LegendaryRewardsModal';
import { DebugManager } from '../game/debug/DebugManager';
import { WORLD_NAMES } from '../game/world/LevelData';

interface MainMenuProps {
  saveData: SaveData;
  onNavigate: (screen: GameScreen) => void;
  onSelectLevel: (levelId: string, isResume?: boolean) => void;
  onClearQuickSave?: () => void;
  onSoundToggle: () => void;
  onOpenDebug?: () => void;
}

// Lightweight floating ember & spark particles canvas background
const MenuBackgroundCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create 32 subtle floating ember particles
    const particles = Array.from({ length: 32 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1 + Math.random() * 2.5,
      speedY: 0.25 + Math.random() * 0.55,
      speedX: (Math.random() - 0.5) * 0.35,
      alpha: 0.2 + Math.random() * 0.65,
      color: Math.random() > 0.4 ? 'rgba(245, 158, 11, ' : 'rgba(239, 68, 68, ',
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle center radial dark vignette glow
      const grad = ctx.createRadialGradient(
        width / 2,
        height * 0.4,
        20,
        width / 2,
        height * 0.4,
        Math.max(width, height) * 0.7
      );
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.08)');
      grad.addColorStop(0.4, 'rgba(14, 165, 233, 0.03)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Update & render ember particles
      for (const p of particles) {
        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
        ctx.shadowBlur = 6;
        ctx.fill();
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full z-0" />;
};

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  onNavigate,
  onSelectLevel,
  onClearQuickSave,
  onSoundToggle,
  onOpenDebug,
}) => {
  const isSoundOn = audioEngine.isSoundEnabled();
  const latestUnlockedLevel = SaveSystem.getLatestUnlockedLevel();
  const progress = SaveSystem.getCampaignProgress(saveData);

  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [showCampaignModal, setShowCampaignModal] = useState<boolean>(false);
  const [showWorldsModal, setShowWorldsModal] = useState<boolean>(false);
  const [showLegendaryModal, setShowLegendaryModal] = useState<boolean>(false);
  const [showNgPlusConfirm, setShowNgPlusConfirm] = useState<boolean>(false);
  const [isDebugUnlocked, setIsDebugUnlocked] = useState<boolean>(DebugManager.isUnlocked());

  useEffect(() => {
    // Play background menu music if music is enabled
    if (audioEngine.isMusicEnabled()) {
      audioEngine.playMusic();
    }
  }, []);

  const handleVersionClick = () => {
    const res = DebugManager.registerVersionTap();
    if (res.unlocked) {
      setIsDebugUnlocked(true);
      if (onOpenDebug) onOpenDebug();
    }
  };

  const handleBtnClick = (screen: GameScreen) => {
    audioEngine.playButtonClick();
    onNavigate(screen);
  };

  const handleContinue = () => {
    audioEngine.playButtonClick();
    onSelectLevel(latestUnlockedLevel);
    onNavigate('PLAYING');
  };

  const handleStartPlay = () => {
    audioEngine.playButtonClick();
    onSelectLevel('1-1');
    onNavigate('PLAYING');
  };

  const handleStartNgPlus = () => {
    audioEngine.playButtonClick();
    SaveSystem.startNewGamePlus();
    setShowNgPlusConfirm(false);
    onSelectLevel('1-1');
    onNavigate('PLAYING');
  };

  const handleSelectWorldLevel = (worldNum: number) => {
    audioEngine.playButtonClick();
    setShowWorldsModal(false);
    // Find highest unlocked level in this world, default to 1
    const worldLevelId = `${worldNum}-1`;
    onSelectLevel(worldLevelId);
    onNavigate('PLAYING');
  };

  const hasQuickSave = Boolean(saveData.quickSave);
  const unclaimedCount = getUnclaimedCount(saveData);
  const isNgPlusUnlocked = Boolean(saveData.newGamePlusUnlocked || saveData.gameCompleted);
  const isLegendaryUnlocked = Boolean(saveData.legendaryTitleUnlocked || saveData.gameCompleted);

  const WORLD_THEMES: Record<number, { bgGradient: string; icon: string; desc: string }> = {
    1: {
      bgGradient: 'from-emerald-950/80 to-slate-900',
      icon: '🌲',
      desc: 'Lush valley guarded by goblin scouts & martial trainees.',
    },
    2: {
      bgGradient: 'from-amber-950/80 to-slate-900',
      icon: '🏜️',
      desc: 'Sunburnt desert filled with ancient ruins & warlords.',
    },
    3: {
      bgGradient: 'from-sky-950/80 to-slate-900',
      icon: '🏔️',
      desc: 'Freezing mountain peak with deadly ice caverns.',
    },
    4: {
      bgGradient: 'from-red-950/80 to-slate-900',
      icon: '🌋',
      desc: 'Scorching lava core where magma guardians lie in wait.',
    },
    5: {
      bgGradient: 'from-purple-950/80 to-slate-900',
      icon: '🔮',
      desc: 'Shadowy abyssal realm of martial specters & curses.',
    },
    6: {
      bgGradient: 'from-amber-950/90 to-yellow-950/80',
      icon: '🏰',
      desc: 'The Goblin King’s royal fortress. Defeat Grandmaster Marcus!',
    },
  };

  return (
    <div className="relative w-full h-full min-h-[480px] bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 flex flex-col items-center justify-between p-3 sm:p-5 overflow-y-auto select-none">
      {/* Dynamic Animated Canvas Background */}
      <MenuBackgroundCanvas />

      {/* Top Header Row */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl flex justify-between items-center z-10 gap-2 mb-2"
      >
        {/* REWARDS / COINS DISPLAY (Opens Upgrades Menu on Click) */}
        <button
          onClick={() => handleBtnClick('UPGRADES')}
          className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border-2 border-amber-500/50 hover:border-amber-400 rounded-full px-3.5 py-1.5 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition active:scale-95 cursor-pointer"
          title="View Upgrades & Coin Rewards"
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300 font-black text-sm tracking-wide">
            🪙 {saveData.coins.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-amber-400/80 bg-amber-500/20 px-1.5 py-0.5 rounded-full uppercase">
            REWARDS
          </span>
        </button>

        <div className="flex items-center gap-2">
          {isLegendaryUnlocked && (
            <div className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/50 px-2.5 py-1 rounded-full text-amber-300 text-[11px] font-black shadow-lg">
              <Crown className="w-3.5 h-3.5" /> LEGEND
            </div>
          )}

          {onOpenDebug && (
            <button
              onClick={() => {
                audioEngine.playButtonClick();
                onOpenDebug();
              }}
              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-black text-xs rounded-full border border-amber-300 shadow-md flex items-center gap-1 transition active:scale-95 cursor-pointer"
              title="Developer Debug Menu"
            >
              <span>🛠️</span> DEBUG
            </button>
          )}

          <button
            onClick={onSoundToggle}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-200 transition shadow-lg active:scale-95 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Toggle Sound FX"
          >
            {isSoundOn ? (
              <Volume2 className="w-5 h-5 text-sky-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-rose-400" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Main Title Hero Section */}
      <div className="flex flex-col items-center z-10 text-center my-auto w-full max-w-md px-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/40 rounded-full mb-1.5 shadow-md">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse fill-amber-400" />
            <span className="text-[11px] font-black tracking-widest text-amber-300 uppercase">
              2D MARTIAL ACTION
            </span>
            <Flame className="w-4 h-4 text-amber-400 animate-pulse fill-amber-400" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-300 to-rose-400 tracking-wider drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] mb-1 uppercase">
            BLAZE ADVENTURE
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide mb-3">
            Master martial stances • Conquer 6 worlds • Defeat Grandmaster Marcus
          </p>
        </motion.div>

        {/* PRIMARY ACTION BUTTONS */}
        <div className="flex flex-col gap-2.5 w-full">
          {/* MID-RUN QUICK SAVE RESUME BUTTON (IF EXISTS) */}
          {hasQuickSave && saveData.quickSave && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col gap-1 w-full bg-slate-900/90 border-2 border-emerald-500/80 rounded-2xl p-2 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
            >
              <button
                onClick={() => {
                  audioEngine.playButtonClick();
                  onSelectLevel(saveData.quickSave!.levelId, true);
                }}
                className="w-full min-h-[50px] py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 hover:from-emerald-400 hover:to-sky-500 active:scale-95 text-slate-950 font-black text-sm sm:text-base tracking-wider uppercase rounded-xl border border-emerald-300/80 shadow-lg flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BookmarkCheck className="w-5 h-5 fill-slate-950" />
                  <span>RESUME RUN ({saveData.quickSave.levelId})</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs bg-slate-950/40 text-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-400/30">
                  <span>❤️ {saveData.quickSave.playerHp}</span>
                  <span>🪙 {saveData.quickSave.startingCoins + saveData.quickSave.collectedCoinsCount}</span>
                </div>
              </button>

              {onClearQuickSave && (
                <button
                  onClick={() => {
                    audioEngine.playButtonClick();
                    onClearQuickSave();
                  }}
                  className="self-center flex items-center gap-1 text-[11px] font-semibold text-rose-400/80 hover:text-rose-300 transition mt-0.5 cursor-pointer py-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Discard Mid-Level Quick Save
                </button>
              )}
            </motion.div>
          )}

          {/* MAIN FOCUS: PLAY / CONTINUE BUTTON */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleContinue}
            className="w-full min-h-[54px] py-3.5 px-6 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base sm:text-lg tracking-wider uppercase rounded-2xl border-2 border-amber-300/90 shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2.5 transition cursor-pointer relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
            <FastForward className="w-6 h-6 fill-slate-950 text-slate-950 animate-pulse" />
            <span>PLAY ({latestUnlockedLevel})</span>
            <ChevronRight className="w-5 h-5 stroke-[3]" />
          </motion.button>

          {/* WORLDS / LEVEL SELECTION & MAP BUTTON ROW */}
          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                audioEngine.playButtonClick();
                setShowWorldsModal(true);
              }}
              className="flex-1 min-h-[48px] py-3 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 font-black text-xs sm:text-sm tracking-wider uppercase rounded-xl border border-slate-600 flex items-center justify-center gap-1.5 transition shadow-md cursor-pointer"
            >
              <Swords className="w-4 h-4 text-amber-400" />
              WORLDS / LEVELS
            </button>

            <button
              onClick={() => handleBtnClick('WORLD_MAP')}
              className="flex-1 min-h-[48px] py-3 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 font-black text-xs sm:text-sm tracking-wider uppercase rounded-xl border border-slate-600 flex items-center justify-center gap-1.5 transition shadow-md cursor-pointer"
            >
              <Map className="w-4 h-4 text-sky-400" />
              WORLD MAP
            </button>
          </div>

          {/* NEW GAME+ / LEGENDARY REWARDS ROW (IF UNLOCKED) */}
          {isNgPlusUnlocked && (
            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  audioEngine.playButtonClick();
                  setShowNgPlusConfirm(true);
                }}
                className="flex-1 min-h-[44px] py-2.5 px-3 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Flame className="w-4 h-4 fill-slate-950" />
                START NG+{saveData.newGamePlusLevel ? ` (${saveData.newGamePlusLevel + 1})` : ''}
              </button>

              <button
                onClick={() => {
                  audioEngine.playButtonClick();
                  setShowLegendaryModal(true);
                }}
                className="flex-1 min-h-[44px] py-2.5 px-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Award className="w-4 h-4" />
                LEGEND REWARDS
              </button>
            </div>
          )}

          {/* SECONDARY MENU BUTTONS ROW */}
          <div className="grid grid-cols-5 gap-1.5 w-full">
            {/* REWARDS / UPGRADES */}
            <button
              onClick={() => handleBtnClick('UPGRADES')}
              className="min-h-[48px] py-2.5 px-1 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold text-[11px] tracking-tight rounded-xl border border-slate-700/80 flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
              title="Open Upgrades & Rewards"
            >
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>REWARDS</span>
            </button>

            {/* CAMPAIGN */}
            <button
              onClick={() => {
                audioEngine.playButtonClick();
                setShowCampaignModal(true);
              }}
              className="min-h-[48px] py-2.5 px-1 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold text-[11px] tracking-tight rounded-xl border border-slate-700/80 flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
              title="Campaign Progress"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>CAMPAIGN</span>
            </button>

            {/* AWARDS / ACHIEVEMENTS */}
            <button
              onClick={() => handleBtnClick('ACHIEVEMENTS')}
              className="min-h-[48px] py-2.5 px-1 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold text-[11px] tracking-tight rounded-xl border border-slate-700/80 flex flex-col items-center justify-center gap-0.5 transition relative cursor-pointer"
              title="Achievements & Trophies"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>AWARDS</span>
              {unclaimedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center border border-amber-300">
                  {unclaimedCount}
                </span>
              )}
            </button>

            {/* SETTINGS */}
            <button
              onClick={() => handleBtnClick('SETTINGS')}
              className="min-h-[48px] py-2.5 px-1 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold text-[11px] tracking-tight rounded-xl border border-slate-700/80 flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
              title="Game Settings"
            >
              <Settings className="w-4 h-4 text-sky-400" />
              <span>SETTINGS</span>
            </button>

            {/* EXIT */}
            <button
              onClick={() => {
                audioEngine.playButtonClick();
                setShowExitConfirm(true);
              }}
              className="min-h-[48px] py-2.5 px-1 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-rose-400 font-bold text-[11px] tracking-tight rounded-xl border border-slate-700/80 flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
              title="Exit Game"
            >
              <LogOut className="w-4 h-4" />
              <span>EXIT</span>
            </button>
          </div>
        </div>

        {/* PLAYER PROFILE & PROGRESS SUMMARY CARD */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-2.5 w-full mt-3 shadow-inner text-left"
        >
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-800/80">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> PLAYER PROGRESS & STATS
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {progress.completedWorldsCount}/6 WORLDS
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Levels Completed</div>
                <div className="text-amber-300 font-black text-xs">
                  {progress.completedLevelsCount} / 30
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex items-center gap-2">
              <Skull className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Bosses Defeated</div>
                <div className="text-red-300 font-black text-xs">
                  {saveData.stats.bossesDefeated || 0} Bosses
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Coins Balance</div>
                <div className="text-yellow-300 font-black text-xs">
                  🪙 {saveData.coins.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Secret Rooms</div>
                <div className="text-sky-300 font-black text-xs">
                  {progress.discoveredSecretRooms} / 12
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* WORLDS / LEVELS OVERVIEW MODAL */}
      <AnimatePresence>
        {showWorldsModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 max-w-lg w-full text-slate-100 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative flex flex-col my-auto max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowWorldsModal(false)}
                className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <Swords className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-black text-amber-300 uppercase tracking-wide">
                  SELECT WORLD / LEVEL
                </h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Choose an unlocked world to jump straight into combat or view world maps.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                {[1, 2, 3, 4, 5, 6].map((worldNum) => {
                  const isUnlocked = SaveSystem.isWorldUnlocked(saveData, worldNum);
                  const isCompleted = SaveSystem.isWorldCompleted(saveData, worldNum);
                  const theme = WORLD_THEMES[worldNum] || WORLD_THEMES[1];
                  const title = WORLD_NAMES[worldNum] || `World ${worldNum}`;

                  return (
                    <div
                      key={worldNum}
                      className={`bg-gradient-to-br ${
                        theme.bgGradient
                      } border rounded-xl p-3 flex flex-col justify-between transition ${
                        isUnlocked
                          ? 'border-amber-500/40 hover:border-amber-400 shadow-md'
                          : 'border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl">{theme.icon}</span>
                          <div>
                            <div className="text-[11px] font-black text-slate-200 uppercase tracking-wide">
                              {title}
                            </div>
                            <div className="text-[9px] text-slate-400 leading-tight">
                              {theme.desc}
                            </div>
                          </div>
                        </div>

                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[9px] font-black shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> COMPLETED
                          </span>
                        ) : isUnlocked ? (
                          <span className="inline-flex items-center gap-1 bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full text-[9px] font-black shrink-0">
                            UNLOCKED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0">
                            <Lock className="w-3 h-3" /> LOCKED
                          </span>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-medium">
                          5 Levels • World Boss
                        </span>

                        {isUnlocked ? (
                          <button
                            onClick={() => handleSelectWorldLevel(worldNum)}
                            className="py-1.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-[11px] uppercase rounded-lg shadow transition active:scale-95 cursor-pointer"
                          >
                            ENTER WORLD {worldNum}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            🔒 CLEAR WORLD {worldNum - 1} FIRST
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowWorldsModal(false);
                    handleBtnClick('WORLD_MAP');
                  }}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-slate-950 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Map className="w-4 h-4" /> OPEN FULL WORLD MAP
                </button>
                <button
                  onClick={() => setShowWorldsModal(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl border border-slate-700 cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showCampaignModal && (
        <CampaignProgressModal saveData={saveData} onClose={() => setShowCampaignModal(false)} />
      )}

      {showLegendaryModal && (
        <LegendaryRewardsModal
          saveData={saveData}
          onClose={() => setShowLegendaryModal(false)}
          onStartNewGamePlus={() => {
            setShowLegendaryModal(false);
            handleStartNgPlus();
          }}
        />
      )}

      {showNgPlusConfirm && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-2xl p-5 max-w-sm w-full text-center shadow-[0_0_50px_rgba(244,63,94,0.4)]">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 border border-rose-500/50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Flame className="w-7 h-7 fill-rose-400" />
            </div>

            <h3 className="text-xl font-black text-rose-400 uppercase tracking-wider mb-1">
              START NEW GAME+
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Resets level completion to World 1-1 while keeping all your permanent upgrades, coins, and legendary abilities! Enemies are stronger (+35% HP, +25% DMG) with +50% coin drops!
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowNgPlusConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl border border-slate-700 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleStartNgPlus}
                className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg cursor-pointer"
              >
                CONFIRM NG+
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xs text-center shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-2">EXIT GAME</h3>
            <p className="text-xs text-slate-400 mb-4">
              Your run progress & unlocked worlds are saved locally!
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200 cursor-pointer"
              >
                STAY
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  window.scrollTo(0, 0);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-bold text-white cursor-pointer"
              >
                EXIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="w-full max-w-xl flex justify-between items-center text-[10px] text-slate-500 font-mono z-10 pt-2 border-t border-slate-800/60">
        <span>6 WORLDS • 30 LEVELS</span>
        <div className="flex items-center gap-2">
          {isDebugUnlocked && onOpenDebug && (
            <button
              onClick={onOpenDebug}
              className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold px-2 py-0.5 rounded border border-amber-500/50 transition cursor-pointer"
            >
              🛠️ DEV DEBUG
            </button>
          )}
          <button
            onClick={handleVersionClick}
            className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/60 shadow-sm hover:border-amber-500/50 transition cursor-pointer"
            title="Tap 7 times to unlock Dev Debug Menu"
          >
            v1.0.4 (Build 104)
          </button>
        </div>
        <span>SAVED OFFLINE</span>
      </div>
    </div>
  );
};
