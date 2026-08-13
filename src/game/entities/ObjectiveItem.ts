import { Entity } from './Entity';
import { Player } from './Player';
import { ParticleSystem } from '../core/ParticleSystem';
import { audioEngine } from '../audio/AudioEngine';

export type ObjectiveItemType = 'RUNE' | 'ALTAR';

export class ObjectiveItem extends Entity {
  public itemType: ObjectiveItemType;
  public itemIndex: number;
  public title: string;
  public isCollected: boolean = false;
  public bobTime: number = Math.random() * Math.PI * 2;
  public originalY: number;

  constructor(
    x: number,
    y: number,
    itemType: ObjectiveItemType,
    itemIndex: number,
    title: string = 'OBJECTIVE'
  ) {
    super(x, y, itemType === 'ALTAR' ? 32 : 24, itemType === 'ALTAR' ? 48 : 24);
    this.itemType = itemType;
    this.itemIndex = itemIndex;
    this.title = title;
    this.originalY = y;
  }

  public update(dt: number, player: Player, particles: ParticleSystem): boolean {
    if (this.isCollected) return false;

    if (this.itemType === 'RUNE') {
      this.bobTime += dt * 4;
      this.y = this.originalY + Math.sin(this.bobTime) * 5;

      const dx = player.x + player.width / 2 - (this.x + this.width / 2);
      const dy = player.y + player.height / 2 - (this.y + this.height / 2);
      const dist = Math.hypot(dx, dy);

      if (dist < 50) {
        this.x += (dx / dist) * 5;
        this.y += (dy / dist) * 5;
      }
    }

    if (this.intersects(player)) {
      this.isCollected = true;
      audioEngine.playVictory();
      particles.createVictoryConfetti(this.x + this.width / 2, this.y);
      particles.createFloatingText(
        this.x + this.width / 2,
        this.y - 10,
        this.itemType === 'RUNE' ? `🔮 ${this.title} COLLECTED!` : `⚡ ${this.title} ACTIVATED!`,
        '#facc15',
        16
      );
      return true;
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    const px = Math.round(this.x - offsetX);
    const py = Math.round(this.y - offsetY);

    ctx.save();
    if (this.itemType === 'RUNE') {
      if (this.isCollected) {
        ctx.restore();
        return;
      }

      const centerX = px + 12;
      const centerY = py + 12;

      // Outer Magic Pulse Glow
      ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 16 + Math.sin(this.bobTime * 2) * 3, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Diamond Rune Body
      ctx.fillStyle = '#a855f7';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 12);
      ctx.lineTo(centerX + 10, centerY);
      ctx.lineTo(centerX, centerY + 12);
      ctx.lineTo(centerX - 10, centerY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner Core Highlight
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Floating Title Text
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.title, centerX, py - 6);
    } else {
      // ALTAR SWITCH
      const bx = px;
      const by = py;

      // Base Altar Stone Pedestal
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.fillRect(bx + 4, by + 24, 24, 24);
      ctx.strokeRect(bx + 4, by + 24, 24, 24);

      if (this.isCollected) {
        // Active Lit Altar
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.fillRect(bx - 4, by - 20, 40, 68);

        // Bright Glowing Crystal Gem
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx + 16, by + 12, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f0fdf4';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ ACTIVATED', bx + 16, by - 6);
      } else {
        // Unlit Altar Gem
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(bx + 16, by + 12, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ ALTAR', bx + 16, by - 6);
      }
    }
    ctx.restore();
  }
}
