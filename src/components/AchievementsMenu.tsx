import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Sword,
  Target,
  Skull,
  Crown,
  Coins,
  CheckCircle2,
  Flame,
  Zap,
  Star,
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  Gift,
  Check,
} from 'lucide-react';
import { GameScreen, SaveData, AchievementDef } from '../types/game';
import { ACHIEVEMENTS, isAchievementUnlocked, isAchievementClaimed, getUnclaimedCount } from '../data/achievements';
import { SaveSystem } from '../game/save/SaveSystem';
import { audioEngine } from '../game/audio/AudioEngine';

interface AchievementsMenuProps {
  saveData: SaveData;
  onNavigate: (screen: GameScreen) => void;
  onSaveUpdate: (updatedSave: SaveData) => void;
}

type CategoryFilter = 'ALL' | 'COMBAT' | 'PROGRESS' | 'COLLECTION' | 'MASTERY';

// Icon Map helper for Lucide icons
const iconMap: Record<string, React.ReactNode> = {
  Sword: <Sword className="w-5 h-5" />,
  Target: <Target className="w-5 h-5" />,
  Skull: <Skull className="w-5 h-5" />,
  Crown: <Crown className="w-5 h-5" />,
  Coins: <Coins className="w-5 h-5" />,
  Trophy: <Trophy className="w-5 h-5" />,
  CheckCircle2: <CheckCircle2 className="w-5 h-5" />,
  Flame: <Flame className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  Award: <Award className="w-5 h-5" />,
  Star: <Star className="w-5 h-5" />,
  ShieldAlert: <ShieldAlert className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
};

export const AchievementsMenu: React.FC<AchievementsMenuProps> = ({
  saveData,
  onNavigate,
  onSaveUpdate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');

  const categories: CategoryFilter[] = ['ALL', 'COMBAT', 'PROGRESS', 'COLLECTION', 'MASTERY'];

  const filteredAchievements = ACHIEVEMENTS.filter((ach) =>
    selectedCategory === 'ALL' ? true : ach.category === selectedCategory
  );

  const unlockedCount = ACHIEVEMENTS.filter((ach) => isAchievementUnlocked(ach, saveData)).length;
  const totalCount = ACHIEVEMENTS.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);
  const unclaimedCount = getUnclaimedCount(saveData);

  const handleClaim = (achId: string) => {
    audioEngine.playCoinPickup();
    const res = SaveSystem.claimAchievement(achId);
    if (res.success) {
      onSaveUpdate(res.data);
    }
  };

  const handleClaimAll = () => {
    audioEngine.playCoinPickup();
    const res = SaveSystem.claimAllAvailableAchievements();
    if (res.claimedCount > 0) {
      onSaveUpdate(res.data);
    }
  };

  const handleBack = () => {
    audioEngine.playButtonClick();
    onNavigate('MAIN_MENU');
  };

  const getCategoryColor = (category: AchievementDef['category']) => {
    switch (category) {
      case 'COMBAT':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'PROGRESS':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      case 'COLLECTION':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'MASTERY':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="relative w-full h-full min-h-[450px] bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 flex flex-col p-4 sm:p-6 select-none overflow-hidden text-slate-100">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-4 z-10 shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 text-xs font-bold transition shadow-md active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </button>

        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400 fill-amber-400/20" />
          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-300 to-emerald-300 uppercase tracking-wide">
            ACHIEVEMENTS
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 rounded-full px-3.5 py-1 shadow-lg text-xs font-bold">
          <span className="text-amber-400">🪙</span>
          <span className="text-amber-300 text-sm font-black">{saveData.coins}</span>
        </div>
      </div>

      {/* Progress & Claim All Banner */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 mb-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 z-10 shrink-0">
        <div className="w-full sm:w-2/3 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs font-black">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-sky-400" />
              MILESTONE PROGRESS
            </span>
            <span className="text-amber-400">
              {unlockedCount} / {totalCount} ({completionPercentage}%)
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {unclaimedCount > 0 ? (
          <button
            onClick={handleClaimAll}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 active:scale-95 text-slate-950 text-xs font-black tracking-wider uppercase rounded-xl border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition animate-pulse shrink-0"
          >
            <Gift className="w-4 h-4" />
            <span>CLAIM ALL ({unclaimedCount})</span>
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Check className="w-4 h-4 text-emerald-400" />
            All Unlocked Rewards Claimed
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 sm:gap-2 mb-3 overflow-x-auto pb-1 z-10 shrink-0 no-scrollbar">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                audioEngine.playButtonClick();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase border transition shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Achievement Cards Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-3 z-10 custom-scrollbar pb-2">
        {filteredAchievements.map((ach) => {
          const unlocked = isAchievementUnlocked(ach, saveData);
          const claimed = isAchievementClaimed(ach.id, saveData);
          const currentVal = ach.getCurrentValue(saveData);
          const progressRatio = Math.min(100, Math.floor((currentVal / ach.targetValue) * 100));

          return (
            <div
              key={ach.id}
              className={`relative flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 ${
                claimed
                  ? 'bg-slate-900/40 border-slate-800/80 opacity-80'
                  : unlocked
                  ? 'bg-slate-900/90 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                  : 'bg-slate-950/60 border-slate-800/60 opacity-90'
              }`}
            >
              {/* Left Side: Icon & Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`p-2.5 rounded-xl border shrink-0 ${
                    unlocked
                      ? getCategoryColor(ach.category)
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}
                >
                  {iconMap[ach.icon] || <Trophy className="w-5 h-5" />}
                </div>

                <div className="flex flex-col min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-black text-slate-100 truncate">{ach.title}</span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border uppercase ${getCategoryColor(
                        ach.category
                      )}`}
                    >
                      {ach.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug mb-1.5">
                    {ach.description}
                  </p>

                  {/* Progress Bar & Numerical Counter */}
                  <div className="flex items-center gap-2 w-full max-w-[200px]">
                    <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          unlocked ? 'bg-amber-400' : 'bg-sky-500/60'
                        }`}
                        style={{ width: `${progressRatio}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                      {currentVal} / {ach.targetValue}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Claim / Claimed / Progress Button */}
              <div className="shrink-0 pl-2 flex items-center">
                {claimed ? (
                  <div className="flex items-center gap-1 text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CLAIMED</span>
                  </div>
                ) : unlocked ? (
                  <button
                    onClick={() => handleClaim(ach.id)}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 text-xs font-black uppercase rounded-xl border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] flex items-center gap-1 transition animate-bounce"
                  >
                    <span>+{ach.rewardCoins}</span>
                    <span>🪙</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-xl">
                    <span>+{ach.rewardCoins}</span>
                    <span>🪙</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
