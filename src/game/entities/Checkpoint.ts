import { Entity } from './Entity';
import { Player } from './Player';
import { ParticleSystem } from '../core/ParticleSystem';
import { audioEngine } from '../audio/AudioEngine';

export class Checkpoint extends Entity {
  public isActive: boolean = false;
  private animTime: number = 0;

  constructor(x: number, y: number) {
    super(x, y, 32, 48);
  }

  public update(dt: number, player: Player, particles: ParticleSystem): boolean {
    this.animTime += dt;

    if (!this.isActive && this.intersects(player)) {
      this.isActive = true;
      audioEngine.playVictory();
      particles.createVictoryConfetti(this.x + 16, this.y);
      particles.createFloatingText(
        this.x + 16,
        this.y - 12,
        'CHECKPOINT REACHED!',
        '#34d399',
        16
      );
      return true; // Newly activated
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    const px = Math.round(this.x - offsetX);
    const py = Math.round(this.y - offsetY);

    ctx.save();

    // 1. Stone Altar Pedestal
    ctx.fillStyle = '#334155';
    ctx.fillRect(px, py + this.height - 10, this.width, 10);
    ctx.fillStyle = '#475569';
    ctx.fillRect(px + 4, py + this.height - 16, this.width - 8, 6);

    // Glowing Altar Runes
    ctx.fillStyle = this.isActive ? '#10b981' : '#64748b';
    ctx.fillRect(px + 10, py + this.height - 8, 12, 3);

    // 2. Wooden Flagpole
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 14, py + 4, 4, this.height - 20);

    // 3. Top Crystal / Star Gem
    ctx.fillStyle = this.isActive ? '#34d399' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(px + 16, py + 4, 5, 0, Math.PI * 2);
    ctx.fill();

    if (this.isActive) {
      // Glow Aura around gem
      ctx.fillStyle = 'rgba(52, 211, 153, 0.3)';
      ctx.beginPath();
      ctx.arc(px + 16, py + 4, 10 + Math.sin(this.animTime * 5) * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Banner Flag
    const wave = Math.sin(this.animTime * 4) * 3;
    ctx.fillStyle = this.isActive ? '#10b981' : '#ef4444'; // Green when activated, red when inactive
    ctx.beginPath();
    ctx.moveTo(px + 18, py + 8);
    ctx.lineTo(px + 36 + wave, py + 16);
    ctx.lineTo(px + 18, py + 24);
    ctx.closePath();
    ctx.fill();

    // Flag symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.isActive ? '✓' : '★', px + 24 + wave * 0.5, py + 18);

    ctx.restore();
  }
}
