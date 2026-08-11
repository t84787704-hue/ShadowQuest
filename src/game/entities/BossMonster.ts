import { Entity } from './Entity';
import { Player } from './Player';
import { TileMap } from '../world/TileMap';
import { ParticleSystem } from '../core/ParticleSystem';
import { audioEngine } from '../audio/AudioEngine';
import { BossProjectile } from './BossProjectile';

export type BossState =
  | 'IDLE'
  | 'INTRO'
  | 'COMBAT'
  | 'WINDUP'
  | 'ATTACKING'
  | 'VULNERABLE'
  | 'PHASE_CHANGE'
  | 'DEAD';

export interface BossInfo {
  name: string;
  worldId: number;
  maxHp: number;
  attackDamage: number;
  baseSpeed: number;
  maxPhases: number;
  primaryColor: string;
  glowColor: string;
}

export const BOSS_SPECS: Record<number, BossInfo> = {
  1: {
    name: 'FOREST WARLORD — COMMANDER RODERICK',
    worldId: 1,
    maxHp: 480,
    attackDamage: 9,
    baseSpeed: 2.3,
    maxPhases: 2,
    primaryColor: '#15803d',
    glowColor: '#4ade80',
  },
  2: {
    name: 'DESERT OVERLORD — GENERAL MALIK',
    worldId: 2,
    maxHp: 650,
    attackDamage: 11,
    baseSpeed: 2.4,
    maxPhases: 2,
    primaryColor: '#b45309',
    glowColor: '#facc15',
  },
  3: {
    name: 'FROST WARLORD — CAPTAIN GUNNAR',
    worldId: 3,
    maxHp: 850,
    attackDamage: 12,
    baseSpeed: 2.5,
    maxPhases: 2,
    primaryColor: '#0284c7',
    glowColor: '#38bdf8',
  },
  4: {
    name: 'VOLCANIC OVERLORD — WARLORD IGNIS',
    worldId: 4,
    maxHp: 1100,
    attackDamage: 14,
    baseSpeed: 2.6,
    maxPhases: 3,
    primaryColor: '#b91c1c',
    glowColor: '#f97316',
  },
  5: {
    name: 'VOID SHADOW MASTER — ARCH-DUKE MALAKOR',
    worldId: 5,
    maxHp: 1400,
    attackDamage: 15,
    baseSpeed: 2.7,
    maxPhases: 3,
    primaryColor: '#6b21a8',
    glowColor: '#c084fc',
  },
  6: {
    name: 'CITADEL SOVEREIGN — GRAND OVERLORD MARCUS',
    worldId: 6,
    maxHp: 1800,
    attackDamage: 16,
    baseSpeed: 2.8,
    maxPhases: 3,
    primaryColor: '#854d0e',
    glowColor: '#facc15',
  },
};

export class BossMonster extends Entity {
  public worldId: number;
  public bossName: string;
  public hp: number;
  public maxHp: number;
  public attackDamage: number;
  public baseSpeed: number;
  public currentPhase: number = 1;
  public maxPhases: number = 2;

  public state: BossState = 'IDLE';
  public introTimer: number = 0;
  public windupTimer: number = 0;
  public attackTimer: number = 0;
  public vulnerableTimer: number = 0;
  public phaseTimer: number = 0;
  public attackCooldown: number = 1.5;
  public hitFlashTimer: number = 0;
  public deathTimer: number = 0;

  public isTriggered: boolean = false;
  public isInvulnerable: boolean = false;
  public activeAttackType: 'MELEE' | 'SHOCKWAVE' | 'PROJECTILE' | 'TELEPORT' = 'MELEE';

  public animFrame: number = 0;
  public animTime: number = 0;

  // Status effects from weapons
  public slowTimer: number = 0;
  public burnTimer: number = 0;
  public burnTickTimer: number = 0;

  constructor(x: number, y: number, levelId: string = '1-5') {
    const [wStr] = levelId.split('-');
    const w = parseInt(wStr, 10) || 1;
    const spec = BOSS_SPECS[w] || BOSS_SPECS[1];

    const width = w === 6 ? 88 : w >= 4 ? 82 : 76;
    const height = w === 6 ? 96 : w >= 4 ? 88 : 80;

    super(x, y, width, height);

    this.worldId = w;
    this.bossName = spec.name;
    this.maxHp = spec.maxHp;
    this.hp = spec.maxHp;
    this.attackDamage = spec.attackDamage;
    this.baseSpeed = spec.baseSpeed;
    this.maxPhases = spec.maxPhases;
  }

  public update(
    dt: number,
    player: Player,
    tileMap: TileMap,
    particles: ParticleSystem,
    projectiles: BossProjectile[]
  ) {
    if (!this.isAlive) return;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.slowTimer > 0) this.slowTimer -= dt;

    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer -= dt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.4;
        this.takeDamage(6, particles);
        particles.createSlashSparks(this.x + this.width / 2, this.y + 15, this.facingRight, [
          '#f97316',
          '#ef4444',
        ]);
      }
    }

    // Animation frame timer
    this.animTime += dt;
    if (this.animTime >= 0.1) {
      this.animTime = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Gravity & Physics
    this.vy += 0.5;
    if (this.vy > 12) this.vy = 12;
    tileMap.resolveEntityCollision(this);

    // Hazard Pit recovery
    if (this.y > tileMap.heightInPixels - 60) {
      this.y = tileMap.heightInPixels - 180;
      this.vy = -6;
    }

    // Check Trigger
    if (!this.isTriggered && dist < 420 && player.isAlive) {
      this.isTriggered = true;
      this.state = 'INTRO';
      this.introTimer = 1.2;
      audioEngine.playCustomSFX('finisher');
      particles.createVictoryConfetti(this.x + this.width / 2, this.y);
    }

    // STATE MACHINE
    switch (this.state) {
      case 'IDLE':
        this.vx = 0;
        break;

      case 'INTRO':
        this.vx = 0;
        this.introTimer -= dt;
        if (this.introTimer <= 0) {
          this.state = 'COMBAT';
        }
        break;

      case 'COMBAT': {
        this.isInvulnerable = false;
        this.facingRight = dx > 0;
        const currentSpeed = (this.slowTimer > 0 ? this.baseSpeed * 0.6 : this.baseSpeed) * (1 + (this.currentPhase - 1) * 0.18);

        if (this.attackCooldown > 0) {
          this.attackCooldown -= dt;
        }

        // Body contact damage
        if (this.intersects(player) && player.isAlive) {
          player.takeDamage(Math.round(this.attackDamage * 0.6), particles);
        }

        const attackRange = 70 + (this.worldId >= 4 ? 20 : 0);

        if (dist > attackRange) {
          // Approach player
          this.vx = this.facingRight ? currentSpeed : -currentSpeed;
        } else {
          // In range -> Windup attack
          this.vx = 0;
          if (this.attackCooldown <= 0) {
            this.state = 'WINDUP';
            this.windupTimer = Math.max(0.28, 0.45 - (this.currentPhase - 1) * 0.08);
            this.chooseAttackType(dist);
          }
        }
        break;
      }

      case 'WINDUP':
        this.vx = 0;
        this.windupTimer -= dt;
        if (this.windupTimer <= 0) {
          this.state = 'ATTACKING';
          this.attackTimer = 0.35;
          this.executeAttack(player, particles, projectiles);
        }
        break;

      case 'ATTACKING':
        this.vx = 0;
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
          // Transition into Vulnerable Recovery Window
          this.state = 'VULNERABLE';
          this.vulnerableTimer = Math.max(0.7, 1.25 - (this.currentPhase - 1) * 0.2);
        }
        break;

      case 'VULNERABLE':
        // Boss is open for counter attacks!
        this.vx = 0;
        this.vulnerableTimer -= dt;
        if (this.vulnerableTimer <= 0) {
          this.state = 'COMBAT';
          this.attackCooldown = Math.max(0.8, 1.6 - (this.currentPhase - 1) * 0.3);
        }
        break;

      case 'PHASE_CHANGE':
        this.vx = 0;
        this.isInvulnerable = true;
        this.phaseTimer -= dt;
        if (this.phaseTimer <= 0) {
          this.isInvulnerable = false;
          this.state = 'COMBAT';
          this.attackCooldown = 0.5;
        }
        break;

      case 'DEAD':
        this.vx = 0;
        this.deathTimer += dt;
        if (Math.random() < 0.3) {
          particles.createHitBloodOrSparks(
            this.x + Math.random() * this.width,
            this.y + Math.random() * this.height
          );
        }
        break;
    }
  }

  private chooseAttackType(distToPlayer: number) {
    const roll = Math.random();
    if (distToPlayer > 120) {
      this.activeAttackType = roll < 0.6 ? 'PROJECTILE' : 'SHOCKWAVE';
    } else {
      if (this.worldId >= 5 && roll < 0.35) {
        this.activeAttackType = 'TELEPORT';
      } else if (roll < 0.5) {
        this.activeAttackType = 'MELEE';
      } else {
        this.activeAttackType = 'SHOCKWAVE';
      }
    }
  }

  private executeAttack(player: Player, particles: ParticleSystem, projectiles: BossProjectile[]) {
    const dir = this.facingRight ? 1 : -1;
    const originX = this.x + (this.facingRight ? this.width + 10 : -20);
    const originY = this.y + 30;

    switch (this.activeAttackType) {
      case 'MELEE':
        audioEngine.playBossAttackSwing('heavy_punch');
        particles.createSlashSparks(originX, originY, this.facingRight, [
          BOSS_SPECS[this.worldId].primaryColor,
          BOSS_SPECS[this.worldId].glowColor,
        ]);
        if (this.intersects(player) && player.isAlive) {
          player.takeDamage(this.attackDamage, particles);
        }
        break;

      case 'SHOCKWAVE':
        audioEngine.playBossAttackSwing('finisher');
        particles.createCombatImpact(
          this.x + this.width / 2,
          this.y + this.height - 10,
          this.facingRight,
          ['#ef4444', '#f97316', '#facc15']
        );
        // Spawn floor crawling shockwave
        projectiles.push(
          new BossProjectile({
            x: originX,
            y: this.y + this.height - 24,
            vx: dir * (5.5 + this.currentPhase * 0.8),
            vy: 0,
            width: 28,
            height: 32,
            damage: Math.round(this.attackDamage * 0.85),
            color: BOSS_SPECS[this.worldId].glowColor,
            glowColor: BOSS_SPECS[this.worldId].primaryColor,
            isShockwave: true,
            type: this.getProjectileType(),
          })
        );
        break;

      case 'PROJECTILE':
        audioEngine.playBossAttackSwing('kick');
        particles.createSlashSparks(originX, originY, this.facingRight, [
          BOSS_SPECS[this.worldId].glowColor,
          '#ffffff',
        ]);
        // Fire 1 to 3 elemental projectiles
        const count = this.currentPhase >= 2 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          const spreadY = (i - (count - 1) / 2) * 1.8;
          projectiles.push(
            new BossProjectile({
              x: originX,
              y: originY + i * 12,
              vx: dir * (6.0 + this.currentPhase * 0.6),
              vy: spreadY,
              width: 22,
              height: 22,
              damage: Math.round(this.attackDamage * 0.8),
              color: BOSS_SPECS[this.worldId].glowColor,
              glowColor: BOSS_SPECS[this.worldId].primaryColor,
              isShockwave: false,
              type: this.getProjectileType(),
            })
          );
        }
        break;

      case 'TELEPORT':
        audioEngine.playBossAttackSwing('spin_kick');
        particles.createCombatImpact(this.x + this.width / 2, this.y + this.height / 2, true, [
          '#c084fc',
          '#7e22ce',
        ]);
        // Teleport behind player
        this.x = player.x + (player.facingRight ? -80 : 80);
        this.facingRight = player.x > this.x;
        particles.createCombatImpact(this.x + this.width / 2, this.y + this.height / 2, true, [
          '#c084fc',
          '#ffffff',
        ]);
        break;
    }
  }

  private getProjectileType(): 'vine' | 'sand' | 'ice' | 'fire' | 'shadow' | 'chaos' {
    switch (this.worldId) {
      case 1:
        return 'vine';
      case 2:
        return 'vine';
      case 3:
        return 'sand';
      case 4:
        return 'ice';
      case 5:
        return 'shadow';
      default:
        return 'chaos';
    }
  }

  public takeDamage(damage: number, particles: ParticleSystem, attackType?: string): boolean {
    if (!this.isAlive || this.isInvulnerable || this.state === 'INTRO') return false;

    // Vulnerable window bonus damage!
    const isVulnerable = this.state === 'VULNERABLE';
    const actualDamage = isVulnerable ? Math.round(damage * 1.35) : damage;

    this.hp -= actualDamage;
    this.hitFlashTimer = 0.22;
    audioEngine.playHitImpact('boss', attackType);

    const textX = this.x + this.width / 2;
    const textY = this.y - 10;

    if (isVulnerable) {
      particles.createFloatingText(textX, textY - 14, `CRITICAL! -${actualDamage}`, '#facc15', 20);
    } else {
      particles.createFloatingText(textX, textY, `-${actualDamage}`, '#ef4444', 16);
    }

    particles.createHitBloodOrSparks(this.x + this.width / 2, this.y + this.height / 2);

    // Check Phase Change
    const phaseThresholds =
      this.maxPhases === 3
        ? [this.maxHp * 0.66, this.maxHp * 0.33]
        : [this.maxHp * 0.5];

    if (
      this.currentPhase === 1 &&
      this.hp <= phaseThresholds[0] &&
      this.maxPhases >= 2
    ) {
      this.triggerPhaseChange(2, particles);
    } else if (
      this.currentPhase === 2 &&
      this.maxPhases === 3 &&
      this.hp <= phaseThresholds[1]
    ) {
      this.triggerPhaseChange(3, particles);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'DEAD';
      this.isAlive = false;
      audioEngine.playVictory();
      particles.createVictoryConfetti(this.x + this.width / 2, this.y + 20);
      particles.createFloatingText(
        this.x + this.width / 2,
        this.y - 30,
        'BOSS DEFEATED!',
        '#22c55e',
        24
      );
    }

    return true;
  }

  private triggerPhaseChange(nextPhase: number, particles: ParticleSystem) {
    this.currentPhase = nextPhase;
    this.state = 'PHASE_CHANGE';
    this.phaseTimer = 1.0;
    audioEngine.playCustomSFX('finisher');
    particles.createVictoryConfetti(this.x + this.width / 2, this.y);
    particles.createFloatingText(
      this.x + this.width / 2,
      this.y - 25,
      `PHASE ${nextPhase} — ENRAGED!`,
      '#f97316',
      22
    );
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    if (!this.isAlive && this.deathTimer > 2.0) return;

    const px = Math.round(this.x - offsetX);
    const py = Math.round(this.y - offsetY);

    ctx.save();
    ctx.translate(px + this.width / 2, py + this.height);

    const scaleX = this.facingRight ? 1 : -1;
    ctx.scale(scaleX, 1);

    const bob = Math.sin(this.animTime * 6) * 2.5;
    const isFlash = this.hitFlashTimer > 0;
    const isWindup = this.state === 'WINDUP';
    const isAttacking = this.state === 'ATTACKING';
    const isVulnerable = this.state === 'VULNERABLE';
    const isPhaseChange = this.state === 'PHASE_CHANGE';

    if (isFlash) {
      ctx.rotate(-0.1); // Hit recoil
    } else if (isWindup) {
      ctx.rotate(-0.08); // Windup pull back
    } else if (isAttacking) {
      ctx.rotate(0.12); // Forward strike lean
    }

    // Render Indicator above Boss
    if (isWindup) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '900 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ WARNING!', 0, -this.height - 24 + bob);

      // Warning Aura Pulse
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -this.height / 2, this.width * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    } else if (isVulnerable) {
      ctx.fillStyle = '#facc15';
      ctx.font = '900 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💫 OPENING!', 0, -this.height - 24 + bob);
    } else if (isPhaseChange) {
      ctx.fillStyle = '#f97316';
      ctx.font = '900 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔥 ENRAGED!', 0, -this.height - 24 + bob);

      // Enraged Energy Shield
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, -this.height / 2, this.width * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // GROUND SHADOW
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, -2, this.width * 0.55, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // RENDER UNIQUE WORLD BOSS VISUALS
    switch (this.worldId) {
      case 1:
        this.renderForestGuardian(ctx, bob, isFlash, isWindup, isAttacking);
        break;
      case 2:
        this.renderDesertTitan(ctx, bob, isFlash, isWindup, isAttacking);
        break;
      case 3:
        this.renderFrostColossus(ctx, bob, isFlash, isWindup, isAttacking);
        break;
      case 4:
        this.renderVolcanicDemon(ctx, bob, isFlash, isWindup, isAttacking);
        break;
      case 5:
        this.renderShadowMonarch(ctx, bob, isFlash, isWindup, isAttacking);
        break;
      case 6:
      default:
        this.renderGoblinKing(ctx, bob, isFlash, isWindup, isAttacking);
        break;
    }

    ctx.restore();
  }

  // --- UNIQUE WORLD HUMAN BOSS ARTWORK GENERATORS ---

  // World 1: Commander Roderick (Forest Warlord)
  private renderForestGuardian(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const skin = isFlash ? '#ffffff' : '#fed7aa'; // Human skin
    const armor = isFlash ? '#ffffff' : '#15803d'; // Oak-green steel plate
    const gold = isFlash ? '#ffffff' : '#f59e0b'; // Gold trim
    const hair = isFlash ? '#ffffff' : '#451a03'; // Brown hair/beard

    // Green Commander Cape
    ctx.fillStyle = armor;
    ctx.fillRect(-28, -62 + bob, 56, 58);

    // Human Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -70 + bob, 18, 0, Math.PI * 2);
    ctx.fill();

    // Human Facial Features & Braided Beard
    ctx.fillStyle = hair; // Hair
    ctx.beginPath();
    ctx.arc(0, -74 + bob, 19, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = hair; // Beard
    ctx.beginPath();
    ctx.moveTo(-12, -68 + bob);
    ctx.lineTo(0, -48 + bob);
    ctx.lineTo(12, -68 + bob);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, -73 + bob, 5, 4);

    // Heavy Pauldrons & Plate Armor
    ctx.fillStyle = armor;
    ctx.fillRect(-26, -56 + bob, 52, 50);
    ctx.fillStyle = gold;
    ctx.fillRect(-30, -56 + bob, 10, 20); // Shoulder pauldrons
    ctx.fillRect(20, -56 + bob, 10, 20);

    // Heavy Spiked Wooden/Steel War Hammer
    ctx.save();
    ctx.translate(22, -45 + bob);
    if (isWindup) {
      ctx.rotate(-1.4);
    } else if (isAttacking) {
      ctx.rotate(0.9);
    } else {
      ctx.rotate(-0.2);
    }

    ctx.fillStyle = '#78350f';
    ctx.fillRect(-4, -54, 10, 68); // Handle
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-18, -68, 38, 22); // Hammer head

    // Glowing Rune
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(-10, -62, 22, 4);

    if (isAttacking && !isFlash) {
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.9)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, -50, 42, -0.9, 0.9);
      ctx.stroke();
    }

    ctx.restore();
  }

  // World 2: General Malik (Desert Overlord)
  private renderDesertTitan(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const skin = isFlash ? '#ffffff' : '#e0a96d'; // Bronze human skin tone
    const gold = isFlash ? '#ffffff' : '#facc15';
    const crimson = isFlash ? '#ffffff' : '#b91c1c';

    // Crimson Cape
    ctx.fillStyle = crimson;
    ctx.fillRect(-30, -64 + bob, 60, 60);

    // Human Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -72 + bob, 18, 0, Math.PI * 2);
    ctx.fill();

    // Desert Turban / Crown
    ctx.fillStyle = crimson;
    ctx.beginPath();
    ctx.arc(0, -78 + bob, 20, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    ctx.fillStyle = gold;
    ctx.fillRect(-8, -88 + bob, 16, 8); // Gold Crown Brooch

    // Human Face Details (Beard & Eye Scar)
    ctx.fillStyle = '#1c1917'; // Dark beard
    ctx.fillRect(-12, -68 + bob, 24, 10);
    ctx.fillStyle = '#0f172a'; // Eye
    ctx.fillRect(4, -74 + bob, 5, 4);

    // Gold Chestplate & Armor
    ctx.fillStyle = gold;
    ctx.fillRect(-26, -56 + bob, 52, 52);
    ctx.fillStyle = crimson;
    ctx.fillRect(-12, -48 + bob, 24, 30); // Belt sash

    // Giant Golden Scimitar
    ctx.save();
    ctx.translate(26, -40 + bob);
    if (isWindup) {
      ctx.rotate(-1.2);
    } else if (isAttacking) {
      ctx.rotate(0.8);
    }

    ctx.fillStyle = '#78350f'; // Handle
    ctx.fillRect(-4, -10, 8, 30);

    // Curved Executioner Blade
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(4, -50);
    ctx.quadraticCurveTo(28, -30, 32, 0);
    ctx.quadraticCurveTo(12, 10, 4, 10);
    ctx.closePath();
    ctx.fill();

    if (isAttacking && !isFlash) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(12, -20, 42, -0.8, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  // World 3: Captain Gunnar (Frost Warlord)
  private renderFrostColossus(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const skin = isFlash ? '#ffffff' : '#ffedd5'; // Fair human skin tone
    const coat = isFlash ? '#ffffff' : '#0284c7'; // Blue winter coat
    const fur = isFlash ? '#ffffff' : '#f8fafc'; // White fur
    const steel = isFlash ? '#ffffff' : '#e2e8f0';

    // Fur-Lined Winter Coat Body
    ctx.fillStyle = coat;
    ctx.fillRect(-30, -64 + bob, 60, 60);

    // Human Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -72 + bob, 18, 0, Math.PI * 2);
    ctx.fill();

    // Braided Blonde/White Beard & Hair
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -78 + bob, 19, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.beginPath(); // Beard
    ctx.moveTo(-14, -70 + bob);
    ctx.lineTo(0, -46 + bob);
    ctx.lineTo(14, -70 + bob);
    ctx.fill();

    // Cold Blue Eyes
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(4, -75 + bob, 5, 4);

    // White Fur Pauldrons & Collar
    ctx.fillStyle = fur;
    ctx.fillRect(-34, -62 + bob, 68, 12);

    // Giant Frost Battleaxe
    ctx.save();
    ctx.translate(26, -42 + bob);
    if (isWindup) {
      ctx.rotate(-1.3);
    } else if (isAttacking) {
      ctx.rotate(0.9);
    }

    ctx.fillStyle = '#451a03'; // Handle
    ctx.fillRect(-4, -50, 8, 70);

    // Double Axe Head
    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.moveTo(4, -40);
    ctx.lineTo(32, -30);
    ctx.lineTo(32, -10);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();

    if (isAttacking && !isFlash) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.95)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(16, -20, 42, -0.8, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  // World 4: Warlord Ignis (Volcanic Overlord)
  private renderVolcanicDemon(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const skin = isFlash ? '#ffffff' : '#d97706'; // Tanned ash human skin
    const obsidian = isFlash ? '#ffffff' : '#18181b'; // Dark obsidian armor
    const flame = isFlash ? '#ffffff' : '#f97316';

    // Fiery Red/Orange Cape
    ctx.fillStyle = flame;
    ctx.fillRect(-32, -66 + bob, 64, 62);

    // Human Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -72 + bob, 18, 0, Math.PI * 2);
    ctx.fill();

    // Dark Spiky Hair
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -78 + bob, 19, Math.PI, Math.PI * 2);
    ctx.fill();

    // Red War Paint & Stern Human Face
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-10, -76 + bob, 20, 4);

    ctx.fillStyle = '#0f172a'; // Eye
    ctx.fillRect(4, -73 + bob, 5, 4);

    // Obsidian Plate Armor with Lava Trims
    ctx.fillStyle = obsidian;
    ctx.fillRect(-28, -58 + bob, 56, 54);
    ctx.fillStyle = flame;
    ctx.fillRect(-28, -44 + bob, 56, 6); // Lava sash

    // Giant Obsidian Greatsword
    ctx.save();
    ctx.translate(28, -44 + bob);
    if (isWindup) {
      ctx.rotate(-1.5);
    } else if (isAttacking) {
      ctx.rotate(1.0);
    }

    ctx.fillStyle = obsidian;
    ctx.fillRect(-6, -72, 14, 90);
    ctx.fillStyle = flame;
    ctx.fillRect(-2, -68, 6, 82);

    if (isAttacking && !isFlash) {
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.95)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, -30, 48, -0.9, 0.9);
      ctx.stroke();
    }

    ctx.restore();
  }

  // World 5: Arch-Duke Malakor (Void Shadow Master)
  private renderShadowMonarch(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const skin = isFlash ? '#ffffff' : '#ffedd5'; // Pale human skin tone
    const coat = isFlash ? '#ffffff' : '#3b0764'; // Dark violet noble coat
    const accent = isFlash ? '#ffffff' : '#c084fc';

    // Noble Dark Cloak
    ctx.fillStyle = coat;
    ctx.fillRect(-30, -68 + bob, 60, 64);

    // Human Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -74 + bob, 17, 0, Math.PI * 2);
    ctx.fill();

    // Silver Hair
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, -79 + bob, 18, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // Sharp Human Facial Features
    ctx.fillStyle = '#c084fc'; // Violet Eyes
    ctx.fillRect(4, -75 + bob, 5, 4);

    ctx.fillStyle = '#78350f'; // Mouth
    ctx.fillRect(3, -67 + bob, 6, 2);

    // High Collar Noble Coat
    ctx.fillStyle = coat;
    ctx.fillRect(-26, -58 + bob, 52, 54);
    ctx.fillStyle = accent;
    ctx.fillRect(-28, -60 + bob, 8, 20); // High collar flaps
    ctx.fillRect(20, -60 + bob, 8, 20);

    // Shadow Blade
    ctx.save();
    ctx.translate(28, -46 + bob);
    if (isWindup) {
      ctx.rotate(-1.4);
    } else if (isAttacking) {
      ctx.rotate(0.9);
    }

    ctx.fillStyle = accent;
    ctx.fillRect(-3, -60, 6, 80);

    if (isAttacking && !isFlash) {
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.95)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, -20, 48, -0.9, 0.9);
      ctx.stroke();
    }

    ctx.restore();
  }

  // World 6: Grand Overlord Marcus (Citadel Sovereign)
  private renderGoblinKing(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const skin = isFlash ? '#ffffff' : '#fed7aa'; // Human skin
    const armor = isFlash ? '#ffffff' : '#1e293b'; // Slate black armor
    const gold = isFlash ? '#ffffff' : '#facc15'; // Imperial gold
    const ruby = isFlash ? '#ffffff' : '#dc2626';

    // Royal Red Velvet Cape
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-38, -66 + bob, 76, 62);

    // Human Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -74 + bob, 18, 0, Math.PI * 2);
    ctx.fill();

    // Regal Golden Crown
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(-18, -84 + bob);
    ctx.lineTo(-14, -100 + bob);
    ctx.lineTo(-6, -88 + bob);
    ctx.lineTo(0, -104 + bob);
    ctx.lineTo(6, -88 + bob);
    ctx.lineTo(14, -100 + bob);
    ctx.lineTo(18, -84 + bob);
    ctx.closePath();
    ctx.fill();

    // Ruby Crown Gem
    ctx.fillStyle = ruby;
    ctx.fillRect(-4, -92 + bob, 8, 8);

    // Human Goatee Beard & Fierce Eyes
    ctx.fillStyle = '#1c1917'; // Dark hair/beard
    ctx.fillRect(-6, -68 + bob, 12, 8);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, -75 + bob, 5, 4);

    // Golden Imperial Dragon Armor
    ctx.fillStyle = armor;
    ctx.fillRect(-30, -58 + bob, 60, 56);
    ctx.fillStyle = gold;
    ctx.fillRect(-34, -58 + bob, 8, 20); // Spiked gold pauldrons
    ctx.fillRect(26, -58 + bob, 8, 20);

    // Fiery Royal Sovereign Greatsword
    ctx.save();
    ctx.translate(32, -48 + bob);
    if (isWindup) {
      ctx.rotate(-1.5);
    } else if (isAttacking) {
      ctx.rotate(1.1);
    }

    ctx.fillStyle = gold; // Guard
    ctx.fillRect(-18, -10, 36, 10);
    ctx.fillStyle = ruby; // Greatsword blade
    ctx.fillRect(-6, -80, 12, 70);

    if (isAttacking && !isFlash) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.95)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, -35, 52, -0.9, 0.9);
      ctx.stroke();
    }

    ctx.restore();
  }
}
