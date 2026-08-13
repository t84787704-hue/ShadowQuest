import { LevelConfig, SecretRoomDef, ArenaConfig, ArenaType, ArenaMechanic } from '../../types/game';
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
  2: 'WORLD 2 — DESERT EMPIRE',
  3: 'WORLD 3 — FROZEN KINGDOM',
  4: 'WORLD 4 — VOLCANIC LANDS',
  5: 'WORLD 5 — ANCIENT TEMPLE',
  6: 'WORLD 6 — DARK SWAMP',
  7: 'WORLD 7 — SKY FORTRESS',
  8: 'WORLD 8 — CURSED CITY',
  9: 'WORLD 9 — DEMON REALM',
  10: 'WORLD 10 — FINAL REALM',
};

const WORLD_TITLES: Record<number, string[]> = {
  1: ['Green Forest', 'Ancient Ruins', 'Forbidden Canyon', 'Final Approach', 'Timberland Outpost', 'Overgrown Aqueduct', 'Cliffside Outlook', 'Old Watchtower', 'Valley Ramparts', 'Valley Chieftain Arena'],
  2: ['Desert Oasis', 'Ancient Ruins', 'Dusty Canyon', 'Sandstorm Pass', 'Sun Temple Courtyard', 'Scorched Sluice', 'Nomadic Encampment', 'Pyramidal Corridor', 'Desert Ramparts', 'Sandstorm Titan Citadel'],
  3: ['Snowy Woods', 'Frozen Lake', 'Ice Caverns', 'Blizzard Summit', 'Frostbite Terrace', 'Rime Ice Sluice', 'Avalanche Spire', 'Snowbound Watchtower', 'Glacier Ramparts', 'Frost Colossus Fortress'],
  4: ['Ash Wasteland', 'Lava Caverns', 'Burning Ridge', 'Magma Foundry', 'Obsidian Sluice', 'Smelting Terrace', 'Firestorm Pass', 'Sulphur Watchtower', 'Volcanic Ramparts', 'Magma Overlord Sanctum'],
  5: ['Haunted Woods', 'Shadow Crypt', 'Dark Fissure', 'Obsidian Tower', 'Void Terrace', 'Phantom Sluice', 'Gloom Ridge', 'Eclipse Watchtower', 'Shadow Ramparts', 'Shadow Monarch Spire'],
  6: ['Citadel Gates', 'Iron Ramparts', 'Citadel Courtyard', 'Guard Garrison', 'Royal Colonnade', 'Armory Corridor', 'Citadel High Tower', 'Royal Keep', 'Throne Approach', 'Goblin King Throne'],
  7: ['Crystal Entrance', 'Prismatic Halls', 'Glittering Chasm', 'Quartz Sluice', 'Gemstone Terrace', 'Amethyst Passage', 'Crystal Ridge', 'Geode Sanctuary', 'Prismatic Ramparts', 'Crystal Golem Sanctum'],
  8: ['Sky Approach', 'Gale Ridge', 'Cloud Sanctuary', 'Thunder Spire', 'Nimbus Terrace', 'Lightning Sluice', 'Storm Ridge', 'Hurricane Watchtower', 'Sky Ramparts', 'Storm Lord Arena'],
  9: ['Submerged Entrance', 'Coral Sluice', 'Flooded Sanctuary', 'Sunken Promenade', 'Aqueduct Terrace', 'Trench Passage', 'Submerged Ruins', 'Tidal Watchtower', 'Temple Ramparts', 'Kraken Basin Coliseum'],
  10: ['Starlight Path', 'Astral Terrace', 'Nebula Pass', 'Constellation Spire', 'Zodiac Colonnade', 'Cosmic Sluice', 'Eclipse Ridge', 'Celestial Watchtower', 'Starlight Throne Approach', 'Ultimate Overlord Sovereign'],
};

// 20 Distinct Arena Archetypes
const ARENA_ARCHETYPES: {
  arenaType: ArenaType;
  arenaLayout: string;
  arenaMechanic: ArenaMechanic;
  arenaAdvantage: string;
  enemyPowerSynergy: string;
  hazards: string[];
  platforms: string;
  environmentEffects: string;
}[] = [
  {
    arenaType: 'FLAT_COURTYARD',
    arenaLayout: 'Open Terraced Courtyard with Raised Ledges',
    arenaMechanic: 'ELEVATED_LEDGES',
    arenaAdvantage: 'High ground advantage! Drop-kick enemies from elevated stone ledges for +50% critical damage.',
    enemyPowerSynergy: 'Forest Rogues attempt to surround you from both sides on open ground.',
    hazards: ['NONE'],
    platforms: 'ELEVATED_LEDGES',
    environmentEffects: 'LEAF_PETALS',
  },
  {
    arenaType: 'SHIELDED_COVER_PILLARS',
    arenaLayout: 'Ancient Ruin Colonnade with Granite Cover Pillars',
    arenaMechanic: 'SHIELDING_PILLARS',
    arenaAdvantage: 'Use heavy cover pillars to block enemy dash attacks and break line of sight.',
    enemyPowerSynergy: 'Ancient Brawlers try to corner you against stone pillars.',
    hazards: ['CRUMBLING_WALLS'],
    platforms: 'STONE_COLUMNS',
    environmentEffects: 'DUST_MOTES',
  },
  {
    arenaType: 'NARROW_BRIDGE',
    arenaLayout: 'Forbidden Canyon Rope & Timber Bridges over Chasm',
    arenaMechanic: 'CHASM_PITS',
    arenaAdvantage: 'Spin-kick enemies into deep canyon chasms for instant environmental defeats!',
    enemyPowerSynergy: 'Canyon Strikers attempt heavy knockback kicks to force you off narrow bridges.',
    hazards: ['SPIKES', 'CHASMS'],
    platforms: 'NARROW_BRIDGES',
    environmentEffects: 'GOLDEN_DUST',
  },
  {
    arenaType: 'SPIKE_PIT_BRIDGES',
    arenaLayout: 'Fortress Ramparts and Portcullis Drawbridges',
    arenaMechanic: 'HAZARD_SPIKES',
    arenaAdvantage: 'Knock ironclad guards into spike moats while maintaining mobility across drawbridges.',
    enemyPowerSynergy: 'Ironclad Brutes shield themselves to push you backward into spike pits.',
    hazards: ['SPIKES'],
    platforms: 'WOOD_BRIDGES',
    environmentEffects: 'EMBERS',
  },
  {
    arenaType: 'BOSS_CIRCULAR_ARENA',
    arenaLayout: 'Grand Citadel Throne Coliseum with Spring Corners',
    arenaMechanic: 'BOUNCE_PADS',
    arenaAdvantage: 'Use corner spring bounce pads to leap over Boss ground shockwaves and strike from above.',
    enemyPowerSynergy: 'Goblin Chief summons shadow clones and unleashes arena-wide ground slams.',
    hazards: ['SHOCKWAVES'],
    platforms: 'ELEVATED_LIPPED',
    environmentEffects: 'FIERY_EMBERS',
  },
  {
    arenaType: 'SLIPPERY_SLOPE',
    arenaLayout: 'Sand Dune Slopes & Glacial Sluices',
    arenaMechanic: 'SLIPPERY_ICE',
    arenaAdvantage: 'Slide momentum allows fast dash attacks through enemy squads.',
    enemyPowerSynergy: 'Desert Assassins slide rapidly across dunes to execute sudden lunges.',
    hazards: ['SAND_SLIDES'],
    platforms: 'SLIPPERY_SLIDES',
    environmentEffects: 'SANDSTORM',
  },
  {
    arenaType: 'CONVEYOR_FACTORY',
    arenaLayout: 'Industrial Aqueduct Conveyors & Moving Platforms',
    arenaMechanic: 'CONVEYOR_BELTS',
    arenaAdvantage: 'Lure heavy enemies onto reverse conveyors to keep them out of attack range.',
    enemyPowerSynergy: 'Aqueduct Guardians charge with the conveyor flow to double their speed.',
    hazards: ['CONVEYORS'],
    platforms: 'MOVING_CONVEYORS',
    environmentEffects: 'MIST',
  },
  {
    arenaType: 'BOUNCE_CANVAS',
    arenaLayout: 'Oasis Canopy Trampoline Platforms',
    arenaMechanic: 'BOUNCE_PADS',
    arenaAdvantage: 'Launch high aerial spin-kicks off spring pads to crush flying acrobats.',
    enemyPowerSynergy: 'Acrobatic Nomads perform high spring attacks between platforms.',
    hazards: ['HEIGHT_FALLS'],
    platforms: 'TRAMPOLINE_CANVAS',
    environmentEffects: 'HEAT_WAVES',
  },
  {
    arenaType: 'WINDY_SUMMIT',
    arenaLayout: 'Blizzard Summit Ridge & Watchtowers',
    arenaMechanic: 'WIND_GUSTS',
    arenaAdvantage: 'Time your jump attacks with wind gusts for extended airtime and double jump distance.',
    enemyPowerSynergy: 'Snipers shoot wind-guided projectiles that curve toward you.',
    hazards: ['WIND_GUSTS', 'FREEZE'],
    platforms: 'HIGH_RIDGE',
    environmentEffects: 'SNOW_GUSTS',
  },
  {
    arenaType: 'GRAVITY_WELL',
    arenaLayout: 'Celestial Floating Temple Arenas',
    arenaMechanic: 'LOW_GRAVITY',
    arenaAdvantage: 'Low gravity enables floating air combos and multi-kick juggle strikes.',
    enemyPowerSynergy: 'Floating Mages teleport across floating islands to strike from distance.',
    hazards: ['VOID_FALLS'],
    platforms: 'FLOATING_ISLANDS',
    environmentEffects: 'STARLIGHT',
  },
  {
    arenaType: 'LAVA_ISLANDS',
    arenaLayout: 'Volcanic Magma Basalt Stepping Stones',
    arenaMechanic: 'LAVA_PITS',
    arenaAdvantage: 'Force lava guardians into molten magma pits for massive damage.',
    enemyPowerSynergy: 'Magma Brawlers slam the ground to ignite basalt platforms.',
    hazards: ['LAVA_PITS', 'FIRE_JETS'],
    platforms: 'BASALT_ISLANDS',
    environmentEffects: 'VOLCANIC_EMBERS',
  },
  {
    arenaType: 'VERTICAL_TOWER',
    arenaLayout: 'Obsidian Spire Multi-Level Vertical Chambers',
    arenaMechanic: 'ELEVATED_LEDGES',
    arenaAdvantage: 'Vertical multi-tier layout lets you drop onto enemies from higher levels.',
    enemyPowerSynergy: 'Shadow Archers rain arrows from top tower balconies.',
    hazards: ['HEIGHT_FALLS'],
    platforms: 'VERTICAL_TIERS',
    environmentEffects: 'SHADOW_AURA',
  },
  {
    arenaType: 'DESTRUCTIBLE_RING',
    arenaLayout: 'Royal Chambers Crumbling Arena Ring',
    arenaMechanic: 'DESTRUCTIBLE_BRICKS',
    arenaAdvantage: 'Break fragile brick platforms underneath heavy enemies to drop them.',
    enemyPowerSynergy: 'Heavy Enforcers smash floor sections with ground pounds.',
    hazards: ['CRUMBLING_FLOOR'],
    platforms: 'CRACKED_TILES',
    environmentEffects: 'SPARKS',
  },
  {
    arenaType: 'ELEMENTAL_HAZARD',
    arenaLayout: 'Thunder Forge Electrified Terraces',
    arenaMechanic: 'TRAP_TILES',
    arenaAdvantage: 'Trigger trap tiles to electrify or incinerate charging enemy waves.',
    enemyPowerSynergy: 'Iron Golems drive you onto active trap tiles.',
    hazards: ['TRAP_TILES', 'SPIKES'],
    platforms: 'FORGE_TILES',
    environmentEffects: 'LIGHTNING_SPARKS',
  },
  {
    arenaType: 'BOULDER_RUN',
    arenaLayout: 'Ascending Canyon Rampart Run',
    arenaMechanic: 'MOVING_PLATFORMS',
    arenaAdvantage: 'Use moving platform lifts to bypass choke points and strike from behind.',
    enemyPowerSynergy: 'Canyon Guards shoot boulders down narrow stairs.',
    hazards: ['BOULDERS', 'HEIGHT_FALLS'],
    platforms: 'ASCENDING_LIFTS',
    environmentEffects: 'FALLING_ROCKS',
  },
  {
    arenaType: 'ELEVATED_MESA',
    arenaLayout: 'Sunken Temple Plateau Mesa Arena',
    arenaMechanic: 'ELEVATED_LEDGES',
    arenaAdvantage: 'Control the central elevated mesa to bottleneck enemy approach paths.',
    enemyPowerSynergy: 'Temple Defenders attempt to swarm the central high ground.',
    hazards: ['NONE'],
    platforms: 'CENTRAL_MESA',
    environmentEffects: 'WATER_DRIPS',
  },
  {
    arenaType: 'FLOATING_ISLANDS',
    arenaLayout: 'Sky Sanctum Floating Crystal Islands',
    arenaMechanic: 'MOVING_PLATFORMS',
    arenaAdvantage: 'Jump between moving crystal platforms to isolate single targets.',
    enemyPowerSynergy: 'Sky Strikers leap between islands with aerial kicks.',
    hazards: ['VOID_GAPS'],
    platforms: 'FLOATING_CRYSTALS',
    environmentEffects: 'CRYSTAL_SHIMMER',
  },
  {
    arenaType: 'CHASM_COLISEUM',
    arenaLayout: 'Royal Pit Chasm Arena',
    arenaMechanic: 'CHASM_PITS',
    arenaAdvantage: 'Spacious circular platform surrounded by deep chasms for ring-out finishes.',
    enemyPowerSynergy: 'Gladiators use shield charges to push you toward chasm edges.',
    hazards: ['CHASM_PITS'],
    platforms: 'RING_PLATFORM',
    environmentEffects: 'TORCH_LIGHT',
  },
  {
    arenaType: 'TRAMPOLINE_ARENA',
    arenaLayout: 'Phantom Citadel Spring Terrace',
    arenaMechanic: 'BOUNCE_PADS',
    arenaAdvantage: 'Bounce pad grid allows continuous aerial mobility and overhead slams.',
    enemyPowerSynergy: 'Phantom Assassins ambush from air bounce arcs.',
    hazards: ['SPIKE_WALLS'],
    platforms: 'BOUNCE_GRID',
    environmentEffects: 'PHANTOM_MIST',
  },
  {
    arenaType: 'BOSS_CIRCULAR_ARENA',
    arenaLayout: 'Ultimate Overlord Throne Sanctum',
    arenaMechanic: 'BOUNCE_PADS',
    arenaAdvantage: 'Master bounce pads, cover pillars, and high platforms to survive the Overlord.',
    enemyPowerSynergy: 'Overlord unleashes multi-phase cataclysmic energy storms.',
    hazards: ['ENERGY_BEAMS', 'LAVA_PITS'],
    platforms: 'GRAND_SANCTUM',
    environmentEffects: 'CHAOS_AURA',
  },
];

export function getArenaConfig(worldId: number, levelNum: number): ArenaConfig {
  const levelIndex = (worldId - 1) * 5 + (levelNum - 1);
  const archetypeIndex = (levelIndex + (levelNum === 5 ? 4 : 0)) % ARENA_ARCHETYPES.length;
  const base = ARENA_ARCHETYPES[archetypeIndex];

  const worldName = WORLD_NAMES[worldId] || `WORLD ${worldId}`;
  return {
    ...base,
    arenaLayout: `${worldName} Level ${levelNum}: ${base.arenaLayout}`,
  };
}

// Seedable pseudo-random generator
function makeRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function parseLevelId(levelId: string): { worldId: number; levelNum: number; globalLevel: number; canonicalId: string } {
  let w = 1;
  let l = 1;
  if (levelId.includes('-')) {
    const [wStr, lStr] = levelId.split('-');
    const wRaw = parseInt(wStr, 10) || 1;
    const lRaw = parseInt(lStr, 10) || 1;
    if (wRaw === 1 && lRaw > 10) {
      const global = Math.min(100, Math.max(1, lRaw));
      w = Math.floor((global - 1) / 10) + 1;
      l = ((global - 1) % 10) + 1;
    } else {
      w = Math.min(10, Math.max(1, wRaw));
      l = Math.min(10, Math.max(1, lRaw));
    }
  } else {
    const global = Math.min(100, Math.max(1, parseInt(levelId, 10) || 1));
    w = Math.floor((global - 1) / 10) + 1;
    l = ((global - 1) % 10) + 1;
  }
  const globalLevel = (w - 1) * 10 + l;
  const canonicalId = `${w}-${l}`;
  return { worldId: w, levelNum: l, globalLevel, canonicalId };
}

export function getLevelCols(worldId: number, levelNum: number): number {
  if (worldId === 1 && levelNum === 1) return 220; // Level 1-1 (7,040px)
  const isBoss = levelNum === 10;
  if (worldId === 10 && isBoss) return 560; // Level 100 Final Boss Finale (17,920px)

  const baseCols = 200 + (worldId - 1) * 20 + (levelNum - 1) * 8;
  return isBoss ? baseCols + 35 : baseCols;
}

export function getLevelWidth(worldId: number, levelNum: number): number {
  return getLevelCols(worldId, levelNum) * 32;
}

export function getLevelsForWorld(worldId: number): LevelConfig[] {
  const titles = WORLD_TITLES[worldId] || WORLD_TITLES[1];
  const wName = WORLD_NAMES[worldId] || `WORLD ${worldId}`;

  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvlNum) => {
    const isBoss = lvlNum === 10;
    const titleIndex = Math.min(titles.length - 1, lvlNum - 1);
    const title = `${worldId}-${lvlNum} ${titles[titleIndex].toUpperCase()}`;
    const width = getLevelWidth(worldId, lvlNum);
    const arenaConfig = getArenaConfig(worldId, lvlNum);
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
      arenaConfig,
    };
  });
}

export const ALL_LEVELS_METADATA: LevelConfig[] = Array.from({ length: 10 }, (_, i) => i + 1).flatMap((w) =>
  getLevelsForWorld(w)
);

export function getLevelDefinition(levelId: string): LevelDefinition {
  const parsed = parseLevelId(levelId);
  const w = parsed.worldId;
  const l = parsed.levelNum;

  const isBoss = l === 10;
  const isFinalLevel = w === 10 && isBoss; // Level 100 (10-10)
  const cols = getLevelCols(w, l);
  const rows = 18;

  const wName = WORLD_NAMES[w] || `WORLD ${w}`;
  const titles = WORLD_TITLES[w] || WORLD_TITLES[1];
  const titleIndex = Math.min(titles.length - 1, l - 1);
  const title = isFinalLevel
    ? "10-10 ULTIMATE OVERLORD SOVEREIGN (FINAL FINALE)"
    : `${w}-${l} ${titles[titleIndex].toUpperCase()}`;

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

  if (w === 1 && l === 2) {
    // Dedicated Layout for World 1-2 Ancient Ruins
    buildWorld1_2Layout(cols, rows, grid, coins, healthPickups, checkpoints, signs, rng);
  } else if (w === 1 && l === 3) {
    // Dedicated Layout for World 1-3 Forbidden Canyon
    buildWorld1_3Layout(cols, rows, grid, coins, healthPickups, checkpoints, signs, rng);
  } else if (w === 1 && l === 4) {
    // Dedicated Layout for World 1-4 Final Approach (Fortress Approach)
    buildWorld1_4Layout(cols, rows, grid, coins, healthPickups, checkpoints, signs, rng);
  } else {
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
  }

  // Ensure initial fallback checkpoint if none was placed
  if (checkpoints.length === 0) {
    checkpoints.push({ x: Math.floor(cols / 2) * 32, y: 11 * 32 - 16 });
  }

  // Filter out enemy spawn columns that overlap with secret rooms
  const secretRooms = buildSecretRooms(w, l, cols, grid);

  // Generate EXACTLY 50 enemies distributed across waves for the level (excluding secret room areas)
  const levelGoblins = generate50EnemiesForLevel(cols, rows, grid, rng, secretRooms, w, l);

  const arenaConfig = getArenaConfig(w, l);

  return {
    config: {
      id: levelId,
      worldId: w,
      levelNum: l,
      title,
      worldName: isBoss ? `${wName} (BOSS)` : wName,
      width: cols * 32,
      height: 18 * 32,
      unlocked: w === 1 && l === 1,
      completed: false,
      stars: 0,
      highScoreCoins: 0,
      isBossLevel: isBoss,
      arenaConfig,
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

function buildWorld1_2Layout(
  cols: number,
  rows: number,
  grid: number[][],
  coins: { x: number; y: number; value?: number }[],
  healthPickups: { x: number; y: number; healAmount?: number }[],
  checkpoints: { x: number; y: number }[],
  signs: TutorialSign[],
  rng: () => number
) {
  // World 1-2: Ancient Ruins layout
  for (let c = 0; c < cols; c++) {
    grid[12][c] = TileType.STONE_PLATFORM;
    for (let r = 13; r < rows; r++) {
      grid[r][c] = TileType.DIRT_MIDDLE;
    }
  }

  signs.push(
    { x: 120, y: 310, title: 'WORLD 1-2: ANCIENT RUINS', subtitle: 'Stone arches and crumbling pillars mark this ancient martial site. Defeat all 50 enemies!' },
    { x: 1500, y: 310, title: 'RUIN COMBAT ARENAS', subtitle: 'Utilize wide ruin courtyards to dodge enemy attacks and string together heavy combos!' }
  );

  const placePillar = (c: number, topRow: number, heightRows: number) => {
    for (let r = topRow; r < topRow + heightRows; r++) {
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        grid[r][c] = TileType.STONE_PLATFORM;
      }
    }
  };

  const placeStonePlatform = (startC: number, endC: number, row: number) => {
    for (let c = startC; c <= endC; c++) {
      if (c >= 0 && c < cols && row >= 0 && row < rows) {
        grid[row][c] = TileType.STONE_PLATFORM;
      }
    }
  };

  const placeGap = (startC: number, endC: number) => {
    for (let c = startC; c <= endC; c++) {
      grid[12][c] = TileType.EMPTY;
      grid[13][c] = TileType.HAZARD_SPIKES;
      grid[14][c] = TileType.DIRT_MIDDLE;
    }
  };

  // Entrance Pillars & Initial Coins
  placePillar(4, 7, 5);
  placePillar(12, 7, 5);
  for (let c = 5; c <= 14; c += 3) coins.push({ x: c * 32, y: 320 });

  // Section 1: Broken Walls & Elevated Platforms (cols 17..45)
  placePillar(20, 8, 4);
  placeStonePlatform(20, 25, 8);
  for (let c = 20; c <= 25; c += 2) coins.push({ x: c * 32, y: 7 * 32 });

  placeGap(26, 28);
  placeStonePlatform(27, 28, 10);

  placePillar(32, 9, 3);
  placeStonePlatform(32, 38, 9);
  for (let c = 33; c <= 37; c += 2) coins.push({ x: c * 32, y: 8 * 32 });

  placeGap(39, 41);
  placeStonePlatform(40, 41, 10);

  // Section 2: First Wide Combat Arena (cols 46..75)
  for (let c = 48; c <= 54; c += 2) coins.push({ x: c * 32, y: 320 });
  healthPickups.push({ x: 50 * 32, y: 310, healAmount: 30 });
  placePillar(46, 8, 4);
  placePillar(55, 8, 4);

  // Section 3: Elevated Walkways & Pillars (cols 76..115)
  placeStonePlatform(78, 88, 9);
  for (let c = 79; c <= 87; c += 2) coins.push({ x: c * 32, y: 8 * 32 });

  checkpoints.push({ x: 85 * 32, y: 11 * 32 - 16 });
  healthPickups.push({ x: 87 * 32, y: 310, healAmount: 30 });

  placePillar(92, 8, 4);
  placeStonePlatform(92, 98, 8);
  for (let c = 93; c <= 97; c += 2) coins.push({ x: c * 32, y: 7 * 32, value: 3 });

  placeGap(108, 110);
  placeStonePlatform(109, 110, 10);

  // Section 4: Great Central Ruin Arena (cols 116..155)
  placePillar(116, 7, 5);
  placePillar(136, 7, 5);

  placeStonePlatform(118, 123, 8);
  placeStonePlatform(129, 134, 8);
  for (let c = 119; c <= 122; c++) coins.push({ x: c * 32, y: 7 * 32 });
  for (let c = 130; c <= 133; c++) coins.push({ x: c * 32, y: 7 * 32 });

  healthPickups.push({ x: 126 * 32, y: 310, healAmount: 30 });

  // Section 5: Sunken Ruin Terraces & Checkpoint 2 (cols 156..185)
  placeStonePlatform(156, 162, 10);
  for (let c = 157; c <= 161; c += 2) coins.push({ x: c * 32, y: 9 * 32 });

  checkpoints.push({ x: 165 * 32, y: 11 * 32 - 16 });
  healthPickups.push({ x: 167 * 32, y: 310, healAmount: 30 });

  placeGap(168, 170);
  placeStonePlatform(169, 170, 10);

  placeStonePlatform(174, 182, 9);
  for (let c = 175; c <= 181; c += 2) coins.push({ x: c * 32, y: 8 * 32 });

  // Section 6: Exit Sanctuary (cols 186..220)
  placePillar(186, 7, 5);
  placePillar(202, 7, 5);

  grid[11][203] = TileType.STONE_PLATFORM;
  grid[10][204] = TileType.STONE_PLATFORM;
  grid[9][205] = TileType.STONE_PLATFORM;

  for (let c = 188; c <= 200; c += 3) coins.push({ x: c * 32, y: 320 });
  coins.push({ x: 205 * 32, y: 8 * 32, value: 5 });
}

function buildWorld1_3Layout(
  cols: number,
  rows: number,
  grid: number[][],
  coins: { x: number; y: number; value?: number }[],
  healthPickups: { x: number; y: number; healAmount?: number }[],
  checkpoints: { x: number; y: number }[],
  signs: TutorialSign[],
  rng: () => number
) {
  // World 1-3: Forbidden Canyon layout
  for (let c = 0; c < cols; c++) {
    grid[12][c] = TileType.STONE_PLATFORM;
    for (let r = 13; r < rows; r++) {
      grid[r][c] = TileType.DIRT_MIDDLE;
    }
  }

  signs.push(
    { x: 120, y: 310, title: 'WORLD 1-3: FORBIDDEN CANYON', subtitle: 'Towering red sandstone cliffs and treacherous canyon passes. Defeat all 50 canyon enemies!' },
    { x: 1500, y: 310, title: 'CANYON BATTLEGROUNDS', subtitle: 'Utilize elevated cliff ledges and wide canyon basins to isolate fast enemies and execute heavy combos!' }
  );

  const placeCanyonPillar = (c: number, topRow: number, heightRows: number) => {
    for (let r = topRow; r < topRow + heightRows; r++) {
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        grid[r][c] = TileType.STONE_PLATFORM;
      }
    }
  };

  const placeCliffLedge = (startC: number, endC: number, row: number) => {
    for (let c = startC; c <= endC; c++) {
      if (c >= 0 && c < cols && row >= 0 && row < rows) {
        grid[row][c] = TileType.STONE_PLATFORM;
      }
    }
  };

  const placeRopeBridge = (startC: number, endC: number, row: number) => {
    for (let c = startC; c <= endC; c++) {
      if (c >= 0 && c < cols && row >= 0 && row < rows) {
        grid[row][c] = TileType.WOOD_BRIDGE;
      }
    }
  };

  const placeCanyonChasm = (startC: number, endC: number) => {
    for (let c = startC; c <= endC; c++) {
      if (c >= 0 && c < cols) {
        grid[12][c] = TileType.EMPTY;
        grid[13][c] = TileType.HAZARD_SPIKES;
        grid[14][c] = TileType.DIRT_MIDDLE;
      }
    }
  };

  // Entrance Pillars & Initial Coins
  placeCanyonPillar(4, 6, 6);
  placeCanyonPillar(12, 6, 6);
  for (let c = 5; c <= 14; c += 3) coins.push({ x: c * 32, y: 320 });

  // Section 1: Canyon Ledges & Stepped Mesa Terraces (cols 17..45)
  placeCanyonPillar(20, 8, 4);
  placeCliffLedge(20, 25, 8);
  for (let c = 20; c <= 25; c += 2) coins.push({ x: c * 32, y: 7 * 32 });

  placeCanyonChasm(26, 28);
  placeCliffLedge(27, 28, 10);

  placeCanyonPillar(32, 7, 5);
  placeCliffLedge(32, 38, 7);
  for (let c = 33; c <= 37; c += 2) coins.push({ x: c * 32, y: 6 * 32 });

  placeCanyonChasm(39, 41);
  placeCliffLedge(40, 41, 10);

  // Section 2: Entrance Gorge Plaza (cols 42..75)
  for (let c = 48; c <= 54; c += 2) coins.push({ x: c * 32, y: 320 });
  healthPickups.push({ x: 50 * 32, y: 310, healAmount: 30 });
  placeCanyonPillar(46, 7, 5);
  placeCanyonPillar(58, 7, 5);

  // Section 3: Canyon Ravine & Elevated Rope Bridges (cols 76..115)
  placeRopeBridge(78, 88, 9);
  for (let c = 79; c <= 87; c += 2) coins.push({ x: c * 32, y: 8 * 32 });

  checkpoints.push({ x: 82 * 32, y: 11 * 32 - 16 });
  healthPickups.push({ x: 84 * 32, y: 310, healAmount: 30 });

  placeCanyonPillar(92, 7, 5);
  placeCliffLedge(92, 98, 7);
  for (let c = 93; c <= 97; c += 2) coins.push({ x: c * 32, y: 6 * 32, value: 3 });

  placeCanyonChasm(108, 110);
  placeCliffLedge(109, 110, 10);

  // Section 4: Great Canyon Ravine Courtyard Arena (cols 116..155)
  placeCanyonPillar(116, 6, 6);
  placeCanyonPillar(136, 6, 6);

  placeCliffLedge(118, 123, 8);
  placeCliffLedge(129, 134, 8);
  for (let c = 119; c <= 122; c++) coins.push({ x: c * 32, y: 7 * 32 });
  for (let c = 130; c <= 133; c++) coins.push({ x: c * 32, y: 7 * 32 });

  healthPickups.push({ x: 126 * 32, y: 310, healAmount: 30 });

  // Section 5: Sunken Canyon Terraces & Checkpoint 2 (cols 156..185)
  placeCliffLedge(156, 162, 10);
  for (let c = 157; c <= 161; c += 2) coins.push({ x: c * 32, y: 9 * 32 });

  checkpoints.push({ x: 160 * 32, y: 11 * 32 - 16 });
  healthPickups.push({ x: 162 * 32, y: 310, healAmount: 30 });

  placeCanyonChasm(168, 170);
  placeCliffLedge(169, 170, 10);

  placeCliffLedge(174, 182, 8);
  for (let c = 175; c <= 181; c += 2) coins.push({ x: c * 32, y: 7 * 32 });

  // Section 6: Forbidden Canyon Basin Arena (cols 186..224)
  placeCanyonPillar(186, 6, 6);
  placeCanyonPillar(202, 6, 6);

  grid[11][203] = TileType.STONE_PLATFORM;
  grid[10][204] = TileType.STONE_PLATFORM;
  grid[9][205] = TileType.STONE_PLATFORM;

  for (let c = 188; c <= 200; c += 3) coins.push({ x: c * 32, y: 320 });
  coins.push({ x: 205 * 32, y: 8 * 32, value: 5 });
}

function buildWorld1_4Layout(
  cols: number,
  rows: number,
  grid: number[][],
  coins: { x: number; y: number; value?: number }[],
  healthPickups: { x: number; y: number; healAmount?: number }[],
  checkpoints: { x: number; y: number }[],
  signs: TutorialSign[],
  rng: () => number
) {
  // World 1-4: Final Approach (Fortress Approach)
  for (let c = 0; c < cols; c++) {
    grid[12][c] = TileType.STONE_PLATFORM;
    for (let r = 13; r < rows; r++) {
      grid[r][c] = TileType.DIRT_MIDDLE;
    }
  }

  signs.push(
    { x: 120, y: 310, title: 'WORLD 1-4: FINAL APPROACH', subtitle: 'The ironclad goblin fortress looms ahead. Defeat all 50 defenders to breach the inner sanctum!' },
    { x: 1500, y: 310, title: 'FORTRESS RAMPARTS', subtitle: 'Watch for fortified choke points and ironclad brawlers defending the courtyard bridges!' }
  );

  const placeFortressPillar = (c: number, topRow: number, heightRows: number) => {
    for (let r = topRow; r < topRow + heightRows; r++) {
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        grid[r][c] = TileType.STONE_PLATFORM;
      }
    }
  };

  const placeFortressWall = (startC: number, endC: number, row: number) => {
    for (let c = startC; c <= endC; c++) {
      if (c >= 0 && c < cols && row >= 0 && row < rows) {
        grid[row][c] = TileType.STONE_PLATFORM;
      }
    }
  };

  const placeDrawBridge = (startC: number, endC: number, row: number) => {
    for (let c = startC; c <= endC; c++) {
      if (c >= 0 && c < cols && row >= 0 && row < rows) {
        grid[row][c] = TileType.WOOD_BRIDGE;
      }
    }
  };

  const placeMoatChasm = (startC: number, endC: number) => {
    for (let c = startC; c <= endC; c++) {
      if (c >= 0 && c < cols) {
        grid[12][c] = TileType.EMPTY;
        grid[13][c] = TileType.HAZARD_SPIKES;
        grid[14][c] = TileType.DIRT_MIDDLE;
      }
    }
  };

  // 1. Entrance Gate Towers & Portcullis Rampart
  placeFortressPillar(4, 6, 6);
  placeFortressPillar(14, 6, 6);
  placeFortressWall(4, 14, 6);
  for (let c = 5; c <= 13; c += 2) coins.push({ x: c * 32, y: 5 * 32 });

  // 2. Open Combat Courtyard #1 (cols 17..55)
  placeFortressPillar(22, 8, 4);
  placeFortressWall(22, 28, 8);
  for (let c = 23; c <= 27; c += 2) coins.push({ x: c * 32, y: 7 * 32 });

  placeMoatChasm(29, 31);
  placeFortressWall(30, 31, 10);

  placeFortressPillar(36, 7, 5);
  placeFortressWall(36, 44, 7);
  for (let c = 37; c <= 43; c += 2) coins.push({ x: c * 32, y: 6 * 32 });

  placeMoatChasm(45, 47);
  placeFortressWall(46, 47, 10);

  // 3. Elevated Platforms & Wall Ramparts (cols 56..90)
  for (let c = 52; c <= 58; c += 2) coins.push({ x: c * 32, y: 320 });
  healthPickups.push({ x: 55 * 32, y: 310, healAmount: 30 });
  placeFortressPillar(50, 7, 5);
  placeFortressPillar(62, 7, 5);

  checkpoints.push({ x: 82 * 32, y: 11 * 32 - 16 });
  healthPickups.push({ x: 84 * 32, y: 310, healAmount: 30 });

  placeFortressPillar(80, 6, 6);
  placeFortressWall(80, 88, 6);
  for (let c = 81; c <= 87; c += 2) coins.push({ x: c * 32, y: 5 * 32, value: 3 });

  // 4. Narrow Fortress Passage & Watchtowers (cols 91..125)
  placeMoatChasm(95, 97);
  placeFortressWall(96, 97, 10);

  placeFortressPillar(102, 7, 5);
  placeFortressWall(102, 110, 7);
  for (let c = 103; c <= 109; c += 2) coins.push({ x: c * 32, y: 6 * 32 });

  placeMoatChasm(115, 117);
  placeFortressWall(116, 117, 10);

  // 5. Large Fortress Drawbridge & Moat Section (cols 126..165)
  placeDrawBridge(128, 142, 9);
  for (let c = 129; c <= 141; c += 2) coins.push({ x: c * 32, y: 8 * 32 });

  checkpoints.push({ x: 155 * 32, y: 11 * 32 - 16 });
  healthPickups.push({ x: 157 * 32, y: 310, healAmount: 30 });

  placeFortressPillar(148, 6, 6);
  placeFortressWall(148, 156, 6);
  for (let c = 149; c <= 155; c += 2) coins.push({ x: c * 32, y: 5 * 32 });

  // 6. Second Inner Combat Courtyard (cols 166..195)
  placeMoatChasm(168, 170);
  placeFortressWall(169, 170, 10);

  placeFortressWall(174, 184, 8);
  for (let c = 175; c <= 183; c += 2) coins.push({ x: c * 32, y: 7 * 32 });

  // 7. Final Grand Fortress Arena Before Boss Entrance (cols 196..224)
  placeFortressPillar(192, 5, 7);
  placeFortressPillar(210, 5, 7);

  grid[11][211] = TileType.STONE_PLATFORM;
  grid[10][212] = TileType.STONE_PLATFORM;
  grid[9][213] = TileType.STONE_PLATFORM;

  for (let c = 194; c <= 208; c += 3) coins.push({ x: c * 32, y: 320 });
  coins.push({ x: 213 * 32, y: 8 * 32, value: 5 });
  healthPickups.push({ x: 202 * 32, y: 310, healAmount: 30 });
}

function generate50EnemiesForLevel(
  cols: number,
  rows: number,
  grid: number[][],
  rng: () => number,
  secretRooms: SecretRoomDef[] = [],
  w: number = 1,
  l: number = 1
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

  // Wave counts: World 1-2, 1-3 & 1-4 use [5, 6, 7, 8, 9, 10, 5] = 50 enemies across 7 waves
  // Other levels use [8, 8, 8, 8, 8, 10] = 50 enemies across 6 waves
  const waveCounts = (w === 1 && (l === 2 || l === 3 || l === 4)) ? [5, 6, 7, 8, 9, 10, 5] : [8, 8, 8, 8, 8, 10];
  const numWaves = waveCounts.length;
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

  for (let waveIdx = 0; waveIdx < numWaves; waveIdx++) {
    const waveEnemyCount = waveCounts[waveIdx];
    const waveStartCol = startCol + Math.floor((totalUsableCols / numWaves) * waveIdx);
    const waveEndCol = startCol + Math.floor((totalUsableCols / numWaves) * (waveIdx + 1)) - 1;
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
  const isBoss = l === 10;
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
    secretRooms.push(
      carveRoom(0, 'Royal Citadel Treasury Vault', 56, 64, 55, 'BREAKABLE_WALL', 'RARE_WEAPON'),
      carveRoom(1, 'Secret Tapestry Armory', 143, 151, 142, 'FAKE_WALL', 'ATTACK_UPGRADE')
    );
  } else if (w === 7) {
    secretRooms.push(
      carveRoom(0, 'Prismatic Crystal Altar', 52, 60, 51, 'BREAKABLE_WALL', 'RARE_WEAPON'),
      carveRoom(1, 'Geode Gemstone Cache', 138, 146, 137, 'FAKE_WALL', 'COIN_CACHE')
    );
  } else if (w === 8) {
    secretRooms.push(
      carveRoom(0, 'Sky Tempest Shrine', 50, 58, 49, 'FAKE_WALL', 'ATTACK_UPGRADE'),
      carveRoom(1, 'Nimbus Cloud Treasury', 134, 142, 133, 'BREAKABLE_WALL', 'HP_PERMANENT')
    );
  } else if (w === 9) {
    secretRooms.push(
      carveRoom(0, 'Submerged Coral Vault', 54, 62, 53, 'BREAKABLE_WALL', 'ANCIENT_RELIC'),
      carveRoom(1, 'Sunken Temple Altar', 140, 148, 139, 'FAKE_WALL', 'COIN_CACHE')
    );
  } else if (w === 10) {
    secretRooms.push(
      carveRoom(0, 'Celestial Starlight Sanctuary', 56, 64, 55, 'FAKE_WALL', 'RARE_WEAPON'),
      carveRoom(1, 'Zodiac Sovereign Vault', 142, 150, 141, 'BREAKABLE_WALL', 'ATTACK_UPGRADE')
    );
  }

  return secretRooms;
}
