import { LevelConfig } from '../../types/game';
import { WORLD_NAMES, getLevelsForWorld } from './LevelData';

export interface WorldDefinition {
  id: number;
  name: string;
  shortTitle: string;
  theme: string;
  subtitle: string;
  levelRangeStr: string;
  globalRange: [number, number]; // e.g. [1, 10], [11, 20]
  bgGradient: string;
  borderColor: string;
  levels: LevelConfig[];
}

export const WORLD_REGISTRY_DATA: Omit<WorldDefinition, 'levels'>[] = [
  {
    id: 1,
    name: 'WORLD 1',
    shortTitle: 'Green Valley',
    theme: 'Green Valley',
    subtitle: 'Lush valley & Chieftain Fortress',
    levelRangeStr: 'Levels 1-10',
    globalRange: [1, 10],
    bgGradient: 'from-emerald-900/60 to-slate-900',
    borderColor: 'border-emerald-500/50',
  },
  {
    id: 2,
    name: 'WORLD 2',
    shortTitle: 'Desert Empire',
    theme: 'Desert Empire',
    subtitle: 'Golden dunes, pyramids & Pharaoh Titan',
    levelRangeStr: 'Levels 11-20',
    globalRange: [11, 20],
    bgGradient: 'from-amber-900/60 to-slate-900',
    borderColor: 'border-amber-500/50',
  },
  {
    id: 3,
    name: 'WORLD 3',
    shortTitle: 'Frozen Kingdom',
    theme: 'Frozen Kingdom',
    subtitle: 'Blizzard peaks & Frost Colossus',
    levelRangeStr: 'Levels 21-30',
    globalRange: [21, 30],
    bgGradient: 'from-sky-900/60 to-slate-900',
    borderColor: 'border-sky-500/50',
  },
  {
    id: 4,
    name: 'WORLD 4',
    shortTitle: 'Volcanic Lands',
    theme: 'Volcanic Lands',
    subtitle: 'Ash wastelands & Magma Overlord',
    levelRangeStr: 'Levels 31-40',
    globalRange: [31, 40],
    bgGradient: 'from-orange-900/60 to-slate-900',
    borderColor: 'border-orange-500/50',
  },
  {
    id: 5,
    name: 'WORLD 5',
    shortTitle: 'Ancient Temple',
    theme: 'Ancient Temple',
    subtitle: 'Sacred ruins & Ancient Guardian Monarch',
    levelRangeStr: 'Levels 41-50',
    globalRange: [41, 50],
    bgGradient: 'from-yellow-900/60 to-slate-900',
    borderColor: 'border-yellow-500/50',
  },
  {
    id: 6,
    name: 'WORLD 6',
    shortTitle: 'Dark Swamp',
    theme: 'Dark Swamp',
    subtitle: 'Murky bogs & Swamp Behemoth',
    levelRangeStr: 'Levels 51-60',
    globalRange: [51, 60],
    bgGradient: 'from-emerald-950/80 to-slate-900',
    borderColor: 'border-emerald-600/50',
  },
  {
    id: 7,
    name: 'WORLD 7',
    shortTitle: 'Sky Fortress',
    theme: 'Sky Fortress',
    subtitle: 'Floating spires & Sky Citadel Titan',
    levelRangeStr: 'Levels 61-70',
    globalRange: [61, 70],
    bgGradient: 'from-cyan-900/60 to-slate-900',
    borderColor: 'border-cyan-500/50',
  },
  {
    id: 8,
    name: 'WORLD 8',
    shortTitle: 'Cursed City',
    theme: 'Cursed City',
    subtitle: 'Spectral streets & Cursed Spectral King',
    levelRangeStr: 'Levels 71-80',
    globalRange: [71, 80],
    bgGradient: 'from-purple-900/60 to-slate-900',
    borderColor: 'border-purple-500/50',
  },
  {
    id: 9,
    name: 'WORLD 9',
    shortTitle: 'Demon Realm',
    theme: 'Demon Realm',
    subtitle: 'Infernal rifts & Demon Archon',
    levelRangeStr: 'Levels 81-90',
    globalRange: [81, 90],
    bgGradient: 'from-rose-950/80 to-slate-900',
    borderColor: 'border-rose-500/50',
  },
  {
    id: 10,
    name: 'WORLD 10',
    shortTitle: 'Final Realm',
    theme: 'Final Realm',
    subtitle: 'Starlight throne & Ultimate Overlord',
    levelRangeStr: 'Levels 91-100',
    globalRange: [91, 100],
    bgGradient: 'from-indigo-900/60 to-slate-900',
    borderColor: 'border-amber-400/70',
  },
];

export class LevelRegistry {
  private static worldsMap: Map<number, WorldDefinition> = new Map();
  private static levelsMap: Map<string, LevelConfig> = new Map();

  static {
    LevelRegistry.initialize();
  }

  public static initialize(): void {
    LevelRegistry.worldsMap.clear();
    LevelRegistry.levelsMap.clear();

    WORLD_REGISTRY_DATA.forEach((wData) => {
      const levels = getLevelsForWorld(wData.id);
      const worldDef: WorldDefinition = {
        ...wData,
        name: WORLD_NAMES[wData.id] || wData.name,
        levels,
      };

      LevelRegistry.worldsMap.set(wData.id, worldDef);
      levels.forEach((lvl) => {
        LevelRegistry.levelsMap.set(lvl.id, lvl);
      });
    });
  }

  public static getWorlds(): WorldDefinition[] {
    if (LevelRegistry.worldsMap.size === 0) {
      LevelRegistry.initialize();
    }
    return Array.from(LevelRegistry.worldsMap.values());
  }

  public static getWorld(worldId: number): WorldDefinition | undefined {
    if (LevelRegistry.worldsMap.size === 0) {
      LevelRegistry.initialize();
    }
    return LevelRegistry.worldsMap.get(worldId);
  }

  public static getLevelsForWorld(worldId: number): LevelConfig[] {
    const world = LevelRegistry.getWorld(worldId);
    return world ? world.levels : getLevelsForWorld(worldId);
  }

  public static getLevel(levelId: string): LevelConfig | undefined {
    if (LevelRegistry.levelsMap.size === 0) {
      LevelRegistry.initialize();
    }
    return LevelRegistry.levelsMap.get(levelId);
  }

  public static getAllLevels(): LevelConfig[] {
    if (LevelRegistry.levelsMap.size === 0) {
      LevelRegistry.initialize();
    }
    return Array.from(LevelRegistry.levelsMap.values());
  }

  public static getTotalWorldCount(): number {
    return 10;
  }

  public static getTotalLevelCount(): number {
    return 100;
  }
}
