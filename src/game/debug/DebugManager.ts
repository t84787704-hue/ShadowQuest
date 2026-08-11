export class DebugManager {
  private static unlocked: boolean = false;
  private static tapCount: number = 0;
  private static lastTapTime: number = 0;

  private static godMode: boolean = false;
  private static enemyHpOverride: number | null = null;
  private static enemyDamageOverride: number | null = null;

  public static isUnlocked(): boolean {
    // In dev environment or if manually unlocked by developer tap code
    const isDev = Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV);
    if (isDev) {
      return true;
    }
    return this.unlocked;
  }

  public static setUnlocked(unlocked: boolean) {
    this.unlocked = unlocked;
  }

  public static registerVersionTap(): { unlocked: boolean; currentTaps: number } {
    const now = Date.now();
    if (now - this.lastTapTime > 2500) {
      this.tapCount = 0;
    }
    this.lastTapTime = now;
    this.tapCount++;

    if (this.tapCount >= 7) {
      this.unlocked = true;
      this.tapCount = 0;
      return { unlocked: true, currentTaps: 7 };
    }
    return { unlocked: this.isUnlocked(), currentTaps: this.tapCount };
  }

  public static getTapCount(): number {
    return this.tapCount;
  }

  public static toggleGodMode(): boolean {
    this.godMode = !this.godMode;
    return this.godMode;
  }

  public static isGodMode(): boolean {
    return this.godMode;
  }

  public static setEnemyHpOverride(hp: number | null) {
    this.enemyHpOverride = hp;
  }

  public static getEnemyHpOverride(): number | null {
    return this.enemyHpOverride;
  }

  public static setEnemyDamageOverride(dmg: number | null) {
    this.enemyDamageOverride = dmg;
  }

  public static getEnemyDamageOverride(): number | null {
    return this.enemyDamageOverride;
  }
}
