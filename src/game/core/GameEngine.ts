import { GameStateStatus, SaveData, PlayerStats, QuickSaveData, LevelState } from '../../types/game';
import { Player } from '../entities/Player';
import { ForestGoblin, EnemyClass } from '../entities/Enemy';
import { BossMonster } from '../entities/BossMonster';
import { BossProjectile } from '../entities/BossProjectile';
import { Coin, HealthPickup } from '../entities/Collectible';
import { Checkpoint } from '../entities/Checkpoint';
import { TileMap, TileType } from '../world/TileMap';
import { LevelDefinition, getLevelDefinition } from '../world/LevelData';
import { Camera } from './Camera';
import { InputManager } from './InputManager';
import { ParticleSystem } from './ParticleSystem';
import { WeatherSystem } from './WeatherSystem';
import { audioEngine } from '../audio/AudioEngine';
import { SaveSystem } from '../save/SaveSystem';
import { DebugManager } from '../debug/DebugManager';
import { EnvironmentRenderer } from '../render/EnvironmentRenderer';
import { SecretRoomManager } from '../entities/SecretRoomManager';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public status: GameStateStatus = 'RUNNING';

  public player: Player;
  public goblins: ForestGoblin[] = [];

  // Enemy System Settings & Roster Tracking
  public readonly TOTAL_LEVEL_ENEMIES: number = 50;
  public readonly MAX_ACTIVE_ENEMIES: number = 5;

  public totalEnemiesInLevel: number = 50;
  public totalEnemiesSpawned: number = 0;
  public totalEnemiesDefeated: number = 0;
  public isAreaCleared: boolean = false;
  public areaClearedBannerTimer: number = 0;

  public levelSpawnRoster: {
    x: number;
    y: number;
    spawned: boolean;
    enemyClass: import('../entities/Enemy').EnemyClass;
  }[] = [];

  public get activeEnemyCount(): number {
    return this.goblins.filter((g) => g.isAlive && g.combatState !== 'DEAD' && !g.isShadowClone).length;
  }
  public bossMonster?: BossMonster;
  public bossProjectiles: BossProjectile[] = [];
  public isBossLevel: boolean = false;
  public coins: Coin[] = [];
  public healthPickups: HealthPickup[] = [];
  public checkpoints: Checkpoint[] = [];
  public tileMap: TileMap;
  public camera: Camera;
  public input: InputManager;
  public particles: ParticleSystem;
  public weather: WeatherSystem;
  public secretRoomManager: SecretRoomManager;
  public levelState: LevelState;

  public levelDef: LevelDefinition;
  public startingCoins: number = 0;
  public collectedCoinsCount: number = 0;
  public totalCoinsInLevel: number = 0;
  public activeSpawn: { x: number; y: number };

  private lastTime: number = 0;
  private animFrameId: number | null = null;
  public onImpactCallback?: (type: 'HEAVY' | 'BOSS' | 'LIGHT') => void;
  private onStateChangeCallback?: (status: GameStateStatus, levelCoins: number, totalCoins: number) => void;
  private statsBonus: Partial<PlayerStats>;

  // Single-hit combat tracking
  private lastAttackId: number = -1;
  private hitEnemiesThisAttack: Set<ForestGoblin> = new Set();

  // Combat Combo Counter & Inactivity Timer
  public comboHits: number = 0;
  public comboTimer: number = 0;
  public readonly maxComboTimer: number = 1.5; // Resets when player does not hit an enemy for ~1.5s

  // Impact Hit-Stop (Freeze Frame on punch/kick connection)
  public hitStopTimer: number = 0;

  public saveData: SaveData;
  private lastDragonAbilityAttackId: number = -1;

  constructor(canvas: HTMLCanvasElement, saveData: SaveData, levelId: string = '1-1', isResume: boolean = false) {
    this.saveData = saveData;
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
    this.weather = new WeatherSystem();
    this.weather.init(levelId);

    this.activeSpawn = { ...this.levelDef.playerSpawn };

    // Secret Room Manager initialization
    this.secretRoomManager = new SecretRoomManager(this.levelDef.secretRooms || [], levelId);

    // Track LevelState for secret rooms and progression
    this.levelState = {
      levelId,
      isAreaCleared: false,
      totalEnemies: this.TOTAL_LEVEL_ENEMIES,
      defeatedEnemies: 0,
      secretRoomsFound: this.secretRoomManager.discoveredCount,
      totalSecretRooms: this.secretRoomManager.totalRooms,
      secretRooms: this.levelDef.secretRooms,
    };

    // Create Player BLAZE with upgrade stats bonus, permanent secret stat bonuses, and equipped weapon
    const permHpBonus = saveData.statBonuses?.maxHpBonus || 0;
    const permDmgBonus = saveData.statBonuses?.attackBonus || 0;

    const hpBonus = (saveData.upgrades?.maxHealth || 0) * 15 + permHpBonus;
    const dmgBonus = (saveData.upgrades?.attackPower || 0) * 5 + permDmgBonus;
    const speedBonus = (saveData.upgrades?.moveSpeed || 0) * 0.3;

    this.statsBonus = {
      maxHp: hpBonus,
      attackDamage: dmgBonus,
      moveSpeed: speedBonus,
    };

    const equippedWeapon = SaveSystem.getEquippedWeapon(saveData, levelId);
    this.player = new Player(this.activeSpawn.x, this.activeSpawn.y, this.statsBonus, equippedWeapon);
    this.player.isGodMode = DebugManager.isGodMode();
    this.player.legendaryAuraUnlocked = Boolean(saveData.legendaryAuraUnlocked);
    this.player.legendaryAbilityUnlocked = Boolean(saveData.legendaryAbilityUnlocked);
    this.player.onDamage = () => this.resetCombo();

    // Quick save restoration check
    const qs = (isResume && saveData.quickSave && saveData.quickSave.levelId === levelId) ? saveData.quickSave : null;

    if (qs) {
      this.startingCoins = qs.startingCoins;
      this.collectedCoinsCount = qs.collectedCoinsCount;
    }

    this.initLevelEntities(qs);

    if (qs) {
      this.player.x = qs.playerX;
      this.player.y = qs.playerY;
      this.player.stats.currentHp = Math.min(this.player.stats.maxHp, qs.playerHp);
    }
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

  public getComboDamageBonus(): number {
    if (this.comboHits >= 10) return 1.15; // +15% maximum
    if (this.comboHits >= 6) return 1.10;  // +10%
    if (this.comboHits >= 4) return 1.05;  // +5%
    return 1.0;                            // x2-x3: normal damage (1.0x)
  }

  public registerComboHit(x: number, y: number) {
    this.comboHits++;
    this.comboTimer = this.maxComboTimer;

    if (this.comboHits >= 2) {
      let label = `COMBO x${this.comboHits}`;
      let color = '#facc15';
      let size = 13 + Math.min(6, this.comboHits);

      if (this.comboHits >= 10) {
        label = `COMBO x${this.comboHits}! 💥`;
        color = '#ef4444';
      } else if (this.comboHits >= 6) {
        label = `COMBO x${this.comboHits}! 🔥`;
        color = '#f97316';
      } else if (this.comboHits >= 4) {
        label = `COMBO x${this.comboHits}! ⚡`;
        color = '#38bdf8';
      }

      this.particles.createFloatingText(x, y - 18, label, color, size);
    }
  }

  public resetCombo() {
    this.comboHits = 0;
    this.comboTimer = 0;
  }

  // ==========================================
  // DEBUG & TESTING HELPERS
  // ==========================================
  public setPlayerHp(hp: number) {
    this.player.stats.currentHp = Math.min(hp, this.player.stats.maxHp);
  }

  public setPlayerLowHp() {
    this.player.stats.currentHp = Math.min(10, this.player.stats.maxHp);
  }

  public addCoins(amount: number) {
    this.collectedCoinsCount += amount;
    SaveSystem.addCoins(amount);
  }

  public setGodMode(enabled: boolean) {
    this.player.isGodMode = enabled;
  }

  public killNearestEnemy() {
    let nearest: ForestGoblin | BossMonster | null = null;
    let minDist = Infinity;

    for (const g of this.goblins) {
      if (g.isAlive) {
        const dist = Math.hypot(g.x - this.player.x, g.y - this.player.y);
        if (dist < minDist) {
          minDist = dist;
          nearest = g;
        }
      }
    }

    if (this.bossMonster && this.bossMonster.isAlive) {
      const dist = Math.hypot(this.bossMonster.x - this.player.x, this.bossMonster.y - this.player.y);
      if (dist < minDist) {
        nearest = this.bossMonster;
      }
    }

    if (nearest) {
      nearest.hp = 0;
      nearest.isAlive = false;
      this.particles.createSlashSparks(nearest.x + nearest.width / 2, nearest.y + nearest.height / 2, true, ['#ef4444', '#facc15']);
    }
  }

  public killAllEnemies() {
    for (const g of this.goblins) {
      if (g.isAlive) {
        g.hp = 0;
        g.isAlive = false;
      }
    }
    if (this.bossMonster && this.bossMonster.isAlive) {
      this.bossMonster.hp = 0;
      this.bossMonster.isAlive = false;
    }
  }

  private init50EnemiesRoster() {
    this.totalEnemiesInLevel = 50;
    this.totalEnemiesSpawned = 0;
    this.totalEnemiesDefeated = 0;
    this.isAreaCleared = false;
    this.levelSpawnRoster = [];

    const startX = 250;
    const mapWidthInPx = this.tileMap ? this.tileMap.widthInPixels : (this.levelDef.config.width || 4000);
    const endX = Math.max(1200, mapWidthInPx - 400);

    for (let i = 0; i < 50; i++) {
      const progressRatio = i / 49;
      const rawX = startX + progressRatio * (endX - startX) + Math.sin(i * 1.9) * 35;
      const groundPos = this.findValidGroundAtX(rawX) || { x: Math.max(120, rawX), y: 320 };

      let enemyClass: import('../entities/Enemy').EnemyClass = 'MARTIAL_ARTIST';
      if (i % 5 === 0) enemyClass = 'ELITE_FIGHTER';
      else if (i % 3 === 0) enemyClass = 'HEAVY_FIGHTER';
      else if (i % 2 === 0) enemyClass = 'FAST_FIGHTER';

      this.levelSpawnRoster.push({
        x: groundPos.x,
        y: groundPos.y,
        spawned: false,
        enemyClass,
      });
    }
  }

  public findValidGroundAtX(targetX: number): { x: number; y: number } | null {
    if (!this.tileMap) return { x: targetX, y: 320 };

    const enemyHeight = 44;
    const baseCol = Math.floor(targetX / 32);

    for (let offset = 0; offset <= 8; offset++) {
      const colsToTry = offset === 0 ? [baseCol] : [baseCol + offset, baseCol - offset];
      for (const col of colsToTry) {
        if (col < 2 || col >= this.tileMap.cols - 3) continue;

        for (let row = 2; row < this.tileMap.rows - 1; row++) {
          const currentTile = this.tileMap.getTile(col, row);
          const tileAbove = this.tileMap.getTile(col, row - 1);
          const tileAbove2 = this.tileMap.getTile(col, row - 2);

          if (
            this.tileMap.isSolidTile(currentTile) &&
            currentTile !== 10 &&
            !this.tileMap.isSolidTile(tileAbove) &&
            !this.tileMap.isSolidTile(tileAbove2)
          ) {
            return {
              x: col * 32,
              y: row * 32 - enemyHeight,
            };
          }
        }
      }
    }

    const clampedX = Math.max(120, Math.min(this.tileMap.widthInPixels - 128, targetX));
    return { x: clampedX, y: this.player ? this.player.y : 320 };
  }

  public findValidGroundSpawnPosition(): { x: number; y: number } | null {
    if (!this.player) return { x: 300, y: 320 };

    const minDistance = 200;
    const maxDistance = 380;
    const directions = this.player.facingRight ? [1, -1] : [-1, 1];

    for (const dir of directions) {
      for (let attempts = 0; attempts < 6; attempts++) {
        const dist = minDistance + Math.random() * (maxDistance - minDistance);
        const targetX = this.player.x + dir * dist;
        if (targetX < 64 || targetX > this.tileMap.widthInPixels - 128) continue;

        const ground = this.findValidGroundAtX(targetX);
        if (ground && Math.abs(ground.x - this.player.x) >= 180) {
          return ground;
        }
      }
    }

    const fallbackX = Math.max(64, Math.min(this.tileMap.widthInPixels - 128, this.player.x + (this.player.facingRight ? 260 : -260)));
    return this.findValidGroundAtX(fallbackX);
  }

  private spawnNextRosterEnemy() {
    if (this.totalEnemiesSpawned >= 50) return;
    if (this.activeEnemyCount >= this.MAX_ACTIVE_ENEMIES) return;

    const unspawnedIndices: number[] = [];
    for (let i = 0; i < this.levelSpawnRoster.length; i++) {
      if (!this.levelSpawnRoster[i].spawned) {
        unspawnedIndices.push(i);
      }
    }

    if (unspawnedIndices.length === 0) return;

    const playerX = this.player ? this.player.x : 200;
    let chosenIndex = -1;
    let bestDist = Infinity;

    for (const idx of unspawnedIndices) {
      const entry = this.levelSpawnRoster[idx];
      const dist = Math.abs(entry.x - playerX);

      if (dist >= 180) {
        if (dist < bestDist) {
          bestDist = dist;
          chosenIndex = idx;
        }
      }
    }

    if (chosenIndex === -1) {
      chosenIndex = unspawnedIndices[0];
      const entry = this.levelSpawnRoster[chosenIndex];
      const safeX = Math.max(64, Math.min(this.tileMap.widthInPixels - 128, playerX + (this.player && this.player.facingRight ? 260 : -260)));
      const validGround = this.findValidGroundAtX(safeX);
      if (validGround) {
        entry.x = validGround.x;
        entry.y = validGround.y;
      }
    }

    const entry = this.levelSpawnRoster[chosenIndex];
    entry.spawned = true;
    this.totalEnemiesSpawned++;

    const enemy = new ForestGoblin(entry.x, entry.y, 100, false, this.levelDef.config.id);
    enemy.enemyClass = entry.enemyClass;

    if (entry.enemyClass === 'ELITE_FIGHTER') {
      enemy.maxHp = 180;
      enemy.hp = 180;
      enemy.attackDamage = 12;
    } else if (entry.enemyClass === 'HEAVY_FIGHTER') {
      enemy.maxHp = 140;
      enemy.hp = 140;
      enemy.attackDamage = 10;
    } else if (entry.enemyClass === 'FAST_FIGHTER') {
      enemy.maxHp = 80;
      enemy.hp = 80;
      enemy.attackDamage = 6;
    }

    this.goblins.push(enemy);

    this.particles.createFloatingText(entry.x, entry.y - 20, `ENEMY #${this.totalEnemiesSpawned}/50 ⚔️`, '#ef4444', 13);
    this.particles.createSlashSparks(entry.x + 16, entry.y + 20, true, ['#ef4444', '#facc15']);
  }

  public spawnEnemy(enemyClass?: import('../entities/Enemy').EnemyClass) {
    if (this.totalEnemiesSpawned >= 50) return;
    this.spawnNextRosterEnemy();
  }

  public spawnMultipleEnemies(count: number) {
    const toSpawn = Math.min(count, 50 - this.totalEnemiesSpawned);
    for (let i = 0; i < toSpawn; i++) {
      this.spawnNextRosterEnemy();
    }
  }

  public spawnBoss() {
    const spawnX = this.player.x + 140;
    const spawnY = this.player.y - 20;
    this.bossMonster = new BossMonster(spawnX, spawnY, this.levelDef.config.id);
    this.isBossLevel = true;
    this.particles.createFloatingText(spawnX, spawnY - 30, 'BOSS SPAWNED!', '#ef4444', 18);
  }

  public setEnemyHp(hp: number) {
    for (const g of this.goblins) {
      if (g.isAlive) {
        g.maxHp = hp;
        g.hp = hp;
      }
    }
    if (this.bossMonster && this.bossMonster.isAlive) {
      this.bossMonster.maxHp = hp;
      this.bossMonster.hp = hp;
    }
  }

  public setEnemyDamage(damage: number) {
    for (const g of this.goblins) {
      g.attackDamage = damage;
    }
    if (this.bossMonster) {
      this.bossMonster.attackDamage = damage;
    }
  }

  public forceEnemyBlock() {
    for (const g of this.goblins) {
      if (g.isAlive) {
        g.triggerForceBlock();
      }
    }
  }

  public forceEnemyDodge() {
    for (const g of this.goblins) {
      if (g.isAlive) {
        g.triggerForceDodge();
      }
    }
  }

  public forceEnemyCounterattack() {
    for (const g of this.goblins) {
      if (g.isAlive) {
        g.triggerForceCounterattack();
      }
    }
  }

  public triggerVictory() {
    this.status = 'VICTORY';
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback('VICTORY', this.collectedCoinsCount, this.totalCoins);
    }
  }

  private initLevelEntities(qs?: QuickSaveData | null) {
    this.bossProjectiles = [];
    this.isBossLevel = this.levelDef.config.isBossLevel || false;
    this.goblins = [];
    this.totalEnemiesInLevel = 50;
    this.totalEnemiesSpawned = 50;
    this.totalEnemiesDefeated = 0;
    this.isAreaCleared = false;

    // Instantiate all 50 actual combat enemies from levelDef.goblins across 6 level waves
    const rawGoblins = this.levelDef.goblins || [];
    for (let i = 0; i < rawGoblins.length; i++) {
      const spawn = rawGoblins[i];
      if (spawn.isBoss) continue;

      const enemy = new ForestGoblin(spawn.x, spawn.y, 100, false, this.levelDef.config.id);

      // Assign Enemy Class & stats based on wave progression (0..49)
      if (i >= 32) {
        enemy.enemyClass = i % 2 === 0 ? 'ELITE_FIGHTER' : 'HEAVY_FIGHTER';
        enemy.maxHp = 180;
        enemy.hp = 180;
        enemy.attackDamage = 12;
      } else if (i >= 16) {
        enemy.enemyClass = i % 2 === 0 ? 'HEAVY_FIGHTER' : 'MARTIAL_ARTIST';
        enemy.maxHp = 130;
        enemy.hp = 130;
        enemy.attackDamage = 9;
      } else {
        enemy.enemyClass = i % 2 === 0 ? 'MARTIAL_ARTIST' : 'FAST_FIGHTER';
        enemy.maxHp = 90;
        enemy.hp = 90;
        enemy.attackDamage = 7;
      }

      this.goblins.push(enemy);
    }

    // QuickSave restoration
    if (qs?.defeatedEnemyIndices && qs.defeatedEnemyIndices.length > 0) {
      const set = new Set(qs.defeatedEnemyIndices);
      this.goblins.forEach((g, idx) => {
        if (set.has(idx)) {
          g.hp = 0;
          g.isAlive = false;
          g.combatState = 'DEAD';
          g.hasRegisteredDeath = true;
          this.totalEnemiesDefeated++;
        }
      });
    }

    if (this.totalEnemiesDefeated >= 50) {
      this.isAreaCleared = true;
    }

    // Apply New Game+ Scaling
    const ngLevel = this.saveData?.newGamePlusLevel || 0;
    if (ngLevel > 0) {
      const hpMult = 1 + 0.35 * ngLevel;
      const dmgMult = 1 + 0.25 * ngLevel;
      const speedMult = 1 + 0.10 * ngLevel;

      for (const enemy of this.goblins) {
        enemy.maxHp = Math.round(enemy.maxHp * hpMult);
        if (enemy.isAlive && enemy.combatState !== 'DEAD') {
          enemy.hp = enemy.maxHp;
        }
        enemy.attackDamage = Math.round(enemy.attackDamage * dmgMult);
        enemy.moveSpeed = enemy.moveSpeed * speedMult;
      }
    }

    // Initialize World Boss for Boss Levels (Level 5 of each world)
    if (this.isBossLevel) {
      const bossSpawn = this.levelDef.goblins.find((g) => g.isBoss);
      const bossX = bossSpawn ? bossSpawn.x : this.levelDef.config.width - 700;
      const bossY = bossSpawn ? bossSpawn.y : 300;

      this.bossMonster = new BossMonster(bossX, bossY, this.levelDef.config.id);

      if (ngLevel > 0) {
        const bossHpMult = 1 + 0.40 * ngLevel;
        const bossDmgMult = 1 + 0.25 * ngLevel;
        this.bossMonster.maxHp = Math.round(this.bossMonster.maxHp * bossHpMult);
        this.bossMonster.attackDamage = Math.round(this.bossMonster.attackDamage * bossDmgMult);
      }

      if (qs?.bossHp !== undefined && qs.bossHp > 0) {
        this.bossMonster.hp = qs.bossHp;
        if (qs.bossPhase) {
          this.bossMonster.currentPhase = qs.bossPhase;
        }
        this.bossMonster.isTriggered = true;
        this.bossMonster.state = 'COMBAT';
      } else if (qs?.bossHp === 0) {
        this.bossMonster.hp = 0;
        this.bossMonster.isAlive = false;
        this.bossMonster.state = 'DEAD';
      } else {
        this.bossMonster.hp = this.bossMonster.maxHp;
      }
    } else {
      this.bossMonster = undefined;
    }

    // Populate Coins
    this.coins = this.levelDef.coins.map((c) => new Coin(c.x, c.y, c.value || 1));
    if (ngLevel > 0) {
      for (const c of this.coins) {
        c.value = Math.round(c.value * (1 + 0.50 * ngLevel));
      }
    }
    this.totalCoinsInLevel = this.coins.reduce((sum, c) => sum + c.value, 0);
    if (qs?.collectedCoinIndices) {
      qs.collectedCoinIndices.forEach((idx) => {
        if (this.coins[idx]) this.coins[idx].isCollected = true;
      });
    }

    // Populate Health Pickups
    this.healthPickups = (this.levelDef.healthPickups || []).map(
      (h) => new HealthPickup(h.x, h.y, h.healAmount || 25)
    );
    if (qs?.collectedHealthIndices) {
      qs.collectedHealthIndices.forEach((idx) => {
        if (this.healthPickups[idx]) this.healthPickups[idx].isCollected = true;
      });
    }

    // Populate Checkpoints
    this.checkpoints = [];
    if (this.levelDef.checkpoints && this.levelDef.checkpoints.length > 0) {
      this.checkpoints = this.levelDef.checkpoints.map((c) => new Checkpoint(c.x, c.y));
    } else if (this.levelDef.checkpoint) {
      this.checkpoints = [new Checkpoint(this.levelDef.checkpoint.x, this.levelDef.checkpoint.y)];
    }

    if (qs?.activeCheckpointIndex !== undefined && qs.activeCheckpointIndex >= 0) {
      if (this.checkpoints[qs.activeCheckpointIndex]) {
        this.checkpoints[qs.activeCheckpointIndex].isActive = true;
        this.activeSpawn = { x: this.checkpoints[qs.activeCheckpointIndex].x, y: this.checkpoints[qs.activeCheckpointIndex].y };
      }
    }
  }

  public createQuickSaveData(): QuickSaveData {
    return {
      levelId: this.levelDef.config.id,
      playerX: this.player.x,
      playerY: this.player.y,
      playerHp: this.player.stats.currentHp,
      collectedCoinsCount: this.collectedCoinsCount,
      startingCoins: this.startingCoins,
      collectedCoinIndices: this.coins.map((c, i) => (c.isCollected ? i : -1)).filter((i) => i >= 0),
      collectedHealthIndices: this.healthPickups.map((h, i) => (h.isCollected ? i : -1)).filter((i) => i >= 0),
      defeatedEnemyIndices: this.goblins.map((g, i) => (!g.isAlive ? i : -1)).filter((i) => i >= 0),
      activeCheckpointIndex: this.checkpoints.findIndex((c) => c.isActive),
      bossHp: this.bossMonster ? this.bossMonster.hp : undefined,
      bossPhase: this.bossMonster ? this.bossMonster.currentPhase : undefined,
      timestamp: Date.now(),
    };
  }

  public saveQuickSave(): SaveData {
    const qs = this.createQuickSaveData();
    const updated = SaveSystem.saveQuickSave(qs);
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.status, this.collectedCoinsCount, this.totalCoins);
    }
    return updated;
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
    SaveSystem.clearQuickSave();
    this.status = 'RUNNING';
    this.particles.clear();
    this.resetCombo();
    this.activeSpawn = { ...this.levelDef.playerSpawn };
    this.player = new Player(this.activeSpawn.x, this.activeSpawn.y, this.statsBonus, this.player.equippedWeapon);
    this.player.onDamage = () => this.resetCombo();
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
    this.resetCombo();
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
    // 0. Process Impact Hit-Stop (Short freeze frame on punch/kick connection for strike clarity)
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      this.particles.update(dt * 0.2);
      this.camera.follow(this.player.x, this.player.y, this.tileMap.widthInPixels, this.tileMap.heightInPixels);
      return;
    }

    const inputState = this.input.getState();

    // Update Combat Combo Inactivity Timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboTimer = 0;
        this.comboHits = 0;
      }
    }

    // 1. Update Player
    this.player.update(dt, inputState, this.tileMap, this.particles, this.camera);

    // Check Player Death
    if (!this.player.isAlive && this.status !== 'GAME_OVER') {
      this.status = 'GAME_OVER';
      audioEngine.playGameOver();
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback('GAME_OVER', this.collectedCoinsCount, this.totalCoins);
      }
      return;
    }

    // 2. Enforce Martial Combat Spacing (maintain readable separation during fight)
    for (const goblin of this.goblins) {
      if (goblin.isAlive) {
        const dx = (goblin.x + goblin.width / 2) - (this.player.x + this.player.width / 2);
        const distX = Math.abs(dx);
        const minSpacing = (this.player.state === 'ATTACK') ? 44 : 38;

        if (distX < minSpacing && Math.abs(goblin.y - this.player.y) < 32) {
          const overlap = minSpacing - distX;
          const pushDir = dx >= 0 ? 1 : -1;
          goblin.x += pushDir * overlap * 0.75;
          if (this.player.state !== 'ATTACK') {
            this.player.x -= pushDir * overlap * 0.25;
          }
        }
      }
    }
    if (this.bossMonster && this.bossMonster.isAlive) {
      const dx = (this.bossMonster.x + this.bossMonster.width / 2) - (this.player.x + this.player.width / 2);
      const distX = Math.abs(dx);
      const minSpacing = (this.player.state === 'ATTACK') ? 56 : 48;

      if (distX < minSpacing && Math.abs(this.bossMonster.y - this.player.y) < 40) {
        const overlap = minSpacing - distX;
        const pushDir = dx >= 0 ? 1 : -1;
        this.bossMonster.x += pushDir * overlap * 0.8;
        if (this.player.state !== 'ATTACK') {
          this.player.x -= pushDir * overlap * 0.2;
        }
      }
    }

    // 3. Martial Arts Attack Collisions (Single-hit per attack swing)
    if (this.player.currentAttackId !== this.lastAttackId) {
      this.lastAttackId = this.player.currentAttackId;
      this.hitEnemiesThisAttack.clear();
    }

    // Trigger Legendary Combat Ability: Dragon Spirit Slash
    if (
      this.player.legendaryAbilityUnlocked &&
      this.player.state === 'ATTACK' &&
      this.player.currentAttackId !== this.lastDragonAbilityAttackId
    ) {
      this.lastDragonAbilityAttackId = this.player.currentAttackId;

      const px = this.player.x + this.player.width / 2;
      const py = this.player.y + 12;
      const dir = this.player.facingRight ? 1 : -1;

      this.particles.createFloatingText(px, py - 32, 'DRAGON SLASH! 🐉', '#facc15', 16);
      this.particles.createCombatImpact(px + dir * 60, py, this.player.facingRight, ['#facc15', '#fef08a', '#f97316']);

      const dragonReach = 200;
      const dragonDmg = Math.max(15, Math.round(this.player.stats.attackDamage * 0.45));

      // Hit Goblins in path
      for (const goblin of this.goblins) {
        if (goblin.isAlive && goblin.combatState !== 'DEAD') {
          const dx = (goblin.x + goblin.width / 2) - px;
          if (Math.sign(dx) === dir && Math.abs(dx) <= dragonReach && Math.abs(goblin.y - this.player.y) < 50) {
            goblin.takeDamage(dragonDmg, this.particles, 'FINISHER');
            this.particles.createFloatingText(goblin.x + goblin.width / 2, goblin.y - 18, `🐉 +${dragonDmg}`, '#fde047', 14);
          }
        }
      }

      // Hit Boss Monster in path
      if (this.bossMonster && this.bossMonster.isAlive) {
        const dx = (this.bossMonster.x + this.bossMonster.width / 2) - px;
        if (Math.sign(dx) === dir && Math.abs(dx) <= dragonReach + 40 && Math.abs(this.bossMonster.y - this.player.y) < 60) {
          this.bossMonster.takeDamage(dragonDmg, this.particles, 'FINISHER');
          this.particles.createFloatingText(this.bossMonster.x + this.bossMonster.width / 2, this.bossMonster.y - 20, `🐉 +${dragonDmg}`, '#fde047', 16);
        }
      }
    }

    const attackHitbox = this.player.getAttackHitbox();
    if (attackHitbox) {
      // Hit Boss Monster
      if (this.bossMonster && this.bossMonster.isAlive && !this.hitEnemiesThisAttack.has(this.bossMonster as unknown as ForestGoblin) && this.bossMonster.intersects(attackHitbox)) {
        this.hitEnemiesThisAttack.add(this.bossMonster as unknown as ForestGoblin);

        const comboMult = this.player.currentComboMultiplier || 1.0;
        const comboBonus = this.getComboDamageBonus();
        const damage = Math.round(this.player.stats.attackDamage * comboMult * comboBonus);

        this.bossMonster.takeDamage(damage, this.particles, this.player.attackType);
        this.registerComboHit(this.bossMonster.x + this.bossMonster.width / 2, this.bossMonster.y);

        if (this.player.attackType === 'KICK') {
          const bossContactX = this.player.facingRight
            ? Math.min(this.bossMonster.x + 12, this.player.x + this.player.width + 50)
            : Math.max(this.bossMonster.x + this.bossMonster.width - 12, this.player.x - 50);
          const bossContactY = this.bossMonster.y + this.bossMonster.height * 0.4;
          this.particles.createKickImpact(bossContactX, bossContactY, this.player.facingRight);
        }

        this.hitStopTimer = 0.06; // 60ms Boss hit stop
        this.camera.addShake(0.15, 6);
        this.onImpactCallback?.('BOSS');

        // Apply weapon stance effects
        const effect = this.player.equippedWeapon.specialEffect;
        if (effect === 'ICE_SLOW') {
          this.bossMonster.slowTimer = 1.8;
        } else if (effect === 'FLAME_BURN') {
          this.bossMonster.burnTimer = 1.5;
        }

        // On Boss Death
        if (!this.bossMonster.isAlive) {
          SaveSystem.recordEnemyDefeated(true);
          const bossBonusCoins = [0, 50, 75, 100, 150, 200, 300][this.bossMonster.worldId] || 100;
          const coinCount = Math.min(15, Math.ceil(bossBonusCoins / 10));
          const perCoinVal = Math.ceil(bossBonusCoins / coinCount);

          for (let c = 0; c < coinCount; c++) {
            const coinObj = new Coin(
              this.bossMonster.x + Math.random() * 80 - 40,
              this.bossMonster.y - Math.random() * 40,
              perCoinVal
            );
            coinObj.vy = -4.5 - Math.random() * 3.5;
            coinObj.vx = Math.random() * 6 - 3;
            this.coins.push(coinObj);
          }

          const bossCenterX = this.bossMonster.x + this.bossMonster.width / 2;
          const bossCenterY = this.bossMonster.y + this.bossMonster.height / 2;
          this.camera.addShake(0.5, 14);
          this.particles.createBossDefeatExplosion(bossCenterX, bossCenterY);
          this.particles.createFloatingText(
            bossCenterX,
            bossCenterY - 36,
            `👑 BOSS DEFEATED! +${bossBonusCoins} COINS!`,
            '#facc15',
            24
          );
          audioEngine.playVictory();
        }
      }

      // Hit Normal Goblins
      for (const goblin of this.goblins) {
        if (goblin.isAlive && !this.hitEnemiesThisAttack.has(goblin) && goblin.intersects(attackHitbox)) {
          this.hitEnemiesThisAttack.add(goblin);

          const comboMult = this.player.currentComboMultiplier || 1.0;
          const comboBonus = this.getComboDamageBonus();
          const buffMult = this.player.attackBuffTimer > 0 ? 1.5 : 1.0;
          const damage = Math.round(this.player.stats.attackDamage * comboMult * comboBonus * buffMult);

          const isBlocked = goblin.takeDamage(damage, this.particles, this.player.attackType);
          this.registerComboHit(goblin.x + goblin.width / 2, goblin.y);

          let impactX = goblin.x + goblin.width / 2;
          let impactY = goblin.y + goblin.height / 2 - 10;

          if (this.player.attackType === 'KICK') {
            impactX = this.player.facingRight
              ? Math.min(goblin.x + 6, this.player.x + this.player.width + 48)
              : Math.max(goblin.x + goblin.width - 6, this.player.x - 48);
            impactY = goblin.y + goblin.height * 0.35;
          }

          if (isBlocked) {
            // Blocked Attack Feedback
            this.hitStopTimer = 0.03; // Short block hit-stop
            this.camera.addShake(0.06, 2.0);
            this.particles.createCombatImpact(impactX, impactY, this.player.facingRight, ['#f59e0b', '#94a3b8', '#ffffff']);
            this.particles.createFloatingText(impactX, goblin.y - 10, 'BLOCKED!', '#facc15', 14);
            audioEngine.playHitImpact('enemy', 'JAB');
            goblin.vx = this.player.facingRight ? 3.0 : -3.0;
          } else {
            // Successful Hit Feedback
            if (this.player.attackType === 'KICK') {
              this.particles.createKickImpact(impactX, impactY, this.player.facingRight);
            } else {
              this.particles.createCombatImpact(impactX, impactY, this.player.facingRight, this.player.equippedWeapon.sparkColors);
            }

            let labelText = 'JAB!';
            let labelColor = '#fef08a';

            if (this.player.attackType === 'CROSS') {
              labelText = 'CROSS!';
              labelColor = '#fbbf24';
              this.hitStopTimer = 0.05;
              this.camera.addShake(0.08, 3.8);
              goblin.vx = this.player.facingRight ? 5.5 : -5.5;
              goblin.vy = -2.2;
              this.onImpactCallback?.('LIGHT');
            } else if (this.player.attackType === 'KICK') {
              labelText = 'ROUNDHOUSE!';
              labelColor = '#f97316';
              this.hitStopTimer = 0.08;
              this.camera.addShake(0.12, 6.5);
              goblin.vx = this.player.facingRight ? 9.0 : -9.0;
              goblin.vy = -4.5;
              this.onImpactCallback?.('HEAVY');
            } else if (this.player.attackType === 'FINISHER') {
              labelText = 'FINISHER! 💥';
              labelColor = '#ef4444';
              this.hitStopTimer = 0.09;
              this.camera.addShake(0.14, 7.5);
              goblin.vx = this.player.facingRight ? 9.5 : -9.5;
              goblin.vy = -4.8;
              this.onImpactCallback?.('HEAVY');
            } else if (this.player.attackType === 'SPIN_KICK') {
              labelText = 'SWEEP KICK! 🌀';
              labelColor = '#06b6d4';
              this.hitStopTimer = 0.08;
              this.camera.addShake(0.12, 6.0);
              goblin.vx = (goblin.x > this.player.x) ? 8.0 : -8.0;
              goblin.vy = -4.5;
              this.onImpactCallback?.('HEAVY');
            } else if (this.player.attackType === 'JUMP_KICK') {
              labelText = 'FLYING KICK!';
              labelColor = '#38bdf8';
              this.hitStopTimer = 0.07;
              this.camera.addShake(0.10, 5.0);
              goblin.vx = this.player.facingRight ? 7.0 : -7.0;
              goblin.vy = -2.8;
              this.onImpactCallback?.('HEAVY');
            } else {
              // Lead Jab
              this.hitStopTimer = 0.04;
              this.camera.addShake(0.07, 3.2);
              goblin.vx = this.player.facingRight ? 4.5 : -4.5;
              goblin.vy = -2.0;
              this.onImpactCallback?.('LIGHT');
            }

            this.particles.createFloatingText(impactX, goblin.y - 12, labelText, labelColor, 15);
            audioEngine.playHitImpact('enemy', this.player.attackType);
          }

          // Apply stance special effects
          const effect = this.player.equippedWeapon.specialEffect;
          if (effect === 'ICE_SLOW') {
            goblin.slowTimer = 2.0;
            this.particles.createFloatingText(goblin.x + goblin.width / 2, goblin.y - 20, 'FROST!', '#38bdf8', 12);
          } else if (effect === 'FLAME_BURN') {
            goblin.burnTimer = 1.6;
            this.particles.createFloatingText(goblin.x + goblin.width / 2, goblin.y - 20, 'BURN!', '#f97316', 12);
          } else if (effect === 'SHADOW_CRIT') {
            if (Math.random() < 0.35) {
              goblin.takeDamage(22, this.particles, this.player.attackType);
              this.particles.createFloatingText(goblin.x + goblin.width / 2, goblin.y - 20, 'CRIT!', '#c084fc', 13);
            }
          } else if (effect === 'GOLDEN_RADIANCE') {
            this.particles.createFloatingText(goblin.x + goblin.width / 2, goblin.y - 20, 'RADIANT!', '#facc15', 12);
          } else if (effect === 'CELESTIAL_BURST') {
            this.particles.createFloatingText(goblin.x + goblin.width / 2, goblin.y - 20, 'CELESTIAL!', '#f43f5e', 14);
          }
        }
      }

      // Check player attacks breaking BREAKABLE_WALL tiles
      const hitCol = Math.floor((attackHitbox.x + attackHitbox.width / 2) / this.tileMap.tileSize);
      const hitRow = Math.floor((attackHitbox.y + attackHitbox.height / 2) / this.tileMap.tileSize);
      for (let r = hitRow - 1; r <= hitRow + 1; r++) {
        for (let c = hitCol - 1; c <= hitCol + 1; c++) {
          if (r >= 0 && r < this.tileMap.rows && c >= 0 && c < this.tileMap.cols) {
            if (this.tileMap.grid[r][c] === TileType.BREAKABLE_WALL) {
              const tileRect = { x: c * 32, y: r * 32, width: 32, height: 32 };
              if (
                attackHitbox.x + attackHitbox.width >= tileRect.x &&
                attackHitbox.x <= tileRect.x + tileRect.width &&
                attackHitbox.y + attackHitbox.height >= tileRect.y &&
                attackHitbox.y <= tileRect.y + tileRect.height
              ) {
                // Shatter the breakable wall tile!
                this.tileMap.grid[r][c] = TileType.EMPTY;
                this.particles.createCombatImpact(tileRect.x + 16, tileRect.y + 16, true, ['#f59e0b', '#fbbf24', '#94a3b8']);
                this.camera.addShake(0.12, 5);
                audioEngine.playHitImpact('enemy', 'FINISHER');
              }
            }
          }
        }
      }
    }

    // Secret Room Manager Update & Discovery Trigger
    if (this.secretRoomManager) {
      this.secretRoomManager.update(
        dt,
        this.player,
        this.tileMap,
        this.particles,
        this.camera,
        (x: number, y: number, enemyClass: string, worldTheme: number) => {
          const elite = new ForestGoblin(x, y, 120, false, `${worldTheme}-1`);
          elite.enemyClass = enemyClass as EnemyClass;
          elite.maxHp = Math.round(elite.maxHp * 1.6);
          elite.hp = elite.maxHp;
          elite.attackDamage = Math.round(elite.attackDamage * 1.3);
          this.goblins.push(elite);
        }
      );

      if (this.levelState) {
        this.levelState.secretRoomsFound = this.secretRoomManager.discoveredCount;
        this.levelState.totalSecretRooms = this.secretRoomManager.totalRooms;
        this.levelState.defeatedEnemies = this.totalEnemiesDefeated;
        this.levelState.isAreaCleared = this.isAreaCleared;
      }
    }

    // 3. Update World Boss & Boss Projectiles
    if (this.bossMonster && this.bossMonster.isAlive) {
      this.bossMonster.update(dt, this.player, this.tileMap, this.particles, this.bossProjectiles);
    }

    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const proj = this.bossProjectiles[i];
      proj.update(dt, this.player, this.tileMap, this.particles);
      if (!proj.isAlive) {
        this.bossProjectiles.splice(i, 1);
      }
    }

    // 4. Checkpoint collision check
    for (const cp of this.checkpoints) {
      const activated = cp.update(dt, this.player, this.particles);
      if (activated) {
        this.activeSpawn = { x: cp.x, y: cp.y };
      }
    }

    // 5. Update Goblins, Death Registration & Cleanup
    for (let i = this.goblins.length - 1; i >= 0; i--) {
      const goblin = this.goblins[i];

      if (goblin.combatState === 'DEAD' || !goblin.isAlive) {
        if (!goblin.hasRegisteredDeath) {
          goblin.hasRegisteredDeath = true;
          SaveSystem.recordEnemyDefeated(goblin.isBoss);

          if (!goblin.isShadowClone) {
            this.totalEnemiesDefeated++;
            this.coins.push(new Coin(goblin.x, goblin.y, goblin.isBoss ? 20 : 2));

            this.particles.createFloatingText(
              goblin.x + goblin.width / 2,
              goblin.y - 18,
              `ENEMIES: ${this.totalEnemiesDefeated}/50 ⚔️`,
              '#ef4444',
              14
            );

            if (this.totalEnemiesDefeated >= 50 && !this.isAreaCleared) {
              this.isAreaCleared = true;
              this.areaClearedBannerTimer = 5.0;

              this.particles.createVictoryConfetti(this.player.x, this.player.y - 30);
              this.particles.createFloatingText(
                this.player.x,
                this.player.y - 50,
                'ALL 50 ENEMIES DEFEATED! EXIT PORTAL UNLOCKED!',
                '#22c55e',
                22
              );
              audioEngine.playVictory();
            }
          }

          if (goblin.isBoss) {
            const bossCenterX = goblin.x + goblin.width / 2;
            const bossCenterY = goblin.y + goblin.height / 2;
            this.camera.addShake(0.38, 11);
            this.particles.createBossDefeatExplosion(bossCenterX, bossCenterY);
            this.particles.createFloatingText(bossCenterX, bossCenterY - 24, 'BOSS DEFEATED! 👑', '#facc15', 20);
            audioEngine.playVictory();
          }
        }

        goblin.update(dt, this.player, this.tileMap, this.particles, this.bossProjectiles, this.goblins);

        if (!goblin.isAlive && goblin.deathTimer > 2.0) {
          this.goblins.splice(i, 1);
        }
      } else {
        const distToPlayer = Math.hypot(
          goblin.x + goblin.width / 2 - (this.player.x + this.player.width / 2),
          goblin.y + goblin.height / 2 - (this.player.y + this.player.height / 2)
        );

        if (distToPlayer < 750) {
          goblin.update(dt, this.player, this.tileMap, this.particles, this.bossProjectiles, this.goblins);
        }
      }
    }

    // 50-Enemy Level Clear Check
    if (!this.isAreaCleared && this.totalEnemiesDefeated >= 50) {
      this.isAreaCleared = true;
      this.areaClearedBannerTimer = 5.0;

      this.particles.createVictoryConfetti(this.player.x, this.player.y - 30);
      this.particles.createFloatingText(
        this.player.x,
        this.player.y - 50,
        'ALL 50 ENEMIES DEFEATED! EXIT PORTAL UNLOCKED!',
        '#22c55e',
        22
      );
      audioEngine.playVictory();
    }

    // 6. Update Collectibles
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      const collected = coin.update(dt, this.player, this.particles);
      if (collected) {
        this.collectedCoinsCount += coin.value;
        SaveSystem.recordCoinsCollected(coin.value);
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

    // 7. Check Goal Post (Level Complete)
    const goal = this.levelDef.goalPost;
    if (this.player.intersects(goal) && this.status === 'RUNNING') {
      if (this.isBossLevel && this.bossMonster && this.bossMonster.isAlive) {
        // Prevent completing level until Boss is defeated!
        this.player.vx = this.player.facingRight ? -7 : 7;
        this.particles.createFloatingText(goal.x, goal.y - 18, '🔒 PORTAL LOCKED — DEFEAT THE BOSS FIRST!', '#ef4444', 16);
      } else if (!this.isBossLevel && !this.isAreaCleared) {
        // Prevent completing level until all 50 enemies are defeated!
        this.player.vx = this.player.facingRight ? -7 : 7;
        this.particles.createFloatingText(
          goal.x,
          goal.y - 18,
          `🔒 PORTAL LOCKED — DEFEAT ALL 50 ENEMIES FIRST! (${this.totalEnemiesDefeated}/50)`,
          '#ef4444',
          15
        );
      } else {
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

    // 9. Update Weather System
    this.weather.update(dt, this.canvas.width, this.canvas.height, this.camera.getOffsetX(), this.camera.getOffsetY());

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

    // 3b. Secret Rooms Clues & Altar
    if (this.secretRoomManager) {
      this.secretRoomManager.render(this.ctx, offsetX, offsetY);
    }

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

    // World Boss
    if (this.bossMonster) {
      this.bossMonster.render(this.ctx, offsetX, offsetY);
    }

    // Boss Projectiles
    for (const proj of this.bossProjectiles) {
      proj.render(this.ctx, offsetX, offsetY);
    }

    // 8. Player (Blaze)
    this.player.render(this.ctx, offsetX, offsetY);

    // Render active COMBO indicator near player during combat
    this.renderPlayerComboIndicator(offsetX, offsetY);

    // 9. Particle FX
    this.particles.render(this.ctx, offsetX, offsetY);

    // 10. Weather System Atmospheric Effects
    this.weather.render(this.ctx, offsetX, offsetY);

    // Sand Blind Screen Vignette Overlay
    if (this.player.sandBlindTimer > 0) {
      this.ctx.fillStyle = 'rgba(217, 119, 6, 0.22)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 11. Wave & Encounter Status HUD Overlay
    this.renderWaveAndEncounterHud();
  }

  private renderWaveAndEncounterHud() {
    const ctx = this.ctx;
    const w = this.canvas.width;

    ctx.save();

    const boxW = 210;
    const boxH = 58;
    const bx = w - boxW - 16;
    const by = 12;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    ctx.strokeStyle = this.isAreaCleared ? '#22c55e' : '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (typeof (ctx as unknown as { roundRect?: Function }).roundRect === 'function') {
      (ctx as unknown as { roundRect: Function }).roundRect(bx, by, boxW, boxH, 8);
    } else {
      ctx.rect(bx, by, boxW, boxH);
    }
    ctx.fill();
    ctx.stroke();

    const secretsFound = this.secretRoomManager?.discoveredCount || 0;
    const secretsTotal = this.secretRoomManager?.totalRooms || 0;

    if (this.isAreaCleared || this.totalEnemiesDefeated >= 50) {
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ALL 50 ENEMIES DEFEATED!', bx + boxW / 2, by + 18);

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`🔓 EXIT PORTAL UNLOCKED | 50/50`, bx + boxW / 2, by + 34);

      ctx.fillStyle = secretsFound > 0 ? '#fde047' : '#94a3b8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`🔍 SECRET ROOMS: ${secretsFound}/${secretsTotal}`, bx + boxW / 2, by + 48);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`ENEMIES: ${this.totalEnemiesDefeated} / 50`, bx + boxW / 2, by + 18);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px monospace';
      ctx.fillText(`ACTIVE: ${this.activeEnemyCount} | REMAINING: ${Math.max(0, 50 - this.totalEnemiesDefeated)}`, bx + boxW / 2, by + 34);

      ctx.fillStyle = secretsFound > 0 ? '#fde047' : '#94a3b8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`🔍 SECRET ROOMS: ${secretsFound}/${secretsTotal}`, bx + boxW / 2, by + 48);
    }

    ctx.restore();
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
    const isLocked = this.isBossLevel && this.bossMonster && this.bossMonster.isAlive;

    // Wooden Flag Pole
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 4, py, 6, goal.height);

    if (isLocked) {
      // Locked Red Energy Gate
      const pulse = Math.sin(Date.now() / 150) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(239, 68, 68, ${0.4 * pulse})`;
      ctx.beginPath();
      ctx.ellipse(px + 7, py + goal.height / 2, 24, 38, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Red Warning Flag
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(px + 10, py + 4);
      ctx.lineTo(px + 36, py + 14);
      ctx.lineTo(px + 10, py + 26);
      ctx.closePath();
      ctx.fill();

      // Lock Emblem
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒', px + 7, py - 6);
    } else {
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
    }

    // Base Pedestal
    ctx.fillStyle = '#475569';
    ctx.fillRect(px - 4, py + goal.height - 8, 22, 8);
  }

  private renderPlayerComboIndicator(offsetX: number, offsetY: number) {
    if (this.comboHits < 2 || this.comboTimer <= 0) return;

    const ctx = this.ctx;
    const px = Math.round(this.player.x - offsetX);
    const py = Math.round(this.player.y - offsetY);

    const bx = px + this.player.width / 2;
    const by = py - 28;

    // Fade out in last 0.3s of timer
    const fadeAlpha = Math.min(1, this.comboTimer / 0.3);

    ctx.save();
    ctx.globalAlpha = fadeAlpha;

    const comboText = `COMBO x${this.comboHits}`;

    let bonusLabel = '';
    let accentColor = '#facc15'; // Gold
    let borderColor = '#a16207';

    if (this.comboHits >= 10) {
      bonusLabel = '+15% DMG';
      accentColor = '#ef4444'; // Red
      borderColor = '#991b1b';
    } else if (this.comboHits >= 6) {
      bonusLabel = '+10% DMG';
      accentColor = '#f97316'; // Orange
      borderColor = '#c2410c';
    } else if (this.comboHits >= 4) {
      bonusLabel = '+5% DMG';
      accentColor = '#38bdf8'; // Cyan
      borderColor = '#0369a1';
    }

    ctx.font = 'bold 11px sans-serif';
    const textW = ctx.measureText(comboText).width;
    const bonusW = bonusLabel ? ctx.measureText(bonusLabel).width + 8 : 0;
    const boxWidth = textW + bonusW + 16;
    const boxHeight = 18;
    const boxX = bx - boxWidth / 2;
    const boxY = by - boxHeight / 2;

    // Background capsule
    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 9);
    } else {
      ctx.rect(boxX, boxY, boxWidth, boxHeight);
    }
    ctx.fill();
    ctx.stroke();

    // Combo text
    ctx.fillStyle = accentColor;
    ctx.textAlign = 'left';
    ctx.fillText(comboText, boxX + 8, by + 4);

    // Bonus label
    if (bonusLabel) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(bonusLabel, boxX + boxWidth - 6, by + 4);
    }

    ctx.restore();
  }
}
