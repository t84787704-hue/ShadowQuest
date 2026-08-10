import { Entity } from './Entity';
import { PlayerActionState, PlayerStats, Rect } from '../../types/game';
import { InputState } from '../../types/game';
import { TileMap, TileType } from '../world/TileMap';
import { ParticleSystem } from '../core/ParticleSystem';
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
  public attackType: 'JAB' | 'CROSS' | 'KICK' | 'FINISHER' | 'JUMP_KICK' = 'JAB';
  public comboWindowTimer: number = 0;
  public attackDuration: number = 0.16;
  public currentComboMultiplier: number = 1.0;

  // Jump responsiveness helpers
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;

  // Constants
  private readonly GRAVITY = 0.52;
  private readonly TERMINAL_VELOCITY = 12;

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
      moveSpeed: 4.8 + (statsBonus?.moveSpeed || 0), // Quick and agile
      jumpForce: 12.0 + (statsBonus?.jumpForce || 0),
      attackCooldownMs: 120, // Fast base combo window
    };
  }

  public setWeapon(weapon: WeaponDef, attackBonus: number = 0) {
    this.equippedWeapon = weapon;
    this.stats.attackDamage = weapon.baseDamage + attackBonus;
  }

  public update(dt: number, input: InputState, tileMap: TileMap, particles: ParticleSystem) {
    if (!this.isAlive) {
      this.state = 'DEAD';
      return;
    }

    // Cooldown & combo window timers
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= dt * 1000;
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

    // Jump buffering tracking (remembers jump press right before landing)
    if (input.jump) {
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

    // Handle Martial Arts Attack Input (Combos + Jump Kick)
    if (input.attack && this.attackCooldownTimer <= 0 && (this.state !== 'ATTACK' || this.attackTimer < 0.05)) {
      this.state = 'ATTACK';
      this.currentAttackId++; // Increment unique attack ID for single-hit detection

      if (!this.isGrounded) {
        // Jump Attack / Flying Side Kick
        this.attackType = 'JUMP_KICK';
        this.attackDuration = 0.22;
        this.attackTimer = 0.22;
        this.attackCooldownTimer = 160;
        this.currentComboMultiplier = 1.3;
        audioEngine.playKick();

        const kickX = this.facingRight ? this.x + this.width + 12 : this.x - 12;
        particles.createCombatImpact(kickX, this.y + 24, this.facingRight, this.equippedWeapon.sparkColors);
        particles.createFloatingText(kickX, this.y + 4, 'FLYING KICK!', '#38bdf8', 15);
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
          this.attackDuration = 0.14;
          this.attackTimer = 0.14;
          this.attackCooldownTimer = 90;
          this.currentComboMultiplier = 1.0;
          audioEngine.playPunch();

          const punchX = this.facingRight ? this.x + this.width + 10 : this.x - 10;
          particles.createCombatImpact(punchX, this.y + 18, this.facingRight, this.equippedWeapon.sparkColors);
          particles.createFloatingText(punchX, this.y, 'JAB!', '#fef08a', 14);
        } else if (this.comboStep === 2) {
          // Heavy Cross Punch
          this.attackType = 'CROSS';
          this.attackDuration = 0.16;
          this.attackTimer = 0.16;
          this.attackCooldownTimer = 100;
          this.currentComboMultiplier = 1.25;
          audioEngine.playPunch();

          const punchX = this.facingRight ? this.x + this.width + 14 : this.x - 14;
          particles.createCombatImpact(punchX, this.y + 18, this.facingRight, this.equippedWeapon.sparkColors);
          particles.createFloatingText(punchX, this.y, 'CROSS!', '#fbbf24', 15);
        } else if (this.comboStep === 3) {
          // Roundhouse Kick
          this.attackType = 'KICK';
          this.attackDuration = 0.20;
          this.attackTimer = 0.20;
          this.attackCooldownTimer = 120;
          this.currentComboMultiplier = 1.5;
          audioEngine.playKick();

          const kickX = this.facingRight ? this.x + this.width + 18 : this.x - 18;
          particles.createCombatImpact(kickX, this.y + 22, this.facingRight, this.equippedWeapon.sparkColors);
          particles.createFloatingText(kickX, this.y - 4, 'KICK!', '#f97316', 16);
        } else {
          // Strong Finishing Spinning Heel Kick
          this.attackType = 'FINISHER';
          this.attackDuration = 0.26;
          this.attackTimer = 0.26;
          this.attackCooldownTimer = 220;
          this.currentComboMultiplier = 2.2;
          audioEngine.playFinisher();

          const kickX = this.facingRight ? this.x + this.width + 22 : this.x - 22;
          particles.createCombatImpact(kickX, this.y + 20, this.facingRight, ['#f43f5e', '#facc15', '#38bdf8']);
          particles.createFloatingText(kickX, this.y - 8, 'FINISHER! 💥', '#ef4444', 18);
        }
      }
    }

    // Handle Horizontal Movement (ALLOW MOVEMENT WHILE FIGHTING FOR FLUIDITY)
    const moveSpeedMult = this.state === 'ATTACK' ? 0.85 : 1.0;

    if (input.left) {
      this.vx = -this.stats.moveSpeed * moveSpeedMult;
      this.facingRight = false;
      if (this.isGrounded && this.state !== 'ATTACK') this.state = 'RUN';
    } else if (input.right) {
      this.vx = this.stats.moveSpeed * moveSpeedMult;
      this.facingRight = true;
      if (this.isGrounded && this.state !== 'ATTACK') this.state = 'RUN';
    } else {
      this.vx *= 0.65; // Smooth friction
      if (Math.abs(this.vx) < 0.2) this.vx = 0;
      if (this.isGrounded && this.state !== 'ATTACK') this.state = 'IDLE';
    }

    // Handle Jump Input with Coyote Time & Jump Buffer
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && this.state !== 'ATTACK') {
      this.vy = -this.stats.jumpForce;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.state = 'JUMP';
      audioEngine.playJump();
      particles.createJumpDust(this.x + this.width / 2, this.y + this.height);
    }

    // Variable Jump Height Cut (short tap vs long hold)
    if (!input.jump && this.vy < -2) {
      this.vy *= 0.6; // Variable height damping
    }

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
      this.takeDamage(12, particles);
    }

    // Hazard Pit check
    if (this.y > tileMap.heightInPixels + 100) {
      this.takeDamage(999, particles); // Fall out of bounds
    }
  }

  public getAttackHitbox(): Rect | null {
    if (this.state === 'ATTACK' && this.attackTimer > 0.02) {
      let reach = 36;
      let attackHeight = 38;

      if (this.attackType === 'CROSS') {
        reach = 42;
        attackHeight = 40;
      } else if (this.attackType === 'KICK') {
        reach = 50;
        attackHeight = 44;
      } else if (this.attackType === 'FINISHER') {
        reach = 58;
        attackHeight = 48;
      } else if (this.attackType === 'JUMP_KICK') {
        reach = 48;
        attackHeight = 44;
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
    if (this.invulnerableTimer > 0 || !this.isAlive) return false;

    this.stats.currentHp = Math.max(0, this.stats.currentHp - damage);
    this.invulnerableTimer = 0.85; // 0.85s (850ms) damage invulnerability period
    this.state = 'HURT';

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
      ctx.globalAlpha = 0.3;
    }

    ctx.save();
    // Anchor at feet center for smooth scaling and ground alignment
    ctx.translate(px + this.width / 2, py + this.height);

    // Apply 1.32x Hero Scale
    const scaleX = this.facingRight ? 1.32 : -1.32;
    ctx.scale(scaleX, 1.32);

    // Ground Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, -2, 11, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Death pose rotation
    if (!this.isAlive) {
      ctx.rotate(Math.PI / 2);
      ctx.translate(0, -10);
    }

    // Calculate state-dependent offsets
    const runCycle = Math.sin(this.animFrame * 0.8);
    const idleBreath = Math.sin(this.animTime * 4) * 1.5;
    
    let legOffset = 0;
    let bodyY = -24; // Align torso to feet anchor

    if (this.state === 'RUN') {
      legOffset = runCycle * 8;
      bodyY = -24 + Math.abs(Math.sin(this.animFrame * 0.8)) * -2;
    } else if (this.state === 'IDLE') {
      bodyY = -24 + idleBreath;
    } else if (this.state === 'JUMP') {
      bodyY = -27;
    } else if (this.state === 'FALL') {
      bodyY = -22;
    } else if (this.state === 'HURT') {
      bodyY = -22;
    }

    // ----------------------------------------------------
    // 1. ADVENTURER CAPE (Fluttering behind)
    // ----------------------------------------------------
    ctx.fillStyle = '#dc2626'; // Bright Crimson Red
    ctx.beginPath();
    const capeWave = this.state === 'RUN' ? Math.sin(this.animTime * 14) * 8 : Math.sin(this.animTime * 3) * 3;
    const capeY = this.state === 'JUMP' ? 2 : this.state === 'FALL' ? -10 : -2;
    
    ctx.moveTo(-6, bodyY + 12);
    ctx.quadraticCurveTo(-18 - capeWave, bodyY + 20, -22 - capeWave, bodyY + capeY + 36);
    ctx.lineTo(-4, bodyY + 32);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ----------------------------------------------------
    // 2. LEGS & ADVENTURER BOOTS
    // ----------------------------------------------------
    ctx.fillStyle = '#1e293b'; // Navy Trousers
    if (this.state === 'JUMP') {
      // Tucked knees jump pose
      ctx.fillRect(-9, bodyY + 22, 7, 10);
      ctx.fillRect(2, bodyY + 20, 7, 10);
      ctx.fillStyle = '#78350f'; // Leather Boots
      ctx.fillRect(-11, bodyY + 30, 9, 6);
      ctx.fillRect(2, bodyY + 28, 9, 6);
    } else if (this.state === 'FALL') {
      // Legs reaching down
      ctx.fillRect(-8, bodyY + 22, 6, 12);
      ctx.fillRect(2, bodyY + 22, 6, 12);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-9, bodyY + 32, 8, 6);
      ctx.fillRect(1, bodyY + 32, 8, 6);
    } else {
      // Idle / Running legs
      ctx.fillRect(-8 + legOffset, bodyY + 22, 6, 11);
      ctx.fillRect(2 - legOffset, bodyY + 22, 6, 11);
      ctx.fillStyle = '#78350f'; // Boots with buckles
      ctx.fillRect(-9 + legOffset, bodyY + 31, 8, 7);
      ctx.fillRect(1 - legOffset, bodyY + 31, 8, 7);
      // Boot cuffs
      ctx.fillStyle = '#a16207';
      ctx.fillRect(-9 + legOffset, bodyY + 31, 8, 2);
      ctx.fillRect(1 - legOffset, bodyY + 31, 8, 2);
    }

    // ----------------------------------------------------
    // 3. TORSO & LEATHER ARMOR VEST
    // ----------------------------------------------------
    ctx.fillStyle = '#2563eb'; // Royal Blue Adventurer Tunic
    ctx.fillRect(-10, bodyY, 20, 22);

    // Brown Leather Armor Harness & Belt
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(-10, bodyY + 16, 20, 5); // Belt
    ctx.fillStyle = '#f59e0b'; // Golden Belt Buckle
    ctx.fillRect(-3, bodyY + 15, 6, 7);

    // Shoulder Pauldrons (Golden/Brass)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(-10, bodyY + 2, 4.5, 0, Math.PI * 2);
    ctx.arc(10, bodyY + 2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Chest Crest Symbol (Blaze Flame)
    ctx.fillStyle = '#f97316'; // Orange Flame
    ctx.beginPath();
    ctx.moveTo(0, bodyY + 3);
    ctx.lineTo(-4, bodyY + 11);
    ctx.lineTo(0, bodyY + 15);
    ctx.lineTo(4, bodyY + 11);
    ctx.closePath();
    ctx.fill();

    // 4. HERO HEAD & FACE
    // Face Skin Tone
    ctx.fillStyle = '#fdba74'; // Warm peach skin
    ctx.fillRect(-7, bodyY - 12, 14, 12);

    // Determined Eye & Eyebrow
    ctx.fillStyle = '#0f172a'; // Eye
    ctx.fillRect(2, bodyY - 9, 3, 4);
    ctx.fillStyle = '#ffffff'; // Iris Shine
    ctx.fillRect(3, bodyY - 9, 1, 2);

    // Headband
    ctx.fillStyle = '#dc2626'; // Red Headband
    ctx.fillRect(-8, bodyY - 11, 16, 3);

    // Dark Brown Spiky Hero Hair
    ctx.fillStyle = '#451a03'; // Dark Brown Hair
    ctx.beginPath();
    ctx.moveTo(-9, bodyY - 11);
    ctx.lineTo(-12, bodyY - 18);
    ctx.lineTo(-5, bodyY - 16);
    ctx.lineTo(0, bodyY - 20);
    ctx.lineTo(5, bodyY - 16);
    ctx.lineTo(11, bodyY - 17);
    ctx.lineTo(8, bodyY - 10);
    ctx.closePath();
    ctx.fill();

    // ----------------------------------------------------
    // 5. MARTIAL ARTS HAND-TO-HAND & ATTACK ANIMATIONS (EMPTY HANDS)
    // ----------------------------------------------------
    const isAttacking = this.state === 'ATTACK';
    const attackProgress = isAttacking ? Math.min(1, Math.max(0, (this.attackDuration - this.attackTimer) / this.attackDuration)) : 0;

    ctx.save();
    ctx.translate(4, bodyY + 10);

    if (isAttacking) {
      const auraColor = this.equippedWeapon.glowColor;

      if (this.attackType === 'JAB') {
        // Fast Jab Punch
        const reach = Math.sin(attackProgress * Math.PI) * 18;
        // Lead Arm
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(0, -3, 8 + reach, 6);
        ctx.fillStyle = '#fdba74'; // Bare Fist
        ctx.beginPath();
        ctx.arc(8 + reach, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a16207'; // Martial Hand Wrap
        ctx.fillRect(6 + reach, -3, 4, 6);

        // Punch Energy Ring
        ctx.strokeStyle = auraColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(12 + reach, 0, 8, 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.attackType === 'CROSS') {
        // Heavy Power Cross Punch
        const reach = Math.sin(attackProgress * Math.PI) * 24;
        ctx.rotate(0.2);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-2, -2, 10 + reach, 7);
        ctx.fillStyle = '#fdba74'; // Clenched Fist
        ctx.beginPath();
        ctx.arc(10 + reach, 1, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a16207'; // Hand Wrap
        ctx.fillRect(8 + reach, -2, 4, 7);

        // Power Shockwave
        ctx.fillStyle = auraColor;
        ctx.beginPath();
        ctx.arc(14 + reach, 1, 10 * Math.sin(attackProgress * Math.PI), 0, Math.PI * 2);
        ctx.fill();
      } else if (this.attackType === 'KICK') {
        // High Roundhouse Kick
        const kickAngle = -Math.PI / 3 + Math.sin(attackProgress * Math.PI) * (Math.PI / 1.8);
        ctx.rotate(kickAngle);
        // Leg Extension
        ctx.fillStyle = '#1e293b'; // Trousers
        ctx.fillRect(0, 4, 20, 7);
        ctx.fillStyle = '#78350f'; // Martial Boot
        ctx.fillRect(18, 2, 8, 9);

        // Kick Arc Effect
        ctx.strokeStyle = auraColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 6, 26, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      } else if (this.attackType === 'FINISHER') {
        // Spinning Heel Kick Finisher
        const spinAngle = attackProgress * Math.PI * 2;
        ctx.rotate(spinAngle);
        // Both legs extended in whirlwind kick
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-16, -3, 32, 6);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(14, -4, 8, 8);
        ctx.fillRect(-22, -4, 8, 8);

        // Full Whirlwind Energy Ring
        ctx.strokeStyle = auraColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.attackType === 'JUMP_KICK') {
        // Flying Side Kick
        ctx.rotate(0.3);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 2, 22, 7);
        ctx.fillStyle = '#78350f'; // Boot
        ctx.fillRect(20, 0, 9, 9);

        // Flying Thrust Energy
        ctx.fillStyle = auraColor;
        ctx.beginPath();
        ctx.moveTo(28, 4);
        ctx.lineTo(38, -2);
        ctx.lineTo(38, 10);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Idle / Running Arms (Hand-to-Hand Stance with Visibly Empty Hands)
      if (this.state === 'RUN') {
        ctx.rotate(Math.sin(this.animFrame * 0.8) * 0.4);
      } else if (this.state === 'JUMP') {
        ctx.rotate(-0.5);
      } else {
        // Martial Guard Stance
        ctx.rotate(-0.2);
      }

      // Front Arm & Clenched Fist (Empty Hands)
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(-2, -3, 8, 5);
      ctx.fillStyle = '#a16207'; // Martial Wrist Wrap
      ctx.fillRect(5, -3, 3, 5);
      ctx.fillStyle = '#fdba74'; // Empty Hand / Clenched Fist
      ctx.beginPath();
      ctx.arc(10, -0.5, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
    ctx.globalAlpha = 1.0;
  }
}
