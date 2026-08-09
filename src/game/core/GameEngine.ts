import { GameStateStatus, SaveData } from '../../types/game';
import { Player } from '../entities/Player';
import { ForestGoblin } from '../entities/Enemy';
import { Coin, HealthPickup } from '../entities/Collectible';
import { Checkpoint } from '../entities/Checkpoint';
import { TileMap } from '../world/TileMap';
import { LEVEL_1_1, LevelDefinition, getLevelDefinition } from '../world/LevelData';
import { Camera } from './Camera';
import { InputManager } from './InputManager';
import { ParticleSystem } from './ParticleSystem';
import { audioEngine } from '../audio/AudioEngine';
import { SaveSystem } from '../save/SaveSystem';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public status: GameStateStatus = 'RUNNING';

  public player: Player;
  public goblins: ForestGoblin[] = [];
  public coins: Coin[] = [];
  public healthPickups: HealthPickup[] = [];
  public checkpoint?: Checkpoint;
  public tileMap: TileMap;
  public camera: Camera;
  public input: InputManager;
  public particles: ParticleSystem;

  public levelDef: LevelDefinition;
  public collectedCoinsCount: number = 0;
  public totalCoinsInLevel: number = 0;
  public activeSpawn: { x: number; y: number };

  private lastTime: number = 0;
  private animFrameId: number | null = null;
  private onStateChangeCallback?: (status: GameStateStatus, coinsCollected: number) => void;

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

    this.levelDef = getLevelDefinition(levelId);
    this.tileMap = new TileMap(
      Math.floor(this.levelDef.config.width / 32),
      Math.floor(this.levelDef.config.height / 32),
      this.levelDef.grid
    );
    this.camera = new Camera(canvas.width, canvas.height);
    this.input = new InputManager();
    this.particles = new ParticleSystem();

    this.activeSpawn = { ...this.levelDef.playerSpawn };

    // Create Player BLAZE with upgrade stats bonus
    const hpBonus = (saveData.upgrades.maxHealth || 0) * 15;
    const dmgBonus = (saveData.upgrades.attackPower || 0) * 5;
    const speedBonus = (saveData.upgrades.moveSpeed || 0) * 0.3;

    this.player = new Player(this.activeSpawn.x, this.activeSpawn.y, {
      maxHp: hpBonus,
      attackDamage: dmgBonus,
      moveSpeed: speedBonus,
    });

    this.initLevelEntities();
  }

  public setOnStateChange(cb: (status: GameStateStatus, coinsCollected: number) => void) {
    this.onStateChangeCallback = cb;
  }

  private initLevelEntities() {
    // Populate Goblins
    this.goblins = this.levelDef.goblins.map(
      (g) => new ForestGoblin(g.x, g.y, g.patrolRange || 100, g.isBoss || false)
    );

    // Populate Coins
    this.coins = this.levelDef.coins.map((c) => new Coin(c.x, c.y, c.value || 1));
    this.totalCoinsInLevel = this.coins.length;

    // Populate Health Pickups
    this.healthPickups = (this.levelDef.healthPickups || []).map(
      (h) => new HealthPickup(h.x, h.y, h.healAmount || 25)
    );

    // Populate Checkpoint
    if (this.levelDef.checkpoint) {
      this.checkpoint = new Checkpoint(
        this.levelDef.checkpoint.x,
        this.levelDef.checkpoint.y
      );
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
        this.onStateChangeCallback('PAUSED', this.collectedCoinsCount);
      }
    }
  }

  public resume() {
    if (this.status === 'PAUSED') {
      this.status = 'RUNNING';
      this.lastTime = performance.now();
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback('RUNNING', this.collectedCoinsCount);
      }
    }
  }

  public restart() {
    this.status = 'RUNNING';
    this.particles.clear();
    this.activeSpawn = { ...this.levelDef.playerSpawn };
    this.player = new Player(this.activeSpawn.x, this.activeSpawn.y);
    this.collectedCoinsCount = 0;
    this.initLevelEntities();
    this.camera.x = 0;
    this.camera.y = 0;
    this.lastTime = performance.now();
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback('RUNNING', 0);
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
      this.onStateChangeCallback('RUNNING', this.collectedCoinsCount);
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
        this.onStateChangeCallback('GAME_OVER', this.collectedCoinsCount);
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

          // Drop coin on goblin death
          if (!goblin.isAlive) {
            this.coins.push(new Coin(goblin.x, goblin.y, 2));
          }
        }
      }
    }

    // 3. Checkpoint collision check
    if (this.checkpoint) {
      const activated = this.checkpoint.update(dt, this.player, this.particles);
      if (activated) {
        this.activeSpawn = { x: this.checkpoint.x, y: this.checkpoint.y };
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
      }
    }

    // Health Pickups
    for (const hpPickup of this.healthPickups) {
      hpPickup.update(dt, this.player, this.particles);
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
        this.onStateChangeCallback('VICTORY', this.collectedCoinsCount);
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
    if (this.checkpoint) {
      this.checkpoint.render(this.ctx, offsetX, offsetY);
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
    const ctx = this.ctx;

    // 1. Layer 1: Sky Gradient (Bright Fantasy Forest Day)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#0284c7'); // Sky Blue
    skyGrad.addColorStop(0.5, '#38bdf8');
    skyGrad.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Sun & Warm Light Glow
    const sunX = width * 0.75 - offsetX * 0.02;
    const sunY = 70;
    ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fill();

    // 2. Layer 2: Parallax Far Distant Misty Mountains (Speed: 0.12)
    ctx.fillStyle = '#38bdf8'; // Soft Distant Blue Peaks
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = -50; x <= width + 50; x += 50) {
      const hillY = height - 150 - Math.sin((x + offsetX * 0.12) * 0.008) * 50;
      ctx.lineTo(x, hillY);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // 3. Layer 3: Parallax Mid Forest Canopy & Rolling Hills (Speed: 0.3)
    ctx.fillStyle = '#0d9488'; // Deep Teal/Green Canopy
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = -50; x <= width + 50; x += 40) {
      const hillY = height - 100 - Math.sin((x + offsetX * 0.3) * 0.012) * 35;
      ctx.lineTo(x, hillY);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // 4. Layer 4: Parallax Near Forest Ancient Trees (Speed: 0.55)
    const treeSpacing = 160;
    const startTreeIdx = Math.floor((offsetX * 0.55 - 100) / treeSpacing);
    for (let i = startTreeIdx; i < startTreeIdx + 12; i++) {
      const treeX = i * treeSpacing - offsetX * 0.55;
      const treeY = height - 130;

      // Tree Trunk
      ctx.fillStyle = '#451a03';
      ctx.fillRect(treeX, treeY, 14, 60);

      // Tree Bark Detail
      ctx.fillStyle = '#78350f';
      ctx.fillRect(treeX + 3, treeY + 5, 4, 50);

      // Lush Foliage Canopy Clusters
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(treeX + 7, treeY - 10, 28, 0, Math.PI * 2);
      ctx.arc(treeX - 10, treeY + 4, 20, 0, Math.PI * 2);
      ctx.arc(treeX + 24, treeY + 4, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e'; // Highlight Leaves
      ctx.beginPath();
      ctx.arc(treeX + 3, treeY - 16, 18, 0, Math.PI * 2);
      ctx.fill();
    }
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
