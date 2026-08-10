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
  // WORLD 1 — FOREST: HUMAN FOREST ROGUE
  // ==========================================
  private renderForestGoblinWarrior(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    attacking: boolean,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#fed7aa'; // Human skin tone
    const hair = hit ? '#ffffff' : '#27272a'; // Dark hair
    const vest = hit ? '#ffffff' : '#15803d'; // Forest green tactical vest
    const shirt = hit ? '#ffffff' : '#78350f'; // Tan inner shirt
    const steel = hit ? '#ffffff' : '#94a3b8'; // Steel blade

    // Human Head & Face
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    // Human Messy Hair & Headband
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, -31 + bob, 12, Math.PI, Math.PI * 2);
    ctx.fill();

    // Red Headband Stripe
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-10, -32 + bob, 20, 3);

    // Human Face Details (Eyes, Nose, Brow)
    ctx.fillStyle = '#0f172a'; // Eye
    ctx.fillRect(3, -29 + bob, 3, 3);
    ctx.fillStyle = '#9a3412'; // Mouth/Stubble
    ctx.fillRect(2, -22 + bob, 4, 1.5);

    // Human Neck & Torso (Inner Shirt + Forest Vest)
    ctx.fillStyle = skin;
    ctx.fillRect(-3, -19 + bob, 6, 3); // Neck

    ctx.fillStyle = shirt;
    ctx.fillRect(-8, -16 + bob, 16, 12); // Inner shirt

    ctx.fillStyle = vest; // Green Vest Lapels
    ctx.fillRect(-9, -16 + bob, 4, 12);
    ctx.fillRect(5, -16 + bob, 4, 12);

    // Belt
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-9, -5 + bob, 18, 3);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2, -5 + bob, 4, 3);

    // Human Trousers & Boots
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(-7 + walk * 4, -4, 6, 6);
    ctx.fillRect(1 - walk * 4, -4, 6, 6);

    ctx.fillStyle = '#27272a'; // Boots
    ctx.fillRect(-8 + walk * 4, -1, 7, 3);
    ctx.fillRect(1 - walk * 4, -1, 7, 3);

    // Weapon Arm (Human Fighter Dagger)
    ctx.save();
    ctx.translate(5, -12 + bob);
    if (attacking) {
      ctx.rotate(-0.9);
    } else {
      ctx.rotate(0.2);
    }

    ctx.fillStyle = skin; // Human Arm
    ctx.fillRect(-2, -2, 6, 5);

    ctx.fillStyle = '#451a03'; // Handle
    ctx.fillRect(4, -2, 4, 3);

    // Steel Dagger Blade
    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.moveTo(8, -3);
    ctx.lineTo(20, -1);
    ctx.lineTo(24, 0); // Tip
    ctx.lineTo(20, 2);
    ctx.lineTo(8, 3);
    ctx.closePath();
    ctx.fill();

    if (attacking && !hit) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(12, 0, 18, -0.6, 0.6);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // WORLD 2 — DESERT: HUMAN DESERT RAIDER
  // ==========================================
  private renderDesertRaider(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    attacking: boolean,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#e0a96d'; // Bronze human skin tone
    const wrap = hit ? '#ffffff' : '#d97706'; // Desert tunic wrap
    const scarf = hit ? '#ffffff' : '#78350f'; // Dark brown scarf
    const steel = hit ? '#ffffff' : '#f1f5f9'; // Scimitar steel

    // Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    // Desert Head Scarf / Hood
    ctx.fillStyle = wrap;
    ctx.beginPath();
    ctx.arc(0, -30 + bob, 12, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // Dark Human Hair Bangs
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-4, -33 + bob, 8, 3);

    // Human Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -29 + bob, 3, 3);

    // Face Scarf / Draped Cloth
    ctx.fillStyle = scarf;
    ctx.fillRect(-6, -24 + bob, 12, 6);

    // Muscular Wrapped Body
    ctx.fillStyle = skin;
    ctx.fillRect(-8, -17 + bob, 16, 13);
    ctx.fillStyle = wrap;
    ctx.fillRect(-9, -11 + bob, 18, 6);

    // Legs
    ctx.fillStyle = scarf;
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    // Curved Scimitar
    ctx.save();
    ctx.translate(6, -12 + bob);
    if (attacking) {
      ctx.rotate(-1.1);
    } else {
      ctx.rotate(0.3);
    }

    ctx.fillStyle = skin;
    ctx.fillRect(-2, -2, 5, 4);

    ctx.fillStyle = '#78350f'; // Hilt
    ctx.fillRect(3, -2, 3, 4);

    // Steel Blade
    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.moveTo(6, -2);
    ctx.quadraticCurveTo(16, -10, 26, -4);
    ctx.quadraticCurveTo(18, 2, 6, 3);
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
  // WORLD 3 — ICE: HUMAN WINTER MERCENARY
  // ==========================================
  private renderIceStalker(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    attacking: boolean,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#ffedd5'; // Fair human skin tone
    const coat = hit ? '#ffffff' : '#0284c7'; // Blue winter parka
    const fur = hit ? '#ffffff' : '#f8fafc'; // White fur trim
    const steel = hit ? '#ffffff' : '#e2e8f0';

    // Hooded Head
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 13, 0, Math.PI * 2);
    ctx.fill();

    // Fur Hood Trim around Face
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 13, -Math.PI / 3, Math.PI / 3);
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Human Face
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(1, -28 + bob, 8, 0, Math.PI * 2);
    ctx.fill();

    // Human Facial Features
    ctx.fillStyle = '#0f172a'; // Eye
    ctx.fillRect(3, -29 + bob, 3, 3);
    ctx.fillStyle = '#3f3f46'; // Beard/stubble
    ctx.fillRect(1, -23 + bob, 6, 2.5);

    // Thick Winter Coat Body
    ctx.fillStyle = coat;
    ctx.fillRect(-9, -18 + bob, 18, 14);

    // White Fur Collar
    ctx.fillStyle = fur;
    ctx.fillRect(-10, -19 + bob, 20, 4);

    // Thermal Pants & Boots
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    // Ice Hatchet / Axe
    ctx.save();
    ctx.translate(6, -12 + bob);
    if (attacking) {
      ctx.rotate(-0.9);
    } else {
      ctx.rotate(0.2);
    }

    ctx.fillStyle = '#451a03'; // Wooden handle
    ctx.fillRect(0, -2, 16, 3);

    ctx.fillStyle = steel; // Axe head
    ctx.beginPath();
    ctx.moveTo(12, -8);
    ctx.lineTo(20, -5);
    ctx.lineTo(20, 5);
    ctx.lineTo(12, 8);
    ctx.closePath();
    ctx.fill();

    if (attacking && !hit) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(14, 0, 18, -0.7, 0.7);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // WORLD 4 — VOLCANO: HUMAN ASH BRAWLER
  // ==========================================
  private renderVolcanicBrute(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    attacking: boolean,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#d97706'; // Tanned olive human skin
    const jacket = hit ? '#ffffff' : '#18181b'; // Dark charcoal jacket
    const accent = hit ? '#ffffff' : '#f97316'; // Orange accent
    const steel = hit ? '#ffffff' : '#71717a';

    // Human Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    // Dark Hair & Tactical Forehead Goggles
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(0, -31 + bob, 12, Math.PI, Math.PI * 2);
    ctx.fill();

    // Goggles resting on forehead
    ctx.fillStyle = accent;
    ctx.fillRect(-8, -33 + bob, 16, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-5, -32 + bob, 4, 2);
    ctx.fillRect(1, -32 + bob, 4, 2);

    // Human Eyes & Mouth
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -29 + bob, 3, 3);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(2, -23 + bob, 4, 2);

    // Heat-Resistant Vest
    ctx.fillStyle = jacket;
    ctx.fillRect(-9, -17 + bob, 18, 13);
    ctx.fillStyle = accent;
    ctx.fillRect(-9, -13 + bob, 18, 3);

    // Trousers
    ctx.fillStyle = '#27272a';
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    // Steel Baton / Mace
    ctx.save();
    ctx.translate(6, -12 + bob);
    if (attacking) {
      ctx.rotate(-1.1);
    } else {
      ctx.rotate(0.2);
    }

    ctx.fillStyle = skin;
    ctx.fillRect(-2, -2, 5, 4);

    ctx.fillStyle = steel;
    ctx.fillRect(3, -2, 16, 4);
    ctx.fillStyle = accent;
    ctx.fillRect(14, -4, 6, 8); // Flanged head

    if (attacking && !hit) {
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(14, 0, 20, -0.8, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // WORLD 5 — DARK LANDS: HUMAN SHADOW ASSASSIN
  // ==========================================
  private renderShadowWraith(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    attacking: boolean,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#ffedd5'; // Pale human skin tone
    const coat = hit ? '#ffffff' : '#3b0764'; // Midnight purple coat
    const accent = hit ? '#ffffff' : '#c084fc';
    const steel = hit ? '#ffffff' : '#f1f5f9';

    // Human Head & Dark Hair
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -29 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    // Slicked Dark Hair
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -32 + bob, 12, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();

    // Fierce Human Eyes
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(3, -30 + bob, 3, 3);

    // Assassin Face Bandana / Lower Mask
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-6, -26 + bob, 12, 6);

    // High-Collared Trench Coat Body
    ctx.fillStyle = coat;
    ctx.fillRect(-9, -18 + bob, 18, 14);

    // Collar
    ctx.fillStyle = accent;
    ctx.fillRect(-10, -19 + bob, 4, 6);
    ctx.fillRect(6, -19 + bob, 4, 6);

    // Trousers
    ctx.fillStyle = '#020617';
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    // Tactical Dagger
    ctx.save();
    ctx.translate(6, -12 + bob);
    if (attacking) {
      ctx.rotate(-1.0);
    } else {
      ctx.rotate(0.3);
    }

    ctx.fillStyle = skin;
    ctx.fillRect(-2, -2, 5, 4);

    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.moveTo(3, -2);
    ctx.lineTo(20, 0); // Tip
    ctx.lineTo(3, 2);
    ctx.closePath();
    ctx.fill();

    if (attacking && !hit) {
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(14, 0, 20, -0.8, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // WORLD 6 — FINAL WORLD: ELITE HUMAN ENFORCER
  // ==========================================
  private renderCitadelWarlord(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    attacking: boolean,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#fed7aa'; // Human skin
    const armor = hit ? '#ffffff' : '#1e293b'; // Slate armor
    const gold = hit ? '#ffffff' : '#facc15'; // Gold trims
    const steel = hit ? '#ffffff' : '#e2e8f0';

    // Human Head with Tactical Visor
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -29 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    // Helmet / Cap with Visor
    ctx.fillStyle = armor;
    ctx.beginPath();
    ctx.arc(0, -32 + bob, 12, Math.PI, Math.PI * 2);
    ctx.fill();

    // Visor covering upper eyes (showing human chin/lips)
    ctx.fillStyle = '#ef4444'; // Red visor strip
    ctx.fillRect(-2, -31 + bob, 10, 3);

    // Human Mouth/Jaw
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -23 + bob, 4, 1.5);

    // Elite Tactical Armor Vest
    ctx.fillStyle = armor;
    ctx.fillRect(-10, -18 + bob, 20, 14);
    ctx.fillStyle = gold;
    ctx.fillRect(-10, -18 + bob, 3, 14);
    ctx.fillRect(7, -18 + bob, 3, 14);

    // Trousers
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    // Energy Baton
    ctx.save();
    ctx.translate(6, -12 + bob);
    if (attacking) {
      ctx.rotate(-1.1);
    } else {
      ctx.rotate(0.2);
    }

    ctx.fillStyle = skin;
    ctx.fillRect(-2, -2, 5, 4);

    ctx.fillStyle = steel;
    ctx.fillRect(3, -2, 18, 4);
    ctx.fillStyle = gold;
    ctx.fillRect(18, -3, 3, 6);

    if (attacking && !hit) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(14, 0, 22, -0.8, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }
}
