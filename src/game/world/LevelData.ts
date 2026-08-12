import { LevelConfig, SecretRoomDef } from '../../types/game';
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
  checkpoints?: { x: number; y: number }[];
  signs?: TutorialSign[];
  coins: { x: number; y: number; value?: number }[];
  healthPickups?: { x: number; y: number; healAmount?: number }[];
  goblins: { x: number; y: number; patrolRange?: number; isBoss?: boolean }[];
  secretRooms?: SecretRoomDef[];
}

export const WORLD_NAMES: Record<number, string> = {
  1: 'WORLD 1 — GREEN VALLEY',
  2: 'WORLD 2 — ANCIENT DESERT',
  3: 'WORLD 3 — FROZEN MOUNTAIN',
  4: 'WORLD 4 — VOLCANIC CORE',
  5: 'WORLD 5 — SHADOW REALM',
  6: "WORLD 6 — GOBLIN KING'S CITADEL",
};

const WORLD_TITLES: Record<number, string[]> = {
  1: ['Green Forest', 'Forest Ruins', 'River Valley', 'Misty Peaks', 'Mountain Fortress'],
  2: ['Desert Oasis', 'Ancient Ruins', 'Dusty Canyon', 'Sandstorm Pass', 'Desert Citadel'],
  3: ['Snowy Woods', 'Frozen Lake', 'Ice Caverns', 'Blizzard Summit', 'Frost Citadel'],
  4: ['Ash Wasteland', 'Lava Caverns', 'Burning Ridge', 'Magma Fortress', 'Volcanic Citadel'],
  5: ['Haunted Woods', 'Shadow Ruins', 'Dark Pass', 'Obsidian Tower', 'Shadow Citadel'],
  6: ['Citadel Gates', 'Outer Ramparts', 'Inner Keep', 'Royal Chambers', 'Goblin King Throne'],
};

// Seedable pseudo-random generator
function makeRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function getLevelCols(worldId: number, levelNum: number): number {
  if (worldId === 1 && levelNum === 1) return 220; // Level 1-1 (7,040px)
  const isBoss = levelNum === 5;
  if (worldId === 6 && isBoss) return 560; // Level 30 Final Boss Finale (17,920px)

  const baseCols = 200 + (worldId - 1) * 50 + (levelNum - 1) * 12;
  return isBoss ? baseCols + 35 : baseCols;
}

export function getLevelWidth(worldId: number, levelNum: number): number {
  return getLevelCols(worldId, levelNum) * 32;
}

export function getLevelsForWorld(worldId: number): LevelConfig[] {
  const titles = WORLD_TITLES[worldId] || WORLD_TITLES[1];
  const wName = WORLD_NAMES[worldId] || `WORLD ${worldId}`;

  return [1, 2, 3, 4, 5].map((lvlNum) => {
    const isBoss = lvlNum === 5;
    const title = `${worldId}-${lvlNum} ${titles[lvlNum - 1].toUpperCase()}`;
    const width = getLevelWidth(worldId, lvlNum);
    return {
      id: `${worldId}-${lvlNum}`,
      worldId,
      levelNum: lvlNum,
      title,
      worldName: isBoss ? `${wName} (BOSS)` : wName,
      width,
      height: 480,
      unlocked: worldId === 1 && lvlNum === 1,
      completed: false,
      stars: 0,
      highScoreCoins: 0,
      isBossLevel: isBoss,
    };
  });
}

export const ALL_LEVELS_METADATA: LevelConfig[] = [1, 2, 3, 4, 5, 6].flatMap((w) =>
  getLevelsForWorld(w)
);

export function getLevelDefinition(levelId: string): LevelDefinition {
  const [wStr, lStr] = levelId.split('-');
  const w = parseInt(wStr, 10) || 1;
  const l = parseInt(lStr, 10) || 1;

  const isBoss = l === 5;
  const isFinalLevel = w === 6 && isBoss; // Level 30
  const cols = getLevelCols(w, l);
  const rows = 18;

  const wName = WORLD_NAMES[w] || `WORLD ${w}`;
  const titles = WORLD_TITLES[w] || WORLD_TITLES[1];
  const title = `${w}-${l} ${titles[l - 1].toUpperCase()}`;

  const rng = makeRandom(w * 1000 + l * 47 + 1337);

  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(TileType.EMPTY));

  // Base ground baseline setup (row 12 ground, rows 13-17 dirt layer)
  for (let c = 0; c < cols; c++) {
    grid[12][c] = TileType.GRASS_TOP;
    for (let r = 13; r < rows; r++) {
      grid[r][c] = TileType.DIRT_MIDDLE;
    }
  }

  const coins: { x: number; y: number; value?: number }[] = [];
  const goblins: { x: number; y: number; patrolRange?: number; isBoss?: boolean }[] = [];
  const healthPickups: { x: number; y: number; healAmount?: number }[] = [];
  const checkpoints: { x: number; y: number }[] = [];
  const signs: TutorialSign[] = [];

  // Tutorial Signs for Level 1-1
  if (w === 1 && l === 1) {
    signs.push(
      { x: 120, y: 310, title: 'CONTROLS', subtitle: 'Use A/D or Arrow keys to move, Space/W to Jump!' },
      { x: 500, y: 310, title: 'COMBAT', subtitle: 'Press J or Attack button to slash goblins with your sword!' },
      { x: 1000, y: 310, title: 'JUMPING', subtitle: 'Hold Jump for higher leaps over gaps and spike pits!' },
      { x: 1800, y: 310, title: 'CHECKPOINTS', subtitle: 'Touch green crystal shrines to save your respawn point!' }
    );
  }

  // 1. Reserve Safe Spawn Zone (cols 0..16)
  for (let c = 0; c <= 16; c++) {
    grid[12][c] = TileType.GRASS_TOP;
    grid[13][c] = TileType.DIRT_MIDDLE;
    grid[14][c] = TileType.DIRT_MIDDLE;
  }

  // Initial coins in spawn zone
  for (let c = 5; c <= 14; c += 3) {
    coins.push({ x: c * 32, y: 320 });
  }

  // Define section limits
  const bodyEnd = isBoss ? cols - 50 : cols - 24;

  // Track gap/feature placement
  let c = 18;
  let nextCheckpointCol = 120;

  while (c < bodyEnd) {
    // Checkpoint Placement every ~120-140 columns
    if (c >= nextCheckpointCol && c < bodyEnd - 20) {
      grid[12][c] = TileType.STONE_PLATFORM;
      grid[12][c + 1] = TileType.STONE_PLATFORM;
      grid[12][c + 2] = TileType.STONE_PLATFORM;

      checkpoints.push({ x: (c + 1) * 32, y: 11 * 32 - 16 });
      healthPickups.push({ x: (c + 3) * 32, y: 310, healAmount: 30 });
      coins.push({ x: (c + 1) * 32, y: 260, value: 3 });

      nextCheckpointCol += 130 + Math.floor(rng() * 30);
      c += 8;
      continue;
    }

    const patternType = Math.floor(rng() * 6);

    switch (patternType) {
      case 0: {
        // Wood Bridge over Ground Gap
        const gapWidth = 3 + Math.floor(rng() * 3); // 3..5 tiles
        for (let gc = c; gc < c + gapWidth; gc++) {
          if (w >= 3 && rng() > 0.5) {
            grid[14][gc] = TileType.DIRT_MIDDLE;
            grid[13][gc] = TileType.HAZARD_SPIKES;
          } else {
            grid[12][gc] = TileType.EMPTY;
            grid[13][gc] = TileType.EMPTY;
            grid[14][gc] = TileType.EMPTY;
          }
        }
        // Elevated Bridge overhead
        const bridgeRow = 8 + Math.floor(rng() * 2); // row 8 or 9
        for (let bc = c - 1; bc <= c + gapWidth; bc++) {
          grid[bridgeRow][bc] = TileType.WOOD_BRIDGE;
          coins.push({ x: bc * 32, y: (bridgeRow - 1) * 32 });
        }
        // Group encounter: 3 goblins around bridge
        goblins.push({ x: (c - 2) * 32, y: 320, patrolRange: 60 });
        goblins.push({ x: (c + Math.floor(gapWidth / 2)) * 32, y: (bridgeRow - 1) * 32, patrolRange: 60 });
        goblins.push({ x: (c + gapWidth + 2) * 32, y: 320, patrolRange: 60 });
        c += gapWidth + 5;
        break;
      }

      case 1: {
        // Ancient Stone Ruins & Pillars
        const ruinLen = 7 + Math.floor(rng() * 4);
        for (let r = 9; r <= 11; r++) {
          grid[r][c] = TileType.STONE_PLATFORM;
          grid[r][c + ruinLen - 1] = TileType.STONE_PLATFORM;
        }
        for (let rc = c; rc < c + ruinLen; rc++) {
          grid[8][rc] = TileType.STONE_PLATFORM;
          coins.push({ x: rc * 32, y: 7 * 32 });
        }
        // Group encounter: 3-4 goblins at ruins
        goblins.push({ x: (c - 1) * 32, y: 320, patrolRange: 60 });
        goblins.push({ x: (c + 2) * 32, y: 7 * 32, patrolRange: 80 });
        goblins.push({ x: (c + ruinLen - 2) * 32, y: 7 * 32, patrolRange: 80 });
        goblins.push({ x: (c + ruinLen + 1) * 32, y: 320, patrolRange: 60 });
        c += ruinLen + 4;
        break;
      }

      case 2: {
        // Spike Pit with Stepping Stones
        const pitLen = 5 + Math.floor(rng() * 3);
        for (let pc = c; pc < c + pitLen; pc++) {
          grid[14][pc] = TileType.DIRT_MIDDLE;
          grid[13][pc] = TileType.HAZARD_SPIKES;
          grid[12][pc] = TileType.EMPTY;
        }
        // Stepping stone platforms
        grid[10][c + 1] = TileType.STONE_PLATFORM;
        grid[9][c + 3] = TileType.STONE_PLATFORM;
        grid[10][c + pitLen - 2] = TileType.STONE_PLATFORM;

        coins.push({ x: (c + 1) * 32, y: 9 * 32 });
        coins.push({ x: (c + 3) * 32, y: 8 * 32, value: 3 });
        coins.push({ x: (c + pitLen - 2) * 32, y: 9 * 32 });

        // Group encounter: 3 goblins around pit
        goblins.push({ x: (c - 2) * 32, y: 320, patrolRange: 60 });
        goblins.push({ x: (c + pitLen + 1) * 32, y: 320, patrolRange: 60 });
        goblins.push({ x: (c + pitLen + 4) * 32, y: 320, patrolRange: 60 });

        c += pitLen + 5;
        break;
      }

      case 3: {
        // Secret High Treasure Tower
        grid[10][c] = TileType.STONE_PLATFORM;
        grid[8][c + 2] = TileType.STONE_PLATFORM;
        grid[6][c + 4] = TileType.STONE_PLATFORM;
        grid[6][c + 5] = TileType.STONE_PLATFORM;
        grid[6][c + 6] = TileType.STONE_PLATFORM;

        coins.push({ x: (c + 4) * 32, y: 5 * 32, value: 5 });
        coins.push({ x: (c + 5) * 32, y: 5 * 32, value: 5 });
        coins.push({ x: (c + 6) * 32, y: 5 * 32, value: 5 });

        // Group encounter: 3 goblins guarding tower ground
        goblins.push({ x: c * 32, y: 320, patrolRange: 60 });
        goblins.push({ x: (c + 3) * 32, y: 320, patrolRange: 60 });
        goblins.push({ x: (c + 6) * 32, y: 320, patrolRange: 60 });

        c += 9;
        break;
      }

      case 4: {
        // Flat Ground Arena Encounter
        const flatLen = 12 + Math.floor(rng() * 4);
        for (let fc = c; fc < c + flatLen; fc += 3) {
          coins.push({ x: fc * 32, y: 320 });
        }
        // Group encounter: 4 goblins approaching from left and right
        goblins.push({ x: (c + 1) * 32, y: 320, patrolRange: 80 });
        goblins.push({ x: (c + 4) * 32, y: 320, patrolRange: 80 });
        goblins.push({ x: (c + 8) * 32, y: 320, patrolRange: 80 });
        goblins.push({ x: (c + 11) * 32, y: 320, patrolRange: 80 });

        if (rng() > 0.5) {
          healthPickups.push({ x: (c + Math.floor(flatLen / 2)) * 32, y: 310, healAmount: 30 });
        }
        c += flatLen + 3;
        break;
      }

      case 5:
      default: {
        // Rolling Hills with Elevated Wood Platforms
        for (let hc = c; hc < c + 8; hc++) {
          grid[11][hc] = TileType.GRASS_TOP;
        }
        for (let bc = c + 1; bc < c + 7; bc++) {
          grid[9][bc] = TileType.WOOD_BRIDGE;
          coins.push({ x: bc * 32, y: 8 * 32 });
        }
        // Group encounter: 4 goblins across hills and platforms
        goblins.push({ x: c * 32, y: 288, patrolRange: 60 });
        goblins.push({ x: (c + 2) * 32, y: 7 * 32, patrolRange: 60 });
        goblins.push({ x: (c + 5) * 32, y: 7 * 32, patrolRange: 60 });
        goblins.push({ x: (c + 7) * 32, y: 288, patrolRange: 60 });
        c += 9;
        break;
      }
    }
  }

  // 2. Build Exit Section or Boss Arena Section
  if (!isBoss) {
    // Normal Level Exit Section
    const exitStart = cols - 20;
    for (let ec = exitStart; ec < cols; ec++) {
      grid[12][ec] = TileType.GRASS_TOP;
      grid[13][ec] = TileType.DIRT_MIDDLE;
      grid[14][ec] = TileType.DIRT_MIDDLE;
    }
    // Staircase leading to goal
    grid[11][cols - 14] = TileType.STONE_PLATFORM;
    grid[10][cols - 12] = TileType.STONE_PLATFORM;
    grid[9][cols - 10] = TileType.STONE_PLATFORM;

    coins.push({ x: (cols - 14) * 32, y: 10 * 32 });
    coins.push({ x: (cols - 12) * 32, y: 9 * 32 });
    coins.push({ x: (cols - 10) * 32, y: 8 * 32, value: 5 });

    goblins.push({ x: (cols - 18) * 32, y: 320, patrolRange: 80 });
    goblins.push({ x: (cols - 15) * 32, y: 320, patrolRange: 80 });
    goblins.push({ x: (cols - 12) * 32, y: 320, patrolRange: 80 });
  } else {
    // BOSS LEVEL ARENA SECTION!
    const arenaStart = cols - 55;
    // Checkpoint before Boss Arena
    checkpoints.push({ x: arenaStart * 32, y: 11 * 32 - 16 });
    healthPickups.push({ x: (arenaStart + 2) * 32, y: 310, healAmount: 30 });

    // Arena Floor
    for (let ac = arenaStart; ac < cols; ac++) {
      grid[12][ac] = TileType.STONE_PLATFORM;
      grid[13][ac] = TileType.DIRT_MIDDLE;
      grid[14][ac] = TileType.DIRT_MIDDLE;
    }

    // Elevated Tactical Battlements inside Boss Arena
    for (let bc = arenaStart + 10; bc <= arenaStart + 18; bc++) {
      grid[8][bc] = TileType.STONE_PLATFORM;
      coins.push({ x: bc * 32, y: 7 * 32 });
    }
    for (let bc = arenaStart + 28; bc <= arenaStart + 36; bc++) {
      grid[8][bc] = TileType.STONE_PLATFORM;
      coins.push({ x: bc * 32, y: 7 * 32 });
    }

    // Guards on Battlements
    goblins.push({ x: (arenaStart + 14) * 32, y: 7 * 32 - 32, patrolRange: 60 });
    goblins.push({ x: (arenaStart + 32) * 32, y: 7 * 32 - 32, patrolRange: 60 });

    // GIANT BOSS GOBLIN in Center Arena!
    const bossX = (arenaStart + 23) * 32;
    goblins.push({ x: bossX, y: 300, patrolRange: 180, isBoss: true });

    // Additional Health Pickup in Arena
    healthPickups.push({ x: (arenaStart + 23) * 32, y: 220, healAmount: 30 });
  }

  // Ensure initial fallback checkpoint if none was placed
  if (checkpoints.length === 0) {
    checkpoints.push({ x: Math.floor(cols / 2) * 32, y: 11 * 32 - 16 });
  }

  // Filter out enemy spawn columns that overlap with secret rooms
  const secretRooms = buildSecretRooms(w, l, cols, grid);

  // Generate EXACTLY 50 enemies distributed across 6 waves for the level (excluding secret room areas)
  const levelGoblins = generate50EnemiesForLevel(cols, rows, grid, rng, secretRooms);

  return {
    config: {
      id: levelId,
      worldId: w,
      levelNum: l,
      title: isFinalLevel ? "30 GOBLIN KING'S THRONE (FINAL FINALE)" : title,
      worldName: isBoss ? `${wName} (BOSS)` : wName,
      width: cols * 32,
      height: 18 * 32,
      unlocked: w === 1 && l === 1,
      completed: false,
      stars: 0,
      highScoreCoins: 0,
      isBossLevel: isBoss,
    },
    grid,
    playerSpawn: { x: 80, y: 320 },
    checkpoints,
    checkpoint: checkpoints[0],
    goalPost: { x: (cols - 6) * 32, y: 11 * 32 - 16, width: 24, height: 48 },
    signs,
    healthPickups,
    coins,
    goblins: levelGoblins,
    secretRooms,
  };
}

function generate50EnemiesForLevel(
  cols: number,
  rows: number,
  grid: number[][],
  rng: () => number,
  secretRooms: SecretRoomDef[] = []
): { x: number; y: number; patrolRange?: number; isBoss?: boolean }[] {
  const result: { x: number; y: number; patrolRange?: number; isBoss?: boolean }[] = [];

  const isInsideSecretRoomArea = (c: number): boolean => {
    for (const sr of secretRooms) {
      const startC = Math.floor(sr.x / 32) - 4;
      const endC = Math.floor((sr.x + sr.width) / 32) + 2;
      if (c >= startC && c <= endC) return true;
    }
    return false;
  };

  // Wave 1: 8 enemies (Early section)
  // Wave 2: 8 enemies (Lower area / early-mid)
  // Wave 3: 8 enemies (Middle section)
  // Wave 4: 8 enemies (Upper platforms / mid-late)
  // Wave 5: 8 enemies (Later section)
  // Wave 6: 10 enemies (Near final area)
  // TOTAL = 50 enemies!
  const waveCounts = [8, 8, 8, 8, 8, 10];
  const startCol = 18;
  const endCol = cols - 16;
  const totalUsableCols = Math.max(60, endCol - startCol);

  const enemyHeight = 44;

  const findValidGroundYAtCol = (c: number): number | null => {
    if (c < 4 || c >= cols - 4 || isInsideSecretRoomArea(c)) return null;

    for (let r = 2; r <= 15; r++) {
      const tile = grid[r][c];
      const tileAbove1 = grid[r - 1][c];
      const tileAbove2 = grid[r - 2][c];

      const isSolid =
        tile === TileType.GRASS_TOP ||
        tile === TileType.DIRT_MIDDLE ||
        tile === TileType.STONE_PLATFORM ||
        tile === TileType.WOOD_BRIDGE;

      const isAbove1Empty =
        tileAbove1 === TileType.EMPTY || tileAbove1 === TileType.FAKE_WALL;
      const isAbove2Empty =
        tileAbove2 === TileType.EMPTY || tileAbove2 === TileType.FAKE_WALL;

      if (isSolid && isAbove1Empty && isAbove2Empty) {
        return r * 32 - enemyHeight;
      }
    }
    return null;
  };

  const occupiedPositions: { x: number; y: number }[] = [];

  for (let waveIdx = 0; waveIdx < 6; waveIdx++) {
    const waveEnemyCount = waveCounts[waveIdx];
    const waveStartCol = startCol + Math.floor((totalUsableCols / 6) * waveIdx);
    const waveEndCol = startCol + Math.floor((totalUsableCols / 6) * (waveIdx + 1)) - 1;
    const waveSpan = Math.max(1, waveEndCol - waveStartCol);

    for (let i = 0; i < waveEnemyCount; i++) {
      const targetCol = Math.floor(waveStartCol + (waveSpan / waveEnemyCount) * i + (rng() * 2 - 1));
      let chosenX: number | null = null;
      let chosenY: number | null = null;

      for (let offset = 0; offset <= 10; offset++) {
        const testCols = offset === 0 ? [targetCol] : [targetCol + offset, targetCol - offset];
        let found = false;

        for (const testCol of testCols) {
          if (testCol < waveStartCol || testCol > waveEndCol) continue;
          const groundY = findValidGroundYAtCol(testCol);
          if (groundY !== null) {
            const posX = testCol * 32;
            const tooClose = occupiedPositions.some(
              (p) => Math.hypot(p.x - posX, p.y - groundY) < 48
            );

            if (!tooClose) {
              chosenX = posX;
              chosenY = groundY;
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }

      if (chosenX === null || chosenY === null) {
        const fallbackCol = Math.max(startCol, Math.min(endCol, targetCol));
        const fallbackY = findValidGroundYAtCol(fallbackCol) || 320;
        chosenX = fallbackCol * 32;
        chosenY = fallbackY;
      }

      occupiedPositions.push({ x: chosenX, y: chosenY });
      result.push({
        x: chosenX,
        y: chosenY,
        patrolRange: 50 + Math.floor(rng() * 40),
      });
    }
  }

  return result;
}

function buildSecretRooms(w: number, l: number, cols: number, grid: number[][]): SecretRoomDef[] {
  const isBoss = l === 5;
  const secretRooms: SecretRoomDef[] = [];
  const rows = grid.length;

  const carveRoom = (
    id: number,
    title: string,
    startCol: number,
    endCol: number,
    entranceCol: number,
    entranceType: 'BREAKABLE_WALL' | 'FAKE_WALL' | 'HIDDEN_PASSAGE' | 'PLATFORM_ROUTE',
    rewardType: 'COIN_CACHE' | 'HP_PERMANENT' | 'ATTACK_UPGRADE' | 'ANCIENT_RELIC' | 'RARE_WEAPON'
  ): SecretRoomDef => {
    // Standardized room height: rows 8..11 (4 tiles high), ground floor at row 12
    const startRow = 8;
    const endRow = 11;
    const entranceRow = 10; // 2 tiles tall: rows 10 & 11

    // 1. Solid Outer Shell
    for (let c = startCol - 1; c <= endCol + 1; c++) {
      if (startRow - 1 >= 0) grid[startRow - 1][c] = TileType.STONE_PLATFORM; // Ceiling
      if (endRow + 1 < rows) grid[endRow + 1][c] = TileType.STONE_PLATFORM;   // Floor
    }
    for (let r = startRow - 1; r <= endRow + 1; r++) {
      if (r >= 0 && r < rows) {
        if (startCol - 1 >= 0) grid[r][startCol - 1] = TileType.STONE_PLATFORM; // Left Wall
        if (endCol + 1 < cols) grid[r][endCol + 1] = TileType.STONE_PLATFORM;   // Right Wall
      }
    }

    // 2. Clear Interior Space
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          grid[r][c] = TileType.EMPTY;
        }
      }
    }

    // 3. Carve Entrance Tiles (2-tile tall door/passage at entranceCol, rows 10 & 11)
    const eTileType = entranceType === 'BREAKABLE_WALL' ? TileType.BREAKABLE_WALL : TileType.FAKE_WALL;
    grid[10][entranceCol] = eTileType;
    grid[11][entranceCol] = eTileType;

    // 4. Guarantee Approach Corridor in Main Level outside entrance
    const isLeftEntrance = entranceCol < startCol;
    const approachStart = isLeftEntrance ? Math.max(0, entranceCol - 3) : entranceCol + 1;
    const approachEnd = isLeftEntrance ? entranceCol - 1 : Math.min(cols - 1, entranceCol + 3);

    for (let c = approachStart; c <= approachEnd; c++) {
      grid[12][c] = TileType.STONE_PLATFORM; // Solid ground
      grid[10][c] = TileType.EMPTY;          // Clear head space
      grid[11][c] = TileType.EMPTY;          // Clear foot space
    }

    const roomX = (startCol - 1) * 32;
    const roomY = (startRow - 1) * 32;
    const roomWidth = (endCol - startCol + 3) * 32;
    const roomHeight = (endRow - startRow + 3) * 32;

    const rewardX = Math.floor((startCol + endCol) / 2) * 32 + 16;
    const rewardY = endRow * 32 + 16; // Sits nicely on interior floor at row 12

    return {
      id,
      title,
      worldTheme: w,
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
      entranceX: entranceCol * 32,
      entranceY: entranceRow * 32,
      entranceWidth: 32,
      entranceHeight: 64,
      entranceType,
      rewardType,
      rewardX,
      rewardY,
      challengeType: 'TREASURE_ONLY',
    };
  };

  // World-Specific Secret Room Setups (all guaranteed accessible on ground plane)
  if (w === 1) {
    secretRooms.push(
      carveRoom(0, 'Tree Canopy Secret Vault', 54, 62, 53, 'BREAKABLE_WALL', 'COIN_CACHE'),
      carveRoom(1, 'Ancient Forest Cave Shrine', 138, 146, 137, 'BREAKABLE_WALL', 'HP_PERMANENT')
    );
  } else if (w === 2) {
    secretRooms.push(
      carveRoom(0, 'Hidden Sand Tomb Chamber', 48, 56, 47, 'FAKE_WALL', 'ANCIENT_RELIC'),
      carveRoom(1, 'Sun Temple Secret Altar', 132, 140, 131, 'BREAKABLE_WALL', 'ATTACK_UPGRADE')
    );
  } else if (w === 3) {
    secretRooms.push(
      carveRoom(0, 'Glacier Frost Cavern', 50, 58, 49, 'BREAKABLE_WALL', 'HP_PERMANENT'),
      carveRoom(1, 'Frozen Summit Shrine', 136, 144, 135, 'FAKE_WALL', 'ANCIENT_RELIC')
    );
  } else if (w === 4) {
    secretRooms.push(
      carveRoom(0, 'Volcanic Ridge Hearth', 52, 60, 51, 'BREAKABLE_WALL', 'ATTACK_UPGRADE'),
      carveRoom(1, 'Underground Magma Treasury', 140, 148, 139, 'BREAKABLE_WALL', 'COIN_CACHE')
    );
  } else if (w === 5) {
    secretRooms.push(
      carveRoom(0, 'Obsidian Void Sanctuary', 50, 58, 49, 'FAKE_WALL', 'ANCIENT_RELIC'),
      carveRoom(1, 'Eclipse Secret Spire', 136, 144, 135, 'BREAKABLE_WALL', 'HP_PERMANENT')
    );
  } else if (w === 6) {
    if (!isBoss) {
      secretRooms.push(
        carveRoom(0, 'Royal Citadel Treasury Vault', 56, 64, 55, 'BREAKABLE_WALL', 'RARE_WEAPON'),
        carveRoom(1, 'Secret Tapestry Armory', 143, 151, 142, 'FAKE_WALL', 'ATTACK_UPGRADE')
      );
    } else {
      secretRooms.push(
        carveRoom(0, "Goblin King's Secret Royal Vault", 65, 73, 64, 'BREAKABLE_WALL', 'ANCIENT_RELIC')
      );
    }
  }

  return secretRooms;
}
