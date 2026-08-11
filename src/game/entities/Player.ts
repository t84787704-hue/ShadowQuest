import { Entity } from './Entity';
import { PlayerActionState, PlayerStats, Rect } from '../../types/game';
import { InputState } from '../../types/game';
import { TileMap, TileType } from '../world/TileMap';
import { ParticleSystem } from '../core/ParticleSystem';
import { Camera } from '../core/Camera';
import { audioEngine } from '../audio/AudioEngine';
import { WeaponDef, WEAPONS } from '../weapons/WeaponData';

export class Player extends Entity {
  public stats: PlayerStats;
  public state: PlayerActionState = 'IDLE';
  public invulnerableTimer: number = 0;
  public attackTimer: number = 0;
  public attackCooldownTimer: number = 0;
  public animFrame: number = 0;
  public animTime: number = 0;
  public equippedWeapon: WeaponDef = WEAPONS.basic_sword;

  public comboStep: number = 0; // 1: JAB, 2: CROSS, 3: KICK, 4: FINISHER
  public attackType: 'JAB' | 'CROSS' | 'KICK' | 'FINISHER' | 'JUMP_KICK' | 'SPIN_KICK' = 'JAB';
  public comboWindowTimer: number = 0;
  public attackDuration: number = 0.16;
  public currentComboMultiplier: number = 1.0;
  public spinKickCooldownTimer: number = 0;
  public onDamage?: () => void;

  // Status effects from world enemies
  public slowTimer: number = 0;
  public stunTimer: number = 0;
  public sandBlindTimer: number = 0;
  public isGodMode: boolean = false;

  // Jump responsiveness helpers
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private isJumpConsumed: boolean = false;

  // Constants
  private readonly GRAVITY = 0.65;
  private readonly TERMINAL_VELOCITY = 13;

  public currentAttackId: number = 0;

  constructor(x: number, y: number, statsBonus?: Partial<PlayerStats>, weapon?: WeaponDef) {
    super(x, y, 32, 48); // Hero width x height
    if (weapon) {
      this.equippedWeapon = weapon;
    }
    this.stats = {
      maxHp: 100 + (statsBonus?.maxHp || 0),
      currentHp: 100 + (statsBonus?.maxHp || 0),
      attackDamage: this.equippedWeapon.baseDamage + (statsBonus?.attackDamage || 0),
      moveSpeed: 3.84 + (statsBonus?.moveSpeed || 0), // Controlled agile movement
      jumpForce: 17.0 + (statsBonus?.jumpForce || 0),
      attackCooldownMs: 120, // Fast base combo window
    };
  }

  public setWeapon(weapon: WeaponDef, attackBonus: number = 0) {
    this.equippedWeapon = weapon;
    this.stats.attackDamage = weapon.baseDamage + attackBonus;
  }

  public update(dt: number, input: InputState, tileMap: TileMap, particles: ParticleSystem, camera?: Camera) {
    if (!this.isAlive) {
      this.state = 'DEAD';
      return;
    }

    // Status Timers
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.vx = 0;
      this.state = 'HURT';
      // Apply gravity and physics while stunned
      this.vy += this.GRAVITY;
      if (this.vy > this.TERMINAL_VELOCITY) this.vy = this.TERMINAL_VELOCITY;
      tileMap.resolveEntityCollision(this);
      return;
    }
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
    }
    if (this.sandBlindTimer > 0) {
      this.sandBlindTimer -= dt;
    }

    // Cooldown & combo window timers
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= dt * 1000;
    }
    if (this.spinKickCooldownTimer > 0) {
      this.spinKickCooldownTimer -= dt;
    }
    if (this.comboWindowTimer > 0) {
      this.comboWindowTimer -= dt;
      if (this.comboWindowTimer <= 0) {
        this.comboStep = 0; // Reset combo if player pauses too long
      }
    }

    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.state = 'IDLE';
        // Give 0.45s window to chain next combo attack
        this.comboWindowTimer = 0.45;
      }
    }

    // Coyote time tracking (allows jump shortly after falling off a platform)
    if (this.isGrounded) {
      this.coyoteTimer = 0.12; // 120ms coyote window
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer -= dt;
    }

    // Re-arm jump when jump input is released
    if (!input.jump) {
      this.isJumpConsumed = false;
    }

    // Jump buffering tracking (remembers jump press right before landing)
    if (input.jump && !this.isJumpConsumed) {
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

    // Handle Special Spinning Low Kick (Joystick Down or Spin Kick Input)
    const triggerSpinKick = (input.spinKick || (input.down && input.attack)) && this.spinKickCooldownTimer <= 0;
    if (triggerSpinKick && (this.state !== 'ATTACK' || this.attackTimer < 0.05)) {
      this.state = 'ATTACK';
      this.currentAttackId++;
      this.attackType = 'SPIN_KICK';
      this.attackDuration = 0.36;
      this.attackTimer = 0.36;
      this.spinKickCooldownTimer = 0.45; // Short cooldown so it cannot be spammed
      this.attackCooldownTimer = 180;
      this.currentComboMultiplier = 1.7; // Strong balanced damage

      audioEngine.playSpinKick();
    }

    // Handle Martial Arts Attack Input (Combos + Jump Kick)
    if (input.attack && this.attackCooldownTimer <= 0 && (this.state !== 'ATTACK' || this.attackTimer < 0.05)) {
      this.state = 'ATTACK';
      this.currentAttackId++; // Increment unique attack ID for single-hit detection

      if (!this.isGrounded) {
        // Jump Attack / Flying Side Kick
        this.attackType = 'JUMP_KICK';
        this.attackDuration = 0.32;
        this.attackTimer = 0.32;
        this.attackCooldownTimer = 160;
        this.currentComboMultiplier = 1.3;
        audioEngine.playJumpKick();
      } else {
        // Ground Martial Arts Combo: Punch -> Punch -> Kick -> Finisher Kick
        if (this.comboWindowTimer > 0 && this.comboStep >= 1 && this.comboStep < 4) {
          this.comboStep++;
        } else {
          this.comboStep = 1;
        }

        this.comboWindowTimer = 0; // Consume window

        if (this.comboStep === 1) {
          // Fast Jab Punch
          this.attackType = 'JAB';
          this.attackDuration = 0.22;
          this.attackTimer = 0.22;
          this.attackCooldownTimer = 90;
          this.currentComboMultiplier = 1.0;
          audioEngine.playLightPunch();
        } else if (this.comboStep === 2) {
          // Heavy Cross Punch
          this.attackType = 'CROSS';
          this.attackDuration = 0.26;
          this.attackTimer = 0.26;
          this.attackCooldownTimer = 100;
          this.currentComboMultiplier = 1.25;
          audioEngine.playHeavyPunch();
        } else if (this.comboStep === 3) {
          // Roundhouse Kick
          this.attackType = 'KICK';
          this.attackDuration = 0.32;
          this.attackTimer = 0.32;
          this.attackCooldownTimer = 120;
          this.currentComboMultiplier = 1.5;
          audioEngine.playKick();
        } else {
          // Strong Finishing Spinning Heel Kick
          this.attackType = 'FINISHER';
          this.attackDuration = 0.38;
          this.attackTimer = 0.38;
          this.attackCooldownTimer = 220;
          this.currentComboMultiplier = 2.2;
          audioEngine.playFinisher();
        }
      }
    }

    // Handle Horizontal Movement (ALLOW MOVEMENT WHILE FIGHTING FOR FLUIDITY)
    const slowSpeedMult = this.slowTimer > 0 ? 0.52 : 1.0;
    const moveSpeedMult = (this.state === 'ATTACK' ? 0.85 : (input.down ? 0.5 : 1.0)) * slowSpeedMult;

    if (input.left) {
      this.vx = -this.stats.moveSpeed * moveSpeedMult;
      this.facingRight = false;
      if (this.isGrounded && this.state !== 'ATTACK') {
        this.state = input.down ? 'CROUCH' : 'RUN';
      }
    } else if (input.right) {
      this.vx = this.stats.moveSpeed * moveSpeedMult;
      this.facingRight = true;
      if (this.isGrounded && this.state !== 'ATTACK') {
        this.state = input.down ? 'CROUCH' : 'RUN';
      }
    } else {
      this.vx *= 0.65; // Smooth friction
      if (Math.abs(this.vx) < 0.2) this.vx = 0;
      if (this.isGrounded && this.state !== 'ATTACK') {
        this.state = input.down ? 'CROUCH' : 'IDLE';
      }
    }

    // Handle Jump Input with Coyote Time & Jump Buffer
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && this.state !== 'ATTACK') {
      this.vy = -this.stats.jumpForce;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.isJumpConsumed = true;
      this.state = 'JUMP';
      audioEngine.playJump();
      particles.createJumpDust(this.x + this.width / 2, this.y + this.height);
    }

    // Variable Jump Height Cut (short tap vs long hold)
    if (!input.jump && this.vy < -2) {
      this.vy *= 0.6; // Variable height damping
    }

    const wasGrounded = this.isGrounded;
    const preLandingVy = this.vy;

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

    // High Jump Landing effect check
    if (!wasGrounded && this.isGrounded) {
      if (preLandingVy >= 7.0) {
        const impactX = this.x + this.width / 2;
        const impactY = this.y + this.height;
        particles.createLandingImpact(impactX, impactY, preLandingVy);
        audioEngine.playLand();
        if (camera) {
          const shakeIntensity = Math.min(6, (preLandingVy - 5) * 0.85);
          camera.addShake(0.12, shakeIntensity);
        }
      }
    }

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
      this.takeDamage(8, particles);
    }

    // Hazard Pit check
    if (this.y > tileMap.heightInPixels + 100) {
      this.takeDamage(999, particles); // Fall out of bounds
    }
  }

  public getAttackHitbox(): Rect | null {
    if (this.state === 'ATTACK' && this.attackTimer > 0.02) {
      const attackProgress = (this.attackDuration - this.attackTimer) / (this.attackDuration || 0.2);
      // Active hit window: Only active during strike extension (22% to 75% of attack duration)
      if (attackProgress < 0.22 || attackProgress > 0.75) {
        return null;
      }

      let reach = 38;
      let attackHeight = 38;

      if (this.attackType === 'CROSS') {
        reach = 44;
        attackHeight = 40;
      } else if (this.attackType === 'KICK') {
        reach = 52;
        attackHeight = 44;
      } else if (this.attackType === 'FINISHER') {
        reach = 62;
        attackHeight = 48;
      } else if (this.attackType === 'JUMP_KICK') {
        reach = 50;
        attackHeight = 44;
      } else if (this.attackType === 'SPIN_KICK') {
        // Low 360-degree sweep kick surrounding lower body
        const reachX = 36;
        return {
          x: this.x - reachX,
          y: this.y + this.height - 26,
          width: this.width + (reachX * 2),
          height: 26,
        };
      }

      const attackX = this.facingRight ? this.x + this.width : this.x - reach;
      const attackY = this.y + 2;

      return {
        x: attackX,
        y: attackY,
        width: reach,
        height: attackHeight,
      };
    }
    return null;
  }

  public takeDamage(damage: number, particles: ParticleSystem): boolean {
    if (this.isGodMode) {
      particles.createFloatingText(this.x + this.width / 2, this.y - 12, 'GOD MODE! ⚡', '#facc15', 14);
      return false;
    }
    if (this.invulnerableTimer > 0 || !this.isAlive) return false;

    this.stats.currentHp = Math.max(0, this.stats.currentHp - damage);
    this.invulnerableTimer = 1.0; // 1.0 second damage invulnerability period
    this.state = 'HURT';

    if (this.onDamage) {
      this.onDamage();
    }

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
      ctx.globalAlpha = 0.35;
    }

    ctx.save();
    // Anchor at feet center for smooth scaling and ground alignment
    ctx.translate(px + this.width / 2, py + this.height);

    // Apply 1.32x Hero Scale
    const scaleX = this.facingRight ? 1.32 : -1.32;
    ctx.scale(scaleX, 1.32);

    // Ground Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, -2, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Death Pose Handling
    if (!this.isAlive) {
      ctx.rotate(Math.PI / 2);
      ctx.translate(0, -8);
    } else if (this.state === 'HURT') {
      ctx.rotate(-0.15); // Slight recoil tilt
    }

    // Animation & Physics Motion Factors
    const runCycle = Math.sin(this.animFrame * 0.8);
    const idleBreath = Math.sin(this.animTime * 4.5) * 1.5;
    const isAttacking = this.state === 'ATTACK';
    const attackProgress = isAttacking ? Math.min(1, Math.max(0, (this.attackDuration - this.attackTimer) / (this.attackDuration || 0.16))) : 0;
    const auraColor = this.equippedWeapon.glowColor || '#38bdf8';

    let bodyY = -24;
    let legOffset = 0;

    if (this.state === 'CROUCH') {
      bodyY = -17; // Crouched stance
    } else if (this.state === 'RUN') {
      legOffset = runCycle * 8.5;
      bodyY = -24 + Math.abs(Math.sin(this.animFrame * 0.8)) * -2;
    } else if (this.state === 'IDLE') {
      bodyY = -24 + idleBreath;
    } else if (this.state === 'JUMP') {
      bodyY = -27;
    } else if (this.state === 'FALL') {
      bodyY = -22;
    } else if (this.state === 'HURT') {
      bodyY = -21;
    }

    // ----------------------------------------------------
    // 1. DYNAMIC MARTIAL SCARF & JACKET TAILS (Wind Physics)
    // ----------------------------------------------------
    const wave1 = Math.sin(this.animTime * 12) * 6;
    const wave2 = Math.cos(this.animTime * 10) * 8;
    const speedMult = Math.abs(this.vx) * 1.2;

    // Red Martial Scarf Trailing Behind Neck
    ctx.fillStyle = '#dc2626'; // Vibrant Crimson
    ctx.beginPath();
    ctx.moveTo(-4, bodyY - 10);
    ctx.quadraticCurveTo(-16 - speedMult - wave1, bodyY - 6 + wave2, -26 - speedMult - wave1, bodyY + 12 + wave2);
    ctx.lineTo(-20 - speedMult, bodyY + 18 + wave2);
    ctx.quadraticCurveTo(-12 - wave1, bodyY + 2, -2, bodyY - 6);
    ctx.closePath();
    ctx.fill();

    // Scarf Golden Trim Line
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ----------------------------------------------------
    // 2. LEGS & ARMORED BOOTS
    // ----------------------------------------------------
    const pantColor = '#18181b'; // Dark Charcoal Trousers
    const bootColor = '#27272a'; // Armored Boots
    const buckleColor = '#f59e0b'; // Gold Buckles

    ctx.fillStyle = pantColor;

    if (isAttacking && this.attackType === 'KICK') {
      // High Roundhouse Kick Pose
      let kickAngle = -0.5; // Anticipation chamber angle
      let legLength = 16;
      if (attackProgress >= 0.28 && attackProgress <= 0.75) {
        // Extended Arc Sweep
        const sweepFactor = (attackProgress - 0.28) / 0.47;
        kickAngle = -Math.PI / 2.8 + sweepFactor * (Math.PI / 1.5);
        legLength = 26;
      } else if (attackProgress > 0.75) {
        // Recovery
        kickAngle = 0.2;
        legLength = 18;
      }

      ctx.save();
      ctx.translate(0, bodyY + 16);
      ctx.rotate(kickAngle);

      // Extended Leg
      ctx.fillStyle = pantColor;
      ctx.fillRect(0, -4, legLength, 8);
      // Knee Brace
      ctx.fillStyle = buckleColor;
      ctx.fillRect(Math.round(legLength * 0.5), -5, 3, 10);
      // Boot
      ctx.fillStyle = bootColor;
      ctx.fillRect(legLength - 4, -5, 10, 10);
      ctx.fillStyle = '#09090b'; // Sole
      ctx.fillRect(legLength - 4, 4, 11, 2);

      // Kick Crescent Arc Trail (visible during strike extension)
      if (attackProgress >= 0.28 && attackProgress <= 0.75) {
        ctx.strokeStyle = auraColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, 32, -Math.PI / 2.2, Math.PI / 2.2);
        ctx.stroke();
      }

      ctx.restore();

      // Support Leg
      ctx.fillStyle = pantColor;
      ctx.fillRect(-6, bodyY + 16, 7, 12);
      ctx.fillStyle = bootColor;
      ctx.fillRect(-8, bodyY + 26, 9, 6);
    } else if (isAttacking && this.attackType === 'FINISHER') {
      // Spinning Heel Kick
      const spinAngle = attackProgress * Math.PI * 2;
      ctx.save();
      ctx.translate(0, bodyY + 14);
      ctx.rotate(spinAngle);

      ctx.fillStyle = pantColor;
      ctx.fillRect(-20, -4, 40, 8);
      ctx.fillStyle = bootColor;
      ctx.fillRect(16, -5, 9, 10);
      ctx.fillRect(-24, -5, 9, 10);

      if (attackProgress >= 0.25 && attackProgress <= 0.78) {
        // Whirlwind Energy Aura Ring
        ctx.strokeStyle = auraColor;
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.arc(0, 0, 34, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    } else if (isAttacking && this.attackType === 'JUMP_KICK') {
      // Flying Side Kick
      ctx.save();
      ctx.translate(0, bodyY + 16);
      ctx.rotate(0.25);

      ctx.fillStyle = pantColor;
      ctx.fillRect(0, -3, 24, 8);
      ctx.fillStyle = bootColor;
      ctx.fillRect(20, -4, 10, 10);
      ctx.fillStyle = buckleColor;
      ctx.fillRect(22, -5, 3, 12);

      // Thrust Cone
      ctx.fillStyle = auraColor;
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(42, -6);
      ctx.lineTo(42, 6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    } else if (isAttacking && this.attackType === 'SPIN_KICK') {
      // Fast Low Spinning Sweep Kick
      const spinAngle = attackProgress * Math.PI * 2 * (this.facingRight ? 1 : -1);
      ctx.save();
      ctx.translate(0, bodyY + 18);
      ctx.rotate(spinAngle);

      // Low extended leg bar
      ctx.fillStyle = pantColor;
      ctx.fillRect(-22, -4, 44, 8);
      ctx.fillStyle = bootColor;
      ctx.fillRect(16, -5, 8, 10);
      ctx.fillRect(-24, -5, 8, 10);
      ctx.fillStyle = buckleColor;
      ctx.fillRect(16, -5, 8, 2);
      ctx.fillRect(-24, -5, 8, 2);

      // Wide Low Sweep Energy Ring
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 9, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    } else if (this.state === 'CROUCH') {
      // Bent crouch legs
      ctx.fillRect(-9, bodyY + 11, 7, 9);
      ctx.fillRect(2, bodyY + 11, 7, 9);
      ctx.fillStyle = bootColor;
      ctx.fillRect(-10, bodyY + 18, 8, 5);
      ctx.fillRect(2, bodyY + 18, 8, 5);
      ctx.fillStyle = buckleColor;
      ctx.fillRect(-10, bodyY + 18, 8, 2);
      ctx.fillRect(2, bodyY + 18, 8, 2);
    } else if (this.state === 'JUMP') {
      // Tucked Airborne Knees
      ctx.fillRect(-9, bodyY + 16, 7, 11);
      ctx.fillRect(2, bodyY + 14, 7, 11);
      ctx.fillStyle = bootColor;
      ctx.fillRect(-11, bodyY + 25, 9, 7);
      ctx.fillRect(2, bodyY + 23, 9, 7);
      ctx.fillStyle = buckleColor;
      ctx.fillRect(-11, bodyY + 25, 9, 2);
      ctx.fillRect(2, bodyY + 23, 9, 2);
    } else if (this.state === 'FALL') {
      // Extended Reaching Legs
      ctx.fillRect(-8, bodyY + 16, 6, 13);
      ctx.fillRect(2, bodyY + 16, 6, 13);
      ctx.fillStyle = bootColor;
      ctx.fillRect(-9, bodyY + 27, 8, 7);
      ctx.fillRect(1, bodyY + 27, 8, 7);
      ctx.fillStyle = buckleColor;
      ctx.fillRect(-9, bodyY + 27, 8, 2);
      ctx.fillRect(1, bodyY + 27, 8, 2);
    } else {
      // Standing / Running Legs
      ctx.fillRect(-8 + legOffset, bodyY + 16, 6, 12);
      ctx.fillRect(2 - legOffset, bodyY + 16, 6, 12);

      // Gold Knee Guards
      ctx.fillStyle = buckleColor;
      ctx.fillRect(-8 + legOffset, bodyY + 18, 6, 3);
      ctx.fillRect(2 - legOffset, bodyY + 18, 6, 3);

      // Armored Boots with Gold Cuffs & Soles
      ctx.fillStyle = bootColor;
      ctx.fillRect(-9 + legOffset, bodyY + 26, 8, 7);
      ctx.fillRect(1 - legOffset, bodyY + 26, 8, 7);
      ctx.fillStyle = buckleColor;
      ctx.fillRect(-9 + legOffset, bodyY + 26, 8, 2);
      ctx.fillRect(1 - legOffset, bodyY + 26, 8, 2);
      ctx.fillStyle = '#09090b'; // Black Soles
      ctx.fillRect(-9 + legOffset, bodyY + 32, 8, 2);
      ctx.fillRect(1 - legOffset, bodyY + 32, 8, 2);
    }

    // ----------------------------------------------------
    // 3. TORSO & FITTED COMBAT JACKET
    // ----------------------------------------------------
    // Inner Crimson Shirt V-Neck
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-5, bodyY - 1, 10, 10);

    // Midnight Blue Outer Combat Vest / Jacket
    ctx.fillStyle = '#1e1b4b'; // Deep Midnight Blue
    ctx.fillRect(-10, bodyY + 1, 20, 17);

    // Jacket Golden Trims & Lapel Collar
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-10, bodyY + 1, 3, 17);
    ctx.fillRect(7, bodyY + 1, 3, 17);

    // Tactical Chest Harness & Belt
    ctx.fillStyle = '#3f3f46'; // Slate Harness
    ctx.fillRect(-10, bodyY + 12, 20, 4);
    ctx.fillStyle = '#f59e0b'; // Gold Buckle
    ctx.fillRect(-3, bodyY + 11, 6, 6);

    // Shoulder Pauldrons (Golden/Brass)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(-10, bodyY + 3, 4, 0, Math.PI * 2);
    ctx.arc(10, bodyY + 3, 4, 0, Math.PI * 2);
    ctx.fill();

    // ----------------------------------------------------
    // 4. HERO HEAD & EXPRESSIVE FACE
    // ----------------------------------------------------
    // Face Skin Tone (Warm Peach)
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-7, bodyY - 12, 14, 12);

    // Expressive Eyes & Expressions
    if (this.state === 'HURT') {
      // Hurt Squinting Eyes (> <)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(1, bodyY - 8);
      ctx.lineTo(5, bodyY - 6);
      ctx.lineTo(1, bodyY - 4);
      ctx.stroke();
    } else {
      // Sharp Anime Eyes with Cyan/Blue Iris & Pupil Shine
      ctx.fillStyle = '#0f172a'; // Eye Socket / Eyelash
      ctx.fillRect(2, bodyY - 9, 4, 4);
      ctx.fillStyle = '#06b6d4'; // Bright Cyan Iris
      ctx.fillRect(3, bodyY - 8, 2, 3);
      ctx.fillStyle = '#ffffff'; // Pupil Shine
      ctx.fillRect(4, bodyY - 8, 1, 1);

      // Determined Eyebrow
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(1, bodyY - 11);
      ctx.lineTo(6, bodyY - 9.5);
      ctx.lineTo(6, bodyY - 8.5);
      ctx.closePath();
      ctx.fill();

      // Confident Smirk Mouth
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (isAttacking) {
        // Open grit-teeth mouth
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, bodyY - 3, 4, 2);
      } else {
        ctx.moveTo(2, bodyY - 3);
        ctx.lineTo(5, bodyY - 2);
      }
      ctx.stroke();
    }

    // Layered Anime Spiky Hair (Ebony with Golden Highlights)
    ctx.fillStyle = '#1c1917'; // Main Ebony Hair
    ctx.beginPath();
    ctx.moveTo(-8, bodyY - 11);
    ctx.lineTo(-12, bodyY - 18);
    ctx.lineTo(-6, bodyY - 16);
    ctx.lineTo(0, bodyY - 21);
    ctx.lineTo(6, bodyY - 16);
    ctx.lineTo(12, bodyY - 18);
    ctx.lineTo(8, bodyY - 10);
    ctx.closePath();
    ctx.fill();

    // Caramel / Gold Hair Highlights
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(-4, bodyY - 18);
    ctx.lineTo(0, bodyY - 21);
    ctx.lineTo(3, bodyY - 17);
    ctx.closePath();
    ctx.fill();

    // Front Bangs Framing Face
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(-6, bodyY - 12);
    ctx.lineTo(-3, bodyY - 7);
    ctx.lineTo(0, bodyY - 12);
    ctx.closePath();
    ctx.fill();

    // ----------------------------------------------------
    // 5. ARMS & MARTIAL ARTS GLOVES (EMPTY HANDS)
    // ----------------------------------------------------
    ctx.save();
    ctx.translate(4, bodyY + 8);

    if (isAttacking) {
      if (this.attackType === 'JAB') {
        // Fast Lead Jab Punch
        let reach = -4; // Anticipation chambering back
        if (attackProgress >= 0.22 && attackProgress <= 0.72) {
          const extFactor = Math.sin(((attackProgress - 0.22) / 0.50) * Math.PI);
          reach = extFactor * 22; // Extended reach
        } else if (attackProgress > 0.72) {
          reach = (1 - (attackProgress - 0.72) / 0.28) * 8;
        }

        ctx.fillStyle = '#1e1b4b'; // Sleeve
        ctx.fillRect(-2, -3, Math.max(4, 8 + reach), 6);
        ctx.fillStyle = '#fbbf24'; // Gold Wrist Wrap
        ctx.fillRect(Math.max(2, 6 + reach), -3, 3, 6);
        ctx.fillStyle = '#27272a'; // Glove
        ctx.fillRect(Math.max(5, 9 + reach), -3.5, 6, 7);
        ctx.fillStyle = '#fed7aa'; // Knuckles
        ctx.fillRect(Math.max(11, 15 + reach), -2.5, 2, 5);

        // Punch Energy Burst Ring (during active extension phase)
        if (attackProgress >= 0.22 && attackProgress <= 0.72) {
          ctx.strokeStyle = auraColor;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(16 + reach, 0, 10, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (this.attackType === 'CROSS') {
        // Heavy Power Rear Cross Punch
        let reach = -6; // Anticipation windup
        if (attackProgress >= 0.25 && attackProgress <= 0.75) {
          const extFactor = Math.sin(((attackProgress - 0.25) / 0.50) * Math.PI);
          reach = extFactor * 30; // Maximum extension
        } else if (attackProgress > 0.75) {
          reach = (1 - (attackProgress - 0.75) / 0.25) * 10;
        }

        ctx.rotate(0.12);
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-2, -3, Math.max(4, 10 + reach), 7);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(Math.max(2, 8 + reach), -3, 4, 7);
        ctx.fillStyle = '#27272a';
        ctx.fillRect(Math.max(6, 12 + reach), -4, 7, 8);
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(Math.max(13, 19 + reach), -3, 3, 6);

        // Power Shockwave Burst
        if (attackProgress >= 0.25 && attackProgress <= 0.75) {
          ctx.fillStyle = auraColor;
          ctx.beginPath();
          ctx.arc(20 + reach, 0, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Idle / Running Arms in Martial Guard Stance
      if (this.state === 'RUN') {
        ctx.rotate(Math.sin(this.animFrame * 0.8) * 0.45);
      } else if (this.state === 'JUMP') {
        ctx.rotate(-0.5);
      } else {
        ctx.rotate(-0.2); // Guard Stance
      }

      // Sleeve & Glove (Empty Hands)
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-2, -3, 8, 5);
      ctx.fillStyle = '#fbbf24'; // Wrist Wrap
      ctx.fillRect(5, -3, 3, 5);
      ctx.fillStyle = '#27272a'; // Glove Body
      ctx.fillRect(8, -3.5, 4, 6);
      ctx.fillStyle = '#fed7aa'; // Bare Knuckles
      ctx.beginPath();
      ctx.arc(12, -0.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render God Mode Badge / Stun Stars / Freeze Aura / Sand Dust
    if (this.isGodMode && this.isAlive) {
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('🛡️ GOD', -16, -58);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -22, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.isGodMode && this.isAlive) {
      ctx.save();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, -22, 26 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
      ctx.stroke();

      // Floating Crown / Badge
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('👑 GOD', -18, -52 + Math.sin(Date.now() * 0.008) * 2);
      ctx.restore();
    }

    if (this.stunTimer > 0 && this.isAlive) {
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 12px sans-serif';
      const starAngle = Date.now() * 0.008;
      for (let i = 0; i < 3; i++) {
        const a = starAngle + (i * Math.PI * 2) / 3;
        const sx = Math.cos(a) * 12;
        const sy = Math.sin(a) * 5 - 50;
        ctx.fillText('✦', sx - 4, sy);
      }
      ctx.restore();
    } else if (this.slowTimer > 0 && this.isAlive) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.arc(0, -20, 18, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.sandBlindTimer > 0 && this.isAlive) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.beginPath();
      ctx.arc(0, -20, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
    ctx.globalAlpha = 1.0;
  }
}
