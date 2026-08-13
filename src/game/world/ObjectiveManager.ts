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
  const { levelNum } = parseLevelId(levelId);
  const isBoss = levelNum === 10;

  if (isBoss) {
    return {
      type: 'DEFEAT_BOSS',
      title: 'DEFEAT WORLD BOSS',
      description: 'Defeat the Boss to unlock the exit portal!',
      targetValue: 1,
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
