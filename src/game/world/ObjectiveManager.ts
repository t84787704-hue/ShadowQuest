export type LevelObjectiveType =
  | 'DEFEAT_50_ENEMIES'
  | 'REACH_EXIT'
  | 'SURVIVE_TIME'
  | 'COLLECT_RUNES'
  | 'ACTIVATE_SWITCHES'
  | 'SURVIVE_AND_EXIT'
  | 'DEFEAT_BOSS';

export interface LevelObjectiveDef {
  type: LevelObjectiveType;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
}

export function parseLevelId(levelId: string): { worldId: number; levelNum: number } {
  const parts = levelId.split('-');
  const worldId = parseInt(parts[0], 10) || 1;
  const levelNum = parseInt(parts[1], 10) || 1;
  return { worldId, levelNum };
}

export function getLevelObjective(levelId: string): LevelObjectiveDef {
  const { worldId, levelNum } = parseLevelId(levelId);
  const isBoss = levelNum === 10;

  if (isBoss) {
    return {
      type: 'DEFEAT_BOSS',
      title: worldId === 1 ? 'DEFEAT GOBLIN CHIEFTAIN' : 'DEFEAT WORLD BOSS',
      description: worldId === 1 ? 'Defeat the Goblin Chieftain to unlock World 2!' : 'Defeat the Boss to unlock the exit portal!',
      targetValue: 1,
      currentValue: 0,
      isCompleted: false,
    };
  }

  if (worldId === 1) {
    const w1Configs: Record<number, { target: number; title: string; desc: string }> = {
      1: { target: 12, title: 'DEFEAT 12 ENEMIES', desc: 'Defeat 12 easy small enemies in Tutorial Valley!' },
      2: { target: 20, title: 'DEFEAT 20 ENEMIES', desc: 'Defeat 20 small enemies across the Broken Bridge!' },
      3: { target: 25, title: 'DEFEAT 25 ENEMIES', desc: 'Survive the Forest Ambush and defeat 25 enemies!' },
      4: { target: 30, title: 'DEFEAT 30 ENEMIES', desc: 'Defeat 30 enemies using the High Ground platforms!' },
      5: { target: 30, title: 'DEFEAT 30 ENEMIES', desc: "Infiltrate Monster's Den and defeat 30 enemies including the Heavy Monster!" },
      6: { target: 35, title: 'DEFEAT 35 ENEMIES', desc: 'Navigate the Moving Forest and defeat 35 enemies!' },
      7: { target: 40, title: 'DEFEAT 40 ENEMIES', desc: 'Survive Trap Valley hazards and defeat 40 enemies!' },
      8: { target: 40, title: 'DEFEAT 40 ENEMIES', desc: 'Clear the Dark Grove of 40 dangerous enemies!' },
      9: { target: 45, title: 'DEFEAT 45 ENEMIES', desc: 'Battle through 45 enemies on the Final Approach!' },
    };

    const cfg = w1Configs[levelNum] || { target: 50, title: 'DEFEAT 50 ENEMIES', desc: 'Defeat 50 martial arts enemies to unlock the exit portal!' };
    return {
      type: 'DEFEAT_50_ENEMIES',
      title: cfg.title,
      description: cfg.desc,
      targetValue: cfg.target,
      currentValue: 0,
      isCompleted: false,
    };
  }

  return {
    type: 'DEFEAT_50_ENEMIES',
    title: 'DEFEAT 50 ENEMIES',
    description: 'Defeat 50 martial arts enemies to unlock the exit portal!',
    targetValue: 50,
    currentValue: 0,
    isCompleted: false,
  };
}
