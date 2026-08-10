import { Entity } from './Entity';
import { Player } from './Player';
import { TileMap } from '../world/TileMap';
import { ParticleSystem } from '../core/ParticleSystem';
import { audioEngine } from '../audio/AudioEngine';
import { BossProjectile } from './BossProjectile';

export class ForestGoblin extends Entity {
  public hp: number = 50;
  public maxHp: number = 50;
  public attackDamage: number = 8;
  public moveSpeed: number = 3.5;
  public detectionRadius: number = 240;
  public attackRange: number = 42;
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

  // Unique World Special Powers
  public abilityCooldown: number = 2.0;
  public warningTimer: number = 0;
  public warningType: string | null = null;

  // Martial Arts Fighter State & Style
  public martialStyle: 'STRIKER' | 'BRAWLER' | 'ACROBAT' | 'BALANCED' = 'BALANCED';
  public combatState: 'IDLE' | 'APPROACH' | 'TELEGRAPH' | 'ATTACK' | 'RECOVERY' | 'RETREAT' | 'DODGE' = 'IDLE';
  public activeAttack: 'FAST_PUNCH' | 'HEAVY_PUNCH' | 'FRONT_KICK' | 'LOW_KICK' | 'ROUNDHOUSE_KICK' | 'JUMP_KICK' = 'FAST_PUNCH';
  public attackStateTimer: number = 0;
  public comboStep: number = 0;
  public maxComboSteps: number = 1;
  public retreatTimer: number = 0;
  public dodgeTimer: number = 0;

  // Shared Multi-Enemy Attack Stagger Cooldown
  private static groupAttackCooldown: number = 0;

  // World 1 (Forest)
  public hasBlockShield: boolean = false;
  public isDashing: boolean = false;
  public dashTimer: number = 0;

  // World 2 (Ruins)
  public stoneShieldTimer: number = 0;

  // World 3 (Desert)
  public isSandDashing: boolean = false;
  public isBurrowed: boolean = false;
  public burrowTimer: number = 0;

  // World 4 (Peaks)
  public iceShieldHits: number = 0;
  public iceShieldTimer: number = 0;

  // World 5 (Shadow)
  public isShadowClone: boolean = false;
  public cloneLifetime: number = 3.5;

  // World 6 (Citadel)
  public isRageMode: boolean = false;

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
      this.maxHp = 500;
      this.attackDamage = 10;
      this.moveSpeed = 2.4;
    } else if (isBoss) {
      this.maxHp = 220 + w * 35;
      this.attackDamage = 8 + Math.floor(w * 0.4);
      this.moveSpeed = 2.2;
    } else {
      this.maxHp = 45 + w * 5;
      this.attackDamage = 5 + Math.floor(w * 0.3);
      // Target enemy move speed: ~90-95% of player speed (3.84)
      this.moveSpeed = 3.50 + (w % 3) * 0.08;
    }

    this.hp = this.maxHp;
    this.detectionRadius = isBoss ? 340 : 240;
    this.attackRange = isBoss ? 52 : 42;

    this.patrolMinX = x - patrolRange / 2;
    this.patrolMaxX = x + patrolRange / 2;

    // Assign Martial Arts Fighter Style for normal enemies
    const seed = Math.abs(Math.floor(x * 3 + y * 7)) % 4;
    if (seed === 0) this.martialStyle = 'STRIKER';
    else if (seed === 1) this.martialStyle = 'BRAWLER';
    else if (seed === 2) this.martialStyle = 'ACROBAT';
    else this.martialStyle = 'BALANCED';

    // World 1 Guard Shield Assignment for 50% of regular enemies
    if (w === 1 && !isBoss && Math.floor(x + y) % 2 === 0) {
      this.hasBlockShield = true;
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

    // Decrement shared group attack stagger cooldown
    if (ForestGoblin.groupAttackCooldown > 0) {
      ForestGoblin.groupAttackCooldown -= dt;
    }

    // Handle Shadow Clone Lifespan
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
    if (this.stoneShieldTimer > 0) this.stoneShieldTimer -= dt;
    if (this.iceShieldTimer > 0) this.iceShieldTimer -= dt;
    if (this.abilityCooldown > 0) this.abilityCooldown -= dt;
    if (this.retreatTimer > 0) this.retreatTimer -= dt;
    if (this.dodgeTimer > 0) this.dodgeTimer -= dt;

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

    // World 6 Rage Mode Trigger (<40% HP)
    const [wStr] = this.levelId.split('-');
    const w = parseInt(wStr, 10) || 1;
    if (w === 6 && !this.isRageMode && this.hp < this.maxHp * 0.4) {
      this.isRageMode = true;
      particles.createFloatingText(this.x + this.width / 2, this.y - 20, 'RAGE MODE! 🤬', '#ef4444', 16);
      particles.createSlashSparks(this.x + this.width / 2, this.y, true, ['#ef4444', '#f97316']);
    }

    const baseSpeed = this.isRageMode ? this.moveSpeed * 1.15 : this.moveSpeed;
    const currentSpeed = this.slowTimer > 0 ? baseSpeed * 0.5 : baseSpeed;

    // Animation frames
    this.animTime += dt;
    if (this.animTime >= 0.08) {
      this.animTime = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);

    // ------------------------------------
    // SPECIAL POWERS WARNING TELEGRAPH
    // ------------------------------------
    if (this.warningTimer > 0) {
      this.warningTimer -= dt;
      this.vx = 0;

      if (this.warningTimer <= 0) {
        if (this.warningType === 'SMASH' && projectiles) {
          projectiles.push(
            new BossProjectile({
              x: this.x + (this.facingRight ? this.width : -24),
              y: this.y + this.height - 24,
              vx: this.facingRight ? 6.5 : -6.5,
              vy: 0,
              width: 24,
              height: 24,
              damage: 7,
              color: '#b45309',
              glowColor: '#f59e0b',
              isShockwave: true,
              type: 'vine',
            })
          );
          audioEngine.playCustomSFX('finisher');
          particles.createLandingImpact(this.x + this.width / 2, this.y + this.height, 8);
        } else if (this.warningType === 'SAND_THROW' && projectiles) {
          projectiles.push(
            new BossProjectile({
              x: this.x + (this.facingRight ? this.width : -20),
              y: this.y + 10,
              vx: this.facingRight ? 7.0 : -7.0,
              vy: 0,
              width: 20,
              height: 20,
              damage: 5,
              color: '#f59e0b',
              glowColor: '#d97706',
              type: 'sand',
            })
          );
          particles.createFloatingText(this.x + this.width / 2, this.y - 10, 'SAND THROW! ⌛', '#f59e0b', 13);
        } else if (this.warningType === 'ICE_BLAST' && projectiles) {
          projectiles.push(
            new BossProjectile({
              x: this.x + (this.facingRight ? this.width : -20),
              y: this.y + 10,
              vx: this.facingRight ? 7.5 : -7.5,
              vy: 0,
              width: 22,
              height: 22,
              damage: 6,
              color: '#38bdf8',
              glowColor: '#0284c7',
              type: 'ice',
            })
          );
          particles.createFloatingText(this.x + this.width / 2, this.y - 10, 'ICE BLAST! ❄️', '#38bdf8', 13);
        } else if (this.warningType === 'SHADOW_STRIKE') {
          this.vx = this.facingRight ? 8.5 : -8.5;
          this.vy = -3;
          if (distToPlayer < 48 && player.isAlive) {
            player.takeDamage(11, particles);
          }
          particles.createFloatingText(this.x + this.width / 2, this.y - 10, 'SHADOW STRIKE! 🔮', '#c084fc', 14);
        }

        this.warningType = null;
        this.abilityCooldown = 4.0 + Math.random() * 2.0;
      }

      this.applyPhysics(tileMap);
      return;
    }

    // Direct body contact check
    if (this.intersects(player) && player.isAlive && !this.isBurrowed) {
      player.takeDamage(this.attackDamage, particles);
    }

    // ------------------------------------
    // MARTIAL ARTS COMBAT STATE MACHINE
    // ------------------------------------
    if (this.combatState === 'TELEGRAPH') {
      this.attackStateTimer -= dt;
      this.vx = 0; // Pause during telegraph pose

      if (this.attackStateTimer <= 0) {
        // Transition to ATTACK
        this.combatState = 'ATTACK';
        this.attackStateTimer = 0.18;

        // Play Martial Arts Vocal / SFX
        if (this.activeAttack === 'FAST_PUNCH') {
          audioEngine.playPunch('light');
        } else if (this.activeAttack === 'HEAVY_PUNCH') {
          audioEngine.playPunch('heavy');
        } else if (this.activeAttack === 'FRONT_KICK' || this.activeAttack === 'LOW_KICK') {
          audioEngine.playKick();
        } else if (this.activeAttack === 'ROUNDHOUSE_KICK') {
          audioEngine.playSpinKick();
        } else if (this.activeAttack === 'JUMP_KICK') {
          audioEngine.playJumpKick();
          if (this.isGrounded) {
            this.vy = -5.5; // Mid-air leap for jump kick
          }
        }

        // Check Hit Range against Player
        const strikeRange = this.activeAttack === 'JUMP_KICK' ? 52 : 46;
        if (distToPlayer <= strikeRange && player.isAlive) {
          const hitDamage = this.activeAttack === 'HEAVY_PUNCH' || this.activeAttack === 'ROUNDHOUSE_KICK' ? 9 : 6;
          player.takeDamage(hitDamage, particles);
          audioEngine.playHitImpact('enemy', this.activeAttack);

          // Impact Particles
          const impactX = this.x + (this.facingRight ? this.width + 10 : -10);
          particles.createSlashSparks(impactX, this.y + 12, this.facingRight, ['#f59e0b', '#ef4444']);
        }
      }

      this.applyPhysics(tileMap);
      return;
    }

    if (this.combatState === 'ATTACK') {
      this.attackStateTimer -= dt;

      if (this.attackStateTimer <= 0) {
        // Combo Check
        if (this.comboStep < this.maxComboSteps) {
          this.comboStep++;
          // Pick next combo strike
          this.activeAttack = this.comboStep % 2 === 0 ? 'ROUNDHOUSE_KICK' : 'HEAVY_PUNCH';
          this.combatState = 'ATTACK';
          this.attackStateTimer = 0.16;

          audioEngine.playKick();
          if (distToPlayer <= 48 && player.isAlive) {
            player.takeDamage(7, particles);
            audioEngine.playHitImpact('enemy', 'KICK');
          }
        } else {
          // Finished attack / combo sequence
          this.combatState = 'RECOVERY';
          this.attackStateTimer = 0.22;
          this.attackCooldown = this.isRageMode ? 0.7 : 1.2;

          // 40% Chance to do a tactical backstep retreat
          if (Math.random() < 0.4) {
            this.retreatTimer = 0.28;
          }

          // Set shared group attack cooldown so other surrounding enemies take turns
          ForestGoblin.groupAttackCooldown = 0.32;
        }
      }

      this.applyPhysics(tileMap);
      return;
    }

    if (this.combatState === 'RECOVERY') {
      this.attackStateTimer -= dt;
      if (this.attackStateTimer <= 0) {
        this.combatState = 'IDLE';
      }
    }

    // Tactical Retreat / Backstep
    if (this.retreatTimer > 0) {
      this.vx = this.facingRight ? -currentSpeed * 0.9 : currentSpeed * 0.9;
      this.applyPhysics(tileMap);
      return;
    }

    // Defensive Dodge Step if Player Attacks nearby
    if (player.state === 'ATTACK' && distToPlayer < 55 && this.isGrounded && Math.random() < 0.3 && this.dodgeTimer <= 0) {
      this.dodgeTimer = 0.22;
      this.vy = -3.5;
      this.vx = dx > 0 ? -currentSpeed * 1.5 : currentSpeed * 1.5;
      particles.createFloatingText(this.x + this.width / 2, this.y - 12, 'DODGE! ⚡', '#38bdf8', 12);
      this.applyPhysics(tileMap);
      return;
    }

    // ------------------------------------
    // WORLD SPECIAL POWERS (SECONDARY MOVES)
    // ------------------------------------
    if (distToPlayer <= this.detectionRadius && player.isAlive) {
      this.facingRight = dx > 0;

      if (this.abilityCooldown <= 0) {
        if (w === 1) {
          if (distToPlayer > 80 && distToPlayer < 180 && Math.random() < 0.5) {
            this.isDashing = true;
            this.dashTimer = 0.38;
            this.abilityCooldown = 3.8;
            particles.createFloatingText(this.x + this.width / 2, this.y - 12, 'DASH! 💨', '#4ade80', 13);
          } else if (distToPlayer > 70 && distToPlayer < 150 && this.isGrounded) {
            this.vy = -7.5;
            this.vx = this.facingRight ? currentSpeed * 1.8 : -currentSpeed * 1.8;
            this.abilityCooldown = 4.5;
            particles.createFloatingText(this.x + this.width / 2, this.y - 12, 'LEAP! 🦅', '#22c55e', 13);
          }
        } else if (w === 2) {
          if (distToPlayer < 120 && this.stoneShieldTimer <= 0 && Math.random() < 0.45) {
            this.stoneShieldTimer = 3.2;
            this.abilityCooldown = 5.5;
            particles.createFloatingText(this.x + this.width / 2, this.y - 12, 'STONE SHIELD! 🪨', '#94a3b8', 13);
          } else if (distToPlayer < 140 && this.isGrounded) {
            this.warningTimer = 0.5;
            this.warningType = 'SMASH';
            particles.createFloatingText(this.x + this.width / 2, this.y - 16, 'SMASH! ⚠️', '#f97316', 14);
          }
        } else if (w === 3) {
          const roll = Math.random();
          if (roll < 0.35 && distToPlayer < 100) {
            this.isSandDashing = true;
            this.x = player.x + (this.facingRight ? -50 : 50);
            this.abilityCooldown = 4.5;
            particles.createSlashSparks(this.x, this.y, true, ['#f59e0b', '#d97706']);
            particles.createFloatingText(this.x + this.width / 2, this.y - 12, 'SAND DASH! ⏳', '#f59e0b', 13);
          } else if (roll < 0.7 && distToPlayer < 110) {
            this.warningTimer = 0.4;
            this.warningType = 'SAND_THROW';
            particles.createFloatingText(this.x + this.width / 2, this.y - 16, 'SAND PREP! ⏳', '#f59e0b', 13);
          } else if (this.isGrounded) {
            this.isBurrowed = true;
            this.burrowTimer = 1.2;
            this.abilityCooldown = 6.5;
            particles.createFloatingText(this.x + this.width / 2, this.y - 12, 'BURROW! 🌪️', '#d97706', 13);
          }
        } else if (w === 4) {
          const roll = Math.random();
          if (roll < 0.4) {
            this.warningTimer = 0.5;
            this.warningType = 'ICE_BLAST';
            particles.createFloatingText(this.x + this.width / 2, this.y - 16, 'ICE CHARGE! ❄️', '#38bdf8', 14);
          } else if (roll < 0.75 && this.isGrounded) {
            this.vy = -10.5;
            this.vx = this.facingRight ? 6.5 : -6.5;
            this.abilityCooldown = 4.5;
            particles.createFloatingText(this.x + this.width / 2, this.y - 12, 'FLIP LEAP! 🦅', '#38bdf8', 13);
          } else {
            this.iceShieldHits = 2;
            this.iceShieldTimer = 3.0;
            this.abilityCooldown = 6.5;
            particles.createFloatingText(this.x + this.width / 2, this.y - 12, 'ICE SHIELD! 🧊', '#0ea5e9', 13);
          }
        } else if (w === 5) {
          const roll = Math.random();
          if (roll < 0.35 && goblins && goblins.length < 12) {
            const clone = new ForestGoblin(this.x + (this.facingRight ? 36 : -36), this.y, 100, false, this.levelId);
            clone.isShadowClone = true;
            clone.maxHp = 15;
            clone.hp = 15;
            goblins.push(clone);
            this.abilityCooldown = 7.0;
            particles.createFloatingText(this.x + this.width / 2, this.y - 12, 'SHADOW CLONE! 👥', '#c084fc', 13);
          } else if (roll < 0.7) {
            this.x = player.x + (this.facingRight ? -60 : 60);
            this.abilityCooldown = 4.0;
            particles.createSlashSparks(this.x, this.y, true, ['#c084fc', '#3b0764']);
            particles.createFloatingText(this.x + this.width / 2, this.y - 12, 'VOID DASH! 🔮', '#c084fc', 13);
          } else {
            this.warningTimer = 0.7;
            this.warningType = 'SHADOW_STRIKE';
            particles.createFloatingText(this.x + this.width / 2, this.y - 16, 'SHADOW CHARGE! 🔮', '#c084fc', 14);
          }
        } else if (w === 6) {
          const roll = Math.random();
          if (roll < 0.4 && this.isGrounded) {
            this.warningTimer = 0.45;
            this.warningType = 'SMASH';
            particles.createFloatingText(this.x + this.width / 2, this.y - 16, 'SMASH! ⚠️', '#ef4444', 14);
          } else if (roll < 0.7) {
            this.x = player.x + (this.facingRight ? -50 : 50);
            this.abilityCooldown = 3.5;
            particles.createFloatingText(this.x + this.width / 2, this.y - 12, 'VOID DASH! 🔮', '#ef4444', 13);
          } else {
            this.stoneShieldTimer = 3.0;
            this.abilityCooldown = 5.0;
            particles.createFloatingText(this.x + this.width / 2, this.y - 12, 'STONE SHIELD! 🪨', '#facc15', 13);
          }
        }
      }

      // Handle Burrow Movement
      if (this.isBurrowed) {
        this.burrowTimer -= dt;
        this.vx = this.facingRight ? currentSpeed * 1.5 : -currentSpeed * 1.5;
        if (Math.random() < 0.4) {
          particles.createSlashSparks(this.x + this.width / 2, this.y + this.height, true, ['#d97706', '#f59e0b']);
        }
        if (this.burrowTimer <= 0 || distToPlayer < 24) {
          this.isBurrowed = false;
          this.vy = -6.5;
          if (distToPlayer < 36 && player.isAlive) {
            player.takeDamage(6, particles);
          }
          particles.createFloatingText(this.x + this.width / 2, this.y - 12, 'BURROW POP! 🌪️', '#d97706', 14);
        }
      } else {
        // Multi-Enemy Repositioning & Coordinated Pursuit
        let targetX = player.x;

        // Group Positioning Check
        if (goblins && goblins.length > 1) {
          const livingGoblins = goblins.filter((g) => g.isAlive && !g.isBoss);
          const myIndex = livingGoblins.indexOf(this);
          if (myIndex >= 0) {
            if (myIndex === 0) {
              targetX = player.x; // Primary attacker
            } else if (myIndex === 1) {
              targetX = player.x + (dx > 0 ? -52 : 52); // Opposite side flanker
            } else if (myIndex === 2) {
              targetX = player.x + (dx > 0 ? 68 : -68); // Secondary side flanker
            } else {
              targetX = player.x + (myIndex % 2 === 0 ? -90 : 90); // Waiting secondary line
            }
          }
        }

        const dxTarget = targetX - this.x;
        const distToTargetX = Math.abs(dxTarget);

        if (distToPlayer > this.attackRange || distToTargetX > 15) {
          // Rapid pursuit toward target position
          const speedMult = this.isDashing ? 2.4 : 1.0;
          this.vx = (dxTarget > 0 ? currentSpeed : -currentSpeed) * speedMult;

          // Auto-jump over obstacles
          if (this.isGrounded && this.isSolidTileAtPixel(tileMap, this.x + (this.facingRight ? 36 : -8), this.y + 20)) {
            this.vy = -8.2;
          }
        } else {
          // Within Martial Arts Strike Distance
          this.vx = 0;

          // Check if this enemy can initiate an attack
          if (this.attackCooldown <= 0 && ForestGoblin.groupAttackCooldown <= 0 && this.combatState === 'IDLE') {
            // Initiate Martial Arts Attack Sequence
            this.combatState = 'TELEGRAPH';
            this.attackStateTimer = 0.16; // Clear readable telegraph window
            ForestGoblin.groupAttackCooldown = 0.30; // Stagger group attack timer

            // Select Attack based on Fighter Style
            if (this.martialStyle === 'STRIKER') {
              const roll = Math.random();
              if (roll < 0.45) this.activeAttack = 'FAST_PUNCH';
              else if (roll < 0.8) this.activeAttack = 'LOW_KICK';
              else {
                this.activeAttack = 'FAST_PUNCH';
                this.comboStep = 1;
                this.maxComboSteps = 2;
              }
            } else if (this.martialStyle === 'BRAWLER') {
              const roll = Math.random();
              if (roll < 0.4) this.activeAttack = 'HEAVY_PUNCH';
              else if (roll < 0.8) this.activeAttack = 'ROUNDHOUSE_KICK';
              else this.activeAttack = 'FAST_PUNCH';
              this.maxComboSteps = 1;
            } else if (this.martialStyle === 'ACROBAT') {
              const roll = Math.random();
              if (roll < 0.4) this.activeAttack = 'JUMP_KICK';
              else if (roll < 0.75) this.activeAttack = 'FRONT_KICK';
              else this.activeAttack = 'ROUNDHOUSE_KICK';
              this.maxComboSteps = 1;
            } else {
              // BALANCED
              const roll = Math.random();
              if (roll < 0.25) this.activeAttack = 'FAST_PUNCH';
              else if (roll < 0.5) this.activeAttack = 'HEAVY_PUNCH';
              else if (roll < 0.75) this.activeAttack = 'FRONT_KICK';
              else this.activeAttack = 'LOW_KICK';
              this.maxComboSteps = 1;
            }
          }
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

    this.applyPhysics(tileMap);

    if (this.y > tileMap.heightInPixels + 100) {
      this.isAlive = false;
    }
  }

  private applyPhysics(tileMap: TileMap) {
    this.vy += 0.5;
    if (this.vy > 10) this.vy = 10;
    tileMap.resolveEntityCollision(this);
  }

  private isSolidTileAtPixel(tileMap: TileMap, px: number, py: number): boolean {
    const tile = tileMap.getTileAtPixel(px, py);
    return tileMap.isSolidTile(tile);
  }

  public takeDamage(damage: number, particles: ParticleSystem, attackType?: string): boolean {
    if (!this.isAlive) return false;

    // Guard Block Check
    if (this.hasBlockShield) {
      this.hasBlockShield = false;
      audioEngine.playEnemyHit(attackType);
      particles.createSlashSparks(this.x + this.width / 2, this.y + 10, this.facingRight, ['#e2e8f0', '#94a3b8']);
      particles.createFloatingText(this.x + this.width / 2, this.y - 14, 'BLOCK! 🛡️', '#e2e8f0', 15);
      return true;
    }

    // Ice Shield Check
    if (this.iceShieldHits > 0 && this.iceShieldTimer > 0) {
      this.iceShieldHits--;
      audioEngine.playEnemyHit(attackType);
      particles.createSlashSparks(this.x + this.width / 2, this.y + 10, this.facingRight, ['#38bdf8', '#0ea5e9']);
      particles.createFloatingText(this.x + this.width / 2, this.y - 14, 'ICE SHIELD! 🧊', '#38bdf8', 14);
      return true;
    }

    // Stone Shield Damage Reduction
    if (this.stoneShieldTimer > 0) {
      damage = Math.max(1, Math.round(damage * 0.4));
      particles.createFloatingText(this.x + this.width / 2, this.y - 14, 'STONE SHIELD! 🪨', '#94a3b8', 13);
    }

    this.hp -= damage;
    this.hitFlashTimer = 0.2;
    this.vy = -3;
    this.vx = this.facingRight ? -4 : 4; // Knockback

    // Interrupt attack if hit during telegraph/attack
    if (this.combatState === 'TELEGRAPH' || this.combatState === 'ATTACK') {
      this.combatState = 'RECOVERY';
      this.attackStateTimer = 0.25;
    }

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

    if (this.isShadowClone) {
      ctx.globalAlpha = 0.55;
    }

    if (this.isBurrowed) {
      ctx.save();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(px + this.width / 2, py + this.height - 4, 14, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px + this.width / 2 - 8, py + this.height - 2, 16, 2);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(px + this.width / 2, py + this.height);

    const baseScale = this.isBoss ? 1.85 : 1.25;
    const scaleX = this.facingRight ? baseScale : -baseScale;
    ctx.scale(scaleX, baseScale);

    const isHit = this.hitFlashTimer > 0;
    const isMoving = Math.abs(this.vx) > 0.1;
    const walkCycle = isMoving ? Math.sin(this.animFrame * 1.2) : 0;
    const bob = isMoving ? Math.abs(Math.sin(this.animFrame * 1.5)) * -2 : Math.sin(this.animTime * 6) * 1.2;

    if (isHit) {
      ctx.rotate(-0.15);
    } else if (isMoving) {
      ctx.rotate(0.05);
    }

    const [wStr] = this.levelId.split('-');
    const w = parseInt(wStr, 10) || 1;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, -2, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Render Auras for Active Shields
    if (this.stoneShieldTimer > 0) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -20, 20, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.iceShieldHits > 0 && this.iceShieldTimer > 0) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -20, 22, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.isRageMode) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -20, 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Render World Martial Artist Body
    switch (w) {
      case 2:
        this.renderDesertRaider(ctx, bob, walkCycle, isHit);
        break;
      case 3:
        this.renderIceStalker(ctx, bob, walkCycle, isHit);
        break;
      case 4:
        this.renderVolcanicBrute(ctx, bob, walkCycle, isHit);
        break;
      case 5:
        this.renderShadowWraith(ctx, bob, walkCycle, isHit);
        break;
      case 6:
        this.renderCitadelWarlord(ctx, bob, walkCycle, isHit);
        break;
      case 1:
      default:
        this.renderForestGoblinWarrior(ctx, bob, walkCycle, isHit);
        break;
    }

    // Render Guard Shield Icon
    if (this.hasBlockShield) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-18, -32 + bob, 6, 12);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.strokeRect(-18, -32 + bob, 6, 12);
    }

    ctx.restore();

    // HP Bar & Warning Badge floating above enemy
    if (this.warningTimer > 0) {
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('⚠️ CHARGING', px - 10, py - 24);
    } else if (this.hp < this.maxHp) {
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

    ctx.globalAlpha = 1.0;
  }

  // =========================================================
  // MARTIAL ARTS LIMBS & ATTACK POSES RENDERER HELPER
  // =========================================================
  private renderMartialArtsLimbs(
    ctx: CanvasRenderingContext2D,
    bob: number,
    skinColor: string,
    gloveColor: string,
    wrapColor: string
  ) {
    const state = this.combatState;
    const atk = this.activeAttack;

    // Telegraph Charge Spark
    if (state === 'TELEGRAPH') {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(atk.includes('KICK') ? 14 : 12, -22 + bob, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(atk.includes('KICK') ? 14 : 12, -22 + bob, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 1. PUNCH POSES (FAST_PUNCH / HEAVY_PUNCH)
    if (state === 'ATTACK' && (atk === 'FAST_PUNCH' || atk === 'HEAVY_PUNCH')) {
      const isHeavy = atk === 'HEAVY_PUNCH';
      const reach = isHeavy ? 22 : 16;

      // Extended Lead Arm (Punching Arm)
      ctx.fillStyle = skinColor;
      ctx.fillRect(4, -20 + bob, reach, 5);

      // Taped Wrist & Glove
      ctx.fillStyle = wrapColor;
      ctx.fillRect(4 + reach - 6, -21 + bob, 5, 7);
      ctx.fillStyle = gloveColor;
      ctx.fillRect(4 + reach, -22 + bob, 7, 8); // Fist

      // Punch Impact Arc
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(4 + reach + 3, -18 + bob, 10, -0.6, 0.6);
      ctx.stroke();

      // Rear Arm Guarding Face
      ctx.fillStyle = skinColor;
      ctx.fillRect(-6, -22 + bob, 5, 6);
      ctx.fillStyle = gloveColor;
      ctx.fillRect(-8, -23 + bob, 5, 5);
      return;
    }

    // 2. FRONT KICK / LOW KICK POSES
    if (state === 'ATTACK' && (atk === 'FRONT_KICK' || atk === 'LOW_KICK')) {
      const isLow = atk === 'LOW_KICK';
      const kickY = isLow ? -6 : -18;
      const kickX = 20;

      // Kicking Leg
      ctx.fillStyle = skinColor;
      ctx.fillRect(2, kickY + bob, kickX, 6);

      // Boot / Foot Strike
      ctx.fillStyle = gloveColor;
      ctx.fillRect(2 + kickX, kickY - 1 + bob, 7, 8);

      // Kick Sweep Trail
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(2 + kickX, kickY + 3 + bob, 12, -0.7, 0.7);
      ctx.stroke();

      // Guard Fists
      ctx.fillStyle = gloveColor;
      ctx.fillRect(-2, -22 + bob, 5, 5);
      ctx.fillRect(4, -20 + bob, 5, 5);
      return;
    }

    // 3. ROUNDHOUSE KICK POSE
    if (state === 'ATTACK' && atk === 'ROUNDHOUSE_KICK') {
      // High Arc Crescent Kick
      ctx.fillStyle = skinColor;
      ctx.fillRect(0, -26 + bob, 22, 6);

      // Foot
      ctx.fillStyle = gloveColor;
      ctx.fillRect(20, -28 + bob, 8, 8);

      // Spinning Crescent Arc
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(12, -24 + bob, 18, -1.2, 0.8);
      ctx.stroke();

      // Guard Fists
      ctx.fillStyle = gloveColor;
      ctx.fillRect(-6, -20 + bob, 5, 5);
      return;
    }

    // 4. JUMP KICK POSE
    if (state === 'ATTACK' && atk === 'JUMP_KICK') {
      // Airborne Diagonal Kick
      ctx.fillStyle = skinColor;
      ctx.fillRect(4, -14 + bob, 22, 6);

      ctx.fillStyle = gloveColor;
      ctx.fillRect(24, -15 + bob, 8, 8);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(20, -12 + bob, 14, -0.6, 0.6);
      ctx.stroke();
      return;
    }

    // DEFAULT: MARTIAL ARTS GUARD STANCE
    ctx.fillStyle = skinColor;
    ctx.fillRect(-3, -20 + bob, 5, 5); // Rear arm
    ctx.fillRect(3, -18 + bob, 5, 5);  // Lead arm

    // Fingerless Gloves / Fists
    ctx.fillStyle = wrapColor;
    ctx.fillRect(-4, -21 + bob, 4, 4);
    ctx.fillRect(5, -19 + bob, 4, 4);

    ctx.fillStyle = gloveColor;
    ctx.fillRect(-5, -22 + bob, 5, 5);
    ctx.fillRect(6, -20 + bob, 5, 5);
  }

  // ==========================================
  // WORLD 1 — FOREST: HUMAN FOREST ROGUE MARTIAL ARTIST
  // ==========================================
  private renderForestGoblinWarrior(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#fed7aa';
    const hair = hit ? '#ffffff' : '#27272a';
    const vest = hit ? '#ffffff' : '#15803d';
    const shirt = hit ? '#ffffff' : '#78350f';

    // Head & Face
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    // Hair & Headband
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(0, -31 + bob, 12, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626'; // Red Headband
    ctx.fillRect(-10, -32 + bob, 20, 3);

    // Face Details
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -29 + bob, 3, 3);
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(2, -22 + bob, 4, 1.5);

    // Neck & Torso
    ctx.fillStyle = skin;
    ctx.fillRect(-3, -19 + bob, 6, 3);

    ctx.fillStyle = shirt;
    ctx.fillRect(-8, -16 + bob, 16, 12);

    ctx.fillStyle = vest;
    ctx.fillRect(-9, -16 + bob, 4, 12);
    ctx.fillRect(5, -16 + bob, 4, 12);

    // Belt
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-9, -5 + bob, 18, 3);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2, -5 + bob, 4, 3);

    // Trousers & Boots
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(-7 + walk * 4, -4, 6, 6);
    ctx.fillRect(1 - walk * 4, -4, 6, 6);

    ctx.fillStyle = '#27272a';
    ctx.fillRect(-8 + walk * 4, -1, 7, 3);
    ctx.fillRect(1 - walk * 4, -1, 7, 3);

    // Martial Arts Arms, Legs & Strikes
    this.renderMartialArtsLimbs(ctx, bob, skin, '#dc2626', '#fef08a');
  }

  // ==========================================
  // WORLD 2 — DESERT: HUMAN DESERT RAIDER MARTIAL ARTIST
  // ==========================================
  private renderDesertRaider(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#e0a96d';
    const wrap = hit ? '#ffffff' : '#d97706';
    const scarf = hit ? '#ffffff' : '#78350f';

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

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-4, -33 + bob, 8, 3);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -29 + bob, 3, 3);

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

    // Martial Arts Arms, Legs & Strikes
    this.renderMartialArtsLimbs(ctx, bob, skin, '#78350f', '#f59e0b');
  }

  // ==========================================
  // WORLD 3 — ICE: HUMAN WINTER MERCENARY MARTIAL ARTIST
  // ==========================================
  private renderIceStalker(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#ffedd5';
    const coat = hit ? '#ffffff' : '#0284c7';
    const fur = hit ? '#ffffff' : '#f8fafc';

    // Hooded Head
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 13, -Math.PI / 3, Math.PI / 3);
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(1, -28 + bob, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -29 + bob, 3, 3);
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(1, -23 + bob, 6, 2.5);

    // Winter Coat Body
    ctx.fillStyle = coat;
    ctx.fillRect(-9, -18 + bob, 18, 14);

    ctx.fillStyle = fur;
    ctx.fillRect(-10, -19 + bob, 20, 4);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    // Martial Arts Arms, Legs & Strikes
    this.renderMartialArtsLimbs(ctx, bob, skin, '#0369a1', '#e0f2fe');
  }

  // ==========================================
  // WORLD 4 — VOLCANO: HUMAN ASH BRAWLER MARTIAL ARTIST
  // ==========================================
  private renderVolcanicBrute(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#d97706';
    const jacket = hit ? '#ffffff' : '#18181b';
    const accent = hit ? '#ffffff' : '#f97316';

    // Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(0, -31 + bob, 12, Math.PI, Math.PI * 2);
    ctx.fill();

    // Forehead Goggles
    ctx.fillStyle = accent;
    ctx.fillRect(-8, -33 + bob, 16, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-5, -32 + bob, 4, 2);
    ctx.fillRect(1, -32 + bob, 4, 2);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -29 + bob, 3, 3);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(2, -23 + bob, 4, 2);

    // Heat Vest Body
    ctx.fillStyle = jacket;
    ctx.fillRect(-9, -17 + bob, 18, 13);
    ctx.fillStyle = accent;
    ctx.fillRect(-9, -13 + bob, 18, 3);

    ctx.fillStyle = '#27272a';
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    // Martial Arts Arms, Legs & Strikes
    this.renderMartialArtsLimbs(ctx, bob, skin, '#c2410c', '#fdba74');
  }

  // ==========================================
  // WORLD 5 — DARK LANDS: HUMAN SHADOW ASSASSIN MARTIAL ARTIST
  // ==========================================
  private renderShadowWraith(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#ffedd5';
    const coat = hit ? '#ffffff' : '#3b0764';
    const accent = hit ? '#ffffff' : '#c084fc';

    // Head & Hair
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -29 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -32 + bob, 12, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();

    ctx.fillStyle = '#c084fc';
    ctx.fillRect(3, -30 + bob, 3, 3);

    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-6, -26 + bob, 12, 6);

    // Trench Coat Body
    ctx.fillStyle = coat;
    ctx.fillRect(-9, -18 + bob, 18, 14);

    ctx.fillStyle = accent;
    ctx.fillRect(-10, -19 + bob, 4, 6);
    ctx.fillRect(6, -19 + bob, 4, 6);

    ctx.fillStyle = '#020617';
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    // Martial Arts Arms, Legs & Strikes
    this.renderMartialArtsLimbs(ctx, bob, skin, '#581c87', '#e9d5ff');
  }

  // ==========================================
  // WORLD 6 — FINAL WORLD: ELITE HUMAN ENFORCER MARTIAL ARTIST
  // ==========================================
  private renderCitadelWarlord(
    ctx: CanvasRenderingContext2D,
    bob: number,
    walk: number,
    hit: boolean
  ) {
    const skin = hit ? '#ffffff' : '#fed7aa';
    const armor = hit ? '#ffffff' : '#1e293b';
    const gold = hit ? '#ffffff' : '#facc15';

    // Head with Tactical Visor
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -29 + bob, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = armor;
    ctx.beginPath();
    ctx.arc(0, -32 + bob, 12, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444'; // Red visor
    ctx.fillRect(-2, -31 + bob, 10, 3);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -23 + bob, 4, 1.5);

    // Elite Armor Vest
    ctx.fillStyle = armor;
    ctx.fillRect(-10, -18 + bob, 20, 14);
    ctx.fillStyle = gold;
    ctx.fillRect(-10, -18 + bob, 3, 14);
    ctx.fillRect(7, -18 + bob, 3, 14);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-7 + walk * 4, -5, 6, 6);
    ctx.fillRect(1 - walk * 4, -5, 6, 6);

    // Martial Arts Arms, Legs & Strikes
    this.renderMartialArtsLimbs(ctx, bob, skin, '#991b1b', '#fef08a');
  }
}

