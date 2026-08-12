import { Entity } from './Entity';
import { Player } from './Player';
import { TileMap } from '../world/TileMap';
import { ParticleSystem } from '../core/ParticleSystem';
import { audioEngine } from '../audio/AudioEngine';
import { BossProjectile } from './BossProjectile';
import { DebugManager } from '../debug/DebugManager';

export type BossState =
  | 'IDLE'
  | 'INTRO'
  | 'COMBAT'
  | 'WINDUP'
  | 'ATTACKING'
  | 'VULNERABLE'
  | 'DEFENSIVE_STANCE'
  | 'PHASE_CHANGE'
  | 'DEAD';

export type MartialAttackType =
  | 'PUNCH_COMBO'
  | 'ROUNDHOUSE_KICK'
  | 'SPINNING_KICK'
  | 'GROUND_SMASH'
  | 'DASH_STRIKE'
  | 'FLYING_KICK'
  | 'SHADOW_PALM'
  | 'TELEPORT_STRIKE'
  | 'DRAGON_COMBO';

export interface BossInfo {
  name: string;
  title: string;
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
    name: 'MASTER KENJI',
    title: 'FOREST WARLORD MARTIAL MASTER',
    worldId: 1,
    maxHp: 500,
    attackDamage: 10,
    baseSpeed: 2.3,
    maxPhases: 1,
    primaryColor: '#15803d',
    glowColor: '#4ade80',
  },
  2: {
    name: 'MASTER BROK',
    title: 'DESERT TITAN HEAVY WARRIOR',
    worldId: 2,
    maxHp: 750,
    attackDamage: 14,
    baseSpeed: 2.0,
    maxPhases: 2,
    primaryColor: '#b45309',
    glowColor: '#facc15',
  },
  3: {
    name: 'VIPER KAEL',
    title: 'DESERT SPEEDSTER FIGHTER',
    worldId: 3,
    maxHp: 950,
    attackDamage: 12,
    baseSpeed: 3.2,
    maxPhases: 2,
    primaryColor: '#0284c7',
    glowColor: '#38bdf8',
  },
  4: {
    name: 'MASTER SHEN',
    title: 'MISTY MOUNTAIN MARTIAL MASTER',
    worldId: 4,
    maxHp: 1200,
    attackDamage: 16,
    baseSpeed: 2.8,
    maxPhases: 2,
    primaryColor: '#b91c1c',
    glowColor: '#f97316',
  },
  5: {
    name: 'SHADOW MALAKOR',
    title: 'ELITE VOID DARK MARTIAL ARTIST',
    worldId: 5,
    maxHp: 1500,
    attackDamage: 18,
    baseSpeed: 3.0,
    maxPhases: 2,
    primaryColor: '#6b21a8',
    glowColor: '#c084fc',
  },
  6: {
    name: 'GRANDMASTER MARCUS',
    title: 'SUPREME GRANDMASTER OF MARTIAL ARTS',
    worldId: 6,
    maxHp: 2000,
    attackDamage: 22,
    baseSpeed: 3.2,
    maxPhases: 3,
    primaryColor: '#854d0e',
    glowColor: '#facc15',
  },
};

export class BossMonster extends Entity {
  public worldId: number;
  public bossName: string;
  public bossTitle: string;
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
  public stanceTimer: number = 0;
  public attackCooldown: number = 1.4;
  public hitFlashTimer: number = 0;
  public deathTimer: number = 0;
  public counterTimer: number = 0;

  public isTriggered: boolean = false;
  public isInvulnerable: boolean = false;
  public isBlocking: boolean = false;
  public isDodging: boolean = false;
  public isRageMode: boolean = false;

  public activeMartialAttack: MartialAttackType = 'PUNCH_COMBO';
  public warningText: string = '';

  public animFrame: number = 0;
  public animTime: number = 0;

  // Status effects from player weapons
  public slowTimer: number = 0;
  public burnTimer: number = 0;
  public burnTickTimer: number = 0;

  constructor(x: number, y: number, levelId: string = '1-5') {
    const [wStr] = levelId.split('-');
    const w = parseInt(wStr, 10) || 1;
    const spec = BOSS_SPECS[w] || BOSS_SPECS[1];

    const width = w === 6 ? 84 : w >= 4 ? 78 : 72;
    const height = w === 6 ? 94 : w >= 4 ? 86 : 80;

    super(x, y, width, height);

    this.worldId = w;
    this.bossName = spec.name;
    this.bossTitle = spec.title;
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

    // Check Boss Intro Trigger
    if (!this.isTriggered && dist < 450 && player.isAlive) {
      this.isTriggered = true;
      this.state = 'INTRO';
      this.introTimer = 1.4;
      audioEngine.playCustomSFX('finisher');
      particles.createVictoryConfetti(this.x + this.width / 2, this.y);
    }

    // Check Rage Mode for World 5 (HP < 40%)
    if (this.worldId === 5 && !this.isRageMode && this.hp <= this.maxHp * 0.4) {
      this.isRageMode = true;
      audioEngine.playCustomSFX('finisher');
      particles.createFloatingText(
        this.x + this.width / 2,
        this.y - 30,
        '🔥 SHADOW RAGE MODE ACTIVATED!',
        '#c084fc',
        22
      );
      particles.createCombatImpact(this.x + this.width / 2, this.y + this.height / 2, true, [
        '#c084fc',
        '#7e22ce',
      ]);
    }

    // State Machine
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
        this.isBlocking = false;
        this.facingRight = dx > 0;

        let currentSpeed =
          (this.slowTimer > 0 ? this.baseSpeed * 0.6 : this.baseSpeed) *
          (1 + (this.currentPhase - 1) * 0.18);

        if (this.isRageMode) {
          currentSpeed *= 1.25;
        }

        if (this.attackCooldown > 0) {
          this.attackCooldown -= dt;
        }

        // Check if counterattack queued
        if (this.counterTimer > 0) {
          this.counterTimer -= dt;
          if (this.counterTimer <= 0) {
            this.state = 'WINDUP';
            this.windupTimer = 0.22;
            this.chooseMartialAttack(dist);
            break;
          }
        }

        // Body contact damage
        if (this.intersects(player) && player.isAlive) {
          player.takeDamage(Math.round(this.attackDamage * 0.5), particles);
        }

        // World 4 Defensive Stance chance
        if (this.worldId === 4 && Math.random() < 0.008 && this.attackCooldown <= 0) {
          this.state = 'DEFENSIVE_STANCE';
          this.stanceTimer = 1.3;
          particles.createFloatingText(
            this.x + this.width / 2,
            this.y - 20,
            '🛡️ MIST GUARD STANCE!',
            '#f97316',
            16
          );
          break;
        }

        const attackRange = 75 + (this.worldId >= 4 ? 20 : 0);

        if (dist > attackRange) {
          // Approach player actively
          this.vx = this.facingRight ? currentSpeed : -currentSpeed;
        } else {
          // In range -> Prepare attack
          this.vx = 0;
          if (this.attackCooldown <= 0) {
            this.state = 'WINDUP';
            const baseWindup = 0.42 - (this.currentPhase - 1) * 0.08;
            this.windupTimer = Math.max(0.25, baseWindup);
            this.chooseMartialAttack(dist);
          }
        }
        break;
      }

      case 'DEFENSIVE_STANCE':
        this.vx = 0;
        this.isBlocking = true;
        this.stanceTimer -= dt;
        if (this.stanceTimer <= 0) {
          this.state = 'COMBAT';
          this.attackCooldown = 0.8;
        }
        break;

      case 'WINDUP':
        this.vx = 0;
        this.windupTimer -= dt;
        if (this.windupTimer <= 0) {
          this.state = 'ATTACKING';
          this.attackTimer = 0.32;
          this.executeMartialAttack(player, particles, projectiles);
        }
        break;

      case 'ATTACKING':
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
          // Transition to Open Vulnerable Window for counterplay!
          this.state = 'VULNERABLE';
          const vulnBase = 1.2 - (this.currentPhase - 1) * 0.2;
          this.vulnerableTimer = Math.max(0.65, vulnBase);
        }
        break;

      case 'VULNERABLE':
        this.vx = 0;
        this.vulnerableTimer -= dt;
        if (this.vulnerableTimer <= 0) {
          this.state = 'COMBAT';
          const cdBase = 1.5 - (this.currentPhase - 1) * 0.3;
          this.attackCooldown = Math.max(0.7, this.isRageMode ? 0.5 : cdBase);
        }
        break;

      case 'PHASE_CHANGE':
        this.vx = 0;
        this.isInvulnerable = true;
        this.phaseTimer -= dt;
        if (this.phaseTimer <= 0) {
          this.isInvulnerable = false;
          this.state = 'COMBAT';
          this.attackCooldown = 0.4;
        }
        break;

      case 'DEAD':
        this.vx = 0;
        this.deathTimer += dt;
        if (Math.random() < 0.35) {
          particles.createHitBloodOrSparks(
            this.x + Math.random() * this.width,
            this.y + Math.random() * this.height
          );
        }
        break;
    }
  }

  private chooseMartialAttack(distToPlayer: number) {
    const roll = Math.random();

    switch (this.worldId) {
      case 1:
        // Master Kenji
        if (roll < 0.45) {
          this.activeMartialAttack = 'PUNCH_COMBO';
          this.warningText = '⚡ JAB CROSS COMBO!';
        } else if (roll < 0.75) {
          this.activeMartialAttack = 'ROUNDHOUSE_KICK';
          this.warningText = '⚡ ROUNDHOUSE KICK!';
        } else {
          this.activeMartialAttack = 'SPINNING_KICK';
          this.warningText = '⚠️ HURRICANE SPINNING KICK!';
        }
        break;

      case 2:
        // Master Brok (Heavy Warrior)
        if (roll < 0.45) {
          this.activeMartialAttack = 'GROUND_SMASH';
          this.warningText = '⚠️ GROUND SMASH SHOCKWAVE — JUMP!';
        } else if (roll < 0.75) {
          this.activeMartialAttack = 'PUNCH_COMBO';
          this.warningText = '⚡ HEAVY IRON FIST!';
        } else {
          this.activeMartialAttack = 'ROUNDHOUSE_KICK';
          this.warningText = '⚡ HEAVY KNEE STRIKE!';
        }
        break;

      case 3:
        // Viper Kael (Desert Speedster)
        if (roll < 0.4) {
          this.activeMartialAttack = 'DASH_STRIKE';
          this.warningText = '⚠️ FAST DASH STRIKE!';
        } else if (roll < 0.7) {
          this.activeMartialAttack = 'PUNCH_COMBO';
          this.warningText = '⚡ RAPID 3-PUNCH!';
        } else {
          this.activeMartialAttack = 'FLYING_KICK';
          this.warningText = '⚡ FLYING KNEE STRIKE!';
        }
        break;

      case 4:
        // Master Shen (Misty Mountain Master)
        if (roll < 0.35) {
          this.activeMartialAttack = 'FLYING_KICK';
          this.warningText = '⚠️ FLYING DRAGON KICK!';
        } else if (roll < 0.7) {
          this.activeMartialAttack = 'SPINNING_KICK';
          this.warningText = '⚠️ WHIRLWIND KICK!';
        } else {
          this.activeMartialAttack = 'SHADOW_PALM';
          this.warningText = '⚡ MIST PALM BLAST!';
        }
        break;

      case 5:
        // Shadow Malakor (Void Dark Martial Artist)
        if (roll < 0.35) {
          this.activeMartialAttack = 'TELEPORT_STRIKE';
          this.warningText = '⚠️ SHADOW FLASH STEP!';
        } else if (roll < 0.7) {
          this.activeMartialAttack = 'PUNCH_COMBO';
          this.warningText = '⚡ ADVANCED MARTIAL COMBO!';
        } else {
          this.activeMartialAttack = 'SHADOW_PALM';
          this.warningText = '⚠️ VOID PALM SHOCKWAVE!';
        }
        break;

      case 6:
      default:
        // Grandmaster Marcus (Supreme Master)
        if (this.currentPhase === 3 || roll < 0.3) {
          this.activeMartialAttack = 'DRAGON_COMBO';
          this.warningText = '🔥 SUPREME DRAGON COMBO!';
        } else if (roll < 0.55) {
          this.activeMartialAttack = 'GROUND_SMASH';
          this.warningText = '⚠️ DRAGON GROUND TREMOR!';
        } else if (roll < 0.8) {
          this.activeMartialAttack = 'SPINNING_KICK';
          this.warningText = '⚠️ HURRICANE KICK!';
        } else {
          this.activeMartialAttack = 'TELEPORT_STRIKE';
          this.warningText = '⚡ FLASH STEP STRIKE!';
        }
        break;
    }
  }

  private executeMartialAttack(
    player: Player,
    particles: ParticleSystem,
    projectiles: BossProjectile[]
  ) {
    const dir = this.facingRight ? 1 : -1;
    const originX = this.x + (this.facingRight ? this.width + 12 : -24);
    const originY = this.y + 25;

    switch (this.activeMartialAttack) {
      case 'PUNCH_COMBO':
        audioEngine.playBossAttackSwing('heavy_punch');
        particles.createSlashSparks(originX, originY, this.facingRight, [
          BOSS_SPECS[this.worldId].primaryColor,
          BOSS_SPECS[this.worldId].glowColor,
        ]);
        if (this.intersects(player) && player.isAlive) {
          player.takeDamage(this.attackDamage, particles);
        }
        break;

      case 'ROUNDHOUSE_KICK':
        audioEngine.playBossAttackSwing('kick');
        particles.createSlashSparks(originX, originY + 10, this.facingRight, [
          '#facc15',
          '#f97316',
        ]);
        if (this.intersects(player) && player.isAlive) {
          player.takeDamage(Math.round(this.attackDamage * 1.15), particles);
        }
        break;

      case 'SPINNING_KICK':
        audioEngine.playBossAttackSwing('spin_kick');
        particles.createCombatImpact(
          this.x + this.width / 2,
          this.y + this.height / 2,
          this.facingRight,
          ['#06b6d4', '#38bdf8', '#ffffff']
        );
        if (Math.hypot(player.x - this.x, player.y - this.y) < 110 && player.isAlive) {
          player.takeDamage(Math.round(this.attackDamage * 1.25), particles);
        }
        break;

      case 'GROUND_SMASH':
        audioEngine.playBossAttackSwing('finisher');
        particles.createCombatImpact(
          this.x + this.width / 2,
          this.y + this.height - 10,
          this.facingRight,
          ['#ef4444', '#f97316', '#facc15']
        );
        // Spawns floor crawling martial shockwave
        projectiles.push(
          new BossProjectile({
            x: originX,
            y: this.y + this.height - 24,
            vx: dir * (5.8 + this.currentPhase * 0.8),
            vy: 0,
            width: 32,
            height: 32,
            damage: Math.round(this.attackDamage * 0.9),
            color: BOSS_SPECS[this.worldId].glowColor,
            glowColor: BOSS_SPECS[this.worldId].primaryColor,
            isShockwave: true,
            type: 'sand',
          })
        );
        break;

      case 'DASH_STRIKE':
        audioEngine.playBossAttackSwing('kick');
        this.vx = dir * 14.0; // Rapid dash forward
        particles.createSlashSparks(originX, originY, this.facingRight, ['#38bdf8', '#ffffff']);
        if (this.intersects(player) && player.isAlive) {
          player.takeDamage(Math.round(this.attackDamage * 1.2), particles);
        }
        break;

      case 'FLYING_KICK':
        audioEngine.playBossAttackSwing('spin_kick');
        this.vy = -6.5; // Flying leap
        this.vx = dir * 9.5;
        particles.createSlashSparks(originX, originY, this.facingRight, ['#f97316', '#facc15']);
        if (this.intersects(player) && player.isAlive) {
          player.takeDamage(Math.round(this.attackDamage * 1.3), particles);
        }
        break;

      case 'SHADOW_PALM':
        audioEngine.playBossAttackSwing('heavy_punch');
        particles.createCombatImpact(originX, originY, this.facingRight, ['#c084fc', '#7e22ce']);
        projectiles.push(
          new BossProjectile({
            x: originX,
            y: originY,
            vx: dir * (7.0 + this.currentPhase * 0.5),
            vy: 0,
            width: 24,
            height: 24,
            damage: Math.round(this.attackDamage * 0.85),
            color: BOSS_SPECS[this.worldId].glowColor,
            glowColor: BOSS_SPECS[this.worldId].primaryColor,
            isShockwave: false,
            type: 'shadow',
          })
        );
        break;

      case 'TELEPORT_STRIKE':
        audioEngine.playBossAttackSwing('finisher');
        particles.createCombatImpact(this.x + this.width / 2, this.y + this.height / 2, true, [
          '#c084fc',
          '#ffffff',
        ]);
        // Teleport behind player
        this.x = player.x + (player.facingRight ? -75 : 75);
        this.facingRight = player.x > this.x;
        particles.createCombatImpact(this.x + this.width / 2, this.y + this.height / 2, true, [
          '#c084fc',
          '#facc15',
        ]);
        if (this.intersects(player) && player.isAlive) {
          player.takeDamage(Math.round(this.attackDamage * 1.35), particles);
        }
        break;

      case 'DRAGON_COMBO':
        audioEngine.playBossAttackSwing('finisher');
        particles.createCombatImpact(this.x + this.width / 2, this.y + this.height / 2, true, [
          '#facc15',
          '#ef4444',
          '#ffffff',
        ]);
        if (Math.hypot(player.x - this.x, player.y - this.y) < 100 && player.isAlive) {
          player.takeDamage(Math.round(this.attackDamage * 1.5), particles);
        }
        break;
    }
  }

  public takeDamage(damage: number, particles: ParticleSystem, attackType?: string): boolean {
    if (!this.isAlive || this.isInvulnerable || this.state === 'INTRO') return false;

    // Check Dodge Probability
    let dodgeChance = 0;
    if (this.worldId === 3) dodgeChance = 0.32;
    else if (this.worldId === 4) dodgeChance = 0.25;
    else if (this.worldId === 5) dodgeChance = this.isRageMode ? 0.35 : 0.25;
    else if (this.worldId === 6) dodgeChance = this.currentPhase >= 2 ? 0.35 : 0.25;

    if (Math.random() < dodgeChance) {
      this.isDodging = true;
      this.vx = (this.facingRight ? -1 : 1) * 9.0;
      this.vy = -2.5;
      audioEngine.playBossAttackSwing('kick');
      particles.createFloatingText(
        this.x + this.width / 2,
        this.y - 15,
        '💨 DODGED!',
        '#38bdf8',
        16
      );
      particles.createHitBloodOrSparks(this.x + this.width / 2, this.y + this.height / 2);

      // Trigger swift martial counter
      if ([3, 4, 5, 6].includes(this.worldId)) {
        this.counterTimer = 0.15;
      }
      return false;
    }

    // Check Block / Defensive Stance Probability
    let blockChance = 0;
    if (this.state === 'DEFENSIVE_STANCE') blockChance = 1.0;
    else if (this.worldId === 1) blockChance = 0.18;
    else if (this.worldId === 2) blockChance = 0.38;
    else if (this.worldId === 4) blockChance = 0.22;
    else if (this.worldId === 5) blockChance = 0.28;
    else if (this.worldId === 6) blockChance = 0.35;

    if (Math.random() < blockChance) {
      this.isBlocking = true;
      this.hitFlashTimer = 0.15;
      audioEngine.playHitImpact('enemy', 'JAB');
      particles.createFloatingText(
        this.x + this.width / 2,
        this.y - 15,
        '🛡️ BLOCKED!',
        '#facc15',
        16
      );
      particles.createCombatImpact(
        this.x + this.width / 2,
        this.y + 20,
        this.facingRight,
        ['#facc15', '#ffffff']
      );

      // Parried / Blocked counter trigger
      if (this.state === 'DEFENSIVE_STANCE' || [4, 5, 6].includes(this.worldId)) {
        this.counterTimer = 0.1;
      }
      return true;
    }

    // Hit connected successfully!
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

    // Boss Physical Recoil
    const pushDir = this.facingRight ? -1 : 1;
    const pushMag = attackType === 'FINISHER' ? 5.5 : attackType === 'SPIN_KICK' ? 4.0 : attackType === 'KICK' ? 3.0 : 1.8;
    this.vx += pushDir * pushMag;

    particles.createHitBloodOrSparks(this.x + this.width / 2, this.y + this.height / 2);

    // Phase Transitions
    if (this.worldId === 6) {
      if (this.currentPhase === 1 && this.hp <= this.maxHp * 0.66) {
        this.triggerPhaseChange(2, particles);
      } else if (this.currentPhase === 2 && this.hp <= this.maxHp * 0.33) {
        this.triggerPhaseChange(3, particles);
      }
    } else if (this.maxPhases === 2 && this.currentPhase === 1 && this.hp <= this.maxHp * 0.5) {
      this.triggerPhaseChange(2, particles);
    }

    // Death Check
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'DEAD';
      this.isAlive = false;
      audioEngine.playVictory();
      particles.createVictoryConfetti(this.x + this.width / 2, this.y + 20);
      particles.createFloatingText(
        this.x + this.width / 2,
        this.y - 30,
        'BOSS DEFEATED! 👑',
        '#22c55e',
        24
      );
    }

    return true;
  }

  private triggerPhaseChange(nextPhase: number, particles: ParticleSystem) {
    this.currentPhase = nextPhase;
    this.state = 'PHASE_CHANGE';
    this.phaseTimer = 1.2;
    audioEngine.playCustomSFX('finisher');
    particles.createVictoryConfetti(this.x + this.width / 2, this.y);

    const phaseMsg =
      nextPhase === 3
        ? '⚡ PHASE 3: FINAL STAND!'
        : this.worldId === 6
        ? '🔥 PHASE 2: DRAGON STANCE!'
        : '🔥 PHASE 2: ENRAGED!';

    particles.createFloatingText(
      this.x + this.width / 2,
      this.y - 25,
      phaseMsg,
      nextPhase === 3 ? '#ef4444' : '#f97316',
      24
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
    const isDefensive = this.state === 'DEFENSIVE_STANCE';
    const isPhaseChange = this.state === 'PHASE_CHANGE';

    if (isFlash) {
      ctx.rotate(-0.1);
    } else if (isWindup) {
      ctx.rotate(-0.08);
    } else if (isAttacking) {
      ctx.rotate(0.12);
    }

    // Overhead Status Indicators
    if (isWindup) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '900 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.warningText || '⚡ WARNING!', 0, -this.height - 24 + bob);

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -this.height / 2, this.width * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    } else if (isVulnerable) {
      ctx.fillStyle = '#facc15';
      ctx.font = '900 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💫 OPENING DETECTED!', 0, -this.height - 24 + bob);
    } else if (isDefensive) {
      ctx.fillStyle = '#f97316';
      ctx.font = '900 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️ MIST GUARD ACTIVE!', 0, -this.height - 24 + bob);
    } else if (isPhaseChange) {
      ctx.fillStyle = '#f97316';
      ctx.font = '900 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🔥 PHASE ${this.currentPhase} AWAKENED!`, 0, -this.height - 24 + bob);

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

    // RENDER UNIQUE WORLD HUMAN MARTIAL ARTIST VISUALS
    switch (this.worldId) {
      case 1:
        this.renderMasterKenji(ctx, bob, isFlash, isWindup, isAttacking);
        break;
      case 2:
        this.renderMasterBrok(ctx, bob, isFlash, isWindup, isAttacking);
        break;
      case 3:
        this.renderViperKael(ctx, bob, isFlash, isWindup, isAttacking);
        break;
      case 4:
        this.renderMasterShen(ctx, bob, isFlash, isWindup, isAttacking);
        break;
      case 5:
        this.renderShadowMalakor(ctx, bob, isFlash, isWindup, isAttacking);
        break;
      case 6:
      default:
        this.renderGrandmasterMarcus(ctx, bob, isFlash, isWindup, isAttacking);
        break;
    }

    ctx.restore();

    if (DebugManager.isAiDebugInfoEnabled()) {
      this.renderAiDebugOverlay(ctx, px, py);
    }
  }

  private renderAiDebugOverlay(ctx: CanvasRenderingContext2D, px: number, py: number) {
    const boxW = 140;
    const boxH = 48;
    const bx = Math.round(px + (this.width - boxW) / 2);
    const by = Math.round(py - 72);

    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(bx, by, boxW, boxH);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';

    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`BOSS State: ${this.state}`, bx + 6, by + 12);

    ctx.fillStyle = '#facc15';
    ctx.fillText(`Phase: ${this.currentPhase}/${this.maxPhases}`, bx + 6, by + 24);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Attack: ${this.activeMartialAttack}`, bx + 6, by + 36);

    ctx.restore();
  }

  // --- UNIQUE WORLD HUMAN MARTIAL ARTIST DRAWING METHODS ---

  // World 1: Master Kenji (Forest Warlord Martial Master)
  private renderMasterKenji(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const skin = isFlash ? '#ffffff' : '#fed7aa'; // Human skin tone
    const gi = isFlash ? '#ffffff' : '#15803d'; // Forest green gi
    const belt = isFlash ? '#ffffff' : '#facc15'; // Gold belt
    const hair = isFlash ? '#ffffff' : '#451a03'; // Dark brown martial hair

    // Martial Gi Body
    ctx.fillStyle = gi;
    ctx.fillRect(-22, -56 + bob, 44, 52);

    // Martial Gold Belt
    ctx.fillStyle = belt;
    ctx.fillRect(-24, -34 + bob, 48, 8);

    // Human Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -68 + bob, 16, 0, Math.PI * 2);
    ctx.fill();

    // Martial Headband
    ctx.fillStyle = belt;
    ctx.fillRect(-18, -76 + bob, 36, 6);

    // Hair
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, -74 + bob, 17, Math.PI, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, -70 + bob, 4, 3);

    // Martial Fists / Stance
    ctx.fillStyle = '#f8fafc'; // White hand wraps
    if (isAttacking) {
      // Extended Punch/Kick Pose
      ctx.fillRect(18, -50 + bob, 22, 12); // Lead Punch
      ctx.fillRect(-12, -44 + bob, 14, 12);
    } else if (isWindup) {
      // Chambered Fist
      ctx.fillRect(-18, -52 + bob, 14, 12);
      ctx.fillRect(6, -42 + bob, 14, 12);
    } else {
      // Fighting Guard
      ctx.fillRect(8, -54 + bob, 14, 12);
      ctx.fillRect(-16, -48 + bob, 14, 12);
    }
  }

  // World 2: Master Brok (Desert Titan Heavy Warrior)
  private renderMasterBrok(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const skin = isFlash ? '#ffffff' : '#e0a96d'; // Bronze human skin
    const vest = isFlash ? '#ffffff' : '#b45309'; // Crimson/Amber heavy martial vest
    const gold = isFlash ? '#ffffff' : '#facc15'; // Gold gauntlets

    // Heavy Torso
    ctx.fillStyle = vest;
    ctx.fillRect(-26, -58 + bob, 52, 54);

    // Gold Waist Sash
    ctx.fillStyle = gold;
    ctx.fillRect(-28, -34 + bob, 56, 10);

    // Human Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -70 + bob, 18, 0, Math.PI * 2);
    ctx.fill();

    // Beard & Stern Hair
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-12, -66 + bob, 24, 10);
    ctx.fillRect(4, -72 + bob, 5, 4); // Eye

    // Heavy Gold Arm Gauntlets
    ctx.fillStyle = gold;
    if (isAttacking) {
      // Ground Slam Pose
      ctx.fillRect(-18, -25 + bob, 36, 18);
    } else if (isWindup) {
      // Raised Fists
      ctx.fillRect(-16, -82 + bob, 32, 16);
    } else {
      // Guard Stance
      ctx.fillRect(12, -54 + bob, 16, 16);
      ctx.fillRect(-22, -50 + bob, 16, 16);
    }
  }

  // World 3: Viper Kael (Desert Speedster Fighter)
  private renderViperKael(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const skin = isFlash ? '#ffffff' : '#ffedd5'; // Fair human skin
    const gi = isFlash ? '#ffffff' : '#0284c7'; // Cyan agile gi
    const headband = isFlash ? '#ffffff' : '#38bdf8';

    // Agile Torso
    ctx.fillStyle = gi;
    ctx.fillRect(-20, -54 + bob, 40, 50);

    // Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -68 + bob, 15, 0, Math.PI * 2);
    ctx.fill();

    // Speed Headband
    ctx.fillStyle = headband;
    ctx.fillRect(-16, -74 + bob, 32, 6);

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -70 + bob, 4, 3);

    // Hand Wraps & Speed Trail
    ctx.fillStyle = '#f8fafc';
    if (isAttacking) {
      ctx.fillRect(20, -48 + bob, 24, 10); // Swift Dash Strike
    } else {
      ctx.fillRect(8, -52 + bob, 12, 10);
      ctx.fillRect(-14, -46 + bob, 12, 10);
    }
  }

  // World 4: Master Shen (Misty Mountain Martial Master)
  private renderMasterShen(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const skin = isFlash ? '#ffffff' : '#d97706'; // Tanned ash skin
    const robes = isFlash ? '#ffffff' : '#b91c1c'; // Flame martial robes
    const flame = isFlash ? '#ffffff' : '#f97316';

    // Robes
    ctx.fillStyle = robes;
    ctx.fillRect(-24, -58 + bob, 48, 54);

    // Flame Sash
    ctx.fillStyle = flame;
    ctx.fillRect(-26, -36 + bob, 52, 8);

    // Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -72 + bob, 17, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Eyes
    ctx.fillStyle = '#facc15';
    ctx.fillRect(3, -74 + bob, 5, 4);

    // Glowing Palm Wraps
    ctx.fillStyle = flame;
    if (isAttacking) {
      ctx.fillRect(16, -52 + bob, 22, 14); // Flame Palm
    } else {
      ctx.fillRect(10, -56 + bob, 14, 12);
      ctx.fillRect(-18, -48 + bob, 14, 12);
    }
  }

  // World 5: Shadow Malakor (Elite Void Dark Martial Artist)
  private renderShadowMalakor(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const skin = isFlash ? '#ffffff' : '#ffedd5'; // Pale human skin
    const robes = isFlash ? '#ffffff' : '#3b0764'; // Dark violet robes
    const purple = isFlash ? '#ffffff' : '#c084fc';

    // Shadow Robes
    ctx.fillStyle = robes;
    ctx.fillRect(-24, -60 + bob, 48, 56);

    // High Collar
    ctx.fillStyle = purple;
    ctx.fillRect(-26, -64 + bob, 8, 20);
    ctx.fillRect(18, -64 + bob, 8, 20);

    // Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -74 + bob, 16, 0, Math.PI * 2);
    ctx.fill();

    // Silver Hair
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, -78 + bob, 17, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // Purple Eyes
    ctx.fillStyle = purple;
    ctx.fillRect(3, -75 + bob, 5, 4);

    // Dark Gauntlets
    ctx.fillStyle = purple;
    if (isAttacking) {
      ctx.fillRect(18, -50 + bob, 24, 14); // Shadow Strike
    } else {
      ctx.fillRect(10, -56 + bob, 14, 12);
      ctx.fillRect(-18, -48 + bob, 14, 12);
    }
  }

  // World 6: Grandmaster Marcus (Supreme Grandmaster of Martial Arts)
  private renderGrandmasterMarcus(
    ctx: CanvasRenderingContext2D,
    bob: number,
    isFlash: boolean,
    isWindup: boolean,
    isAttacking: boolean
  ) {
    const skin = isFlash ? '#ffffff' : '#fed7aa'; // Human skin
    const gi = isFlash ? '#ffffff' : '#854d0e'; // Imperial Gold Gi
    const ruby = isFlash ? '#ffffff' : '#dc2626';
    const gold = isFlash ? '#ffffff' : '#facc15';

    // Dragon Martial Aura
    if (this.currentPhase >= 2 && !isFlash) {
      ctx.fillStyle =
        this.currentPhase === 3 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(250, 204, 21, 0.22)';
      ctx.beginPath();
      ctx.arc(0, -45 + bob, 44, 0, Math.PI * 2);
      ctx.fill();
    }

    // Imperial Gold Gi Body
    ctx.fillStyle = gi;
    ctx.fillRect(-26, -60 + bob, 52, 56);

    // Ruby Belt & Dragon Trim
    ctx.fillStyle = ruby;
    ctx.fillRect(-28, -36 + bob, 56, 10);

    // Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -74 + bob, 18, 0, Math.PI * 2);
    ctx.fill();

    // Regal Grandmaster Crown / Headband
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.moveTo(-16, -82 + bob);
    ctx.lineTo(-12, -96 + bob);
    ctx.lineTo(-5, -86 + bob);
    ctx.lineTo(0, -98 + bob);
    ctx.lineTo(5, -86 + bob);
    ctx.lineTo(12, -96 + bob);
    ctx.lineTo(16, -82 + bob);
    ctx.closePath();
    ctx.fill();

    // Ruby Gem
    ctx.fillStyle = ruby;
    ctx.fillRect(-3, -88 + bob, 6, 6);

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, -75 + bob, 5, 4);

    // Golden Dragon Gauntlets
    ctx.fillStyle = gold;
    if (isAttacking) {
      ctx.fillRect(20, -52 + bob, 26, 16); // Dragon Punch/Kick
    } else {
      ctx.fillRect(12, -58 + bob, 16, 14);
      ctx.fillRect(-20, -50 + bob, 16, 14);
    }
  }
}
