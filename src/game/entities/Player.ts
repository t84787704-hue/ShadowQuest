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

    // Apply Hero Scale (1.42x for crisp, highly readable character features)
    const heroScale = 1.42;
    const scaleX = this.facingRight ? heroScale : -heroScale;
    ctx.scale(scaleX, heroScale);

    // Ground Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, -2, 12, 3.8, 0, 0, Math.PI * 2);
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
    const skinTone = '#f8c898'; // Warm natural human skin
    const skinShade = '#e2aa76'; // Skin shadow
    const hairColor = '#1c1917'; // Short modern black hair
    const hairHighlight = '#334155'; // Subtle top hair volume highlight
    const shirtColor = '#18181b'; // Dark fitted training top
    const pantsColor = '#27272a'; // Dark fitted training pants
    const sashColor = '#dc2626'; // Red martial belt/sash
    const wrapColor = '#f8fafc'; // Clean white wrist wraps
    const shoeColor = '#0f172a'; // Simple black martial arts shoes
    const shoeSoleColor = '#e2e8f0'; // Clean white shoe soles

    // ----------------------------------------------------
    // LAYER 1: BACK ARM & HAND (Rear Arm)
    // ----------------------------------------------------
    ctx.save();
    let backArmAngle = -0.2;
    let backArmReach = 0;

    if (isAttacking && this.attackType === 'CROSS') {
      // Rear arm is the POWER CROSS PUNCH (Extends forward)
      let reach = -3;
      if (attackProgress >= 0.22 && attackProgress <= 0.75) {
        const ext = Math.sin(((attackProgress - 0.22) / 0.53) * Math.PI);
        reach = ext * 24;
      } else if (attackProgress > 0.75) {
        reach = (1 - (attackProgress - 0.75) / 0.25) * 6;
      }
      backArmReach = reach;
      backArmAngle = 0.1;
    } else if (isAttacking && this.attackType === 'JAB') {
      // Rear arm stays in guard at chest while front arm jabs
      backArmAngle = -0.4;
    } else if (this.state === 'RUN') {
      backArmAngle = -Math.sin(this.animFrame * 0.8) * 0.5;
    } else if (this.state === 'JUMP') {
      backArmAngle = -0.5;
    }

    ctx.translate(-5, bodyY + 4);
    ctx.rotate(backArmAngle);

    if (isAttacking && this.attackType === 'CROSS') {
      // Extended Rear Arm
      ctx.fillStyle = skinTone;
      ctx.fillRect(-2, -3, Math.max(4, 8 + backArmReach), 5);
      // Wrist Wrap
      ctx.fillStyle = wrapColor;
      ctx.fillRect(Math.max(2, 6 + backArmReach), -3, 4, 5);
      // Bare Fist
      ctx.fillStyle = skinTone;
      ctx.fillRect(Math.max(6, 10 + backArmReach), -3.5, 6, 6);
      ctx.fillStyle = skinShade;
      ctx.fillRect(Math.max(10, 14 + backArmReach), -2.5, 2, 4);

      if (attackProgress >= 0.22 && attackProgress <= 0.75) {
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(16 + backArmReach, 0, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      // Guarded Rear Arm
      ctx.fillStyle = skinTone;
      ctx.fillRect(-2, -2.5, 7, 4.5);
      ctx.fillStyle = wrapColor;
      ctx.fillRect(5, -2.5, 3.5, 4.5);
      ctx.fillStyle = skinTone;
      ctx.beginPath();
      ctx.arc(10, -0.2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ----------------------------------------------------
    // LAYER 2: BACK LEG & FOOT (Rear Leg)
    // ----------------------------------------------------
    ctx.fillStyle = pantsColor;
    if (isAttacking && (this.attackType === 'SPIN_KICK' || this.attackType === 'FINISHER')) {
      // Handled in special spinning block below
    } else if (isAttacking && this.attackType === 'KICK') {
      // Rear leg is support leg grounded
      ctx.fillRect(-7, bodyY + 16, 6, 12);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(-8, bodyY + 26, 7, 5);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(-8, bodyY + 30, 7, 2);
    } else if (this.state === 'CROUCH') {
      ctx.fillRect(-9, bodyY + 11, 6, 8);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(-10, bodyY + 17, 7, 5);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(-10, bodyY + 21, 7, 2);
    } else if (this.state === 'JUMP') {
      ctx.fillRect(-9, bodyY + 16, 6, 10);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(-10, bodyY + 24, 7, 6);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(-10, bodyY + 28, 7, 2);
    } else if (this.state === 'FALL') {
      ctx.fillRect(-8, bodyY + 16, 5, 12);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(-9, bodyY + 26, 7, 6);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(-9, bodyY + 30, 7, 2);
    } else {
      // Standing / Running Rear Leg
      const backLegPos = -8 - legOffset;
      ctx.fillRect(backLegPos, bodyY + 16, 5, 12);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(backLegPos - 1, bodyY + 26, 7, 5);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(backLegPos - 1, bodyY + 30, 7, 2);
    }

    // ----------------------------------------------------
    // LAYER 3: TORSO & CLOTHING (Shirt, Red Sash, Pants Hips)
    // ----------------------------------------------------
    let torsoRot = 0;
    if (isAttacking) {
      if (this.attackType === 'CROSS') torsoRot = 0.15;
      else if (this.attackType === 'JAB') torsoRot = 0.08;
    }
    ctx.save();
    ctx.rotate(torsoRot);

    // Dark Fitted Training Pants (Hips)
    ctx.fillStyle = pantsColor;
    ctx.fillRect(-8, bodyY + 13, 16, 4);

    // Red Martial Belt / Sash at Waist
    ctx.fillStyle = sashColor;
    ctx.fillRect(-9, bodyY + 11, 18, 3.5);
    // Hanging Sash Knot Ends
    ctx.fillRect(-3, bodyY + 14.5, 3, 5);
    ctx.fillRect(0, bodyY + 14.5, 3, 4);

    // Dark Fitted Training Top (Shirt)
    ctx.fillStyle = shirtColor;
    ctx.fillRect(-9, bodyY, 18, 11);

    // Muscle V-Neck Opening showing Skin
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.moveTo(-3, bodyY);
    ctx.lineTo(0, bodyY + 4.5);
    ctx.lineTo(3, bodyY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // ----------------------------------------------------
    // LAYER 4: FRONT LEG & FOOT (Lead Leg)
    // ----------------------------------------------------
    ctx.fillStyle = pantsColor;
    if (isAttacking && this.attackType === 'KICK') {
      // Front leg is HIGH ROUNDHOUSE KICK
      let kickAngle = -0.3;
      let legLength = 16;
      if (attackProgress >= 0.22 && attackProgress <= 0.75) {
        const sweepFactor = (attackProgress - 0.22) / 0.53;
        kickAngle = -Math.PI / 2.6 + sweepFactor * (Math.PI / 1.6);
        legLength = 26;
      } else if (attackProgress > 0.75) {
        kickAngle = 0.15;
        legLength = 18;
      }

      ctx.save();
      ctx.translate(1, bodyY + 15);
      ctx.rotate(kickAngle);

      ctx.fillStyle = pantsColor;
      ctx.fillRect(0, -4, legLength, 8);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(legLength - 2, -5, 8, 9);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(legLength - 2, 3, 9, 2);

      if (attackProgress >= 0.22 && attackProgress <= 0.75) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 30, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      }

      ctx.restore();
    } else if (isAttacking && this.attackType === 'FINISHER') {
      // Spinning Heel Kick
      const spinAngle = attackProgress * Math.PI * 2;
      ctx.save();
      ctx.translate(0, bodyY + 14);
      ctx.rotate(spinAngle);

      ctx.fillStyle = pantsColor;
      ctx.fillRect(-20, -4, 40, 8);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(16, -5, 8, 9);
      ctx.fillRect(-24, -5, 8, 9);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(16, 3, 8, 2);
      ctx.fillRect(-24, 3, 8, 2);

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
      ctx.translate(0, bodyY + 15);
      ctx.rotate(0.2);

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

      ctx.fillStyle = pantsColor;
      ctx.fillRect(-22, -4, 44, 7);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(16, -5, 8, 8);
      ctx.fillRect(-24, -5, 8, 8);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(16, 2, 8, 2);
      ctx.fillRect(-24, 2, 8, 2);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (this.state === 'CROUCH') {
      ctx.fillRect(2, bodyY + 11, 6, 8);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(2, bodyY + 17, 7, 5);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(2, bodyY + 21, 7, 2);
    } else if (this.state === 'JUMP') {
      ctx.fillRect(2, bodyY + 14, 6, 10);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(2, bodyY + 22, 7, 6);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(2, bodyY + 26, 7, 2);
    } else if (this.state === 'FALL') {
      ctx.fillRect(2, bodyY + 16, 5, 12);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(1, bodyY + 26, 7, 6);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(1, bodyY + 30, 7, 2);
    } else {
      // Standing / Running Lead Leg
      const frontLegPos = 2 + legOffset;
      ctx.fillRect(frontLegPos, bodyY + 16, 5, 12);
      ctx.fillStyle = shoeColor;
      ctx.fillRect(frontLegPos, bodyY + 26, 7, 5);
      ctx.fillStyle = shoeSoleColor;
      ctx.fillRect(frontLegPos, bodyY + 30, 7, 2);
    }

    // ----------------------------------------------------
    // LAYER 5: FRONT ARM & HAND (Lead Arm)
    // ----------------------------------------------------
    ctx.save();
    let frontArmAngle = -0.2;
    let frontArmReach = 0;

    if (isAttacking && this.attackType === 'JAB') {
      // Lead Arm is JAB PUNCH (Extends forward)
      let reach = -2;
      if (attackProgress >= 0.22 && attackProgress <= 0.72) {
        const ext = Math.sin(((attackProgress - 0.22) / 0.5) * Math.PI);
        reach = ext * 20;
      } else if (attackProgress > 0.72) {
        reach = (1 - (attackProgress - 0.72) / 0.28) * 6;
      }
      frontArmReach = reach;
      frontArmAngle = 0.05;
    } else if (isAttacking && this.attackType === 'CROSS') {
      // Front arm pulls back into chest guard
      frontArmAngle = -0.5;
    } else if (this.state === 'RUN') {
      frontArmAngle = Math.sin(this.animFrame * 0.8) * 0.5;
    } else if (this.state === 'JUMP') {
      frontArmAngle = -0.4;
    }

    ctx.translate(4, bodyY + 4);
    ctx.rotate(frontArmAngle);

    if (isAttacking && this.attackType === 'JAB') {
      // Extended Lead Arm
      ctx.fillStyle = skinTone;
      ctx.fillRect(-2, -2.5, Math.max(4, 7 + frontArmReach), 5);
      // Wrist Wrap
      ctx.fillStyle = wrapColor;
      ctx.fillRect(Math.max(2, 5 + frontArmReach), -2.5, 4, 5);
      // Bare Fist
      ctx.fillStyle = skinTone;
      ctx.fillRect(Math.max(6, 9 + frontArmReach), -3, 5, 6);
      ctx.fillStyle = skinShade;
      ctx.fillRect(Math.max(10, 13 + frontArmReach), -2, 2, 4);

      if (attackProgress >= 0.22 && attackProgress <= 0.72) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(14 + frontArmReach, 0, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      // Guarded Lead Arm
      ctx.fillStyle = skinTone;
      ctx.fillRect(-2, -2.5, 7, 4.5);
      ctx.fillStyle = wrapColor;
      ctx.fillRect(5, -2.5, 3.5, 4.5);
      ctx.fillStyle = skinTone;
      ctx.beginPath();
      ctx.arc(10.5, -0.2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ----------------------------------------------------
    // LAYER 6: NECK
    // ----------------------------------------------------
    ctx.fillStyle = skinTone;
    ctx.fillRect(-2, bodyY - 3.5, 4, 4);

    // ----------------------------------------------------
    // LAYER 7: HEAD BASE
    // ----------------------------------------------------
    const headX = 0;
    const headY = bodyY - 11;
    const headRadiusX = 7.5;
    const headRadiusY = 8.5;

    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.ellipse(headX, headY, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ear (skin shade)
    ctx.fillStyle = skinShade;
    ctx.beginPath();
    ctx.arc(headX - 7.0, headY, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // ----------------------------------------------------
    // LAYER 8: FACE DETAILS (TWO CLEAR EYES, EYEBROWS, NOSE, MOUTH)
    // ----------------------------------------------------
    if (this.state === 'HURT') {
      // Hurt expression with squinting (> <) eyes
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      // Left eye squint
      ctx.beginPath();
      ctx.moveTo(-1, headY - 1.5);
      ctx.lineTo(1.5, headY - 0.5);
      ctx.lineTo(-1, headY + 0.5);
      ctx.stroke();
      // Right eye squint
      ctx.beginPath();
      ctx.moveTo(3, headY - 1.5);
      ctx.lineTo(5.5, headY - 0.5);
      ctx.lineTo(3, headY + 0.5);
      ctx.stroke();

      // Grimace mouth
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(1, headY + 5);
      ctx.lineTo(5, headY + 4.5);
      ctx.stroke();
    } else {
      // TWO CLEARLY DEFINED EYES WITH WHITE SCLERA & DARK PUPILS
      
      // LEFT EYE (REAR EYE)
      ctx.fillStyle = '#ffffff'; // White Sclera
      ctx.fillRect(headX - 1.5, headY - 3.0, 3.5, 3.2);
      ctx.fillStyle = '#0f172a'; // Dark Pupil/Iris
      ctx.fillRect(headX - 0.3, headY - 2.5, 2.0, 2.3);
      ctx.fillStyle = '#ffffff'; // Pupil Catchlight
      ctx.fillRect(headX + 0.7, headY - 2.2, 0.8, 0.8);

      // LEFT EYEBROW
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(headX - 2.0, headY - 4.5);
      ctx.lineTo(headX + 2.0, headY - 3.8);
      ctx.lineTo(headX + 2.0, headY - 3.0);
      ctx.lineTo(headX - 2.0, headY - 3.8);
      ctx.closePath();
      ctx.fill();

      // RIGHT EYE (FRONT EYE)
      ctx.fillStyle = '#ffffff'; // White Sclera
      ctx.fillRect(headX + 3.2, headY - 3.0, 4.0, 3.2);
      ctx.fillStyle = '#0f172a'; // Dark Pupil/Iris
      ctx.fillRect(headX + 4.5, headY - 2.5, 2.2, 2.3);
      ctx.fillStyle = '#ffffff'; // Pupil Catchlight
      ctx.fillRect(headX + 5.7, headY - 2.2, 0.8, 0.8);

      // RIGHT EYEBROW
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(headX + 2.8, headY - 4.5);
      ctx.lineTo(headX + 7.5, headY - 3.6);
      ctx.lineTo(headX + 7.5, headY - 2.8);
      ctx.lineTo(headX + 2.8, headY - 3.8);
      ctx.closePath();
      ctx.fill();

      // NOSE INDICATION
      ctx.fillStyle = skinShade;
      ctx.fillRect(headX + 6.2, headY, 1.6, 2.2);

      // MOUTH / EXPRESSION
      if (isAttacking) {
        // Grit teeth
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(headX + 2.5, headY + 3.8, 4.0, 2.0);
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(headX + 2.5, headY + 3.8, 4.0, 2.0);
      } else {
        // Serious confident mouth line
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(headX + 2.0, headY + 4.5);
        ctx.lineTo(headX + 6.0, headY + 4.0);
        ctx.stroke();
      }
    }

    // ----------------------------------------------------
    // LAYER 9: SHORT MODERN BLACK HAIR
    // ----------------------------------------------------
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    // Scalp arc covering top and back of head
    ctx.arc(headX, headY - 0.5, 8.0, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // Sideburns
    ctx.fillRect(headX - 7.5, headY - 4, 3, 5);

    // Modern styled hair fringe/locks over forehead
    ctx.beginPath();
    ctx.moveTo(headX - 7.0, headY - 4.5);
    ctx.lineTo(headX - 3.5, headY - 9.0);
    ctx.lineTo(headX, headY - 9.5);
    ctx.lineTo(headX + 3.5, headY - 9.0);
    ctx.lineTo(headX + 6.5, headY - 5.5);
    ctx.lineTo(headX + 3.0, headY - 5.8);
    ctx.lineTo(headX - 1.5, headY - 5.8);
    ctx.closePath();
    ctx.fill();

    // Subtle hair highlight volume stroke
    ctx.strokeStyle = hairHighlight;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(headX, headY - 2.0, 7.5, Math.PI * 1.1, Math.PI * 1.6);
    ctx.stroke();

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
