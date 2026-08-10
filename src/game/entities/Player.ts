import { Entity } from './Entity';
import { PlayerActionState, PlayerStats, Rect } from '../../types/game';
import { InputState } from '../../types/game';
import { TileMap, TileType } from '../world/TileMap';
import { ParticleSystem } from '../core/ParticleSystem';
import { audioEngine } from '../audio/AudioEngine';

export class Player extends Entity {
  public stats: PlayerStats;
  public state: PlayerActionState = 'IDLE';
  public invulnerableTimer: number = 0;
  public attackTimer: number = 0;
  public attackCooldownTimer: number = 0;
  public animFrame: number = 0;
  public animTime: number = 0;

  // Jump responsiveness helpers
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;

  // Constants
  private readonly GRAVITY = 0.52;
  private readonly TERMINAL_VELOCITY = 12;

  public currentAttackId: number = 0;

  constructor(x: number, y: number, statsBonus?: Partial<PlayerStats>) {
    super(x, y, 32, 48); // Hero width x height
    this.stats = {
      maxHp: 100 + (statsBonus?.maxHp || 0),
      currentHp: 100 + (statsBonus?.maxHp || 0),
      attackDamage: 35 + (statsBonus?.attackDamage || 0),
      moveSpeed: 4.4 + (statsBonus?.moveSpeed || 0),
      jumpForce: 12.0 + (statsBonus?.jumpForce || 0),
      attackCooldownMs: 320,
    };
  }

  public update(dt: number, input: InputState, tileMap: TileMap, particles: ParticleSystem) {
    if (!this.isAlive) {
      this.state = 'DEAD';
      return;
    }

    // Cooldown & buffer timers
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= dt * 1000;
    }
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.state = 'IDLE';
      }
    }

    // Coyote time tracking (allows jump shortly after falling off a platform)
    if (this.isGrounded) {
      this.coyoteTimer = 0.12; // 120ms coyote window
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer -= dt;
    }

    // Jump buffering tracking (remembers jump press right before landing)
    if (input.jump) {
      this.jumpBufferTimer = 0.14; // 140ms jump buffer window
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    // Animation frame progression
    this.animTime += dt;
    if (this.animTime >= 0.08) {
      this.animTime = 0;
      this.animFrame = (this.animFrame + 1) % 8;
    }

    // Handle Attack Input
    if (input.attack && this.attackCooldownTimer <= 0 && this.state !== 'ATTACK') {
      this.state = 'ATTACK';
      this.currentAttackId++; // Increment unique attack ID for single-hit detection
      this.attackTimer = 0.25; // 250ms attack animation duration
      this.attackCooldownTimer = this.stats.attackCooldownMs;
      audioEngine.playSwordAttack();
      const slashX = this.facingRight ? this.x + this.width + 10 : this.x - 10;
      particles.createSlashSparks(slashX, this.y + 20, this.facingRight);
    }

    // Handle Horizontal Movement
    if (this.state !== 'ATTACK') {
      if (input.left) {
        this.vx = -this.stats.moveSpeed;
        this.facingRight = false;
        if (this.isGrounded) this.state = 'RUN';
      } else if (input.right) {
        this.vx = this.stats.moveSpeed;
        this.facingRight = true;
        if (this.isGrounded) this.state = 'RUN';
      } else {
        this.vx *= 0.65; // Smooth friction
        if (Math.abs(this.vx) < 0.2) this.vx = 0;
        if (this.isGrounded) this.state = 'IDLE';
      }
    } else {
      // Slight movement dampening while swinging sword
      this.vx *= 0.7;
    }

    // Handle Jump Input with Coyote Time & Jump Buffer
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && (this.state as string) !== 'ATTACK') {
      this.vy = -this.stats.jumpForce;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.state = 'JUMP';
      audioEngine.playJump();
      particles.createJumpDust(this.x + this.width / 2, this.y + this.height);
    }

    // Variable Jump Height Cut (short tap vs long hold)
    if (!input.jump && this.vy < -2) {
      this.vy *= 0.6; // Variable height damping
    }

    // Apply Gravity
    this.vy += this.GRAVITY;
    if (this.vy > this.TERMINAL_VELOCITY) {
      this.vy = this.TERMINAL_VELOCITY;
    }

    if (!this.isGrounded && this.state !== 'ATTACK') {
      this.state = this.vy < 0 ? 'JUMP' : 'FALL';
    }

    // TileMap Physics & Collision Check
    tileMap.resolveEntityCollision(this);

    // World Boundary Clamp
    if (this.x < 0) {
      this.x = 0;
      this.vx = 0;
    } else if (this.x > tileMap.widthInPixels - this.width) {
      this.x = tileMap.widthInPixels - this.width;
      this.vx = 0;
    }

    // Hazard Spikes check
    const footTile = tileMap.getTileAtPixel(this.x + this.width / 2, this.y + this.height - 4);
    if (footTile === TileType.HAZARD_SPIKES) {
      this.takeDamage(12, particles);
    }

    // Hazard Pit check
    if (this.y > tileMap.heightInPixels + 100) {
      this.takeDamage(999, particles); // Fall out of bounds
    }
  }

  public getAttackHitbox(): Rect | null {
    if (this.state === 'ATTACK' && this.attackTimer > 0.05 && this.attackTimer < 0.22) {
      const reach = 38;
      const attackWidth = reach;
      const attackHeight = 44;
      const attackX = this.facingRight ? this.x + this.width : this.x - attackWidth;
      const attackY = this.y + 2;

      return {
        x: attackX,
        y: attackY,
        width: attackWidth,
        height: attackHeight,
      };
    }
    return null;
  }

  public takeDamage(damage: number, particles: ParticleSystem): boolean {
    if (this.invulnerableTimer > 0 || !this.isAlive) return false;

    this.stats.currentHp = Math.max(0, this.stats.currentHp - damage);
    this.invulnerableTimer = 0.85; // 0.85s (850ms) damage invulnerability period
    this.state = 'HURT';

    // Knockback
    this.vy = -4;
    this.vx = this.facingRight ? -5 : 5;

    audioEngine.playPlayerHurt();
    particles.createHitBloodOrSparks(this.x + this.width / 2, this.y + this.height / 2);

    if (this.stats.currentHp <= 0) {
      this.isAlive = false;
      this.state = 'DEAD';
    }
    return true;
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    const px = Math.round(this.x - offsetX);
    const py = Math.round(this.y - offsetY);

    // Invulnerability Flashing / Blinking
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.3;
    }

    ctx.save();
    // Anchor at feet center for smooth scaling and ground alignment
    ctx.translate(px + this.width / 2, py + this.height);

    // Apply 1.32x Hero Scale
    const scaleX = this.facingRight ? 1.32 : -1.32;
    ctx.scale(scaleX, 1.32);

    // Ground Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, -2, 11, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Death pose rotation
    if (!this.isAlive) {
      ctx.rotate(Math.PI / 2);
      ctx.translate(0, -10);
    }

    // Calculate state-dependent offsets
    const runCycle = Math.sin(this.animFrame * 0.8);
    const idleBreath = Math.sin(this.animTime * 4) * 1.5;
    
    let legOffset = 0;
    let bodyY = -24; // Align torso to feet anchor

    if (this.state === 'RUN') {
      legOffset = runCycle * 8;
      bodyY = -24 + Math.abs(Math.sin(this.animFrame * 0.8)) * -2;
    } else if (this.state === 'IDLE') {
      bodyY = -24 + idleBreath;
    } else if (this.state === 'JUMP') {
      bodyY = -27;
    } else if (this.state === 'FALL') {
      bodyY = -22;
    } else if (this.state === 'HURT') {
      bodyY = -22;
    }

    // ----------------------------------------------------
    // 1. ADVENTURER CAPE (Fluttering behind)
    // ----------------------------------------------------
    ctx.fillStyle = '#dc2626'; // Bright Crimson Red
    ctx.beginPath();
    const capeWave = this.state === 'RUN' ? Math.sin(this.animTime * 14) * 8 : Math.sin(this.animTime * 3) * 3;
    const capeY = this.state === 'JUMP' ? 2 : this.state === 'FALL' ? -10 : -2;
    
    ctx.moveTo(-6, bodyY + 12);
    ctx.quadraticCurveTo(-18 - capeWave, bodyY + 20, -22 - capeWave, bodyY + capeY + 36);
    ctx.lineTo(-4, bodyY + 32);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ----------------------------------------------------
    // 2. LEGS & ADVENTURER BOOTS
    // ----------------------------------------------------
    ctx.fillStyle = '#1e293b'; // Navy Trousers
    if (this.state === 'JUMP') {
      // Tucked knees jump pose
      ctx.fillRect(-9, bodyY + 22, 7, 10);
      ctx.fillRect(2, bodyY + 20, 7, 10);
      ctx.fillStyle = '#78350f'; // Leather Boots
      ctx.fillRect(-11, bodyY + 30, 9, 6);
      ctx.fillRect(2, bodyY + 28, 9, 6);
    } else if (this.state === 'FALL') {
      // Legs reaching down
      ctx.fillRect(-8, bodyY + 22, 6, 12);
      ctx.fillRect(2, bodyY + 22, 6, 12);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-9, bodyY + 32, 8, 6);
      ctx.fillRect(1, bodyY + 32, 8, 6);
    } else {
      // Idle / Running legs
      ctx.fillRect(-8 + legOffset, bodyY + 22, 6, 11);
      ctx.fillRect(2 - legOffset, bodyY + 22, 6, 11);
      ctx.fillStyle = '#78350f'; // Boots with buckles
      ctx.fillRect(-9 + legOffset, bodyY + 31, 8, 7);
      ctx.fillRect(1 - legOffset, bodyY + 31, 8, 7);
      // Boot cuffs
      ctx.fillStyle = '#a16207';
      ctx.fillRect(-9 + legOffset, bodyY + 31, 8, 2);
      ctx.fillRect(1 - legOffset, bodyY + 31, 8, 2);
    }

    // ----------------------------------------------------
    // 3. TORSO & LEATHER ARMOR VEST
    // ----------------------------------------------------
    ctx.fillStyle = '#2563eb'; // Royal Blue Adventurer Tunic
    ctx.fillRect(-10, bodyY, 20, 22);

    // Brown Leather Armor Harness & Belt
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(-10, bodyY + 16, 20, 5); // Belt
    ctx.fillStyle = '#f59e0b'; // Golden Belt Buckle
    ctx.fillRect(-3, bodyY + 15, 6, 7);

    // Shoulder Pauldrons (Golden/Brass)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(-10, bodyY + 2, 4.5, 0, Math.PI * 2);
    ctx.arc(10, bodyY + 2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Chest Crest Symbol (Blaze Flame)
    ctx.fillStyle = '#f97316'; // Orange Flame
    ctx.beginPath();
    ctx.moveTo(0, bodyY + 3);
    ctx.lineTo(-4, bodyY + 11);
    ctx.lineTo(0, bodyY + 15);
    ctx.lineTo(4, bodyY + 11);
    ctx.closePath();
    ctx.fill();

    // 4. HERO HEAD & FACE
    // Face Skin Tone
    ctx.fillStyle = '#fdba74'; // Warm peach skin
    ctx.fillRect(-7, bodyY - 12, 14, 12);

    // Determined Eye & Eyebrow
    ctx.fillStyle = '#0f172a'; // Eye
    ctx.fillRect(2, bodyY - 9, 3, 4);
    ctx.fillStyle = '#ffffff'; // Iris Shine
    ctx.fillRect(3, bodyY - 9, 1, 2);

    // Headband
    ctx.fillStyle = '#dc2626'; // Red Headband
    ctx.fillRect(-8, bodyY - 11, 16, 3);

    // Dark Brown Spiky Hero Hair
    ctx.fillStyle = '#451a03'; // Dark Brown Hair
    ctx.beginPath();
    ctx.moveTo(-9, bodyY - 11);
    ctx.lineTo(-12, bodyY - 18);
    ctx.lineTo(-5, bodyY - 16);
    ctx.lineTo(0, bodyY - 20);
    ctx.lineTo(5, bodyY - 16);
    ctx.lineTo(11, bodyY - 17);
    ctx.lineTo(8, bodyY - 10);
    ctx.closePath();
    ctx.fill();

    // ----------------------------------------------------
    // 5. SWORD & ARMS ANIMATION
    // ----------------------------------------------------
    const isAttacking = this.state === 'ATTACK';
    const attackProgress = isAttacking ? (0.25 - this.attackTimer) / 0.25 : 0; // 0 to 1

    ctx.save();
    ctx.translate(4, bodyY + 10);

    if (isAttacking) {
      // Dynamic 3-stage slash rotation
      const slashAngle = -Math.PI / 2 + attackProgress * (Math.PI * 1.2);
      ctx.rotate(slashAngle);
    } else if (this.state === 'RUN') {
      ctx.rotate(Math.sin(this.animFrame * 0.8) * 0.4);
    } else if (this.state === 'JUMP') {
      ctx.rotate(-0.5);
    }

    // Arm (Tunic sleeve + Gloves)
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-2, -3, 8, 5);
    ctx.fillStyle = '#78350f'; // Leather Glove
    ctx.fillRect(5, -3, 4, 5);

    // Fantasy Sword Hilt & Guard
    ctx.fillStyle = '#f59e0b'; // Gold Crossguard
    ctx.fillRect(8, -8, 4, 16);
    ctx.fillStyle = '#78350f'; // Hilt Grip
    ctx.fillRect(5, -1, 4, 3);
    ctx.fillStyle = '#38bdf8'; // Pommel Gem
    ctx.beginPath();
    ctx.arc(4, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    // Radiant Blaze Sword Blade
    ctx.fillStyle = '#38bdf8'; // Glowing Light Blue Edge
    ctx.beginPath();
    ctx.moveTo(12, -3);
    ctx.lineTo(36, -1);
    ctx.lineTo(40, 0); // Tip
    ctx.lineTo(36, 1);
    ctx.lineTo(12, 3);
    ctx.closePath();
    ctx.fill();

    // Silver Blade Core
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(12, -1, 24, 2);

    ctx.restore();

    // ----------------------------------------------------
    // 6. SWORD SLASH ARC EFFECT (During Attack)
    // ----------------------------------------------------
    if (isAttacking) {
      const slashAlpha = Math.sin(attackProgress * Math.PI);
      ctx.save();
      ctx.globalAlpha = slashAlpha;

      // Outer Cyan Energy Arc
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(8, bodyY + 10, 38, -Math.PI / 2.2, Math.PI / 2);
      ctx.stroke();

      // Inner White Core Arc
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(8, bodyY + 10, 37, -Math.PI / 2.2, Math.PI / 2);
      ctx.stroke();

      // Energy Sparkles at arc tip
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(28, bodyY - 10, 3, 0, Math.PI * 2);
      ctx.arc(36, bodyY + 20, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
    ctx.globalAlpha = 1.0;
  }
}
