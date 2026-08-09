export class Camera {
  public x: number = 0;
  public y: number = 0;
  public viewportWidth: number;
  public viewportHeight: number;
  private shakeTimer: number = 0;
  private shakeIntensity: number = 0;

  constructor(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  public follow(targetX: number, targetY: number, levelWidth: number, levelHeight: number) {
    // Center camera on target horizontally
    let desiredX = targetX - this.viewportWidth * 0.35; // Slightly offset ahead of player
    let desiredY = targetY - this.viewportHeight * 0.5;

    // Clamp camera within level bounds
    desiredX = Math.max(0, Math.min(desiredX, levelWidth - this.viewportWidth));
    desiredY = Math.max(0, Math.min(desiredY, levelHeight - this.viewportHeight));

    // Smooth lerp camera movement
    this.x += (desiredX - this.x) * 0.12;
    this.y += (desiredY - this.y) * 0.12;

    if (this.shakeTimer > 0) {
      this.shakeTimer -= 0.016;
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
      }
    }
  }

  public addShake(durationSec: number = 0.2, intensity: number = 6) {
    this.shakeTimer = durationSec;
    this.shakeIntensity = intensity;
  }

  public getOffsetX(): number {
    if (this.shakeTimer > 0) {
      return this.x + (Math.random() * 2 - 1) * this.shakeIntensity;
    }
    return this.x;
  }

  public getOffsetY(): number {
    if (this.shakeTimer > 0) {
      return this.y + (Math.random() * 2 - 1) * this.shakeIntensity;
    }
    return this.y;
  }
}
