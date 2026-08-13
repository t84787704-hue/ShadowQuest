import React from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Star,
  Home,
  ArrowRight,
  RotateCcw,
  Crown,
  Sparkles,
  Award,
  Shield,
  Clock,
  Swords,
  Coins,
  Skull,
  Gift,
  Globe,
} from 'lucide-react';
import { audioEngine } from '../game/audio/AudioEngine';
import { SaveSystem } from '../game/save/SaveSystem';
import { LegendaryRewardsModal } from './LegendaryRewardsModal';
import { BOSS_SPECS } from '../game/entities/BossMonster';
import { WORLD_NAMES } from '../game/world/LevelData';
import { WEAPONS, WeaponDef } from '../game/weapons/WeaponData';

interface VictoryModalProps {
  levelTitle?: string;
  levelId: string;
  coinsCollected: number;
  totalCoinsInLevel: number;
  enemiesDefeated: number;
  totalEnemies: number;
  timeSeconds: number;
  damageTaken: number;
  maxCombo: number;
  playerMaxHp: number;
  hasNextLevel?: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onMainMenu: () => void;
}

export const calculateLevelRating = (
  damageTaken: number,
  timeSeconds: number,
  enemiesDefeated: number,
  totalEnemies: number,
  maxCombo: number,
  playerMaxHp: number
): { stars: number; title: string } => {
  let score = 100;

  // Damage penalty/bonus
  if (damageTaken === 0) {
    score += 15; // Flawless bonus
  } else {
    const hpRatio = damageTaken / (playerMaxHp || 100);
    if (hpRatio <= 0.25) score += 5;
    else if (hpRatio <= 0.50) score -= 10;
    else if (hpRatio <= 1.0) score -= 20;
    else score -= 30;
  }

  // Time factor (~2 minutes benchmark)
  if (timeSeconds <= 90) score += 10;
  else if (timeSeconds <= 150) score += 0;
  else if (timeSeconds <= 240) score -= 10;
  else score -= 20;

  // Clear completion
  if (totalEnemies > 0 && enemiesDefeated >= totalEnemies) score += 10;

  // Combo bonus
  if (maxCombo >= 10) score += 10;
  else if (maxCombo >= 5) score += 5;

  let stars = 3;
  let title = 'Good';

  if (score >= 105) {
    stars = 5;
    title = 'Excellent performance';
  } else if (score >= 88) {
    stars = 4;
    title = 'Very good';
  } else if (score >= 68) {
    stars = 3;
    title = 'Good';
  } else if (score >= 48) {
    stars = 2;
    title = 'Needs improvement';
  } else {
    stars = 1;
    title = 'Poor';
  }

  return { stars, title };
};

export const VictoryModal: React.FC<VictoryModalProps> = ({
  levelTitle,
  levelId,
  coinsCollected,
  totalCoinsInLevel,
  enemiesDefeated,
  totalEnemies,
  timeSeconds,
  damageTaken,
  maxCombo,
  playerMaxHp,
  hasNextLevel = true,
  onNextLevel,
  onReplay,
  onMainMenu,
}) => {
  const saveData = SaveSystem.load();
  const isAllWorldsCompleted = SaveSystem.isAllWorldsCompleted(saveData);

  const [worldNum, levelNum] = levelId.split('-').map((n) => parseInt(n, 10) || 1);
  const isBossLevel = levelNum === 10 || Boolean(levelTitle?.toLowerCase().includes('boss'));
  const isWorldComplete = levelNum === 10;
  const isGrandVictory = isAllWorldsCompleted || (worldNum === 10 && levelNum === 10) || (!hasNextLevel && (levelTitle?.includes('10-10') || levelTitle?.includes('SOVEREIGN') || levelTitle?.includes('6-5')));
  const [showRewardModal, setShowRewardModal] = React.useState(false);

  const bossSpec = BOSS_SPECS[worldNum];

  // Check if a weapon stance is unlocked by this level
  const unlockedWeapon: WeaponDef | undefined = Object.values(WEAPONS).find(
    (w) => w.unlockedAtLevel === levelId
  );

  // Calculate rating from actual gameplay statistics
  const ratingData = calculateLevelRating(
    damageTaken,
    timeSeconds,
    enemiesDefeated,
    totalEnemies,
    maxCombo,
    playerMaxHp
  );

  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  const handleNextLevelClick = () => {
    audioEngine.playButtonClick();
    onNextLevel();
  };

  const handleReplayClick = () => {
    audioEngine.playButtonClick();
    onReplay();
  };

  const handleMainMenuClick = () => {
    audioEngine.playButtonClick();
    onMainMenu();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-40 flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto"
    >
      {showRewardModal ? (
        <div className="w-full flex items-center justify-center">
          <LegendaryRewardsModal
            saveData={saveData}
            onClose={() => setShowRewardModal(false)}
            onStartNewGamePlus={() => {
              SaveSystem.startNewGamePlus();
              onMainMenu();
            }}
          />
        </div>
      ) : isGrandVictory ? (
        /* GRAND FINAL ADVENTURE COMPLETE MODAL */
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-400 rounded-2xl p-4 sm:p-6 max-w-md w-full text-center shadow-[0_0_60px_rgba(245,158,11,0.5)] flex flex-col items-center relative overflow-hidden my-auto max-h-[92vh] overflow-y-auto"
        >
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 border-2 border-amber-300 rounded-2xl flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-bounce">
            <Crown className="w-9 h-9 stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-[10px] sm:text-xs font-black tracking-widest text-amber-300 uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" /> ALL 6 WORLDS CONQUERED!
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tracking-wider mb-1">
            GRAND VICTORY!
          </h2>
          <p className="text-xs text-amber-100/90 font-medium mb-3 max-w-xs leading-relaxed">
            You have defeated Grandmaster Marcus and restored peace across all 6 worlds!
          </p>

          {/* Actual Performance Stats */}
          <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-3 w-full mb-3 grid grid-cols-2 gap-2 text-left text-xs">
            <div className="flex items-center gap-2">
              <Skull className="w-4 h-4 text-red-400" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Boss Defeated</div>
                <div className="text-amber-200 font-black text-xs">GRANDMASTER MARCUS</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Coins Collected</div>
                <div className="text-amber-300 font-black text-xs">🪙 +{coinsCollected}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Time</div>
                <div className="text-sky-200 font-black text-xs">{formatTime(timeSeconds)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Damage Taken</div>
                <div className={`font-black text-xs ${damageTaken === 0 ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {damageTaken === 0 ? '0 HP (FLAWLESS!)' : `${damageTaken} HP`}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => {
                audioEngine.playButtonClick();
                setShowRewardModal(true);
              }}
              className="w-full min-h-[44px] py-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 text-slate-950 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 shadow-xl transition cursor-pointer"
            >
              <Award className="w-4 h-4 stroke-[3]" />
              VIEW UNLOCKED LEGENDARY REWARDS
            </button>

            <button
              onClick={handleReplayClick}
              className="w-full min-h-[44px] py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs uppercase rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              REPLAY LEVEL
            </button>

            <button
              onClick={handleMainMenuClick}
              className="w-full min-h-[44px] py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs uppercase rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Home className="w-4 h-4" />
              RETURN TO MAIN MENU
            </button>
          </div>
        </motion.div>
      ) : isBossLevel ? (
        /* BOSS DEFEATED MODAL */
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-slate-900 border-2 border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.4)] rounded-2xl p-4 sm:p-5 max-w-sm sm:max-w-md w-full text-center flex flex-col items-center my-auto max-h-[92vh] overflow-y-auto"
        >
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 border-2 border-amber-300 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-amber-500/30 animate-bounce">
            <Crown className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/50 rounded-full text-[10px] sm:text-xs font-black text-amber-300 uppercase tracking-widest mb-1.5">
            👑 BOSS DEFEATED!
          </div>

          {isWorldComplete && (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-[10px] font-black text-emerald-300 uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" /> 🏆 WORLD COMPLETE!
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-black text-amber-300 tracking-wider mb-0.5 uppercase">
            {bossSpec ? bossSpec.name : `WORLD ${worldNum} BOSS`}
          </h2>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-3">
            {bossSpec ? bossSpec.title : WORLD_NAMES[worldNum] || `Level ${levelId}`}
          </p>

          {/* 5-STAR PERFORMANCE RATING DISPLAY */}
          <div className="flex flex-col items-center mb-3 w-full bg-slate-950/70 border border-amber-500/30 rounded-xl py-2 px-3">
            <div className="flex gap-1.5 mb-1">
              {[1, 2, 3, 4, 5].map((starIdx) => {
                const isEarned = starIdx <= ratingData.stars;
                return (
                  <motion.div
                    key={starIdx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: starIdx * 0.08, duration: 0.2 }}
                  >
                    <Star
                      className={`w-6 h-6 sm:w-7 sm:h-7 ${
                        isEarned
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                          : 'text-slate-700 fill-slate-800'
                      }`}
                    />
                  </motion.div>
                );
              })}
            </div>
            <div className="text-[11px] font-black text-amber-300 uppercase tracking-wider">
              ⭐ Rating: {ratingData.stars}/5 ({ratingData.title})
            </div>
          </div>

          {/* ACTUAL STATS GRID */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 w-full mb-3 grid grid-cols-2 gap-2 text-left text-xs">
            <div className="flex items-center gap-2">
              <Skull className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Boss Name</div>
                <div className="text-amber-200 font-black text-[11px] truncate">
                  {bossSpec ? bossSpec.name : 'BOSS DEFEATED'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Coins Collected</div>
                <div className="text-amber-300 font-black text-xs">🪙 +{coinsCollected}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Time</div>
                <div className="text-sky-200 font-black text-xs">{formatTime(timeSeconds)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Damage Taken</div>
                <div className={`font-black text-xs ${damageTaken === 0 ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {damageTaken === 0 ? '0 HP (FLAWLESS!)' : `${damageTaken} HP`}
                </div>
              </div>
            </div>
          </div>

          {/* REWARDS EARNED BREAKDOWN */}
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-2.5 w-full mb-4 text-left text-xs">
            <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Gift className="w-3.5 h-3.5" /> REWARDS EARNED
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-200">
              <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                🪙 Coins: +{coinsCollected}
              </span>
              <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-500/30">
                ⭐ Rating: +{ratingData.stars} Stars
              </span>
              {isWorldComplete && worldNum < 6 && (
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Unlocked World {worldNum + 1}!
                </span>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-2 w-full">
            {hasNextLevel && (
              <button
                onClick={handleNextLevelClick}
                className="w-full min-h-[44px] py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black text-xs sm:text-sm uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 stroke-[3]" />
                {isWorldComplete ? 'NEXT WORLD' : 'NEXT LEVEL'}
              </button>
            )}

            <button
              onClick={handleReplayClick}
              className="w-full min-h-[44px] py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs uppercase rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              REPLAY LEVEL
            </button>

            <button
              onClick={handleMainMenuClick}
              className="w-full min-h-[44px] py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs uppercase rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Home className="w-4 h-4" />
              MAIN MENU
            </button>
          </div>
        </motion.div>
      ) : (
        /* STANDARD LEVEL COMPLETE MODAL */
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-slate-900 border-2 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.3)] rounded-2xl p-4 sm:p-5 max-w-sm sm:max-w-md w-full text-center flex flex-col items-center my-auto max-h-[92vh] overflow-y-auto"
        >
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl flex items-center justify-center mb-2">
            <Trophy className="w-7 h-7 fill-amber-400" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider mb-0.5">
            🏆 LEVEL COMPLETE!
          </h2>
          <p className="text-xs text-slate-300 font-medium mb-3">
            {levelTitle ? `${levelTitle} Conquered!` : `Level ${levelId} Conquered!`}
          </p>

          {/* 5-STAR PERFORMANCE RATING DISPLAY */}
          <div className="flex flex-col items-center mb-3 w-full bg-slate-950/60 border border-amber-500/20 rounded-xl py-2 px-3">
            <div className="flex gap-1.5 mb-1">
              {[1, 2, 3, 4, 5].map((starIdx) => {
                const isEarned = starIdx <= ratingData.stars;
                return (
                  <motion.div
                    key={starIdx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: starIdx * 0.08, duration: 0.2 }}
                  >
                    <Star
                      className={`w-6 h-6 sm:w-7 sm:h-7 ${
                        isEarned
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                          : 'text-slate-700 fill-slate-800'
                      }`}
                    />
                  </motion.div>
                );
              })}
            </div>
            <div className="text-[11px] font-black text-amber-300 uppercase tracking-wider">
              ⭐ Rating: {ratingData.stars}/5 ({ratingData.title})
            </div>
          </div>

          {/* ACTUAL STATS GRID */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 w-full mb-3 grid grid-cols-2 gap-2 text-left text-xs">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Enemies Defeated</div>
                <div className="text-amber-200 font-black text-xs">
                  {enemiesDefeated} / {totalEnemies || 50}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Coins Collected</div>
                <div className="text-amber-300 font-black text-xs">🪙 +{coinsCollected}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Time</div>
                <div className="text-sky-200 font-black text-xs">{formatTime(timeSeconds)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Damage Taken</div>
                <div className={`font-black text-xs ${damageTaken === 0 ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {damageTaken === 0 ? '0 HP (FLAWLESS!)' : `${damageTaken} HP`}
                </div>
              </div>
            </div>
          </div>

          {/* REWARDS EARNED BREAKDOWN */}
          <div className="bg-slate-950/80 border border-amber-500/20 rounded-xl p-2.5 w-full mb-4 text-left text-xs">
            <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Gift className="w-3.5 h-3.5" /> REWARDS EARNED
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-200">
              <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                🪙 Coins: +{coinsCollected}
              </span>
              <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-500/30">
                ⭐ Rating: +{ratingData.stars} Stars
              </span>
              {levelNum === 4 && (
                <span className="bg-rose-500/25 text-rose-300 px-2.5 py-0.5 rounded border border-rose-500/50 flex items-center gap-1 font-black animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> NEW BOSS UNLOCKED!
                </span>
              )}
              {unlockedWeapon && (
                <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30 flex items-center gap-1">
                  {unlockedWeapon.icon} Unlocked {unlockedWeapon.name}!
                </span>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-2 w-full">
            {hasNextLevel && (
              <button
                onClick={handleNextLevelClick}
                className={`w-full min-h-[44px] py-3 active:scale-95 font-black text-xs sm:text-sm uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                  levelNum === 4
                    ? 'bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 hover:from-rose-500 hover:to-amber-400 text-slate-950 border border-amber-300 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
                }`}
              >
                <ArrowRight className="w-4 h-4 stroke-[3]" />
                {levelNum === 4 ? 'CHALLENGE WORLD BOSS 👑' : 'NEXT LEVEL'}
              </button>
            )}

            <button
              onClick={handleReplayClick}
              className="w-full min-h-[44px] py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs uppercase rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              REPLAY LEVEL
            </button>

            <button
              onClick={handleMainMenuClick}
              className="w-full min-h-[44px] py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs uppercase rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Home className="w-4 h-4" />
              MAIN MENU
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
