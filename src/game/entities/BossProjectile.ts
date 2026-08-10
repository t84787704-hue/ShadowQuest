import { Player } from './Player';
import { TileMap } from '../world/TileMap';
import { ParticleSystem } from '../core/ParticleSystem';

export interface ProjectileConfig {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  damage: number;
  color: string;
  glowColor: string;
  isShockwave?: boolean; // Floor crawling shockwave
  type?: 'vine' | 'sand' | 'ice' | 'fire' | 'shadow' | 'chaos';
}

export class BossProjectile {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public width: number;
  public height: number;
  public damage: number;
  public color: string;
  public glowColor: string;
  public isShockwave: boolean;
  public type: 'vine' | 'sand' | 'ice' | 'fire' | 'shadow' | 'chaos';
  public isAlive: boolean = true;
  public lifetime: number = 4.0; // Seconds before auto-despawn

  constructor(config: ProjectileConfig) {
    this.x = config.x;
    this.y = config.y;
    this.vx = config.vx;
    this.vy = config.vy;
    this.width = config.width;
    this.height = config.height;
    this.damage = config.damage;
    this.color = config.color;
    this.glowColor = config.glowColor;
    this.isShockwave = config.isShockwave || false;
    this.type = config.type || 'fire';
  }

  public update(dt: number, player: Player, tileMap: TileMap, particles: ParticleSystem) {
    if (!this.isAlive) return;

    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.isAlive = false;
      return;
    }

    this.x += this.vx * (dt * 60);
    this.y += this.vy * (dt * 60);

    // Shockwave gravity / ground-hug
    if (this.isShockwave) {
      this.vy += 0.4;
      // Tile collision to keep shockwave on floor
      const tile = tileMap.getTileAtPixel(this.x + this.width / 2, this.y + this.height);
      if (tileMap.isSolidTile(tile)) {
        this.vy = 0;
      }
    }

    // Check hit with Player
    const playerBox = {
      x: player.x,
      y: player.y,
      width: player.width,
      height: player.height,
    };

    if (
      this.x < playerBox.x + playerBox.width &&
      this.x + this.width > playerBox.x &&
      this.y < playerBox.y + playerBox.height &&
      this.y + this.height > playerBox.y
    ) {
      if (player.isAlive) {
        player.takeDamage(this.damage, particles);
        particles.createHitBloodOrSparks(this.x + this.width / 2, this.y + this.height / 2);
        this.isAlive = false;
        return;
      }
    }

    // Check wall collision
    const centerTile = tileMap.getTileAtPixel(this.x + this.width / 2, this.y + this.height / 2);
    if (!this.isShockwave && tileMap.isSolidTile(centerTile)) {
      this.isAlive = false;
      particles.createSlashSparks(this.x, this.y, this.vx > 0, [this.color, this.glowColor]);
    }
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    if (!this.isAlive) return;

    const px = Math.round(this.x - offsetX);
    const py = Math.round(this.y - offsetY);

    ctx.save();

    // Glow Effect
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = 12;

    if (this.isShockwave) {
      // Ground shockwave blade / spike
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(px, py + this.height);
      ctx.lineTo(px + this.width / 2, py);
      ctx.lineTo(px + this.width, py + this.height);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + this.width / 2 - 2, py + 4, 4, this.height - 6);
    } else {
      // Orb / Elemental Bullet
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(px + this.width / 2, py + this.height / 2, this.width / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px + this.width / 2 - 2, py + this.height / 2 - 2, this.width / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
