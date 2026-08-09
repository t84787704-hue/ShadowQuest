import { SaveData } from '../../types/game';

const SAVE_KEY = 'BLAZE_ADVENTURE_SAVE_V1';

const DEFAULT_SAVE_DATA: SaveData = {
  coins: 0,
  currentWorld: 1,
  currentLevel: 1,
  completedLevels: [],
  levelStars: {},
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
      return {
        ...DEFAULT_SAVE_DATA,
        ...parsed,
        upgrades: { ...DEFAULT_SAVE_DATA.upgrades, ...(parsed.upgrades || {}) },
        settings: { ...DEFAULT_SAVE_DATA.settings, ...(parsed.settings || {}) },
      };
    } catch (e) {
      console.warn('Failed to load save data, using default:', e);
      return { ...DEFAULT_SAVE_DATA };
    }
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
    this.save(data);
    return data;
  }

  public static completeLevel(levelId: string, stars: number, coinsEarned: number): SaveData {
    const data = this.load();
    data.coins += coinsEarned;
    if (!data.completedLevels.includes(levelId)) {
      data.completedLevels.push(levelId);
    }
    const currentStar = data.levelStars[levelId] || 0;
    if (stars > currentStar) {
      data.levelStars[levelId] = stars;
    }
    this.save(data);
    return data;
  }

  public static purchaseUpgrade(upgradeKey: keyof SaveData['upgrades'], cost: number): { success: boolean; data: SaveData } {
    const data = this.load();
    if (data.coins >= cost && (data.upgrades[upgradeKey] || 0) < 5) {
      data.coins -= cost;
      data.upgrades[upgradeKey] = (data.upgrades[upgradeKey] || 0) + 1;
      this.save(data);
      return { success: true, data };
    }
    return { success: false, data };
  }

  public static resetSaveData(): SaveData {
    const fresh = { ...DEFAULT_SAVE_DATA };
    this.save(fresh);
    return fresh;
  }
}
