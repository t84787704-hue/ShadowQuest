import { LevelConfig } from '../../types/game';
import { TileType } from './TileMap';

export interface TutorialSign {
  x: number;
  y: number;
  title: string;
  subtitle: string;
}

export interface LevelDefinition {
  config: LevelConfig;
  grid: number[][];
  playerSpawn: { x: number; y: number };
  goalPost: { x: number; y: number; width: number; height: number };
  checkpoint?: { x: number; y: number };
  signs?: TutorialSign[];
  coins: { x: number; y: number; value?: number }[];
  healthPickups?: { x: number; y: number; healAmount?: number }[];
  goblins: { x: number; y: number; patrolRange?: number }[];
}

// Helper to construct Level 1-1 Green Forest Tile Grid (140 cols x 15 rows = 4480px)
function buildLevel1_1Grid(): number[][] {
  const cols = 140;
  const rows = 15;
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(TileType.EMPTY));

  // Base ground line setup (row 12, 13, 14) with strategic gap pits
  for (let c = 0; c < cols; c++) {
    // Gap 1: Section 2 Forest Path (cols 32..35)
    if (c >= 32 && c <= 35) continue;

    // Gap 2: Section 3 Forest Ruins Spike Pit (cols 66..70)
    if (c >= 66 && c <= 70) {
      grid[14][c] = TileType.DIRT_MIDDLE;
      grid[13][c] = TileType.HAZARD_SPIKES; // Spikes in pit
      continue;
    }

    // Gap 3: Section 4 Deep Forest Chasm (cols 102..107)
    if (c >= 102 && c <= 107) continue;

    grid[12][c] = TileType.GRASS_TOP;
    grid[13][c] = TileType.DIRT_MIDDLE;
    grid[14][c] = TileType.DIRT_MIDDLE;
  }

  // ==================== SECTION 1 — Forest Entrance (cols 0..28) ====================
  // Gentle introduction hill
  grid[11][12] = TileType.GRASS_TOP;
  grid[11][13] = TileType.GRASS_TOP;
  grid[11][14] = TileType.GRASS_TOP;
  grid[11][15] = TileType.GRASS_TOP;

  // Intro low platform
  for (let c = 20; c <= 24; c++) {
    grid[10][c] = TileType.WOOD_BRIDGE;
  }

  // ==================== SECTION 2 — Forest Path (cols 29..58) ====================
  // Pre-gap launch step
  grid[10][30] = TileType.STONE_PLATFORM;
  grid[10][31] = TileType.STONE_PLATFORM;

  // Low Wooden Bridge across Gap 1 (cols 32..35) - row 10 (easy jump from row 10/12)
  for (let c = 32; c <= 35; c++) {
    grid[10][c] = TileType.WOOD_BRIDGE;
  }

  // Stepping stones to mid platform
  grid[10][39] = TileType.STONE_PLATFORM;
  grid[10][40] = TileType.STONE_PLATFORM;

  // Mid Wooden Bridge (cols 41..45) at row 8 (reachable from row 10 platform!)
  for (let c = 41; c <= 45; c++) {
    grid[8][c] = TileType.WOOD_BRIDGE;
  }
  grid[10][46] = TileType.STONE_PLATFORM; // Step down

  // Forest Path Hill (cols 50..55)
  for (let c = 50; c <= 55; c++) {
    grid[11][c] = TileType.GRASS_TOP;
  }

  // ==================== SECTION 3 — Forest Ruins (cols 59..88) ====================
  // Ancient Stone Ruins & Pillars
  grid[10][60] = TileType.STONE_PLATFORM;
  grid[10][61] = TileType.STONE_PLATFORM;

  for (let r = 9; r <= 11; r++) {
    grid[r][62] = TileType.STONE_PLATFORM;
    grid[r][65] = TileType.STONE_PLATFORM;
  }
  for (let c = 62; c <= 65; c++) {
    grid[8][c] = TileType.STONE_PLATFORM; // Reachable from row 10 stone step
  }

  // Ruin Platform above Spike Pit (cols 67..70) at row 9
  for (let c = 67; c <= 70; c++) {
    grid[9][c] = TileType.STONE_PLATFORM;
  }

  // Secret Coin Tower Staircase (cols 73..79)
  grid[10][73] = TileType.STONE_PLATFORM; // Step 1 (row 10)
  for (let c = 74; c <= 75; c++) {
    grid[8][c] = TileType.STONE_PLATFORM; // Step 2 (row 8)
  }
  for (let c = 76; c <= 79; c++) {
    grid[6][c] = TileType.STONE_PLATFORM; // Secret Top (row 6) - reachable from row 8 step!
  }

  // ==================== SECTION 4 — Deep Forest (cols 89..118) ====================
  // Checkpoint Pedestal at Col 91 (row 11)
  grid[11][91] = TileType.STONE_PLATFORM;

  // Stepping Stone Platforms across Chasm (cols 102..107)
  grid[10][101] = TileType.STONE_PLATFORM;
  grid[10][103] = TileType.STONE_PLATFORM;
  grid[9][105] = TileType.STONE_PLATFORM;
  grid[10][107] = TileType.STONE_PLATFORM;

  // Deep Forest High Branch Platform (cols 111..116)
  grid[10][109] = TileType.WOOD_BRIDGE;
  grid[10][110] = TileType.WOOD_BRIDGE;
  for (let c = 111; c <= 116; c++) {
    grid[8][c] = TileType.WOOD_BRIDGE; // Reachable from row 10 bridge step!
  }
  grid[10][117] = TileType.WOOD_BRIDGE;

  // ==================== SECTION 5 — Level Exit (cols 119..140) ====================
  // Victory Staircase
  for (let c = 124; c <= 126; c++) {
    grid[11][c] = TileType.STONE_PLATFORM;
  }
  for (let c = 127; c <= 129; c++) {
    grid[10][c] = TileType.STONE_PLATFORM;
  }
  for (let c = 130; c <= 132; c++) {
    grid[9][c] = TileType.STONE_PLATFORM;
  }

  // Goal Post Pedestal (col 135)
  grid[11][135] = TileType.STONE_PLATFORM;

  return grid;
}

export const LEVEL_1_1: LevelDefinition = {
  config: {
    id: '1-1',
    worldId: 1,
    levelNum: 1,
    title: '1-1 GREEN FOREST',
    worldName: 'WORLD 1 — GREEN VALLEY',
    width: 140 * 32, // 4480px
    height: 15 * 32, // 480px
    unlocked: true,
    completed: false,
    stars: 0,
    highScoreCoins: 0,
  },
  grid: buildLevel1_1Grid(),
  playerSpawn: { x: 80, y: 320 },
  checkpoint: { x: 91 * 32, y: 11 * 32 - 48 }, // Deep Forest Checkpoint (x: 2912, y: 304)
  goalPost: { x: 135 * 32 + 4, y: 11 * 32 - 48, width: 24, height: 48 },
  signs: [],
  healthPickups: [
    { x: 1480, y: 310, healAmount: 30 }, // Mid forest path healing heart
    { x: 3120, y: 310, healAmount: 30 }, // Deep forest healing heart
  ],
  coins: [
    // Section 1 — Forest Entrance
    { x: 180, y: 330 },
    { x: 220, y: 330 },
    { x: 400, y: 300 },
    { x: 440, y: 300 },
    { x: 680, y: 270 }, // On intro wood bridge
    { x: 720, y: 270 },
    { x: 760, y: 330 },

    // Section 2 — Forest Path
    { x: 1040, y: 270 }, // On bridge
    { x: 1080, y: 270 },
    { x: 1320, y: 200 }, // On high wood bridge
    { x: 1360, y: 200 },
    { x: 1400, y: 200 },
    { x: 1620, y: 300 },
    { x: 1660, y: 300 },

    // Section 3 — Forest Ruins
    { x: 2000, y: 200 }, // On ruin platform
    { x: 2040, y: 200 },
    { x: 2180, y: 230 }, // On spike pit bridge
    { x: 2220, y: 230 },
    // Secret Stash Top
    { x: 2440, y: 140, value: 5 },
    { x: 2480, y: 140, value: 5 },
    { x: 2520, y: 140, value: 5 },

    // Section 4 — Deep Forest
    { x: 3000, y: 330 },
    { x: 3040, y: 330 },
    { x: 3300, y: 270 }, // Across chasm stepping stones
    { x: 3360, y: 240 },
    { x: 3580, y: 200 }, // On high branch
    { x: 3640, y: 200 },

    // Section 5 — Level Exit
    { x: 4000, y: 330 },
    { x: 4050, y: 330 },
    { x: 4100, y: 290 }, // On victory stairs
    { x: 4140, y: 260 },
    { x: 4180, y: 230 },
    { x: 4250, y: 330 },
  ],
  goblins: [
    // Section 1
    { x: 820, y: 320, patrolRange: 80 },

    // Section 2
    { x: 1340, y: 200, patrolRange: 80 },
    { x: 1640, y: 320, patrolRange: 100 },

    // Section 3
    { x: 2020, y: 200, patrolRange: 70 },
    { x: 2500, y: 320, patrolRange: 120 },

    // Section 4
    { x: 3080, y: 320, patrolRange: 110 },
    { x: 3600, y: 200, patrolRange: 80 },

    // Section 5
    { x: 4020, y: 320, patrolRange: 120 },
    { x: 4180, y: 320, patrolRange: 100 },
  ],
};

export const ALL_LEVELS_METADATA: LevelConfig[] = [
  LEVEL_1_1.config,
  {
    id: '1-2',
    worldId: 1,
    levelNum: 2,
    title: '1-2 ANCIENT RUINS',
    worldName: 'WORLD 1 — GREEN VALLEY',
    width: 2800,
    height: 480,
    unlocked: false,
    completed: false,
    stars: 0,
    highScoreCoins: 0,
  },
  {
    id: '1-3',
    worldId: 1,
    levelNum: 3,
    title: '1-3 EMERALD CAVERN',
    worldName: 'WORLD 1 — GREEN VALLEY',
    width: 3000,
    height: 480,
    unlocked: false,
    completed: false,
    stars: 0,
    highScoreCoins: 0,
  },
  {
    id: '1-4',
    worldId: 1,
    levelNum: 4,
    title: '1-4 MISTY PEAKS',
    worldName: 'WORLD 1 — GREEN VALLEY',
    width: 3200,
    height: 480,
    unlocked: false,
    completed: false,
    stars: 0,
    highScoreCoins: 0,
  },
  {
    id: '1-5',
    worldId: 1,
    levelNum: 5,
    title: '1-5 GOBLIN KING CHIEF',
    worldName: 'WORLD 1 — GREEN VALLEY (BOSS)',
    width: 2400,
    height: 480,
    unlocked: false,
    completed: false,
    stars: 0,
    highScoreCoins: 0,
  },
];

export const WORLD_NAMES: Record<number, string> = {
  1: 'WORLD 1 — GREEN VALLEY',
  2: 'WORLD 2 — MAGMA CAVERNS',
  3: 'WORLD 3 — FROZEN MOUNTAINS',
  4: 'WORLD 4 — SHADOW FORTRESS',
  5: 'WORLD 5 — SKY KINGDOM',
  6: 'WORLD 6 — DRAGON LAIR',
};
