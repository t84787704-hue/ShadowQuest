export class DebugManager {
  private static godMode: boolean = false;
  private static debugMenuOpen: boolean = false;
  private static tapCount: number = 0;
  private static lastTapTime: number = 0;

  public static isGodMode(): boolean {
    return this.godMode;
  }

  public static setGodMode(enabled: boolean): boolean {
    this.godMode = enabled;
    return this.godMode;
  }

  public static toggleGodMode(): boolean {
    this.godMode = !this.godMode;
    return this.godMode;
  }

  public static isDebugMenuOpen(): boolean {
    return this.debugMenuOpen;
  }

  public static setDebugMenuOpen(open: boolean): void {
    this.debugMenuOpen = open;
  }

  public static registerVersionTap(): { unlocked: boolean; currentTaps: number } {
    const now = Date.now();
    if (now - this.lastTapTime > 3000) {
      this.tapCount = 1;
    } else {
      this.tapCount += 1;
    }
    this.lastTapTime = now;

    if (this.tapCount >= 7) {
      this.tapCount = 0;
      this.debugMenuOpen = true;
      return { unlocked: true, currentTaps: 7 };
    }
    return { unlocked: false, currentTaps: this.tapCount };
  }

  public static getTapCount(): number {
    return this.tapCount;
  }
}
