import { Entity } from './Entity';
import { Player } from './Player';
import { TileMap } from '../world/TileMap';
import { ParticleSystem } from '../core/ParticleSystem';
import { audioEngine } from '../audio/AudioEngine';
import { BossProjectile } from './BossProjectile';
import { DebugManager } from '../debug/DebugManager';

export type EnemyClass = 'FAST_FIGHTER' | 'HEAVY_FIGHTER' | 'MARTIAL_ARTIST' | 'ELITE_FIGHTER';

export type AICombatState =
  | 'IDLE'
  | 'ALERT'
  | 'APPROACH'
  | 'COMBAT'
  | 'TELEGRAPH'
  | 'ATTACK'
  | 'DEFEND'
  | 'DODGE'
  | 'COUNTER'
  | 'RETREAT'
  | 'RECOVER'
  | 'HIT'
  | 'DEAD';

export class ForestGoblin extends Entity {
  public hp: number = 90;
  public maxHp: number = 90;
  public attackDamage: number = 7;
  public moveSpeed: number = 3.5;
  public detectionRadius: number = 260;
  public attackRange: number = 44;
  public attackCooldown: number = 0;
  public hitFlashTimer: number = 0;
  public animFrame: number = 0;
  public animTime: number = 0;
  public isBoss: boolean = false;
  public levelId: string = '1-1';

  // Serious Martial Artist Identifier & Class
  public enemyClass: EnemyClass = 'MARTIAL_ARTIST';
  public enemyName: string = 'Forest Martial Artist';

  // Weapon status effects
  public slowTimer: number = 0;
  public burnTimer: number = 0;
  public burnTickTimer: number = 0;

  // Unique World Special Powers
  public abilityCooldown: number = 2.5;
  public warningTimer: number = 0;
  public warningType: string | null = null;

  // Martial Arts Fighter State
  public martialStyle: 'STRIKER' | 'BRAWLER' | 'ACROBAT' | 'BALANCED' = 'BALANCED';
  public combatState: AICombatState = 'IDLE';
  public activeAttack: 'FAST_PUNCH' | 'HEAVY_PUNCH' | 'FRONT_KICK' | 'LOW_KICK' | 'ROUNDHOUSE_KICK' | 'FLYING_KNEE' | 'JUMP_KICK' = 'FAST_PUNCH';
  public attackStateTimer: number = 0;
  public comboStep: number = 0;
  public maxComboSteps: number = 2;
  public retreatTimer: number = 0;
  public dodgeTimer: number = 0;
  public isGuarding: boolean = false;
  public guardTimer: number = 0;

  // AI Perception, Reaction & Group Combat
  public reactionTimer: number = 0;
  public reactionDelay: number = 0.20;
  public perceivedPlayerAttack: string | null = null;
  public playerAttackWindowTimer: number = 0;
  public playerAttacksCount: number = 0;
  public hasAttackToken: boolean = false;

  // AI Cooldowns & Hit Stun
  public guardCooldown: number = 0;
  public dodgeCooldown: number = 0;
  public counterCooldown: number = 0;
  public consecutiveHitsTaken: number = 0;
  public hitStunTimer: number = 0;

  // Death & Lifecycle Tracking
  public deathTimer: number = 0;
  public hasRegisteredDeath: boolean = false;

  // AI Debug Information Overlay
  public debugInfo = {
    state: 'IDLE',
    target: 'PLAYER',
    distance: 0,
    lastPlayerAction: 'NONE',
    world: 1,
  };

  // Debug Force Flags
  public forceBlockFlag: boolean = false;
  public forceDodgeFlag: boolean = false;
  public forceCounterattackFlag: boolean = false;

  // World Specific Powers
  public hasBlockShield: boolean = false;
  public isDashing: boolean = false;
  public dashTimer: number = 0;
  public stoneShieldTimer: number = 0;
  public isSandDashing: boolean = false;
  public isBurrowed: boolean = false;
  public burrowTimer: number = 0;
  public iceShieldHits: number = 0;
  public iceShieldTimer: number = 0;
  public isShadowClone: boolean = false;
  public cloneLifetime: number = 3.5;
  public isRageMode: boolean = false;

  // Shared Multi-Enemy Stagger Cooldown
  private static groupAttackCooldown: number = 0;

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
    const width = isFinalBoss ? 68 : isBoss ? 54 : 34;
    const height = isFinalBoss ? 72 : isBoss ? 60 : 44;
    super(x, y, width, height);

    this.isBoss = isBoss;
    this.levelId = levelId;

    const [wStr] = levelId.split('-');
    const w = parseInt(wStr, 10) || 1;

    // Determine Archetype Class for Normal Enemies
    const seed = Math.abs(Math.floor(x * 3 + y * 7)) % 10;
    if (seed < 2) {
      this.enemyClass = 'FAST_FIGHTER';
    } else if (seed < 5) {
      this.enemyClass = 'HEAVY_FIGHTER';
    } else if (seed < 8) {
      this.enemyClass = 'MARTIAL_ARTIST';
    } else {
      this.enemyClass = 'ELITE_FIGHTER';
    }

    // Set Serious World Names
    this.enemyName = this.getEnemyName(w, this.enemyClass);

    // HP Scaling according to World (W1: 110-350 HP, W6: 320-1000 HP)
    let baseWorldHp = 110 + (w - 1) * 40;
    let hpMultiplier = 1.0;
    let speedMult = 1.0;
    let damageMult = 1.0;

    switch (this.enemyClass) {
      case 'FAST_FIGHTER':
        hpMultiplier = 0.88; // ~97 HP in W1 => ~9 hits
        speedMult = 1.2; // Speed ~4.2
        damageMult = 0.9;
        this.maxComboSteps = 2;
        break;

      case 'HEAVY_FIGHTER':
        hpMultiplier = 2.1; // ~230 HP in W1 => ~21 hits
        speedMult = 0.82; // Speed ~2.8
        damageMult = 1.35;
        this.maxComboSteps = 1;
        break;

      case 'MARTIAL_ARTIST':
        hpMultiplier = 1.1; // ~120 HP in W1 => ~11 hits
        speedMult = 1.0;
        damageMult = 1.0;
        this.maxComboSteps = 3;
        break;

      case 'ELITE_FIGHTER':
        hpMultiplier = 3.2; // ~350 HP in W1 => ~32 hits
        speedMult = 1.08;
        damageMult = 1.3;
        this.maxComboSteps = 3;
        break;
    }

    if (isFinalBoss) {
      this.maxHp = 1200;
      this.attackDamage = 14;
      this.moveSpeed = 2.8;
    } else if (isBoss) {
      this.maxHp = 800 + w * 250;
      this.attackDamage = 9 + Math.floor(w * 0.8);
      this.moveSpeed = 2.5;
    } else {
      this.maxHp = Math.round(baseWorldHp * hpMultiplier);
      this.attackDamage = Math.max(2, Math.round((2.5 + w * 0.4) * damageMult));
      this.moveSpeed = (3.40 + (w % 3) * 0.08) * speedMult;
    }

    this.hp = this.maxHp;
    this.detectionRadius = isBoss ? 350 : 270;
    this.attackRange = isBoss ? 54 : 44;

    this.patrolMinX = x - patrolRange / 2;
    this.patrolMaxX = x + patrolRange / 2;

    // World 1 Guard Shield Assignment
    if (w === 1 && !isBoss && seed % 2 === 0) {
      this.hasBlockShield = true;
    }
  }

  private getEnemyName(worldId: number, enemyClass: EnemyClass): string {
    const names: Record<number, Record<EnemyClass, string>> = {
      1: {
        FAST_FIGHTER: 'Forest Shadow Rogue',
        HEAVY_FIGHTER: 'Woodland Brawler',
        MARTIAL_ARTIST: 'Forest Martial Artist',
        ELITE_FIGHTER: 'Forest Enforcer',
      },
      2: {
        FAST_FIGHTER: 'Sand Assassin',
        HEAVY_FIGHTER: 'Desert Crusher',
        MARTIAL_ARTIST: 'Desert Brawler',
        ELITE_FIGHTER: 'Sun Citadel Guard',
      },
      3: {
        FAST_FIGHTER: 'Ice Stalker',
        HEAVY_FIGHTER: 'Glacier Titan',
        MARTIAL_ARTIST: 'Frost Monk',
        ELITE_FIGHTER: 'Snow Citadel Enforcer',
      },
      4: {
        FAST_FIGHTER: 'Lava Striker',
        HEAVY_FIGHTER: 'Inferno Titan',
        MARTIAL_ARTIST: 'Ash Brawler',
        ELITE_FIGHTER: 'Magma Warlord Guard',
      },
      5: {
        FAST_FIGHTER: 'Void Ninja',
        HEAVY_FIGHTER: 'Shadow Brute',
        MARTIAL_ARTIST: 'Phantom Striker',
        ELITE_FIGHTER: 'Dark Master Enforcer',
      },
      6: {
        FAST_FIGHTER: 'Citadel Speed Assassin',
        HEAVY_FIGHTER: 'Royal Gate Crusher',
        MARTIAL_ARTIST: 'Citadel Guard Monk',
        ELITE_FIGHTER: 'Imperial Grandmaster Guard',
      },
    };

    return names[worldId]?.[enemyClass] || 'Martial Arts Warrior';
  }

  public static manageGroupCombat(goblins: ForestGoblin[], player: Player, dt: number) {
    if (this.groupAttackCooldown > 0) {
      this.groupAttackCooldown -= dt;
    }

    const alive = goblins.filter((g) => g.isAlive && g.combatState !== 'DEAD' && !g.isShadowClone);
    if (alive.length === 0) return;

    const sampleLevel = alive[0].levelId || '1-1';
    const worldId = parseInt(sampleLevel.split('-')[0], 10) || 1;
    const maxTokens = worldId <= 2 ? 1 : 2;

    let activeTokens = 0;
    const isPlayerAttacking = player.state === 'ATTACK';

    for (const g of alive) {
      const dx = player.x - g.x;
      const dy = player.y - g.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Alert nearby goblins if player attacks one or enters detection radius
      if ((isPlayerAttacking && dist < 240) || dist < g.detectionRadius) {
        if (g.combatState === 'IDLE') {
          g.combatState = 'ALERT';
        }
      }

      if (g.hasAttackToken) {
        if (g.combatState === 'TELEGRAPH' || g.combatState === 'ATTACK') {
          activeTokens++;
        } else if (g.combatState === 'RECOVER' || g.combatState === 'RETREAT' || g.combatState === 'HIT' || g.combatState === 'DODGE') {
          g.hasAttackToken = false;
        }
      }
    }

    if (activeTokens < maxTokens && this.groupAttackCooldown <= 0) {
      const candidates = alive.filter(
        (g) =>
          !g.hasAttackToken &&
          g.attackCooldown <= 0 &&
          g.hitStunTimer <= 0 &&
          (g.combatState === 'APPROACH' || g.combatState === 'COMBAT' || g.combatState === 'ALERT') &&
          Math.abs(player.x - g.x) < g.detectionRadius
      );

      candidates.sort((a, b) => Math.abs(player.x - a.x) - Math.abs(player.x - b.x));

      for (let i = 0; i < candidates.length && activeTokens < maxTokens; i++) {
        candidates[i].hasAttackToken = true;
        activeTokens++;
      }
    }
  }

  public update(
    dt: number,
    player: Player,
    tileMap: TileMap,
    particles: ParticleSystem,
    projectiles?: BossProjectile[],
    goblins?: ForestGoblin[]
  ) {
    if (!this.isAlive) return;

    // Handle DEAD state (death animation before complete removal)
    if (this.combatState === 'DEAD') {
      this.vx = 0;
      this.deathTimer -= dt;
      this.vy += 0.65;
      if (this.vy > 12) this.vy = 12;
      tileMap.resolveEntityCollision(this);

      if (this.deathTimer <= 0) {
        this.isAlive = false;
      }
      return;
    }

    // Run Group Combat Coordinator
    if (goblins && goblins.length > 0) {
      ForestGoblin.manageGroupCombat(goblins, player, dt);
    }

    if (ForestGoblin.groupAttackCooldown > 0) {
      ForestGoblin.groupAttackCooldown -= dt;
    }

    if (this.isShadowClone) {
      this.cloneLifetime -= dt;
      if (this.cloneLifetime <= 0) {
        this.isAlive = false;
        particles.createSlashSparks(this.x + this.width / 2, this.y + 10, true, ['#c084fc', '#3b0764']);
        return;
      }
    }

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.slowTimer > 0) this.slowTimer -= dt;
    if (this.abilityCooldown > 0) this.abilityCooldown -= dt;
    if (this.retreatTimer > 0) this.retreatTimer -= dt;
    if (this.dodgeTimer > 0) this.dodgeTimer -= dt;
    if (this.guardCooldown > 0) this.guardCooldown -= dt;
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
    if (this.counterCooldown > 0) this.counterCooldown -= dt;
    if (this.hitStunTimer > 0) this.hitStunTimer -= dt;
    if (this.reactionTimer > 0) this.reactionTimer -= dt;
    if (this.playerAttackWindowTimer > 0) {
      this.playerAttackWindowTimer -= dt;
      if (this.playerAttackWindowTimer <= 0) this.playerAttacksCount = 0;
    }

    if (this.isGuarding) {
      this.guardTimer -= dt;
      if (this.guardTimer <= 0) {
        this.isGuarding = false;
      }
    }

    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) this.isDashing = false;
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

    const [wStr] = this.levelId.split('-');
    const w = parseInt(wStr, 10) || 1;

    // Handle HIT State Stagger & Recoil
    if (this.combatState === 'HIT') {
      this.facingRight = player.x > this.x; // Always face attacker
      this.vx *= 0.85;

      if (this.hitStunTimer <= 0) {
        if (this.consecutiveHitsTaken >= 3) {
          this.consecutiveHitsTaken = 0;
          this.combatState = 'RETREAT';
          this.retreatTimer = 0.42;
          this.vx = this.facingRight ? -8.0 : 8.0;
          this.isGuarding = true;
          this.guardTimer = 0.60;
          particles.createFloatingText(this.x + this.width / 2, this.y - 18, 'GUARD BURST! ⚡', '#facc15', 14);
        } else {
          const dx = player.x - this.x;
          const dy = player.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          this.combatState = dist < 70 ? 'COMBAT' : 'ALERT';
        }
      }

      this.applyPhysics(tileMap);
      return;
    }

    // World 6 Rage Mode Trigger (<35% HP)
    if (w === 6 && !this.isRageMode && this.hp < this.maxHp * 0.35) {
      this.isRageMode = true;
      particles.createFloatingText(this.x + this.width / 2, this.y - 20, 'AURA BURST! ⚡', '#facc15', 16);
      particles.createSlashSparks(this.x + this.width / 2, this.y, true, ['#facc15', '#ef4444']);
    }

    const baseSpeed = this.isRageMode ? this.moveSpeed * 1.2 : this.moveSpeed;
    const currentSpeed = this.slowTimer > 0 ? baseSpeed * 0.5 : baseSpeed;

    this.animTime += dt;
    if (this.animTime >= 0.08) {
      this.animTime = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);

    // Record Debug Info
    const isPlayerAttacking = player.state === 'ATTACK';
    const playerFacingUs = (player.facingRight && dx < 0) || (!player.facingRight && dx > 0);

    let playerAction = 'NONE';
    if (isPlayerAttacking) playerAction = player.attackType || 'ATTACK';
    else if (!player.isGrounded) playerAction = 'JUMP';
    else if (Math.abs(player.vx) > 1.0) playerAction = 'APPROACHING';

    this.debugInfo = {
      state: this.combatState,
      target: 'PLAYER',
      distance: Math.round(distToPlayer),
      lastPlayerAction: playerAction,
      world: w,
    };

    // Multi-enemy physical separation so enemies don't overlap into a single stack
    if (goblins && goblins.length > 1) {
      for (const other of goblins) {
        if (other !== this && other.isAlive) {
          const sepDx = this.x - other.x;
          if (Math.abs(sepDx) < 28 && Math.abs(this.y - other.y) < 30) {
            this.vx += sepDx >= 0 ? 0.9 : -0.9;
          }
        }
      }
    }

    // Body contact physical separation & light bump damage
    if (this.intersects(player) && player.isAlive) {
      const bumpDx = (this.x + this.width / 2) - (player.x + player.width / 2);
      const pushDir = bumpDx >= 0 ? 1 : -1;
      this.x += pushDir * 2.2; // Push enemy outwards to prevent sprite clipping
      if (!player.isGodMode && player.invulnerableTimer <= 0) {
        // Body bump deals a tiny 1 HP graze rather than full heavy attack damage
        player.takeDamage(1, particles);
      }
    }

    // Continuous Player Attack Perception
    if (isPlayerAttacking && playerFacingUs && distToPlayer < 110) {
      if (this.perceivedPlayerAttack === null) {
        this.perceivedPlayerAttack = player.attackType || 'JAB';
        this.playerAttacksCount++;
        this.playerAttackWindowTimer = 1.4;

        let baseDelay = 0.22 - (w - 1) * 0.025;
        if (this.enemyClass === 'FAST_FIGHTER') baseDelay -= 0.03;
        if (this.enemyClass === 'ELITE_FIGHTER') baseDelay -= 0.04;
        if (this.isBoss) baseDelay -= 0.05;

        this.reactionDelay = Math.max(0.06, baseDelay);
        this.reactionTimer = this.reactionDelay;
      }
    } else if (!isPlayerAttacking) {
      this.perceivedPlayerAttack = null;
    }

    // Perform Tactical Defense Decision on reaction expiry
    if (
      this.reactionTimer <= 0 &&
      isPlayerAttacking &&
      distToPlayer < 90 &&
      this.combatState !== 'TELEGRAPH' &&
      this.combatState !== 'ATTACK' &&
      this.combatState !== 'DODGE' &&
      !this.isGuarding
    ) {
      const isHeavyAtk = player.attackType === 'FINISHER' || player.attackType === 'SPIN_KICK' || player.attackType === 'JUMP_KICK';
      const isSpam = this.playerAttacksCount >= 3;

      let blockProb = 0.20 + (w - 1) * 0.09;
      let dodgeProb = 0.10 + (w - 1) * 0.08;

      if (this.enemyClass === 'HEAVY_FIGHTER') { blockProb += 0.20; dodgeProb -= 0.05; }
      if (this.enemyClass === 'FAST_FIGHTER') { dodgeProb += 0.25; blockProb -= 0.05; }
      if (this.enemyClass === 'ELITE_FIGHTER') { blockProb += 0.15; dodgeProb += 0.15; }

      if (isHeavyAtk) dodgeProb += 0.30;
      if (isSpam) { dodgeProb += 0.20; blockProb += 0.15; }

      if (this.forceDodgeFlag || (this.dodgeCooldown <= 0 && Math.random() < dodgeProb)) {
        this.forceDodgeFlag = false;
        this.combatState = 'DODGE';
        this.dodgeTimer = 0.38;
        this.dodgeCooldown = Math.max(0.8, 2.0 - w * 0.2);
        this.vx = dx > 0 ? -7.5 : 7.5;
        this.vy = -2.2;
        particles.createFloatingText(this.x + this.width / 2, this.y - 18, 'DODGE! 💨', '#38bdf8', 13);
        audioEngine.playVocal('spin_kick');
      } else if (this.forceBlockFlag || (this.guardCooldown <= 0 && Math.random() < blockProb)) {
        this.forceBlockFlag = false;
        this.combatState = 'DEFEND';
        this.isGuarding = true;
        this.guardTimer = 0.55;
        this.guardCooldown = Math.max(0.7, 1.6 - w * 0.15);
        particles.createFloatingText(this.x + this.width / 2, this.y - 18, 'GUARD! 🛡️', '#f59e0b', 13);
      } else if (this.forceCounterattackFlag || (this.counterCooldown <= 0 && distToPlayer < 50 && Math.random() < (0.25 + w * 0.08))) {
        this.forceCounterattackFlag = false;
        this.combatState = 'TELEGRAPH';
        this.activeAttack = 'ROUNDHOUSE_KICK';
        this.attackStateTimer = 0.14;
        this.counterCooldown = Math.max(1.0, 2.5 - w * 0.2);
        particles.createFloatingText(this.x + this.width / 2, this.y - 20, 'COUNTERSTRIKE! ⚡', '#ef4444', 14);
        audioEngine.playVocal('heavy_punch');
      }
    }

    // State Executions
    if (this.combatState === 'TELEGRAPH') {
      this.facingRight = dx > 0;
      this.vx = 0;
      this.attackStateTimer -= dt;
      if (this.attackStateTimer <= 0) {
        this.combatState = 'ATTACK';
        this.attackStateTimer = 0.18;
        audioEngine.playPunch();

        if (distToPlayer <= this.attackRange + 12 && player.isAlive) {
          player.takeDamage(this.attackDamage, particles);
          audioEngine.playHitImpact('enemy', 'PUNCH');
        }
      }
      this.applyPhysics(tileMap);
      return;
    }

    if (this.combatState === 'ATTACK') {
      this.facingRight = dx > 0;
      this.attackStateTimer -= dt;
      if (this.attackStateTimer <= 0) {
        if (this.comboStep < this.maxComboSteps) {
          this.comboStep++;
          this.activeAttack = this.comboStep % 2 === 0 ? 'ROUNDHOUSE_KICK' : 'HEAVY_PUNCH';
          this.combatState = 'ATTACK';
          this.attackStateTimer = 0.16;

          audioEngine.playKick();
          if (distToPlayer <= this.attackRange + 12 && player.isAlive) {
            player.takeDamage(Math.round(this.attackDamage * 1.1), particles);
            audioEngine.playHitImpact('enemy', 'KICK');
          }
        } else {
          this.combatState = 'RECOVER';
          this.attackStateTimer = 0.22;
          this.attackCooldown = this.isRageMode ? 0.6 : 1.1;

          if (Math.random() < 0.45) {
            this.retreatTimer = 0.32;
          }
        }
      }
      this.applyPhysics(tileMap);
      return;
    }

    if (this.combatState === 'RECOVER') {
      this.facingRight = dx > 0;
      this.attackStateTimer -= dt;
      if (this.retreatTimer > 0) {
        this.vx = this.facingRight ? -currentSpeed * 0.8 : currentSpeed * 0.8;
      } else {
        this.vx = 0;
      }

      if (this.attackStateTimer <= 0) {
        this.combatState = 'COMBAT';
      }

      this.applyPhysics(tileMap);
      return;
    }

    // Pursuit & Tactical Movement AI
    if (distToPlayer <= this.detectionRadius && player.isAlive) {
      this.facingRight = dx > 0;

      // Special Ability Check
      if (this.abilityCooldown <= 0 && distToPlayer < 180 && Math.random() < 0.35) {
        this.executeWorldSpecialAbility(w, dx, dy, player, particles, goblins);
        this.abilityCooldown = 4.5 + Math.random() * 2.0;
      }

      if (this.retreatTimer > 0) {
        this.combatState = 'RETREAT';
        this.vx = this.facingRight ? -currentSpeed * 0.9 : currentSpeed * 0.9;
      } else if (distToPlayer > this.attackRange) {
        this.combatState = 'APPROACH';
        if (this.hasAttackToken) {
          const speedMult = this.isDashing ? 1.8 : 1.0;
          this.vx = (dx > 0 ? currentSpeed : -currentSpeed) * speedMult;
        } else {
          // Circle or maintain distance (65px to 105px)
          if (distToPlayer < 65) {
            this.vx = dx > 0 ? -currentSpeed * 0.6 : currentSpeed * 0.6;
          } else if (distToPlayer > 105) {
            this.vx = (dx > 0 ? currentSpeed : -currentSpeed) * 0.7;
          } else {
            this.vx = 0;
            this.combatState = 'COMBAT';
          }
        }

        if (this.isGrounded && this.isSolidTileAtPixel(tileMap, this.x + (this.facingRight ? 36 : -8), this.y + 20)) {
          this.vy = -8.2;
        }
      } else {
        // Within Attack Range
        this.vx = 0;
        this.combatState = 'COMBAT';

        if (this.hasAttackToken && this.attackCooldown <= 0 && ForestGoblin.groupAttackCooldown <= 0) {
          this.combatState = 'TELEGRAPH';
          this.comboStep = 1;

          const rand = Math.random();
          if (rand < 0.35) this.activeAttack = 'FAST_PUNCH';
          else if (rand < 0.65) this.activeAttack = 'FRONT_KICK';
          else if (rand < 0.85) this.activeAttack = 'ROUNDHOUSE_KICK';
          else this.activeAttack = 'FLYING_KNEE';

          this.attackStateTimer = this.enemyClass === 'FAST_FIGHTER' ? 0.16 : 0.24;
          ForestGoblin.groupAttackCooldown = 0.35;
        }
      }
    } else {
      // Patrol behavior
      this.combatState = 'IDLE';
      this.vx = currentSpeed * 0.5 * this.patrolDirection;
      this.facingRight = this.patrolDirection > 0;

      if (this.x <= this.patrolMinX) {
        this.patrolDirection = 1;
      } else if (this.x >= this.patrolMaxX) {
        this.patrolDirection = -1;
      }

      if (this.isGrounded && this.isSolidTileAtPixel(tileMap, this.x + (this.facingRight ? 32 : -8), this.y + 20)) {
        this.patrolDirection *= -1;
      }
    }

    this.applyPhysics(tileMap);
  }

  private executeWorldSpecialAbility(
    w: number,
    dx: number,
    dy: number,
    player: Player,
    particles: ParticleSystem,
    goblins?: ForestGoblin[]
  ) {
    if (w === 1) {
      this.isDashing = true;
      this.dashTimer = 0.45;
      this.vx = dx > 0 ? 8.5 : -8.5;
      this.vy = -3.5;
      particles.createFloatingText(this.x + this.width / 2, this.y - 15, 'SHADOW LEAP! 🍃', '#22c55e', 14);
      audioEngine.playVocal('jump_kick');
    } else if (w === 2) {
      this.isGuarding = true;
      this.guardTimer = 1.2;
      particles.createFloatingText(this.x + this.width / 2, this.y - 15, 'IRON GUARD! 🛡️', '#f59e0b', 14);
      audioEngine.playCustomSFX('land');
    } else if (w === 3) {
      this.dodgeTimer = 0.35;
      this.vx = dx > 0 ? -7.0 : 7.0;
      particles.createFloatingText(this.x + this.width / 2, this.y - 15, 'MIST STEP! ❄️', '#38bdf8', 14);
      audioEngine.playVocal('spin_kick');
    } else if (w === 4) {
      this.isDashing = true;
      this.dashTimer = 0.35;
      this.vx = dx > 0 ? 9.0 : -9.0;
      particles.createFloatingText(this.x + this.width / 2, this.y - 15, 'INFERNO STRIKE! 🔥', '#f97316', 15);
      audioEngine.playVocal('heavy_punch');
    } else if (w === 5) {
      if (goblins && goblins.length < 12) {
        const clone = new ForestGoblin(this.x + 20, this.y, 60, false, this.levelId);
        clone.isShadowClone = true;
        clone.hp = 30;
        clone.maxHp = 30;
        goblins.push(clone);
        particles.createFloatingText(this.x + this.width / 2, this.y - 15, 'SHADOW DECOY! 👁️', '#c084fc', 14);
      }
    } else if (w === 6) {
      this.isGuarding = true;
      this.guardTimer = 1.0;
      this.activeAttack = 'ROUNDHOUSE_KICK';
      particles.createFloatingText(this.x + this.width / 2, this.y - 15, 'IMPERIAL STANCE! 👑', '#facc15', 15);
      audioEngine.playVocal('finisher');
    }
  }

  private applyPhysics(tileMap: TileMap) {
    this.vy += 0.65;
    if (this.vy > 12) this.vy = 12;
    tileMap.resolveEntityCollision(this);

    if (this.y > tileMap.heightInPixels - 60) {
      this.y = tileMap.heightInPixels - 180;
      this.vy = -6;
    }
  }

  private isSolidTileAtPixel(tileMap: TileMap, px: number, py: number): boolean {
    const tile = tileMap.getTileAtPixel(px, py);
    return tileMap.isSolidTile(tile);
  }

  public takeDamage(damage: number, particles: ParticleSystem, attackType?: string): boolean {
    if (!this.isAlive || this.combatState === 'DEAD') return false;

    const hitX = this.x + this.width / 2;
    const hitY = this.y - 10;

    // 1. Dodge Invulnerability
    if (this.combatState === 'DODGE' || this.dodgeTimer > 0) {
      particles.createFloatingText(hitX, hitY, 'DODGED! 💨', '#38bdf8', 14);
      return false;
    }

    // 2. Guarding reduces incoming damage by 80%
    if (this.isGuarding || this.combatState === 'DEFEND') {
      const finalDamage = Math.max(1, Math.round(damage * 0.2));
      this.hp -= finalDamage;
      this.hitFlashTimer = 0.18;

      audioEngine.playHitImpact('enemy', attackType);
      particles.createFloatingText(hitX, hitY, `BLOCKED! -${finalDamage} 🛡️`, '#94a3b8', 13);

      if (this.counterCooldown <= 0 && Math.random() < 0.5) {
        this.counterCooldown = 1.8;
        this.isGuarding = false;
        this.combatState = 'TELEGRAPH';
        this.activeAttack = 'ROUNDHOUSE_KICK';
        this.attackStateTimer = 0.14;
        particles.createFloatingText(hitX, hitY - 15, 'GUARD COUNTER! ⚡', '#ef4444', 14);
      }

      if (this.hp <= 0) {
        this.hp = 0;
        this.combatState = 'DEAD';
        this.deathTimer = 0.5;
        this.vx = 0;
        this.isGuarding = false;
        this.hasAttackToken = false;
        audioEngine.playPlayerHurt();
        particles.createSlashSparks(this.x + this.width / 2, this.y + this.height / 2, true, ['#facc15', '#ef4444']);
        return true;
      }
      return true;
    }

    // 3. Direct Hit -> Enter HIT Stagger state
    const finalDamage = damage;
    this.hp -= finalDamage;
    this.hitFlashTimer = 0.10; // Crisp brief 100ms white hit flash
    this.combatState = 'HIT';

    let hitStunDuration = 0.20;
    if (attackType === 'FINISHER') hitStunDuration = 0.45;
    else if (attackType === 'SPIN_KICK' || attackType === 'KICK') hitStunDuration = 0.35;
    else if (attackType === 'CROSS') hitStunDuration = 0.28;
    else if (attackType === 'JUMP_KICK') hitStunDuration = 0.32;

    this.hitStunTimer = hitStunDuration;

    this.vx = this.facingRight ? -5.5 : 5.5;
    this.vy = -2.2;

    audioEngine.playHitImpact('enemy', attackType);
    if (!attackType) {
      particles.createFloatingText(hitX, hitY, `-${finalDamage}`, '#ef4444', 15);
    }
    this.consecutiveHitsTaken++;

    particles.createHitBloodOrSparks(this.x + this.width / 2, this.y + this.height / 2);

    if (this.hp <= 0) {
      this.hp = 0;
      this.combatState = 'DEAD';
      this.deathTimer = 0.5;
      this.vx = 0;
      this.isGuarding = false;
      this.hasAttackToken = false;
      audioEngine.playPlayerHurt();
      particles.createSlashSparks(this.x + this.width / 2, this.y + this.height / 2, true, ['#facc15', '#ef4444']);
      return true;
    }

    return false;
  }

  // Force Debug Triggers
  public triggerForceBlock() {
    this.forceBlockFlag = true;
  }

  public triggerForceDodge() {
    this.forceDodgeFlag = true;
  }

  public triggerForceCounterattack() {
    this.forceCounterattackFlag = true;
  }

  // ==========================================
  // RENDER SERIOUS HUMANOID MARTIAL ARTISTS
  // ==========================================
  public render(
    ctx: CanvasRenderingContext2D,
    cameraOrOffsetX: { x: number; y: number } | number,
    offsetY: number = 0
  ) {
    if (!this.isAlive) return;

    const camX = typeof cameraOrOffsetX === 'number' ? cameraOrOffsetX : cameraOrOffsetX.x;
    const camY = typeof cameraOrOffsetX === 'number' ? offsetY : cameraOrOffsetX.y;

    const renderX = Math.round(this.x - camX);
    const renderY = Math.round(this.y - camY);

    ctx.save();
    ctx.translate(renderX + this.width / 2, renderY + this.height);

    if (!this.facingRight) {
      ctx.scale(-1, 1);
    }

    const bob = Math.sin(this.animFrame * Math.PI / 2) * 2;
    const walk = Math.sin(this.animFrame * Math.PI / 2);
    const isHitFlash = this.hitFlashTimer > 0;
    const isHitStagger = isHitFlash || this.combatState === 'HIT';

    if (this.combatState === 'DEAD') {
      const alpha = Math.max(0, Math.min(1, this.deathTimer / 0.5));
      ctx.globalAlpha = alpha;
      ctx.rotate(-0.45);
      ctx.translate(-8, 6);
    } else if (isHitStagger) {
      // Apply visible head & body recoil stagger when hit
      ctx.rotate(-0.22); // Tilt backward from impact direction
      ctx.translate(-4, -2); // Push back slightly
    }

    const [wStr] = this.levelId.split('-');
    const w = parseInt(wStr, 10) || 1;

    // Render World Specific Serious Martial Artist
    switch (w) {
      case 1:
        this.renderForestMartialArtist(ctx, bob, walk, isHitFlash);
        break;
      case 2:
        this.renderDesertBrawler(ctx, bob, walk, isHitFlash);
        break;
      case 3:
        this.renderFrostMercenary(ctx, bob, walk, isHitFlash);
        break;
      case 4:
        this.renderAshBrawler(ctx, bob, walk, isHitFlash);
        break;
      case 5:
        this.renderShadowAssassin(ctx, bob, walk, isHitFlash);
        break;
      case 6:
      default:
        this.renderCitadelGrandmaster(ctx, bob, walk, isHitFlash);
        break;
    }

    ctx.restore();

    // Render Health Bar & Serious Name Above Head (living enemies only)
    if (this.combatState !== 'DEAD') {
      this.renderHealthBar(ctx, renderX, renderY);

      if (DebugManager.isAiDebugInfoEnabled()) {
        this.renderAiDebugOverlay(ctx, renderX, renderY);
      }
    }
  }

  private renderAiDebugOverlay(ctx: CanvasRenderingContext2D, rx: number, ry: number) {
    const boxW = 126;
    const boxH = 46;
    const bx = Math.round(rx + (this.width - boxW) / 2);
    const by = Math.round(ry - 66);

    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(bx, by, boxW, boxH);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`State: ${this.combatState}`, bx + 6, by + 12);

    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`Target: ${this.debugInfo.target} (${this.debugInfo.distance}px)`, bx + 6, by + 24);

    ctx.fillStyle = '#facc15';
    ctx.fillText(`Player: ${this.debugInfo.lastPlayerAction}`, bx + 6, by + 36);

    ctx.restore();
  }

  private renderHealthBar(ctx: CanvasRenderingContext2D, rx: number, ry: number) {
    if (this.hp < this.maxHp && this.isAlive) {
      const barW = 38;
      const barH = 5;
      const bx = rx + (this.width - barW) / 2;
      const by = ry - 14;

      ctx.fillStyle = '#020617';
      ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

      const hpRatio = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(bx, by, Math.round(barW * hpRatio), barH);

      // Render Serious Enemy Name
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.enemyName, rx + this.width / 2, ry - 18);
    }
  }

  // Common Martial Arts Arms, Legs & Strikes Rendering
  private renderMartialArtsLimbs(
    ctx: CanvasRenderingContext2D,
    bob: number,
    skinColor: string,
    wrapColor: string,
    gloveColor: string
  ) {
    const state = this.combatState;
    const atk = this.activeAttack;

    // Telegraph Eye/Hand Aura Flare
    if (state === 'TELEGRAPH') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(4, -29 + bob, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Active Strike Animations
    if (state === 'ATTACK' && (atk === 'FAST_PUNCH' || atk === 'HEAVY_PUNCH')) {
      // Extended Straight Punch
      ctx.fillStyle = skinColor;
      ctx.fillRect(2, -20 + bob, 18, 6);

      ctx.fillStyle = wrapColor;
      ctx.fillRect(16, -21 + bob, 5, 8);

      ctx.fillStyle = gloveColor;
      ctx.fillRect(20, -22 + bob, 7, 10);
      return;
    }

    if (state === 'ATTACK' && (atk === 'FRONT_KICK' || atk === 'LOW_KICK')) {
      // Extended Front Kick
      ctx.fillStyle = skinColor;
      ctx.fillRect(0, -10 + bob, 20, 7);

      ctx.fillStyle = gloveColor;
      ctx.fillRect(18, -11 + bob, 8, 9);
      return;
    }

    if (state === 'ATTACK' && atk === 'ROUNDHOUSE_KICK') {
      // High Roundhouse Kick
      ctx.fillStyle = skinColor;
      ctx.fillRect(-2, -18 + bob, 22, 7);

      ctx.fillStyle = gloveColor;
      ctx.fillRect(18, -20 + bob, 9, 10);
      return;
    }

    if (state === 'ATTACK' && (atk === 'FLYING_KNEE' || atk === 'JUMP_KICK')) {
      // Airborne Lunge Knee / Jump Kick
      ctx.fillStyle = skinColor;
      ctx.fillRect(4, -16 + bob, 22, 7);

      ctx.fillStyle = gloveColor;
      ctx.fillRect(24, -17 + bob, 8, 9);
      return;
    }

    // Guard Stance
    if (this.isGuarding) {
      ctx.fillStyle = skinColor;
      ctx.fillRect(2, -24 + bob, 6, 12);
      ctx.fillRect(6, -26 + bob, 6, 12);

      ctx.fillStyle = wrapColor;
      ctx.fillRect(2, -26 + bob, 10, 5);
      return;
    }

    // DEFAULT: MARTIAL ARTS GUARD STANCE
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -20 + bob, 5, 5);
    ctx.fillRect(3, -18 + bob, 5, 5);

    ctx.fillStyle = wrapColor;
    ctx.fillRect(-4, -21 + bob, 4, 4);
    ctx.fillRect(5, -19 + bob, 4, 4);

    ctx.fillStyle = gloveColor;
    ctx.fillRect(-5, -22 + bob, 5, 5);
    ctx.fillRect(6, -20 + bob, 5, 5);
  }

  // WORLD 1 — FOREST: HUMAN FOREST ROGUE MARTIAL ARTIST
  private renderForestMartialArtist(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#fed7aa';
    const hair = hit ? '#ffffff' : '#1c1917';
    const tunic = hit ? '#ffffff' : '#15803d';

    // Head & Headband
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, -31 + bob, 12, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626'; // Red headband
    ctx.fillRect(-10, -32 + bob, 20, 3);

    // Face
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -29 + bob, 3, 3);

    // Neck & Tunic
    ctx.fillStyle = tunic;
    ctx.fillRect(-8, -17 + bob, 16, 13);

    ctx.fillStyle = '#78350f'; // Belt
    ctx.fillRect(-9, -5 + bob, 18, 3);

    // Trousers & Boots
    ctx.fillStyle = '#27272a';
    ctx.fillRect(-7 + walk * 4, -4, 6, 6);
    ctx.fillRect(1 - walk * 4, -4, 6, 6);

    this.renderMartialArtsLimbs(ctx, bob, skin, '#dc2626', '#fef08a');
  }

  // WORLD 2 — DESERT: HUMAN DESERT BRAWLER
  private renderDesertBrawler(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#e0a96d';
    const wrap = hit ? '#ffffff' : '#d97706';

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    // Desert Head Scarf
    ctx.fillStyle = wrap;
    ctx.beginPath();
    ctx.arc(0, -30 + bob, 12, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -29 + bob, 3, 3);

    // Wrapped Muscular Torso
    ctx.fillStyle = skin;
    ctx.fillRect(-8, -17 + bob, 16, 13);
    ctx.fillStyle = wrap;
    ctx.fillRect(-9, -11 + bob, 18, 6);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    this.renderMartialArtsLimbs(ctx, bob, skin, '#78350f', '#f59e0b');
  }

  // WORLD 3 — ICE: HUMAN FROST MERCENARY
  private renderFrostMercenary(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#ffedd5';
    const coat = hit ? '#ffffff' : '#0284c7';
    const fur = hit ? '#ffffff' : '#f8fafc';

    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(1, -28 + bob, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -29 + bob, 3, 3);

    ctx.fillStyle = coat;
    ctx.fillRect(-9, -18 + bob, 18, 14);

    ctx.fillStyle = fur;
    ctx.fillRect(-10, -19 + bob, 20, 4);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    this.renderMartialArtsLimbs(ctx, bob, skin, '#0369a1', '#e0f2fe');
  }

  // WORLD 4 — VOLCANO: HUMAN ASH BRAWLER
  private renderAshBrawler(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#d97706';
    const jacket = hit ? '#ffffff' : '#18181b';
    const accent = hit ? '#ffffff' : '#f97316';

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = accent;
    ctx.fillRect(-8, -33 + bob, 16, 4); // Headband Goggles

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -29 + bob, 3, 3);

    ctx.fillStyle = jacket;
    ctx.fillRect(-9, -17 + bob, 18, 13);
    ctx.fillStyle = accent;
    ctx.fillRect(-9, -13 + bob, 18, 3);

    ctx.fillStyle = '#27272a';
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    this.renderMartialArtsLimbs(ctx, bob, skin, '#c2410c', '#fdba74');
  }

  // WORLD 5 — SHADOW REALM: HUMAN SHADOW ASSASSIN
  private renderShadowAssassin(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#ffedd5';
    const coat = hit ? '#ffffff' : '#3b0764';
    const accent = hit ? '#ffffff' : '#c084fc';

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -29 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -32 + bob, 12, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();

    ctx.fillStyle = accent;
    ctx.fillRect(3, -30 + bob, 3, 3);

    ctx.fillStyle = coat;
    ctx.fillRect(-9, -18 + bob, 18, 14);

    ctx.fillStyle = '#020617';
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    this.renderMartialArtsLimbs(ctx, bob, skin, '#581c87', '#e9d5ff');
  }

  // WORLD 6 — CITADEL: IMPERIAL GRANDMASTER GUARD
  private renderCitadelGrandmaster(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#fed7aa';
    const armor = hit ? '#ffffff' : '#1e293b';
    const gold = hit ? '#ffffff' : '#facc15';

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -29 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = armor;
    ctx.beginPath();
    ctx.arc(0, -32 + bob, 12, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444'; // Red Visor
    ctx.fillRect(-2, -31 + bob, 10, 3);

    ctx.fillStyle = armor;
    ctx.fillRect(-10, -18 + bob, 20, 14);
    ctx.fillStyle = gold;
    ctx.fillRect(-10, -18 + bob, 3, 14);
    ctx.fillRect(7, -18 + bob, 3, 14);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    this.renderMartialArtsLimbs(ctx, bob, skin, '#991b1b', '#fef08a');
  }
}
