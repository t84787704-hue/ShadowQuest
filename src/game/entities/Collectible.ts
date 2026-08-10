import { Entity } from './Entity';
import { Player } from './Player';
import { ParticleSystem } from '../core/ParticleSystem';
import { audioEngine } from '../audio/AudioEngine';

export class Coin extends Entity {
  public value: number = 1;
  public bobTime: number = Math.random() * Math.PI * 2;
  public originalY: number;
  public isCollected: boolean = false;

  constructor(x: number, y: number, value: number = 1) {
    super(x, y, 20, 20);
    this.originalY = y;
    this.value = value;
  }

  public update(dt: number, player: Player, particles: ParticleSystem): boolean {
    if (this.isCollected) return false;

    // Gentle floating bobbing animation
    this.bobTime += dt * 4;
    this.y = this.originalY + Math.sin(this.bobTime) * 4;

    // Check magnet radius or direct touch
    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Magnetic pull if close
    if (dist < 60) {
      this.x += (dx / dist) * 6;
      this.y += (dy / dist) * 6;
    }

    if (this.intersects(player)) {
      this.isCollected = true;
      audioEngine.playCoinPickup();
      particles.createCoinSparkle(this.x + 10, this.y + 10);
      particles.createFloatingText(this.x + 10, this.y, `+${this.value}`, '#fde047', 15);
      return true; // Collected!
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    if (this.isCollected) return;

    const px = Math.round(this.x - offsetX);
    const py = Math.round(this.y - offsetY);

    const spinWidth = Math.abs(Math.cos(this.bobTime * 1.5)) * 9 + 2;

    ctx.save();
    ctx.translate(px + 10, py + 10);

    // 1. Soft Outer Gold Glow Aura
    ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // 2. Coin Outer Gold Rim
    ctx.fillStyle = '#d97706'; // Amber Gold
    ctx.beginPath();
    ctx.ellipse(0, 0, spinWidth, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Inner Shiny Gold Surface
    ctx.fillStyle = '#fde047'; // Bright Yellow
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(1, spinWidth - 2.5), 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Center Gem / Crest Highlight
    if (spinWidth > 4) {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-1, -3, 2, 6);
      ctx.fillStyle = '#ffffff'; // Sparkle glint
      ctx.fillRect(-1, -2, 1.5, 2);
    }

    ctx.restore();
  }
}

export class HealthPickup extends Entity {
  public healAmount: number = 25;
  public bobTime: number = Math.random() * Math.PI * 2;
  public originalY: number;
  public isCollected: boolean = false;

  constructor(x: number, y: number, healAmount: number = 25) {
    super(x, y, 22, 22);
    this.originalY = y;
    this.healAmount = healAmount;
  }

  public update(dt: number, player: Player, particles: ParticleSystem): boolean {
    if (this.isCollected) return false;

    this.bobTime += dt * 3.5;
    this.y = this.originalY + Math.sin(this.bobTime) * 3.5;

    if (this.intersects(player)) {
      if (player.stats.currentHp < player.stats.maxHp) {
        this.isCollected = true;
        player.stats.currentHp = Math.min(player.stats.maxHp, player.stats.currentHp + this.healAmount);
        audioEngine.playHeal();
        particles.createCoinSparkle(this.x + 11, this.y + 11);
        particles.createFloatingText(this.x + 11, this.y, `+${this.healAmount} HP`, '#4ade80', 16);
        return true;
      }
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    if (this.isCollected) return;

    const px = Math.round(this.x - offsetX);
    const py = Math.round(this.y - offsetY);

    ctx.save();
    ctx.translate(px + 11, py + 11);

    // Glowing Heart Aura
    ctx.fillStyle = 'rgba(74, 222, 128, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    // Red Heart Shape
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(-9, 0, -9, -7, 0, -5);
    ctx.bezierCurveTo(9, -7, 9, 0, 0, 5);
    ctx.fill();

    // White Health Cross
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1.5, -4, 3, 7);
    ctx.fillRect(-3.5, -2, 7, 3);

    ctx.restore();
  }
}

