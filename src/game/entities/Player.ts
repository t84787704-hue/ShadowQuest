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

    // Apply Hero Scale
    const scaleX = this.facingRight ? 1.32 : -1.32;
    ctx.scale(scaleX, 1.32);

    // Ground Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, -2, 11, 3.5, 0, 0, Math.PI * 2);
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
    const idleBreath = Math.sin(this.animTime * 4.5) * 1.2;
    const isAttacking = this.state === 'ATTACK';
    const attackProgress = isAttacking
      ? Math.min(1, Math.max(0, (this.attackDuration - this.attackTimer) / (this.attackDuration || 0.16)))
      : 0;

    let bodyY = -24;
    let legOffset = 0;

    if (this.state === 'CROUCH') {
      bodyY = -17; // Crouched stance
    } else if (this.state === 'RUN') {
      legOffset = runCycle * 8.0;
      bodyY = -24 + Math.abs(Math.sin(this.animFrame * 0.8)) * -1.8;
    } else if (this.state === 'IDLE') {
      bodyY = -24 + idleBreath;
    } else if (this.state === 'JUMP') {
      bodyY = -27;
    } else if (this.state === 'FALL') {
      bodyY = -22;
    } else if (this.state === 'HURT') {
      bodyY = -21;
    }

    // Color Palette for Realistic Human Martial Artist
    const skinTone = '#f5c28b'; // Warm natural human skin
    const skinShade = '#e0a96d'; // Skin shadow
    const hairColor = '#1c1917'; // Short modern black hair
    const shirtColor = '#18181b'; // Dark fitted training top
    const pantsColor = '#27272a'; // Dark fitted training pants
    const sashColor = '#dc2626'; // Red martial belt/sash
    const wrapColor = '#f8fafc'; // Clean white wrist wraps
    const shoeColor = '#0f172a'; // Simple black martial arts shoes
    const shoeSoleColor = '#e2e8f0'; // Clean white shoe soles

    // ----------------------------------------------------
    // 1. LEGS & MARTIAL ARTS FOOTWEAR
    // ----------------------------------------------------
    ctx.fillStyle = pantsColor;

    if (isAttacking && this.attackType === 'KICK') {
      // High Roundhouse Kick Stance
      let kickAngle = -0.3; // Chambering leg
      let legLength = 16;
      if (attackProgress >= 0.22 && attackProgress <= 0.75) {
        // Full Leg Extension Forward
        const sweepFactor = (attackProgress - 0.22) / 0.53;
        kickAngle = -Math.PI / 2.6 + sweepFactor * (Math.PI / 1.6);
        legLength = 26;
      } else if (attackProgress > 0.75) {
        kickAngle = 0.15;
        legLength = 18;
      }

      ctx.save();
      ctx.translate(0, bodyY + 16);
      ctx.rotate(kickAngle);

      // Extended Kicking Leg
      ctx.fillStyle = pantsColor;
      ctx.fillRect(0, -4, legLength, 8);
      // Shoe
      ctx.fillStyle = shoeColor;
      ctx.fillRect(legLength - 2, -5, 8, 9);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(legLength - 2, 3, 9, 2);

      // Clean, unobtrusive Kick Swing Arc (does not cover character)
      if (attackProgress >= 0.22 && attackProgress <= 0.75) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 30, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      }

      ctx.restore();

      // Support Leg Grounded
      ctx.fillStyle = pantsColor;
      ctx.fillRect(-6, bodyY + 16, 6, 12);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(-8, bodyY + 26, 8, 5);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(-8, bodyY + 30, 8, 2);
    } else if (isAttacking && this.attackType === 'FINISHER') {
      // Spinning Heel Kick
      const spinAngle = attackProgress * Math.PI * 2;
      ctx.save();
      ctx.translate(0, bodyY + 14);
      ctx.rotate(spinAngle);

      // Extended Spinning Legs
      ctx.fillStyle = pantsColor;
      ctx.fillRect(-20, -4, 40, 8);
      // Shoes on both feet
      ctx.fillStyle = shoeColor;
      ctx.fillRect(16, -5, 8, 9);
      ctx.fillRect(-24, -5, 8, 9);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(16, 3, 8, 2);
      ctx.fillRect(-24, 3, 8, 2);

      // Readable Spinning Ring
      if (attackProgress >= 0.22 && attackProgress <= 0.78) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    } else if (isAttacking && this.attackType === 'JUMP_KICK') {
      // Flying Side Kick
      ctx.save();
      ctx.translate(0, bodyY + 16);
      ctx.rotate(0.2);

      // Front Extended Leg
      ctx.fillStyle = pantsColor;
      ctx.fillRect(0, -3, 22, 7);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(18, -4, 9, 8);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(18, 3, 9, 2);

      // Back Tucked Leg
      ctx.fillStyle = pantsColor;
      ctx.fillRect(-10, -1, 10, 6);

      ctx.restore();
    } else if (isAttacking && this.attackType === 'SPIN_KICK') {
      // Low Spinning Sweep Kick
      const spinAngle = attackProgress * Math.PI * 2 * (this.facingRight ? 1 : -1);
      ctx.save();
      ctx.translate(0, bodyY + 18);
      ctx.rotate(spinAngle);

      // Low extended leg bar
      ctx.fillStyle = pantsColor;
      ctx.fillRect(-22, -4, 44, 7);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(16, -5, 8, 8);
      ctx.fillRect(-24, -5, 8, 8);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(16, 2, 8, 2);
      ctx.fillRect(-24, 2, 8, 2);

      // Low Sweep Ground Arc
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 8, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    } else if (this.state === 'CROUCH') {
      // Crouched Legs
      ctx.fillRect(-8, bodyY + 11, 6, 8);
      ctx.fillRect(2, bodyY + 11, 6, 8);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(-9, bodyY + 17, 7, 5);
      ctx.fillRect(2, bodyY + 17, 7, 5);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(-9, bodyY + 21, 7, 2);
      ctx.fillRect(2, bodyY + 21, 7, 2);
    } else if (this.state === 'JUMP') {
      // Tucked Airborne Knees
      ctx.fillRect(-8, bodyY + 16, 6, 10);
      ctx.fillRect(2, bodyY + 14, 6, 10);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(-9, bodyY + 24, 7, 6);
      ctx.fillRect(2, bodyY + 22, 7, 6);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(-9, bodyY + 28, 7, 2);
      ctx.fillRect(2, bodyY + 26, 7, 2);
    } else if (this.state === 'FALL') {
      // Descending Legs
      ctx.fillRect(-7, bodyY + 16, 5, 12);
      ctx.fillRect(2, bodyY + 16, 5, 12);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(-8, bodyY + 26, 7, 6);
      ctx.fillRect(1, bodyY + 26, 7, 6);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(-8, bodyY + 30, 7, 2);
      ctx.fillRect(1, bodyY + 30, 7, 2);
    } else {
      // Standing / Running Legs
      ctx.fillRect(-7 + legOffset, bodyY + 16, 5, 12);
      ctx.fillRect(2 - legOffset, bodyY + 16, 5, 12);

      // Simple Martial Arts Shoes
      ctx.fillStyle = shoeColor;
      ctx.fillRect(-8 + legOffset, bodyY + 26, 7, 5);
      ctx.fillRect(1 - legOffset, bodyY + 26, 7, 5);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(-8 + legOffset, bodyY + 30, 7, 2);
      ctx.fillRect(1 - legOffset, bodyY + 30, 7, 2);
    }

    // ----------------------------------------------------
    // 2. TORSO & SLEEVELESS / SHORT-SLEEVE MARTIAL TOP
    // ----------------------------------------------------
    // Shoulder Movement for Punching
    let shoulderRot = 0;
    if (isAttacking && (this.attackType === 'JAB' || this.attackType === 'CROSS')) {
      shoulderRot = this.attackType === 'CROSS' ? 0.22 : 0.12;
    }

    ctx.save();
    ctx.rotate(shoulderRot);

    // Short-sleeve / Sleeveless Top
    ctx.fillStyle = shirtColor;
    ctx.fillRect(-9, bodyY, 18, 16);

    // Subtle V-Neck collar line showing skin
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.moveTo(-3, bodyY);
    ctx.lineTo(0, bodyY + 4);
    ctx.lineTo(3, bodyY);
    ctx.closePath();
    ctx.fill();

    // Red Martial Belt / Sash at Waist
    ctx.fillStyle = sashColor;
    ctx.fillRect(-9, bodyY + 14, 18, 3);

    ctx.restore();

    // ----------------------------------------------------
    // 3. HUMAN HEAD, FACE & SHORT MODERN BLACK HAIR
    // ----------------------------------------------------
    // Natural Human Head (Oval)
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.ellipse(0, bodyY - 10, 6.5, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ear
    ctx.fillStyle = skinShade;
    ctx.beginPath();
    ctx.arc(-6, bodyY - 10, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Two Natural Human Eyes
    if (this.state === 'HURT') {
      // Squinting hurt eyes
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(1, bodyY - 11);
      ctx.lineTo(4, bodyY - 9);
      ctx.stroke();
    } else {
      // White Sclera
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(1.5, bodyY - 11.5, 3.5, 2.5);

      // Dark Iris / Pupil
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2.8, bodyY - 11, 1.8, 2);

      // Focused Eyebrow
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(0.5, bodyY - 13);
      ctx.lineTo(5.5, bodyY - 12);
      ctx.lineTo(5.5, bodyY - 11.2);
      ctx.closePath();
      ctx.fill();

      // Nose indication
      ctx.fillStyle = skinShade;
      ctx.fillRect(4.5, bodyY - 9, 1.2, 2);

      // Mouth / Serious confident expression
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      if (isAttacking) {
        // Grit teeth
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, bodyY - 6, 3, 1.5);
      } else {
        ctx.moveTo(1.5, bodyY - 5.5);
        ctx.lineTo(4.5, bodyY - 5);
      }
      ctx.stroke();
    }

    // Short Modern Black Hair (Clean cropped sides with textured top)
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    // Top & sides of hair
    ctx.arc(0, bodyY - 11.5, 7.2, Math.PI * 0.85, Math.PI * 2.15);
    ctx.fill();

    // Short modern hair fringe/locks
    ctx.beginPath();
    ctx.moveTo(-6.5, bodyY - 12);
    ctx.lineTo(-3, bodyY - 16);
    ctx.lineTo(0, bodyY - 16.5);
    ctx.lineTo(3, bodyY - 16);
    ctx.lineTo(5.5, bodyY - 13);
    ctx.lineTo(2, bodyY - 13.5);
    ctx.lineTo(-2, bodyY - 13.5);
    ctx.closePath();
    ctx.fill();

    // ----------------------------------------------------
    // 4. ARMS, WRIST WRAPS & BARE HANDS / FISTS
    // ----------------------------------------------------
    ctx.save();
    ctx.translate(2, bodyY + 6);

    if (isAttacking) {
      if (this.attackType === 'JAB') {
        // Lead Jab Punch Extension
        let reach = -2;
        if (attackProgress >= 0.22 && attackProgress <= 0.72) {
          const extFactor = Math.sin(((attackProgress - 0.22) / 0.5) * Math.PI);
          reach = extFactor * 20;
        } else if (attackProgress > 0.72) {
          reach = (1 - (attackProgress - 0.72) / 0.28) * 6;
        }

        // Arm Skin
        ctx.fillStyle = skinTone;
        ctx.fillRect(-2, -2.5, Math.max(4, 7 + reach), 5);
        // Wrist Wrap
        ctx.fillStyle = wrapColor;
        ctx.fillRect(Math.max(2, 5 + reach), -2.5, 4, 5);
        // Bare Fist
        ctx.fillStyle = skinTone;
        ctx.fillRect(Math.max(6, 9 + reach), -3, 5, 6);
        ctx.fillStyle = skinShade;
        ctx.fillRect(Math.max(10, 13 + reach), -2, 2, 4);

        // Impact indicator at fist
        if (attackProgress >= 0.22 && attackProgress <= 0.72) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(14 + reach, 0, 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (this.attackType === 'CROSS') {
        // Heavy Rear Cross Punch Extension
        let reach = -4;
        if (attackProgress >= 0.22 && attackProgress <= 0.75) {
          const extFactor = Math.sin(((attackProgress - 0.22) / 0.53) * Math.PI);
          reach = extFactor * 26;
        } else if (attackProgress > 0.75) {
          reach = (1 - (attackProgress - 0.75) / 0.25) * 8;
        }

        ctx.rotate(0.1);
        // Arm Skin
        ctx.fillStyle = skinTone;
        ctx.fillRect(-2, -3, Math.max(4, 9 + reach), 6);
        // Wrist Wrap
        ctx.fillStyle = wrapColor;
        ctx.fillRect(Math.max(2, 7 + reach), -3, 4, 6);
        // Bare Fist
        ctx.fillStyle = skinTone;
        ctx.fillRect(Math.max(6, 11 + reach), -3.5, 6, 7);
        ctx.fillStyle = skinShade;
        ctx.fillRect(Math.max(11, 16 + reach), -2.5, 2, 5);

        // Impact indicator
        if (attackProgress >= 0.22 && attackProgress <= 0.75) {
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(17 + reach, 0, 9, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    } else {
      // Guard Stance / Movement Arms
      if (this.state === 'RUN') {
        ctx.rotate(Math.sin(this.animFrame * 0.8) * 0.4);
      } else if (this.state === 'JUMP') {
        ctx.rotate(-0.4);
      } else {
        ctx.rotate(-0.2); // Martial Guard
      }

      // Arm Skin
      ctx.fillStyle = skinTone;
      ctx.fillRect(-2, -2.5, 7, 4.5);
      // White Wrist Wrap
      ctx.fillStyle = wrapColor;
      ctx.fillRect(5, -2.5, 3.5, 4.5);
      // Bare Fist
      ctx.fillStyle = skinTone;
      ctx.beginPath();
      ctx.arc(10.5, -0.2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Render Status Effects (God Mode / Stun / Slow / Sand)
    if (this.isGodMode && this.isAlive) {
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('👑 GOD', -14, -54);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -20, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.stunTimer > 0 && this.isAlive) {
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 11px sans-serif';
      const starAngle = Date.now() * 0.008;
      for (let i = 0; i < 3; i++) {
        const a = starAngle + (i * Math.PI * 2) / 3;
        const sx = Math.cos(a) * 11;
        const sy = Math.sin(a) * 4 - 46;
        ctx.fillText('✦', sx - 3, sy);
      }
      ctx.restore();
    } else if (this.slowTimer > 0 && this.isAlive) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.arc(0, -18, 16, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.sandBlindTimer > 0 && this.isAlive) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.beginPath();
      ctx.arc(0, -18, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.globalAlpha = 1.0;
  }
}
