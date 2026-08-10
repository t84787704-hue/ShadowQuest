import { GameStateStatus, SaveData, PlayerStats } from '../../types/game';
import { Player } from '../entities/Player';
import { ForestGoblin } from '../entities/Enemy';
import { Coin, HealthPickup } from '../entities/Collectible';
import { Checkpoint } from '../entities/Checkpoint';
import { TileMap } from '../world/TileMap';
import { LevelDefinition, getLevelDefinition } from '../world/LevelData';
import { Camera } from './Camera';
import { InputManager } from './InputManager';
import { ParticleSystem } from './ParticleSystem';
import { audioEngine } from '../audio/AudioEngine';
import { SaveSystem } from '../save/SaveSystem';
import { EnvironmentRenderer } from '../render/EnvironmentRenderer';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public status: GameStateStatus = 'RUNNING';

  public player: Player;
  public goblins: ForestGoblin[] = [];
  public coins: Coin[] = [];
  public healthPickups: HealthPickup[] = [];
  public checkpoints: Checkpoint[] = [];
  public tileMap: TileMap;
  public camera: Camera;
  public input: InputManager;
  public particles: ParticleSystem;

  public levelDef: LevelDefinition;
  public startingCoins: number = 0;
  public collectedCoinsCount: number = 0;
  public totalCoinsInLevel: number = 0;
  public activeSpawn: { x: number; y: number };

  private lastTime: number = 0;
  private animFrameId: number | null = null;
  private onStateChangeCallback?: (status: GameStateStatus, levelCoins: number, totalCoins: number) => void;
  private statsBonus: Partial<PlayerStats>;

  // Single-hit combat tracking
  private lastAttackId: number = -1;
  private hitEnemiesThisAttack: Set<ForestGoblin> = new Set();

  constructor(canvas: HTMLCanvasElement, saveData: SaveData, levelId: string = '1-1') {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to acquire 2D canvas context');
    }
    this.ctx = context;

    this.startingCoins = saveData.coins || 0;
    this.collectedCoinsCount = 0;

    this.levelDef = getLevelDefinition(levelId);
    this.tileMap = new TileMap(
      Math.floor(this.levelDef.config.width / 32),
      Math.floor(this.levelDef.config.height / 32),
      this.levelDef.grid,
      this.levelDef.config.id
    );
    this.camera = new Camera(canvas.width, canvas.height);
    this.input = new InputManager();
    this.particles = new ParticleSystem();

    this.activeSpawn = { ...this.levelDef.playerSpawn };

    // Create Player BLAZE with upgrade stats bonus and equipped weapon
    const hpBonus = (saveData.upgrades?.maxHealth || 0) * 15;
    const dmgBonus = (saveData.upgrades?.attackPower || 0) * 5;
    const speedBonus = (saveData.upgrades?.moveSpeed || 0) * 0.3;

    this.statsBonus = {
      maxHp: hpBonus,
      attackDamage: dmgBonus,
      moveSpeed: speedBonus,
    };

    const equippedWeapon = SaveSystem.getEquippedWeapon(saveData, levelId);
    this.player = new Player(this.activeSpawn.x, this.activeSpawn.y, this.statsBonus, equippedWeapon);

    this.initLevelEntities();
  }

  public get totalCoins(): number {
    return this.startingCoins + this.collectedCoinsCount;
  }

  public get checkpoint(): Checkpoint | undefined {
    return this.checkpoints.find((c) => c.isActive) || this.checkpoints[0];
  }

  public setOnStateChange(cb: (status: GameStateStatus, levelCoins: number, totalCoins: number) => void) {
    this.onStateChangeCallback = cb;
  }

  private initLevelEntities() {
    // Populate Goblins
    this.goblins = this.levelDef.goblins.map(
      (g) => new ForestGoblin(g.x, g.y, g.patrolRange || 100, g.isBoss || false, this.levelDef.config.id)
    );

    // Populate Coins
    this.coins = this.levelDef.coins.map((c) => new Coin(c.x, c.y, c.value || 1));
    this.totalCoinsInLevel = this.coins.reduce((sum, c) => sum + c.value, 0);

    // Populate Health Pickups
    this.healthPickups = (this.levelDef.healthPickups || []).map(
      (h) => new HealthPickup(h.x, h.y, h.healAmount || 25)
    );

    // Populate Checkpoints
    this.checkpoints = [];
    if (this.levelDef.checkpoints && this.levelDef.checkpoints.length > 0) {
      this.checkpoints = this.levelDef.checkpoints.map((c) => new Checkpoint(c.x, c.y));
    } else if (this.levelDef.checkpoint) {
      this.checkpoints = [new Checkpoint(this.levelDef.checkpoint.x, this.levelDef.checkpoint.y)];
    }
  }

  public start() {
    this.status = 'RUNNING';
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public pause() {
    if (this.status === 'RUNNING') {
      this.status = 'PAUSED';
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback('PAUSED', this.collectedCoinsCount, this.totalCoins);
      }
    }
  }

  public resume() {
    if (this.status === 'PAUSED') {
      this.status = 'RUNNING';
      this.lastTime = performance.now();
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback('RUNNING', this.collectedCoinsCount, this.totalCoins);
      }
    }
  }

  public restart() {
    this.status = 'RUNNING';
    this.particles.clear();
    this.activeSpawn = { ...this.levelDef.playerSpawn };
    this.player = new Player(this.activeSpawn.x, this.activeSpawn.y, this.statsBonus);
    this.collectedCoinsCount = 0;
    this.initLevelEntities();
    this.camera.x = 0;
    this.camera.y = 0;
    this.lastTime = performance.now();
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback('RUNNING', 0, this.totalCoins);
    }
  }

  public respawnAtCheckpoint() {
    this.status = 'RUNNING';
    this.particles.clear();
    this.player.x = this.activeSpawn.x;
    this.player.y = this.activeSpawn.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isAlive = true;
    this.player.state = 'IDLE';
    this.player.stats.currentHp = this.player.stats.maxHp;
    this.player.invulnerableTimer = 1.5; // Invulnerability frames on respawn

    this.lastTime = performance.now();
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback('RUNNING', this.collectedCoinsCount, this.totalCoins);
    }
  }

  private loop = (now: number) => {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05); // Cap max delta time to 50ms
    this.lastTime = now;

    if (this.status === 'RUNNING') {
      this.update(dt);
    }
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const inputState = this.input.getState();

    // 1. Update Player
    this.player.update(dt, inputState, this.tileMap, this.particles);

    // Check Player Death
    if (!this.player.isAlive && this.status !== 'GAME_OVER') {
      this.status = 'GAME_OVER';
      audioEngine.playGameOver();
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback('GAME_OVER', this.collectedCoinsCount, this.totalCoins);
      }
      return;
    }

    // 2. Sword Attack Collisions (Single-hit per attack swing)
    if (this.player.currentAttackId !== this.lastAttackId) {
      this.lastAttackId = this.player.currentAttackId;
      this.hitEnemiesThisAttack.clear();
    }

    const attackHitbox = this.player.getAttackHitbox();
    if (attackHitbox) {
      for (const goblin of this.goblins) {
        if (goblin.isAlive && !this.hitEnemiesThisAttack.has(goblin) && goblin.intersects(attackHitbox)) {
          this.hitEnemiesThisAttack.add(goblin);
          goblin.takeDamage(this.player.stats.attackDamage, this.particles);
          this.camera.addShake(0.12, 4);

          // Apply weapon special effects
          const effect = this.player.equippedWeapon.specialEffect;
          if (effect === 'ICE_SLOW') {
            goblin.slowTimer = 2.0;
            this.particles.createFloatingText(goblin.x + goblin.width / 2, goblin.y - 12, 'FROST!', '#38bdf8', 12);
          } else if (effect === 'FLAME_BURN') {
            goblin.burnTimer = 1.6;
            this.particles.createFloatingText(goblin.x + goblin.width / 2, goblin.y - 12, 'BURN!', '#f97316', 12);
          } else if (effect === 'SHADOW_CRIT') {
            if (Math.random() < 0.35) {
              goblin.takeDamage(22, this.particles);
              this.particles.createFloatingText(goblin.x + goblin.width / 2, goblin.y - 12, 'CRIT!', '#c084fc', 13);
            }
          } else if (effect === 'GOLDEN_RADIANCE') {
            this.particles.createFloatingText(goblin.x + goblin.width / 2, goblin.y - 12, 'RADIANT!', '#facc15', 12);
          } else if (effect === 'CELESTIAL_BURST') {
            this.particles.createFloatingText(goblin.x + goblin.width / 2, goblin.y - 12, 'CELESTIAL!', '#f43f5e', 14);
          }

          // Drop coin on goblin death
          if (!goblin.isAlive) {
            this.coins.push(new Coin(goblin.x, goblin.y, 2));
          }
        }
      }
    }

    // 3. Checkpoint collision check
    for (const cp of this.checkpoints) {
      const activated = cp.update(dt, this.player, this.particles);
      if (activated) {
        this.activeSpawn = { x: cp.x, y: cp.y };
      }
    }

    // 4. Update Goblins
    for (const goblin of this.goblins) {
      if (goblin.isAlive) {
        goblin.update(dt, this.player, this.tileMap, this.particles);
      }
    }

    // 5. Update Collectibles
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      const collected = coin.update(dt, this.player, this.particles);
      if (collected) {
        this.collectedCoinsCount += coin.value;
        this.coins.splice(i, 1);
        if (this.onStateChangeCallback) {
          this.onStateChangeCallback(this.status, this.collectedCoinsCount, this.totalCoins);
        }
      }
    }

    // Health Pickups
    for (let i = this.healthPickups.length - 1; i >= 0; i--) {
      const hpPickup = this.healthPickups[i];
      const collected = hpPickup.update(dt, this.player, this.particles);
      if (collected) {
        this.healthPickups.splice(i, 1);
      }
    }

    // 6. Check Goal Post (Level Complete)
    const goal = this.levelDef.goalPost;
    if (this.player.intersects(goal) && this.status === 'RUNNING') {
      this.status = 'VICTORY';
      audioEngine.playVictory();
      this.particles.createVictoryConfetti(goal.x + 12, goal.y);

      // Star calculation: 3 = excellent (>=80%), 2 = good (>=40%), 1 = completed
      const totalPossible = Math.max(1, this.totalCoinsInLevel);
      const coinRatio = this.collectedCoinsCount / totalPossible;
      const stars = coinRatio >= 0.8 ? 3 : coinRatio >= 0.4 ? 2 : 1;

      SaveSystem.completeLevel(this.levelDef.config.id, stars, this.collectedCoinsCount);

      if (this.onStateChangeCallback) {
        this.onStateChangeCallback('VICTORY', this.collectedCoinsCount, this.totalCoins);
      }
    }

    // 7. Update Camera
    this.camera.follow(
      this.player.x,
      this.player.y,
      this.tileMap.widthInPixels,
      this.tileMap.heightInPixels
    );

    // 8. Update Particles
    this.particles.update(dt);

    this.input.updatePreviousState();
  }

  private render() {
    const { width, height } = this.canvas;
    const offsetX = this.camera.getOffsetX();
    const offsetY = this.camera.getOffsetY();

    // 1. Sky & Parallax Mountain Background
    this.renderBackground(offsetX, offsetY, width, height);

    // 2. Tutorial Signboards
    this.renderTutorialSigns(offsetX, offsetY);

    // 3. TileMap Terrain
    this.tileMap.render(this.ctx, offsetX, offsetY, width, height);

    // 4. Checkpoint Flag / Shrine
    for (const cp of this.checkpoints) {
      cp.render(this.ctx, offsetX, offsetY);
    }

    // 5. Goal Post (Victory Flag)
    this.renderGoalPost(offsetX, offsetY);

    // 6. Collectible Coins
    for (const coin of this.coins) {
      coin.render(this.ctx, offsetX, offsetY);
    }

    // Health Pickups
    for (const hpPickup of this.healthPickups) {
      hpPickup.render(this.ctx, offsetX, offsetY);
    }

    // 7. Enemies (Goblins)
    for (const goblin of this.goblins) {
      goblin.render(this.ctx, offsetX, offsetY);
    }

    // 8. Player (Blaze)
    this.player.render(this.ctx, offsetX, offsetY);

    // 9. Particle FX
    this.particles.render(this.ctx, offsetX, offsetY);
  }

  private renderTutorialSigns(offsetX: number, offsetY: number) {
    if (!this.levelDef.signs) return;
    const ctx = this.ctx;

    for (const sign of this.levelDef.signs) {
      // Hide tutorial sign after player has passed that section
      if (this.player.x > sign.x + 180) continue;

      const px = Math.round(sign.x - offsetX);
      const py = Math.round(sign.y - offsetY);

      // Only draw if on screen
      if (px < -200 || px > this.canvas.width + 200) continue;

      const signWidth = 120;
      const signHeight = 36;
      const signX = px - signWidth / 2 + 16;

      // Wooden Posts
      ctx.fillStyle = '#451a03';
      ctx.fillRect(signX + 16, py + signHeight - 4, 6, 24);
      ctx.fillRect(signX + signWidth - 22, py + signHeight - 4, 6, 24);

      // Parchment Wooden Frame
      ctx.fillStyle = '#78350f';
      ctx.fillRect(signX - 2, py - 2, signWidth + 4, signHeight + 4);

      // Parchment Paper Board
      ctx.fillStyle = '#fef3c7'; // Warm Parchment Cream
      ctx.fillRect(signX, py, signWidth, signHeight);

      ctx.strokeStyle = '#d97706'; // Gold Border
      ctx.lineWidth = 1.5;
      ctx.strokeRect(signX + 1, py + 1, signWidth - 2, signHeight - 2);

      // Text Title & Subtitle
      ctx.fillStyle = '#78350f'; // Dark Brown Header
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(sign.title, signX + signWidth / 2, py + 13);

      ctx.fillStyle = '#1e293b'; // Slate Subtitle
      ctx.font = '9px sans-serif';
      ctx.fillText(sign.subtitle, signX + signWidth / 2, py + 27);
    }
  }

  private renderBackground(offsetX: number, offsetY: number, width: number, height: number) {
    EnvironmentRenderer.render(this.ctx, this.levelDef.config.id, offsetX, offsetY, width, height);
  }

  private renderGoalPost(offsetX: number, offsetY: number) {
    const goal = this.levelDef.goalPost;
    const px = Math.round(goal.x - offsetX);
    const py = Math.round(goal.y - offsetY);

    const ctx = this.ctx;

    // Wooden Flag Pole
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 4, py, 6, goal.height);

    // Glowing Victory Banner
    const wave = Math.sin(Date.now() / 200) * 4;
    ctx.fillStyle = '#38bdf8'; // Glowing Cyan Flag
    ctx.beginPath();
    ctx.moveTo(px + 10, py + 4);
    ctx.lineTo(px + 38 + wave, py + 14);
    ctx.lineTo(px + 10, py + 26);
    ctx.closePath();
    ctx.fill();

    // Golden Crest Symbol
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(px + 20, py + 14, 4, 0, Math.PI * 2);
    ctx.fill();

    // Base Pedestal
    ctx.fillStyle = '#475569';
    ctx.fillRect(px - 4, py + goal.height - 8, 22, 8);
  }
}
