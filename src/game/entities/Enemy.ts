import { Entity } from './Entity';
import { Player } from './Player';
import { TileMap } from '../world/TileMap';
import { ParticleSystem } from '../core/ParticleSystem';
import { audioEngine } from '../audio/AudioEngine';

export class ForestGoblin extends Entity {
  public hp: number = 50;
  public maxHp: number = 50;
  public attackDamage: number = 8;
  public moveSpeed: number = 2.0;
  public detectionRadius: number = 220;
  public attackRange: number = 36;
  public attackCooldown: number = 0;
  public hitFlashTimer: number = 0;
  public animFrame: number = 0;
  public animTime: number = 0;
  public isBoss: boolean = false;
  public levelId: string = '1-1';

  // Weapon status effects
  public slowTimer: number = 0;
  public burnTimer: number = 0;
  public burnTickTimer: number = 0;

  private patrolMinX: number;
  private patrolMaxX: number;
  private patrolDirection: number = 1;

  constructor(
    x: number,
    y: number,
    patrolRange: number = 120,
    isBoss: boolean = false,
    levelId: string = '1-1'
  ) {
    const isFinalBoss = isBoss && levelId === '6-5';
    const width = isFinalBoss ? 68 : isBoss ? 54 : 32;
    const height = isFinalBoss ? 72 : isBoss ? 60 : 40;
    super(x, y, width, height);

    this.isBoss = isBoss;
    this.levelId = levelId;

    const [wStr] = levelId.split('-');
    const w = parseInt(wStr, 10) || 1;

    if (isFinalBoss) {
      this.maxHp = 500; // Final Goblin King
      this.attackDamage = 10;
      this.moveSpeed = 1.9;
    } else if (isBoss) {
      this.maxHp = 220 + w * 35;
      this.attackDamage = 8 + Math.floor(w * 0.4);
      this.moveSpeed = 1.8;
    } else {
      this.maxHp = 45 + w * 5;
      this.attackDamage = 5 + Math.floor(w * 0.3);
      this.moveSpeed = 1.9 + (w % 2 === 0 ? 0.3 : 0);
    }

    this.hp = this.maxHp;
    this.detectionRadius = isBoss ? 340 : 220;
    this.attackRange = isBoss ? 52 : 36;

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

    // Status Timers
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
    }
    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer -= dt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.4;
        this.takeDamage(5, particles);
        particles.createSlashSparks(this.x + this.width / 2, this.y + 10, this.facingRight, ['#f97316', '#ef4444']);
      }
    }

    const currentSpeed = this.slowTimer > 0 ? this.moveSpeed * 0.5 : this.moveSpeed;

    // Animation frames
    this.animTime += dt;
    if (this.animTime >= 0.1) {
      this.animTime = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);

    // Direct body contact check
    if (this.intersects(player) && player.isAlive) {
      player.takeDamage(this.attackDamage, particles);
    }

    // AI Logic
    if (distToPlayer <= this.detectionRadius && player.isAlive) {
      // Pursuit player
      this.facingRight = dx > 0;
      if (distToPlayer > this.attackRange) {
        this.vx = this.facingRight ? currentSpeed : -currentSpeed;
      } else {
        // Attack Range reached
        this.vx = 0;
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 1.2; // Attack every 1.2s
          player.takeDamage(this.attackDamage, particles);
        }
      }
    } else {
      // Normal Patrol Logic
      this.vx = this.patrolDirection * (currentSpeed * 0.6);
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

  public takeDamage(damage: number, particles: ParticleSystem, attackType?: string): boolean {
    if (!this.isAlive) return false;

    this.hp -= damage;
    this.hitFlashTimer = 0.2;
    this.vy = -3;
    this.vx = this.facingRight ? -4 : 4; // Knockback

    audioEngine.playEnemyHit(attackType);
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
    const isHit = this.hitFlashTimer > 0;
    const isMoving = Math.abs(this.vx) > 0.1;
    const walkCycle = isMoving ? Math.sin(this.animFrame * 1.2) : 0;
    const bob = isMoving ? Math.abs(Math.sin(this.animFrame * 1.5)) * -2 : Math.sin(this.animTime * 6) * 1.2;

    // Stagger rotation when hit
    if (isHit) {
      ctx.rotate(-0.15);
    } else if (isMoving) {
      ctx.rotate(0.05); // Slight aggressive forward lean while moving
    }

    // World ID parsing
    const [wStr] = this.levelId.split('-');
    const w = parseInt(wStr, 10) || 1;

    // 1. Ground Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, -2, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden Boss Crown
    if (this.isBoss) {
      ctx.fillStyle = isHit ? '#ffffff' : '#facc15';
      ctx.beginPath();
      ctx.moveTo(-10, -42 + bob);
      ctx.lineTo(-7, -52 + bob);
      ctx.lineTo(-3, -45 + bob);
      ctx.lineTo(0, -56 + bob);
      ctx.lineTo(3, -45 + bob);
      ctx.lineTo(7, -52 + bob);
      ctx.lineTo(10, -42 + bob);
      ctx.closePath();
      ctx.fill();
    }

    // Render World-Specific Intimidating Enemy Visuals
    switch (w) {
      case 2:
        this.renderDesertRaider(ctx, bob, walkCycle, isAttacking, isHit);
        break;
      case 3:
        this.renderIceStalker(ctx, bob, walkCycle, isAttacking, isHit);
        break;
      case 4:
        this.renderVolcanicBrute(ctx, bob, walkCycle, isAttacking, isHit);
        break;
      case 5:
        this.renderShadowWraith(ctx, bob, walkCycle, isAttacking, isHit);
        break;
      case 6:
        this.renderCitadelWarlord(ctx, bob, walkCycle, isAttacking, isHit);
        break;
      case 1:
      default:
        this.renderForestGoblinWarrior(ctx, bob, walkCycle, isAttacking, isHit);
        break;
    }

    ctx.restore();

    // HP Bar floating above enemy
    if (this.hp < this.maxHp) {
      const hpWidth = 34;
      const hpHeight = 4;
      const hpPercent = Math.max(0, this.hp / this.maxHp);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(px, py - 16, hpWidth, hpHeight);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px, py - 16, hpWidth * hpPercent, hpHeight);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py - 16, hpWidth, hpHeight);
    }
  }

  // ==========================================
  // WORLD 1 — FOREST: WILD GOBLIN BERSERKER
  // ==========================================
  private renderForestGoblinWarrior(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    attacking: boolean,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#15803d';
    const darkSkin = hit ? '#e2e8f0' : '#166534';
    const tunic = hit ? '#ffffff' : '#78350f';
    const steel = hit ? '#ffffff' : '#94a3b8';

    // Jagged Ears
    ctx.fillStyle = skin;
    ctx.beginPath(); // Back ear
    ctx.moveTo(-6, -28 + bob);
    ctx.lineTo(-24, -36 + bob);
    ctx.lineTo(-8, -20 + bob);
    ctx.fill();

    ctx.beginPath(); // Front ear
    ctx.moveTo(6, -28 + bob);
    ctx.lineTo(24, -36 + bob);
    ctx.lineTo(8, -20 + bob);
    ctx.fill();

    // Muscular Head
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 12, 0, Math.PI * 2);
    ctx.fill();

    // Snarl Brow & Snout
    ctx.fillStyle = darkSkin;
    ctx.fillRect(-2, -33 + bob, 12, 4); // Angry Brow
    ctx.fillRect(4, -28 + bob, 8, 5); // Pointed Snout

    // Red War Paint Stripe
    if (!hit) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(2, -31 + bob, 8, 2);
    }

    // Glowing Yellow/Red Eye
    ctx.fillStyle = '#facc15';
    ctx.fillRect(3, -32 + bob, 4, 3);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(5, -31 + bob, 2, 2);

    // Mouth with Sharp Fangs
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -24 + bob, 8, 4);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(3, -24 + bob);
    ctx.lineTo(5, -20 + bob);
    ctx.lineTo(7, -24 + bob);
    ctx.fill();

    // Muscular Body & Leather Harness
    ctx.fillStyle = darkSkin;
    ctx.fillRect(-8, -19 + bob, 16, 15);

    // Harness Straps
    ctx.fillStyle = tunic;
    ctx.fillRect(-8, -17 + bob, 16, 8);
    ctx.fillStyle = '#fef08a'; // Bone Buckle
    ctx.fillRect(-2, -16 + bob, 4, 4);

    // Legs
    ctx.fillStyle = darkSkin;
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    // Weapon Arm (Jagged Bone Blade)
    ctx.save();
    ctx.translate(6, -15 + bob);
    if (attacking) {
      ctx.rotate(-0.9); // Deep strike forward
    } else {
      ctx.rotate(0.2);
    }

    ctx.fillStyle = skin;
    ctx.fillRect(-2, -2, 6, 6);

    ctx.fillStyle = '#451a03'; // Handle
    ctx.fillRect(4, -2, 5, 3);

    // Jagged Bone Blade
    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.moveTo(9, -4);
    ctx.lineTo(22, -2);
    ctx.lineTo(26, 0); // Tip
    ctx.lineTo(20, 3);
    ctx.lineTo(14, 1);
    ctx.lineTo(9, 4);
    ctx.closePath();
    ctx.fill();

    // Attack Slash Arc Overlay
    if (attacking && !hit) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(12, 0, 20, -0.6, 0.6);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // WORLD 2 — DESERT: DUNE RAIDER
  // ==========================================
  private renderDesertRaider(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    attacking: boolean,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#d97706';
    const wrap = hit ? '#ffffff' : '#b45309';
    const bronze = hit ? '#ffffff' : '#78350f';
    const steel = hit ? '#ffffff' : '#e2e8f0';

    // Head in Desert Wrap/Cowl
    ctx.fillStyle = wrap;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 13, 0, Math.PI * 2);
    ctx.fill();

    // Desert Goggles / Eye Slit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -31 + bob, 9, 5);

    // Glowing Amber Eyes
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(4, -30 + bob, 3, 3);
    ctx.fillRect(8, -30 + bob, 3, 3);

    // Bronze Shoulder Pauldrons
    ctx.fillStyle = bronze;
    ctx.fillRect(-10, -20 + bob, 6, 6);
    ctx.fillRect(4, -20 + bob, 6, 6);

    // Muscular Wrapped Body
    ctx.fillStyle = skin;
    ctx.fillRect(-8, -18 + bob, 16, 14);
    ctx.fillStyle = wrap;
    ctx.fillRect(-9, -12 + bob, 18, 7);

    // Legs with Sand Wraps
    ctx.fillStyle = bronze;
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    // Curved Scimitar Blade
    ctx.save();
    ctx.translate(6, -14 + bob);
    if (attacking) {
      ctx.rotate(-1.1); // Slash
    } else {
      ctx.rotate(0.3);
    }

    ctx.fillStyle = bronze;
    ctx.fillRect(0, -2, 5, 3); // Hilt

    // Curved Scimitar Steel Blade
    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.moveTo(5, -2);
    ctx.quadraticCurveTo(16, -10, 26, -4);
    ctx.quadraticCurveTo(18, 2, 5, 3);
    ctx.closePath();
    ctx.fill();

    if (attacking && !hit) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(14, -4, 22, -0.8, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // WORLD 3 — ICE: FROST GLACIER STALKER
  // ==========================================
  private renderIceStalker(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    attacking: boolean,
    hit: boolean
  ) {
    const ice = hit ? '#ffffff' : '#0284c7';
    const crystal = hit ? '#ffffff' : '#38bdf8';
    const coreGlow = hit ? '#ffffff' : '#7dd3fc';

    // Icicle Horns
    ctx.fillStyle = crystal;
    ctx.beginPath();
    ctx.moveTo(-6, -30 + bob);
    ctx.lineTo(-14, -44 + bob);
    ctx.lineTo(-2, -30 + bob);

    ctx.moveTo(2, -30 + bob);
    ctx.lineTo(10, -44 + bob);
    ctx.lineTo(6, -30 + bob);
    ctx.fill();

    // Crystal Head
    ctx.fillStyle = ice;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 12, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Cold Cyan Eyes
    ctx.fillStyle = coreGlow;
    ctx.fillRect(2, -31 + bob, 4, 3);
    ctx.fillRect(7, -31 + bob, 4, 3);

    // Jagged Frost Body
    ctx.fillStyle = ice;
    ctx.fillRect(-8, -18 + bob, 16, 14);

    // Frozen Core
    ctx.fillStyle = crystal;
    ctx.fillRect(-4, -14 + bob, 8, 8);

    // Frozen Legs
    ctx.fillStyle = ice;
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    // Ice Claw / Icicle Spear
    ctx.save();
    ctx.translate(6, -14 + bob);
    if (attacking) {
      ctx.rotate(-0.8);
    } else {
      ctx.rotate(0.1);
    }

    ctx.fillStyle = crystal;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(24, 0); // Tip
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();

    if (attacking && !hit) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(12, 0, 18, -0.7, 0.7);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // WORLD 4 — VOLCANO: INFERNAL MAGMA BRUTE
  // ==========================================
  private renderVolcanicBrute(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    attacking: boolean,
    hit: boolean
  ) {
    const obsidian = hit ? '#ffffff' : '#18181b';
    const magma = hit ? '#ffffff' : '#ef4444';
    const flame = hit ? '#ffffff' : '#f97316';

    // Demon Obsidian Horns
    ctx.fillStyle = magma;
    ctx.beginPath();
    ctx.moveTo(-6, -30 + bob);
    ctx.lineTo(-15, -46 + bob);
    ctx.lineTo(-2, -32 + bob);

    ctx.moveTo(2, -32 + bob);
    ctx.lineTo(15, -46 + bob);
    ctx.lineTo(6, -30 + bob);
    ctx.fill();

    // Rocky Head
    ctx.fillStyle = obsidian;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 13, 0, Math.PI * 2);
    ctx.fill();

    // Fiery Yellow Eyes
    ctx.fillStyle = '#facc15';
    ctx.fillRect(3, -31 + bob, 4, 4);
    ctx.fillRect(8, -31 + bob, 4, 4);

    // Magma Chest Veins
    ctx.fillStyle = obsidian;
    ctx.fillRect(-9, -18 + bob, 18, 15);

    ctx.fillStyle = flame;
    ctx.fillRect(-6, -15 + bob, 12, 3);
    ctx.fillRect(-4, -10 + bob, 8, 3);

    // Legs
    ctx.fillStyle = obsidian;
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    // Magma Battleaxe
    ctx.save();
    ctx.translate(6, -14 + bob);
    if (attacking) {
      ctx.rotate(-1.2);
    } else {
      ctx.rotate(0.2);
    }

    ctx.fillStyle = '#451a03'; // Handle
    ctx.fillRect(0, -2, 18, 4);

    // Fiery Axe Head
    ctx.fillStyle = magma;
    ctx.beginPath();
    ctx.moveTo(14, -12);
    ctx.lineTo(24, -6);
    ctx.lineTo(24, 6);
    ctx.lineTo(14, 12);
    ctx.closePath();
    ctx.fill();

    if (attacking && !hit) {
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(18, 0, 22, -0.8, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // WORLD 5 — DARK LANDS: SHADOW VOID WRAITH
  // ==========================================
  private renderShadowWraith(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    attacking: boolean,
    hit: boolean
  ) {
    const shadow = hit ? '#ffffff' : '#3b0764';
    const voidGlow = hit ? '#ffffff' : '#c084fc';
    const eyeRed = hit ? '#ffffff' : '#ef4444';

    // Floating Void Hood
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(0, -30 + bob, 14, 0, Math.PI * 2);
    ctx.fill();

    // Spectral Void Face
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -29 + bob, 9, 0, Math.PI * 2);
    ctx.fill();

    // 3 Piercing Crimson Eyes
    ctx.fillStyle = eyeRed;
    ctx.fillRect(-3, -32 + bob, 3, 3);
    ctx.fillRect(2, -32 + bob, 3, 3);
    ctx.fillRect(6, -32 + bob, 3, 3);

    // Tattered Phantom Cloak
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.moveTo(-10, -18 + bob);
    ctx.lineTo(10, -18 + bob);
    ctx.lineTo(14 + walk * 3, 0);
    ctx.lineTo(-14 - walk * 3, 0);
    ctx.closePath();
    ctx.fill();

    // Void Scythe
    ctx.save();
    ctx.translate(6, -14 + bob);
    if (attacking) {
      ctx.rotate(-1.0);
    } else {
      ctx.rotate(0.3);
    }

    ctx.fillStyle = voidGlow;
    ctx.fillRect(0, -2, 20, 3);

    // Crescent Scythe Blade
    ctx.beginPath();
    ctx.moveTo(18, -12);
    ctx.quadraticCurveTo(28, 0, 18, 12);
    ctx.lineTo(22, 0);
    ctx.closePath();
    ctx.fill();

    if (attacking && !hit) {
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(20, 0, 24, -0.8, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // WORLD 6 — FINAL WORLD: CITADEL ELITE WARLORD
  // ==========================================
  private renderCitadelWarlord(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    attacking: boolean,
    hit: boolean
  ) {
    const steel = hit ? '#ffffff' : '#334155';
    const gold = hit ? '#ffffff' : '#facc15';
    const cape = hit ? '#ffffff' : '#7f1d1d';
    const redGlow = hit ? '#ffffff' : '#dc2626';

    // Crimson Cape
    ctx.fillStyle = cape;
    ctx.fillRect(-12, -22 + bob, 24, 20);

    // Heavy Horned Helm
    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.arc(0, -30 + bob, 13, 0, Math.PI * 2);
    ctx.fill();

    // Helm Horns
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(-8, -34 + bob);
    ctx.lineTo(-16, -46 + bob);
    ctx.lineTo(-3, -34 + bob);

    ctx.moveTo(3, -34 + bob);
    ctx.lineTo(16, -46 + bob);
    ctx.lineTo(8, -34 + bob);
    ctx.fill();

    // Visor Slit with Glowing Red Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-4, -32 + bob, 12, 4);
    ctx.fillStyle = redGlow;
    ctx.fillRect(2, -31 + bob, 5, 2);

    // Heavy Plate Armor & Spiked Pauldrons
    ctx.fillStyle = steel;
    ctx.fillRect(-10, -18 + bob, 20, 15);
    ctx.fillStyle = gold;
    ctx.fillRect(-12, -20 + bob, 5, 6);
    ctx.fillRect(7, -20 + bob, 5, 6);

    // Legs
    ctx.fillStyle = steel;
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    // Heavy Jagged Greatsword
    ctx.save();
    ctx.translate(8, -14 + bob);
    if (attacking) {
      ctx.rotate(-1.1);
    } else {
      ctx.rotate(0.2);
    }

    ctx.fillStyle = gold; // Crossguard
    ctx.fillRect(-2, -6, 4, 12);

    ctx.fillStyle = steel; // Blade
    ctx.fillRect(2, -4, 22, 8);
    ctx.fillStyle = redGlow; // Rune Core
    ctx.fillRect(4, -1, 18, 2);

    if (attacking && !hit) {
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(16, 0, 24, -0.8, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }
}
