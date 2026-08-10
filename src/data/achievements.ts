import { AchievementDef, SaveData } from '../types/game';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Defeat your first enemy in combat.',
    icon: 'Sword',
    category: 'COMBAT',
    targetValue: 1,
    rewardCoins: 50,
    getCurrentValue: (data: SaveData) => data.stats?.enemiesDefeated || 0,
  },
  {
    id: 'defeat_10_enemies',
    title: 'Goblin Hunter',
    description: 'Defeat 10 enemies in total.',
    icon: 'Target',
    category: 'COMBAT',
    targetValue: 10,
    rewardCoins: 100,
    getCurrentValue: (data: SaveData) => data.stats?.enemiesDefeated || 0,
  },
  {
    id: 'defeat_100_enemies',
    title: 'Monster Slayer',
    description: 'Defeat 100 enemies in total.',
    icon: 'Skull',
    category: 'COMBAT',
    targetValue: 100,
    rewardCoins: 300,
    getCurrentValue: (data: SaveData) => data.stats?.enemiesDefeated || 0,
  },
  {
    id: 'boss_buster',
    title: 'Boss Buster',
    description: 'Defeat your first World Boss.',
    icon: 'Crown',
    category: 'COMBAT',
    targetValue: 1,
    rewardCoins: 250,
    getCurrentValue: (data: SaveData) => data.stats?.bossesDefeated || 0,
  },
  {
    id: 'coin_collector_100',
    title: 'Pocketful of Gold',
    description: 'Collect 100 total coins.',
    icon: 'Coins',
    category: 'COLLECTION',
    targetValue: 100,
    rewardCoins: 100,
    getCurrentValue: (data: SaveData) => data.stats?.coinsCollectedLifetime || 0,
  },
  {
    id: 'coin_collector_500',
    title: 'Wealthy Adventurer',
    description: 'Collect 500 total coins.',
    icon: 'Coins',
    category: 'COLLECTION',
    targetValue: 500,
    rewardCoins: 250,
    getCurrentValue: (data: SaveData) => data.stats?.coinsCollectedLifetime || 0,
  },
  {
    id: 'coin_collector_1000',
    title: 'Treasure Hoarder',
    description: 'Collect 1000 total coins.',
    icon: 'Trophy',
    category: 'COLLECTION',
    targetValue: 1000,
    rewardCoins: 500,
    getCurrentValue: (data: SaveData) => data.stats?.coinsCollectedLifetime || 0,
  },
  {
    id: 'completed_level_1',
    title: 'First Step',
    description: 'Complete Level 1-1.',
    icon: 'CheckCircle2',
    category: 'PROGRESS',
    targetValue: 1,
    rewardCoins: 50,
    getCurrentValue: (data: SaveData) => (data.completedLevels.includes('1-1') ? 1 : 0),
  },
  {
    id: 'world_1_cleared',
    title: 'World 1 Champion',
    description: 'Complete All Levels in World 1.',
    icon: 'Flame',
    category: 'PROGRESS',
    targetValue: 5,
    rewardCoins: 250,
    getCurrentValue: (data: SaveData) =>
      ['1-1', '1-2', '1-3', '1-4', '1-5'].filter((id) => data.completedLevels.includes(id)).length,
  },
  {
    id: 'world_3_cleared',
    title: 'Sky Realm Conqueror',
    description: 'Complete All Levels in World 3.',
    icon: 'Zap',
    category: 'PROGRESS',
    targetValue: 5,
    rewardCoins: 400,
    getCurrentValue: (data: SaveData) =>
      ['3-1', '3-2', '3-3', '3-4', '3-5'].filter((id) => data.completedLevels.includes(id)).length,
  },
  {
    id: 'world_6_cleared',
    title: 'Grand Savior',
    description: 'Complete All Levels in World 6 and finish the journey.',
    icon: 'Award',
    category: 'PROGRESS',
    targetValue: 5,
    rewardCoins: 800,
    getCurrentValue: (data: SaveData) =>
      ['6-1', '6-2', '6-3', '6-4', '6-5'].filter((id) => data.completedLevels.includes(id)).length,
  },
  {
    id: 'star_collector_15',
    title: 'Star Collector',
    description: 'Earn 15 total Stars across all levels.',
    icon: 'Star',
    category: 'MASTERY',
    targetValue: 15,
    rewardCoins: 200,
    getCurrentValue: (data: SaveData) =>
      Object.values(data.levelStars || {}).reduce((sum, s) => sum + s, 0),
  },
  {
    id: 'upgrade_novice',
    title: 'Powered Up',
    description: 'Purchase 3 Upgrades in the shop.',
    icon: 'ShieldAlert',
    category: 'MASTERY',
    targetValue: 3,
    rewardCoins: 150,
    getCurrentValue: (data: SaveData) =>
      Object.values(data.upgrades || {}).reduce((sum, lvl) => sum + (typeof lvl === 'number' ? lvl : 0), 0),
  },
  {
    id: 'upgrade_master',
    title: 'Maximum Potential',
    description: 'Purchase 10 Upgrades in total.',
    icon: 'Sparkles',
    category: 'MASTERY',
    targetValue: 10,
    rewardCoins: 350,
    getCurrentValue: (data: SaveData) =>
      Object.values(data.upgrades || {}).reduce((sum, lvl) => sum + (typeof lvl === 'number' ? lvl : 0), 0),
  },
];

export function isAchievementUnlocked(achievement: AchievementDef, saveData: SaveData): boolean {
  return achievement.getCurrentValue(saveData) >= achievement.targetValue;
}

export function isAchievementClaimed(achievementId: string, saveData: SaveData): boolean {
  return (saveData.claimedAchievements || []).includes(achievementId);
}

export function getUnclaimedCount(saveData: SaveData): number {
  return ACHIEVEMENTS.filter(
    (ach) => isAchievementUnlocked(ach, saveData) && !isAchievementClaimed(ach.id, saveData)
  ).length;
}
