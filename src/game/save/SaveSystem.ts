import { SaveData } from '../../types/game';
import { getHighestUnlockedWeapon, WEAPONS, WeaponDef } from '../weapons/WeaponData';
import { ACHIEVEMENTS, isAchievementUnlocked } from '../../data/achievements';

const SAVE_KEY = 'BLAZE_ADVENTURE_SAVE_V1';

const DEFAULT_SAVE_DATA: SaveData = {
  coins: 0,
  currentWorld: 1,
  currentLevel: 1,
  completedLevels: [],
  unlockedWorlds: [1],
  hasSeenStory: false,
  levelStars: {},
  equippedWeaponId: 'basic_sword',
  stats: {
    enemiesDefeated: 0,
    bossesDefeated: 0,
    coinsCollectedLifetime: 0,
    upgradesPurchased: 0,
  },
  claimedAchievements: [],
  upgrades: {
    maxHealth: 0,
    attackPower: 0,
    coinMagnet: 0,
    moveSpeed: 0,
  },
  settings: {
    soundFxEnabled: true,
    musicEnabled: true,
    touchControlsOpacity: 0.85,
    musicVolume: 0.7,
    sfxVolume: 0.8,
  },
};

export class SaveSystem {
  public static load(): SaveData {
    try {
      const dataStr = localStorage.getItem(SAVE_KEY);
      if (!dataStr) {
        return { ...DEFAULT_SAVE_DATA };
      }
      const parsed = JSON.parse(dataStr);

      const loadedUpgrades = { ...DEFAULT_SAVE_DATA.upgrades, ...(parsed.upgrades || {}) };
      const totalUpgradesCount = Object.values(loadedUpgrades).reduce(
        (sum: number, lvl: number) => sum + (typeof lvl === 'number' ? lvl : 0),
        0
      );

      const completedLevelsList: string[] = parsed.completedLevels || [];
      const unlockedSet = new Set<number>(parsed.unlockedWorlds || [1]);
      unlockedSet.add(1); // World 1 is always unlocked

      for (let w = 1; w < 10; w++) {
        if (completedLevelsList.includes(`${w}-10`) || completedLevelsList.includes(`${w}-5`)) {
          unlockedSet.add(w + 1);
        }
      }

      const unlockedWorldsList = Array.from(unlockedSet).sort((a: number, b: number) => a - b);

      const loadedData: SaveData = {
        ...DEFAULT_SAVE_DATA,
        ...parsed,
        unlockedWorlds: unlockedWorldsList,
        completedLevels: completedLevelsList,
        equippedWeaponId: parsed.equippedWeaponId || 'basic_sword',
        claimedAchievements: parsed.claimedAchievements || [],
        stats: {
          enemiesDefeated: parsed.stats?.enemiesDefeated || 0,
          bossesDefeated: parsed.stats?.bossesDefeated || 0,
          coinsCollectedLifetime: parsed.stats?.coinsCollectedLifetime || parsed.coins || 0,
          upgradesPurchased: parsed.stats?.upgradesPurchased ?? totalUpgradesCount,
        },
        upgrades: loadedUpgrades,
        settings: { ...DEFAULT_SAVE_DATA.settings, ...(parsed.settings || {}) },
      };

      // Ensure equipped weapon is at least the highest unlocked weapon
      const highest = getHighestUnlockedWeapon(loadedData);
      const currentEquipped = WEAPONS[loadedData.equippedWeaponId || 'basic_sword'] || WEAPONS.basic_sword;
      if (highest.baseDamage > currentEquipped.baseDamage) {
        loadedData.equippedWeaponId = highest.id;
        this.save(loadedData);
      }

      return loadedData;
    } catch (e) {
      console.warn('Failed to load save data, using default:', e);
      return { ...DEFAULT_SAVE_DATA };
    }
  }

  public static getEquippedWeapon(data: SaveData, currentLevelId?: string): WeaponDef {
    const highest = getHighestUnlockedWeapon(data, currentLevelId);
    const equipped = WEAPONS[data.equippedWeaponId || 'basic_sword'] || WEAPONS.basic_sword;

    if (highest.baseDamage > equipped.baseDamage) {
      data.equippedWeaponId = highest.id;
      this.save(data);
      return highest;
    }
    return equipped;
  }

  public static save(data: SaveData): boolean {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save data offline:', e);
      return false;
    }
  }

  public static addCoins(amount: number): SaveData {
    const data = this.load();
    data.coins += amount;
    data.stats.coinsCollectedLifetime += amount;
    this.save(data);
    return data;
  }

  public static recordEnemyDefeated(isBoss: boolean = false): SaveData {
    const data = this.load();
    data.stats.enemiesDefeated += 1;
    if (isBoss) {
      data.stats.bossesDefeated += 1;
    }
    this.save(data);
    return data;
  }

  public static recordCoinsCollected(amount: number): SaveData {
    const data = this.load();
    data.stats.coinsCollectedLifetime += amount;
    this.save(data);
    return data;
  }

  public static claimAchievement(achievementId: string): { success: boolean; rewardCoins: number; data: SaveData } {
    const data = this.load();
    const ach = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!ach) return { success: false, rewardCoins: 0, data };

    if (isAchievementUnlocked(ach, data) && !data.claimedAchievements.includes(achievementId)) {
      data.claimedAchievements.push(achievementId);
      data.coins += ach.rewardCoins;
      this.save(data);
      return { success: true, rewardCoins: ach.rewardCoins, data };
    }
    return { success: false, rewardCoins: 0, data };
  }

  public static claimAllAvailableAchievements(): { claimedCount: number; totalRewards: number; data: SaveData } {
    let data = this.load();
    let claimedCount = 0;
    let totalRewards = 0;

    for (const ach of ACHIEVEMENTS) {
      if (isAchievementUnlocked(ach, data) && !data.claimedAchievements.includes(ach.id)) {
        data.claimedAchievements.push(ach.id);
        data.coins += ach.rewardCoins;
        totalRewards += ach.rewardCoins;
        claimedCount++;
      }
    }

    if (claimedCount > 0) {
      this.save(data);
    }
    return { claimedCount, totalRewards, data };
  }

  public static isSecretRoomDiscovered(levelId: string, secretRoomId: number): boolean {
    const data = this.load();
    const discovered = data.discoveredSecretRooms?.[levelId] || [];
    return discovered.includes(secretRoomId);
  }

  public static recordSecretRoomDiscovered(levelId: string, secretRoomId: number): SaveData {
    const data = this.load();
    if (!data.discoveredSecretRooms) {
      data.discoveredSecretRooms = {};
    }
    if (!data.discoveredSecretRooms[levelId]) {
      data.discoveredSecretRooms[levelId] = [];
    }
    if (!data.discoveredSecretRooms[levelId].includes(secretRoomId)) {
      data.discoveredSecretRooms[levelId].push(secretRoomId);
      data.stats.secretRoomsDiscoveredLifetime = (data.stats.secretRoomsDiscoveredLifetime || 0) + 1;
      this.save(data);
    }
    return data;
  }

  public static claimSecretRoomReward(
    levelId: string,
    secretRoomId: number,
    rewardType: string
  ): { coinGain: number; maxHpGain: number; attackGain: number; data: SaveData } {
    const data = this.recordSecretRoomDiscovered(levelId, secretRoomId);
    if (!data.statBonuses) {
      data.statBonuses = { maxHpBonus: 0, attackBonus: 0, speedBonus: 0 };
    }

    let coinGain = 0;
    let maxHpGain = 0;
    let attackGain = 0;

    switch (rewardType) {
      case 'COIN_CACHE':
        coinGain = 50;
        break;
      case 'HP_PERMANENT':
        maxHpGain = 5;
        coinGain = 20;
        break;
      case 'ATTACK_UPGRADE':
        attackGain = 2;
        coinGain = 20;
        break;
      case 'ANCIENT_RELIC':
        coinGain = 100;
        maxHpGain = 5;
        break;
      case 'RARE_WEAPON':
        coinGain = 75;
        attackGain = 2;
        break;
    }

    if (coinGain > 0) {
      data.coins += coinGain;
      data.stats.coinsCollectedLifetime += coinGain;
    }
    if (maxHpGain > 0) {
      data.statBonuses.maxHpBonus = (data.statBonuses.maxHpBonus || 0) + maxHpGain;
    }
    if (attackGain > 0) {
      data.statBonuses.attackBonus = (data.statBonuses.attackBonus || 0) + attackGain;
    }

    this.save(data);
    return { coinGain, maxHpGain, attackGain, data };
  }

  public static isWorldCompleted(data: SaveData, worldNum: number): boolean {
    const requiredLevels = Array.from({ length: 10 }, (_, i) => `${worldNum}-${i + 1}`);
    const completed = data.completedLevels || [];
    return requiredLevels.every((lvl) => completed.includes(lvl));
  }

  public static isWorldUnlocked(data: SaveData, worldNum: number): boolean {
    if (worldNum === 1) return true;
    return Boolean(data.unlockedWorlds?.includes(worldNum));
  }

  public static isAllWorldsCompleted(data: SaveData): boolean {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].every((w) => this.isWorldCompleted(data, w));
  }

  public static completeLevel(levelId: string, stars: number, coinsEarned: number): SaveData {
    const data = this.load();
    data.coins += coinsEarned;
    data.stats.coinsCollectedLifetime += coinsEarned;
    data.quickSave = null; // Clear active quick save on victory
    if (!data.completedLevels.includes(levelId)) {
      data.completedLevels.push(levelId);
    }
    const currentStar = data.levelStars[levelId] || 0;
    if (stars > currentStar) {
      data.levelStars[levelId] = stars;
    }

    // Determine next level to unlock
    const [worldStr, levelStr] = levelId.split('-');
    const w = parseInt(worldStr, 10) || 1;
    const l = parseInt(levelStr, 10) || 1;

    if (l < 10) {
      // Unlocks next level in same world (e.g. 1-1 -> 1-2)
      data.currentWorld = w;
      data.currentLevel = l + 1;
    } else {
      // World boss cleared! Unlock next world
      const nextWorld = w + 1;
      if (nextWorld <= 10) {
        if (!data.unlockedWorlds.includes(nextWorld)) {
          data.unlockedWorlds.push(nextWorld);
        }
        data.currentWorld = nextWorld;
        data.currentLevel = 1;
      }
    }

    // Check TRUE GAME COMPLETION: All required worlds 1-10 completed
    if (this.isAllWorldsCompleted(data) || (w === 10 && l === 10)) {
      if (!data.gameCompleted) {
        data.gameCompleted = true;
        data.legendaryTitleUnlocked = true;
        data.legendaryAuraUnlocked = true;
        data.legendaryAbilityUnlocked = true;
        data.newGamePlusUnlocked = true;
        data.coins += 1000; // Substantial completion bonus
        data.stats.coinsCollectedLifetime += 1000;
      }
    }

    // Auto-equip newly unlocked weapon if applicable
    const highest = getHighestUnlockedWeapon(data, `${data.currentWorld}-${data.currentLevel}`);
    if (highest.baseDamage > (WEAPONS[data.equippedWeaponId || 'basic_sword']?.baseDamage || 0)) {
      data.equippedWeaponId = highest.id;
    }

    this.save(data);
    return data;
  }

  public static startNewGamePlus(): SaveData {
    const data = this.load();
    data.newGamePlusLevel = (data.newGamePlusLevel || 0) + 1;
    data.currentWorld = 1;
    data.currentLevel = 1;
    data.completedLevels = [];
    data.unlockedWorlds = [1];
    data.levelStars = {};
    data.quickSave = null;
    data.gameCompleted = true;
    data.legendaryTitleUnlocked = true;
    data.legendaryAuraUnlocked = true;
    data.legendaryAbilityUnlocked = true;
    data.newGamePlusUnlocked = true;

    this.save(data);
    return data;
  }

  public static getCampaignProgress(data: SaveData) {
    const worldStatus: Record<number, boolean> = {};
    let completedWorldsCount = 0;
    for (let w = 1; w <= 10; w++) {
      const isDone = this.isWorldCompleted(data, w);
      worldStatus[w] = isDone;
      if (isDone) completedWorldsCount++;
    }

    let totalSecretRoomsFound = 0;
    if (data.discoveredSecretRooms) {
      for (const rooms of Object.values(data.discoveredSecretRooms)) {
        totalSecretRoomsFound += rooms.length;
      }
    }

    return {
      completedWorldsCount,
      totalWorlds: 10,
      completedLevelsCount: data.completedLevels?.length || 0,
      totalLevels: 100,
      worldStatus,
      discoveredSecretRooms: totalSecretRoomsFound,
      totalSecretRooms: 20,
      isAllWorldsCompleted: completedWorldsCount === 10,
      gameCompleted: Boolean(data.gameCompleted),
      newGamePlusLevel: data.newGamePlusLevel || 0,
    };
  }

  public static getLatestUnlockedLevel(): string {
    const data = this.load();
    // Default to 1-1
    if (data.completedLevels.length === 0) {
      return '1-1';
    }

    // Find highest completed level
    let maxWorld = 1;
    let maxLevel = 1;

    for (const lvlId of data.completedLevels) {
      const [wStr, lStr] = lvlId.split('-');
      const w = parseInt(wStr, 10) || 1;
      const l = parseInt(lStr, 10) || 1;

      if (w > maxWorld || (w === maxWorld && l > maxLevel)) {
        maxWorld = w;
        maxLevel = l;
      }
    }

    // Next level to play
    if (maxLevel < 10) {
      return `${maxWorld}-${maxLevel + 1}`;
    } else if (maxWorld < 10) {
      return `${maxWorld + 1}-1`;
    }

    return '10-10';
  }

  public static purchaseUpgrade(upgradeKey: keyof SaveData['upgrades'], cost: number): { success: boolean; data: SaveData } {
    const data = this.load();
    if (data.coins >= cost && (data.upgrades[upgradeKey] || 0) < 5) {
      data.coins -= cost;
      data.upgrades[upgradeKey] = (data.upgrades[upgradeKey] || 0) + 1;
      data.stats.upgradesPurchased += 1;
      this.save(data);
      return { success: true, data };
    }
    return { success: false, data };
  }

  public static markStorySeen(): SaveData {
    const data = this.load();
    data.hasSeenStory = true;
    this.save(data);
    return data;
  }

  public static saveQuickSave(quickSave: import('../../types/game').QuickSaveData): SaveData {
    const data = this.load();
    data.quickSave = quickSave;
    data.coins = quickSave.startingCoins + quickSave.collectedCoinsCount;
    this.save(data);
    return data;
  }

  public static clearQuickSave(): SaveData {
    const data = this.load();
    data.quickSave = null;
    this.save(data);
    return data;
  }

  public static resetSaveData(): SaveData {
    const fresh = { ...DEFAULT_SAVE_DATA };
    this.save(fresh);
    return fresh;
  }
}

