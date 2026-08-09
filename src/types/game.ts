export type GameScreen = 'MAIN_MENU' | 'LEVELS' | 'UPGRADES' | 'SETTINGS' | 'PLAYING';

export type GameStateStatus = 'RUNNING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export type PlayerActionState = 'IDLE' | 'WALK' | 'RUN' | 'JUMP' | 'FALL' | 'ATTACK' | 'HURT' | 'DEAD';

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
}

export interface SaveData {
  coins: number;
  currentWorld: number;
  currentLevel: number;
  completedLevels: string[]; // e.g. ['1-1']
  levelStars: Record<string, number>;
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
  };
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
}
