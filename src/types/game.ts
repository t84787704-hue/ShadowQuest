export type GameScreen = 'MAIN_MENU' | 'STORY' | 'WORLD_MAP' | 'LEVELS' | 'UPGRADES' | 'SETTINGS' | 'ACHIEVEMENTS' | 'PLAYING';

export type GameStateStatus = 'RUNNING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export type PlayerActionState = 'IDLE' | 'WALK' | 'RUN' | 'JUMP' | 'FALL' | 'ATTACK' | 'CROUCH' | 'HURT' | 'DEAD';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlayerStats {
  maxHp: number;
  currentHp: number;
  attackDamage: number;
  moveSpeed: number;
  jumpForce: number;
  attackCooldownMs: number;
}

export interface UpgradeLevel {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: number;
  icon: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'COMBAT' | 'PROGRESS' | 'COLLECTION' | 'MASTERY';
  targetValue: number;
  rewardCoins: number;
  getCurrentValue: (saveData: SaveData) => number;
}

export type ArenaType =
  | 'FLAT_COURTYARD'
  | 'MULTI_PLATFORM'
  | 'NARROW_BRIDGE'
  | 'VERTICAL_TOWER'
  | 'FLOATING_ISLANDS'
  | 'BOUNCE_CANVAS'
  | 'CHASM_COLISEUM'
  | 'CONVEYOR_FACTORY'
  | 'SLIPPERY_SLOPE'
  | 'ELEMENTAL_HAZARD'
  | 'DESTRUCTIBLE_RING'
  | 'ELEVATED_MESA'
  | 'TRAMPOLINE_ARENA'
  | 'WINDY_SUMMIT'
  | 'GRAVITY_WELL'
  | 'SPIKE_PIT_BRIDGES'
  | 'SHIELDED_COVER_PILLARS'
  | 'LAVA_ISLANDS'
  | 'BOULDER_RUN'
  | 'BOSS_CIRCULAR_ARENA';

export type ArenaMechanic =
  | 'ELEVATED_LEDGES'
  | 'NARROW_BRIDGES'
  | 'BOUNCE_PADS'
  | 'SLIPPERY_ICE'
  | 'CONVEYOR_BELTS'
  | 'SHIELDING_PILLARS'
  | 'HAZARD_SPIKES'
  | 'DESTRUCTIBLE_BRICKS'
  | 'WIND_GUSTS'
  | 'LOW_GRAVITY'
  | 'LAVA_PITS'
  | 'FIRE_JETS'
  | 'TRAP_TILES'
  | 'MOVING_PLATFORMS'
  | 'CHASM_PITS';

export interface ArenaConfig {
  arenaType: ArenaType;
  arenaLayout: string;
  arenaMechanic: ArenaMechanic;
  arenaAdvantage: string;
  enemyPowerSynergy: string;
  hazards: string[];
  platforms: string;
  environmentEffects: string;
}

export interface LevelConfig {
  id: string;
  worldId: number;
  levelNum: number;
  title: string;
  worldName: string;
  width: number;
  height: number;
  unlocked: boolean;
  completed: boolean;
  stars: number;
  highScoreCoins: number;
  isBossLevel?: boolean;
  arenaConfig?: ArenaConfig;
}

export interface LevelState {
  levelId: string;
  isAreaCleared: boolean;
  totalEnemies: number;
  defeatedEnemies: number;
  secretRoomsFound: number;
  totalSecretRooms: number;
  secretRooms?: SecretRoomDef[];
}

export interface QuickSaveData {
  levelId: string;
  playerX: number;
  playerY: number;
  playerHp: number;
  collectedCoinsCount: number;
  startingCoins: number;
  collectedCoinIndices?: number[];
  collectedHealthIndices?: number[];
  defeatedEnemyIndices?: number[];
  activeCheckpointIndex?: number;
  bossHp?: number;
  bossPhase?: number;
  timestamp: number;
}

export type SecretRoomEntranceType = 'BREAKABLE_WALL' | 'FAKE_WALL' | 'HIDDEN_PASSAGE' | 'PLATFORM_ROUTE';
export type SecretRoomRewardType = 'COIN_CACHE' | 'HP_PERMANENT' | 'ATTACK_UPGRADE' | 'ANCIENT_RELIC' | 'RARE_WEAPON';
export type SecretRoomChallengeType = 'ELITE_COMBAT' | 'HAZARD_PLATFORM' | 'TREASURE_ONLY';

export interface SecretRoomDef {
  id: number; // 0 or 1 per level
  title: string;
  worldTheme: number; // 1 to 6
  x: number; // Room bounds X (col * 32)
  y: number; // Room bounds Y (row * 32)
  width: number; // Room width in px
  height: number; // Room height in px
  entranceX: number; // Entrance tile X
  entranceY: number; // Entrance tile Y
  entranceWidth: number; // Entrance width (e.g. 32)
  entranceHeight: number; // Entrance height (e.g. 64)
  entranceType: SecretRoomEntranceType;
  rewardType: SecretRoomRewardType;
  rewardX: number;
  rewardY: number;
  challengeType: SecretRoomChallengeType;
  eliteEnemyX?: number;
  eliteEnemyY?: number;
  eliteEnemyClass?: 'MARTIAL_ARTIST' | 'FAST_FIGHTER' | 'HEAVY_FIGHTER' | 'ELITE_FIGHTER';
  discovered?: boolean;
  rewardClaimed?: boolean;
}

export interface SaveDataStats {
  enemiesDefeated: number;
  bossesDefeated: number;
  coinsCollectedLifetime: number;
  upgradesPurchased: number;
  secretRoomsDiscoveredLifetime?: number;
}

export interface SaveData {
  coins: number;
  currentWorld: number;
  currentLevel: number;
  completedLevels: string[]; // e.g. ['1-1', '1-2']
  unlockedWorlds: number[]; // e.g. [1, 2]
  hasSeenStory: boolean;
  levelStars: Record<string, number>;
  equippedWeaponId?: string;
  quickSave?: QuickSaveData | null;
  stats: SaveDataStats;
  claimedAchievements: string[]; // list of achievement IDs whose coin rewards have been claimed
  discoveredSecretRooms?: Record<string, number[]>; // levelId -> secret room IDs discovered [0, 1]
  gameCompleted?: boolean;
  legendaryTitleUnlocked?: boolean;
  legendaryAuraUnlocked?: boolean;
  legendaryAbilityUnlocked?: boolean;
  newGamePlusUnlocked?: boolean;
  newGamePlusLevel?: number;
  statBonuses?: {
    maxHpBonus: number;
    attackBonus: number;
    speedBonus: number;
  };
  upgrades: {
    maxHealth: number; // level 0-5
    attackPower: number;
    coinMagnet: number;
    moveSpeed: number;
  };
  settings: {
    soundFxEnabled: boolean;
    musicEnabled: boolean;
    touchControlsOpacity: number;
    musicVolume?: number;
    sfxVolume?: number;
  };
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  kick: boolean;
  down: boolean;
  spinKick: boolean;
}

