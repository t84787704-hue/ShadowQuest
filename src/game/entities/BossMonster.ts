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
    name: 'FOREST GUARDIAN — ELDER TREANT',
    worldId: 1,
    maxHp: 280,
    attackDamage: 8,
    baseSpeed: 2.1,
    maxPhases: 2,
    primaryColor: '#15803d',
    glowColor: '#4ade80',
  },
  2: {
    name: 'DESERT BEHEMOTH — SAND TITAN',
    worldId: 2,
    maxHp: 360,
    attackDamage: 10,
    baseSpeed: 2.2,
    maxPhases: 2,
    primaryColor: '#b45309',
    glowColor: '#facc15',
  },
  3: {
    name: 'FROST COLOSSUS — GLACIER GOLEM',
    worldId: 3,
    maxHp: 440,
    attackDamage: 11,
    baseSpeed: 2.3,
    maxPhases: 2,
    primaryColor: '#0284c7',
    glowColor: '#38bdf8',
  },
  4: {
    name: 'VOLCANIC MAGMA DEMON — OBSIDIAN TITAN',
    worldId: 4,
    maxHp: 540,
    attackDamage: 13,
    baseSpeed: 2.4,
    maxPhases: 3,
    primaryColor: '#b91c1c',
    glowColor: '#f97316',
  },
  5: {
    name: 'SHADOW VOID MONARCH — NIGHTMARE SPECTRE',
    worldId: 5,
    maxHp: 650,
    attackDamage: 14,
    baseSpeed: 2.5,
    maxPhases: 3,
    primaryColor: '#6b21a8',
    glowColor: '#c084fc',
  },
  6: {
    name: 'GOBLIN OVERLORD KING — CHAOS SOVEREIGN',
    worldId: 6,
    maxHp: 800,
    attackDamage: 15,
    baseSpeed: 2.6,
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
        return 'sand';
      case 3:
        return 'ice';
      case 4:
        return 'fire';
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

  // --- UNIQUE WORLD BOSS ARTWORK GENERATORS ---

  // World 1: Ancient Treant Guardian Warlord
  private renderForestGuardian(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const bark = isFlash ? '#ffffff' : '#3f2305';
    const darkBark = isFlash ? '#e2e8f0' : '#271202';
    const leaf = isFlash ? '#ffffff' : '#15803d';
    const eye = isFlash ? '#ffffff' : '#facc15';

    // Mossy Canopy Pauldrons
    ctx.fillStyle = leaf;
    ctx.beginPath();
    ctx.arc(-28, -62 + bob, 22, 0, Math.PI * 2);
    ctx.arc(28, -62 + bob, 22, 0, Math.PI * 2);
    ctx.arc(0, -86 + bob, 26, 0, Math.PI * 2);
    ctx.fill();

    // Ancient Bark Body
    ctx.fillStyle = bark;
    ctx.fillRect(-26, -58 + bob, 52, 54);
    ctx.fillStyle = darkBark;
    ctx.fillRect(-18, -48 + bob, 36, 38);

    // Root Beard / Tendrils
    ctx.fillStyle = darkBark;
    ctx.beginPath();
    ctx.moveTo(-16, -50 + bob);
    ctx.lineTo(-10, -32 + bob);
    ctx.lineTo(-4, -50 + bob);
    ctx.lineTo(4, -50 + bob);
    ctx.lineTo(10, -32 + bob);
    ctx.lineTo(16, -50 + bob);
    ctx.fill();

    // Glowing Yellow Eyes
    ctx.fillStyle = eye;
    ctx.fillRect(4, -68 + bob, 8, 7);
    ctx.fillRect(-12, -68 + bob, 8, 7);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(7, -66 + bob, 3, 3);
    ctx.fillRect(-9, -66 + bob, 3, 3);

    // Heavy Spiked Wooden War Hammer
    ctx.save();
    ctx.translate(22, -45 + bob);
    if (isWindup) {
      ctx.rotate(-1.4); // Raised far back
    } else if (isAttacking) {
      ctx.rotate(0.9); // Ground slam
    } else {
      ctx.rotate(-0.2);
    }

    ctx.fillStyle = '#78350f';
    ctx.fillRect(-4, -54, 10, 68); // Handle
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-18, -68, 38, 22); // Hammer head

    // Glowing Rune Engraving
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

  // World 2: Desert Sand Titan
  private renderDesertTitan(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const sand = isFlash ? '#ffffff' : '#d97706';
    const gold = isFlash ? '#ffffff' : '#facc15';
    const bronze = isFlash ? '#ffffff' : '#78350f';

    // Ancient Egyptian Gold Pharaoh Crest
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(0, -92 + bob);
    ctx.lineTo(-32, -70 + bob);
    ctx.lineTo(32, -70 + bob);
    ctx.closePath();
    ctx.fill();

    // Ruby Crown Gem
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-4, -84 + bob, 8, 8);

    // Sandstone Body
    ctx.fillStyle = sand;
    ctx.fillRect(-28, -66 + bob, 56, 58);

    // Sun Scarab Amber Medallion Core
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(0, -42 + bob, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(0, -42 + bob, 8, 0, Math.PI * 2);
    ctx.fill();

    // Stone Fists
    ctx.save();
    ctx.translate(26, -40 + bob);
    if (isWindup) {
      ctx.rotate(-1.2);
    } else if (isAttacking) {
      ctx.rotate(0.8);
    }

    ctx.fillStyle = bronze;
    ctx.fillRect(-6, -16, 24, 28);
    ctx.fillStyle = gold;
    ctx.fillRect(10, -18, 10, 32); // Spiked knuckles

    if (isAttacking && !isFlash) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(6, 0, 36, -0.8, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  // World 3: Frost Glacier Colossus
  private renderFrostColossus(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const ice = isFlash ? '#ffffff' : '#0284c7';
    const crystal = isFlash ? '#ffffff' : '#38bdf8';
    const coreGlow = isFlash ? '#ffffff' : '#7dd3fc';

    // Massive Jagged Icicle Horn Crown
    ctx.fillStyle = crystal;
    ctx.beginPath();
    ctx.moveTo(-18, -72 + bob);
    ctx.lineTo(-32, -98 + bob);
    ctx.lineTo(-10, -72 + bob);

    ctx.moveTo(18, -72 + bob);
    ctx.lineTo(32, -98 + bob);
    ctx.lineTo(10, -72 + bob);
    ctx.fill();

    // Ice Armor Body
    ctx.fillStyle = ice;
    ctx.fillRect(-28, -68 + bob, 56, 60);

    // Spiked Ice Pauldrons
    ctx.fillStyle = crystal;
    ctx.fillRect(-34, -66 + bob, 10, 24);
    ctx.fillRect(24, -66 + bob, 10, 24);

    // Glowing Cyan Core Crystal
    ctx.fillStyle = coreGlow;
    ctx.fillRect(-10, -46 + bob, 20, 20);

    // Ice Hammer Fist
    ctx.save();
    ctx.translate(26, -42 + bob);
    if (isWindup) {
      ctx.rotate(-1.3);
    } else if (isAttacking) {
      ctx.rotate(0.9);
    }

    ctx.fillStyle = crystal;
    ctx.fillRect(-10, -24, 30, 48);

    if (isAttacking && !isFlash) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.95)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(8, 0, 38, -0.8, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  // World 4: Volcanic Magma Demon Lord
  private renderVolcanicDemon(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const obsidian = isFlash ? '#ffffff' : '#18181b';
    const magma = isFlash ? '#ffffff' : '#ef4444';
    const flame = isFlash ? '#ffffff' : '#f97316';

    // Burning Curved Demon Horns
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-16, -72 + bob);
    ctx.lineTo(-38 + (isWindup ? -5 : 0), -102 + bob);
    ctx.lineTo(-8, -72 + bob);

    ctx.moveTo(16, -72 + bob);
    ctx.lineTo(38 + (isWindup ? 5 : 0), -102 + bob);
    ctx.lineTo(8, -72 + bob);
    ctx.fill();

    // Obsidian Plate Body
    ctx.fillStyle = obsidian;
    ctx.fillRect(-30, -70 + bob, 60, 62);

    // Glowing Lava Veins
    ctx.fillStyle = flame;
    ctx.fillRect(-22, -52 + bob, 44, 6);
    ctx.fillRect(-16, -38 + bob, 32, 6);

    // Fiery Yellow Eyes
    ctx.fillStyle = '#facc15';
    ctx.fillRect(6, -66 + bob, 8, 7);
    ctx.fillRect(-14, -66 + bob, 8, 7);

    // Giant Flaming Sword
    ctx.save();
    ctx.translate(28, -44 + bob);
    if (isWindup) {
      ctx.rotate(-1.5);
    } else if (isAttacking) {
      ctx.rotate(1.0);
    }

    ctx.fillStyle = magma;
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

  // World 5: Shadow Void Monarch
  private renderShadowMonarch(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const shadow = isFlash ? '#ffffff' : '#3b0764';
    const voidGlow = isFlash ? '#ffffff' : '#c084fc';
    const eyeRed = isFlash ? '#ffffff' : '#ef4444';

    // Floating Obsidian Crown
    ctx.fillStyle = voidGlow;
    ctx.beginPath();
    ctx.moveTo(-22, -84 + bob);
    ctx.lineTo(0, -102 + bob);
    ctx.lineTo(22, -84 + bob);
    ctx.closePath();
    ctx.fill();

    // Phantom Robe
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.moveTo(0, -78 + bob);
    ctx.lineTo(-32, -6 + bob);
    ctx.lineTo(32, -6 + bob);
    ctx.closePath();
    ctx.fill();

    // Crimson Void Eyes
    ctx.fillStyle = eyeRed;
    ctx.fillRect(5, -64 + bob, 7, 7);
    ctx.fillRect(-12, -64 + bob, 7, 7);

    // Spectral Void Orbs / Scythe
    ctx.save();
    ctx.translate(28, -46 + bob);
    if (isWindup) {
      ctx.rotate(-1.4);
    } else if (isAttacking) {
      ctx.rotate(0.9);
    }

    ctx.fillStyle = voidGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    if (isAttacking && !isFlash) {
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.95)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, 44, -0.9, 0.9);
      ctx.stroke();
    }

    ctx.restore();
  }

  // World 6: Goblin Overlord King Chaos Sovereign
  private renderGoblinKing(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const armor = isFlash ? '#ffffff' : '#334155';
    const gold = isFlash ? '#ffffff' : '#facc15';
    const cape = isFlash ? '#ffffff' : '#991b1b';
    const ruby = isFlash ? '#ffffff' : '#dc2626';

    // Royal Red Cape with Fur Collar
    ctx.fillStyle = cape;
    ctx.fillRect(-38, -66 + bob, 76, 62);

    // Regal Royal Ruby Crown
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(-24, -80 + bob);
    ctx.lineTo(-18, -102 + bob);
    ctx.lineTo(-8, -88 + bob);
    ctx.lineTo(0, -106 + bob);
    ctx.lineTo(8, -88 + bob);
    ctx.lineTo(18, -102 + bob);
    ctx.lineTo(24, -80 + bob);
    ctx.closePath();
    ctx.fill();

    // Ruby Crown Gem
    ctx.fillStyle = ruby;
    ctx.fillRect(-4, -92 + bob, 8, 8);

    // Golden Dragon Armor Plate
    ctx.fillStyle = armor;
    ctx.fillRect(-30, -72 + bob, 60, 66);
    ctx.fillStyle = gold;
    ctx.fillRect(-34, -70 + bob, 8, 18); // Spiked shoulders
    ctx.fillRect(26, -70 + bob, 8, 18);

    // Piercing Crimson Eyes
    ctx.fillStyle = ruby;
    ctx.fillRect(6, -68 + bob, 8, 7);
    ctx.fillRect(-14, -68 + bob, 8, 7);

    // Fiery Royal Greatsword
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
