import { Entity } from './Entity';
import { Player } from './Player';
import { TileMap } from '../world/TileMap';
import { ParticleSystem } from '../core/ParticleSystem';
import { audioEngine } from '../audio/AudioEngine';

export class ForestGoblin extends Entity {
  public hp: number = 50;
  public maxHp: number = 50;
  public attackDamage: number = 15;
  public moveSpeed: number = 2.0;
  public detectionRadius: number = 220;
  public attackRange: number = 36;
  public attackCooldown: number = 0;
  public hitFlashTimer: number = 0;
  public animFrame: number = 0;
  public animTime: number = 0;
  public isBoss: boolean = false;

  private patrolMinX: number;
  private patrolMaxX: number;
  private patrolDirection: number = 1;

  constructor(x: number, y: number, patrolRange: number = 120, isBoss: boolean = false) {
    const width = isBoss ? 54 : 32;
    const height = isBoss ? 60 : 40;
    super(x, y, width, height);
    this.isBoss = isBoss;
    this.maxHp = isBoss ? 250 : 50;
    this.hp = this.maxHp;
    this.attackDamage = isBoss ? 12 : 7;
    this.moveSpeed = isBoss ? 1.8 : 2.0;
    this.detectionRadius = isBoss ? 300 : 220;
    this.attackRange = isBoss ? 48 : 36;

    this.patrolMinX = x - patrolRange / 2;
    this.patrolMaxX = x + patrolRange / 2;
  }


  public update(dt: number, player: Player, tileMap: TileMap, particles: ParticleSystem) {
    if (!this.isAlive) return;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // Animation frames
    this.animTime += dt;
    if (this.animTime >= 0.1) {
      this.animTime = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);

    // AI Logic
    if (distToPlayer <= this.detectionRadius && player.isAlive) {
      // Pursuit player
      this.facingRight = dx > 0;
      if (distToPlayer > this.attackRange) {
        this.vx = this.facingRight ? this.moveSpeed : -this.moveSpeed;
      } else {
        // Attack Range reached
        this.vx = 0;
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 1.5; // Attack every 1.5s
          player.takeDamage(this.attackDamage, particles);
        }
      }
    } else {
      // Normal Patrol Logic
      this.vx = this.patrolDirection * (this.moveSpeed * 0.6);
      if (this.x <= this.patrolMinX) {
        this.patrolDirection = 1;
        this.facingRight = true;
      } else if (this.x >= this.patrolMaxX) {
        this.patrolDirection = -1;
        this.facingRight = false;
      }
    }

    // Apply gravity
    this.vy += 0.5;
    if (this.vy > 10) this.vy = 10;

    // TileMap Physics
    tileMap.resolveEntityCollision(this);

    // Hazard Pit check
    if (this.y > tileMap.heightInPixels + 100) {
      this.isAlive = false;
    }
  }

  public takeDamage(damage: number, particles: ParticleSystem): boolean {
    if (!this.isAlive) return false;

    this.hp -= damage;
    this.hitFlashTimer = 0.2;
    this.vy = -3;
    this.vx = this.facingRight ? -4 : 4; // Knockback

    audioEngine.playEnemyHit();
    particles.createHitBloodOrSparks(this.x + this.width / 2, this.y + this.height / 2);
    particles.createFloatingText(
      this.x + this.width / 2,
      this.y,
      `-${damage}`,
      '#ef4444',
      16
    );

    if (this.hp <= 0) {
      this.isAlive = false;
      audioEngine.playEnemyDeath();
      particles.createHitBloodOrSparks(this.x + this.width / 2, this.y + this.height / 2);
    }
    return true;
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    if (!this.isAlive) return;

    const px = Math.round(this.x - offsetX);
    const py = Math.round(this.y - offsetY);

    ctx.save();
    // Anchor at feet center for ground alignment
    ctx.translate(px + this.width / 2, py + this.height);

    const baseScale = this.isBoss ? 1.85 : 1.25;
    const scaleX = this.facingRight ? baseScale : -baseScale;
    ctx.scale(scaleX, baseScale);

    const isAttacking = this.attackCooldown > 0.9; // Attack windup/slash pose
    const walkCycle = Math.sin(this.animFrame * 1.2);
    const bob = Math.sin(this.animTime * 6) * 1.5;

    // Golden Boss Crown
    if (this.isBoss) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(-8, -40 + bob);
      ctx.lineTo(-6, -48 + bob);
      ctx.lineTo(-2, -42 + bob);
      ctx.lineTo(0, -50 + bob);
      ctx.lineTo(2, -42 + bob);
      ctx.lineTo(6, -48 + bob);
      ctx.lineTo(8, -40 + bob);
      ctx.closePath();
      ctx.fill();
    }


    // 1. Goblin Ground Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, -2, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Color theme: White flash on hit, else forest goblin bright lime green for high visibility
    const mainSkin = this.hitFlashTimer > 0 ? '#ffffff' : '#22c55e'; // Bright Lime Green
    const darkSkin = this.hitFlashTimer > 0 ? '#e2e8f0' : '#15803d'; // Forest Dark Green

    // 2. Pointed Goblin Ears (Back & Front)
    ctx.fillStyle = mainSkin;
    ctx.beginPath(); // Left Back Ear
    ctx.moveTo(-6, -30 + bob);
    ctx.lineTo(-22, -38 + bob);
    ctx.lineTo(-8, -24 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath(); // Right Front Ear
    ctx.moveTo(6, -30 + bob);
    ctx.lineTo(22, -38 + bob);
    ctx.lineTo(8, -24 + bob);
    ctx.closePath();
    ctx.fill();

    // Inner Ear shading
    if (this.hitFlashTimer <= 0) {
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.moveTo(8, -29 + bob);
      ctx.lineTo(18, -34 + bob);
      ctx.lineTo(9, -26 + bob);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Head & Face
    ctx.fillStyle = mainSkin;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    // Goblin Nose & Jaw
    ctx.fillRect(4, -29 + bob, 7, 4); // Long Goblin Nose

    // Eyes (Glowing Yellow/Red)
    ctx.fillStyle = '#facc15'; // Glowing Yellow
    ctx.fillRect(2, -32 + bob, 4, 4);
    ctx.fillStyle = '#dc2626'; // Red Pupil
    ctx.fillRect(3, -31 + bob, 2, 2);

    // Mouth with sharp fang
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(1, -25 + bob, 6, 3);
    ctx.fillStyle = '#ffffff'; // White Fang
    ctx.fillRect(2, -25 + bob, 2, 2);

    // 4. Body & Ragged Clothes
    ctx.fillStyle = darkSkin;
    ctx.fillRect(-7, -18 + bob, 14, 14);

    // Ragged Brown Leather Tunic
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-8, -12 + bob, 16, 9);
    // Rope Belt
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-8, -13 + bob, 16, 2);

    // 5. Legs & Feet
    ctx.fillStyle = darkSkin;
    if (Math.abs(this.vx) > 0.1) {
      ctx.fillRect(-7 + walkCycle * 4, -5, 5, 5);
      ctx.fillRect(2 - walkCycle * 4, -5, 5, 5);
    } else {
      ctx.fillRect(-6, -5, 5, 5);
      ctx.fillRect(1, -5, 5, 5);
    }

    // 6. Goblin Weapon (Jagged Dagger / Spiked Club)
    ctx.save();
    ctx.translate(6, -14 + bob);

    if (isAttacking) {
      ctx.rotate(-0.8); // Thrust forward
    }

    // Hand
    ctx.fillStyle = mainSkin;
    ctx.fillRect(-2, -2, 5, 5);

    // Dagger Handle & Guard
    ctx.fillStyle = '#451a03';
    ctx.fillRect(3, -1, 4, 3);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(7, -5, 2, 11);

    // Jagged Steel Blade
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(9, -3);
    ctx.lineTo(20, -1);
    ctx.lineTo(24, 0); // Blade Tip
    ctx.lineTo(18, 3);
    ctx.lineTo(14, 1);
    ctx.lineTo(9, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.restore();

    // 7. HP Bar floating above goblin
    if (this.hp < this.maxHp) {
      const hpWidth = 32;
      const hpHeight = 4;
      const hpPercent = Math.max(0, this.hp / this.maxHp);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(px, py - 14, hpWidth, hpHeight);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px, py - 14, hpWidth * hpPercent, hpHeight);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py - 14, hpWidth, hpHeight);
    }
  }
}
