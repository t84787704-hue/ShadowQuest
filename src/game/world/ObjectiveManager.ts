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

  if (worldId <= 8) {
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

  // World 9 Objectives (Immortal Demon Realm)
  if (worldId === 9) {
    if (isBoss) {
      return {
        type: 'DEFEAT_BOSS',
        title: 'DEFEAT DEMON LORD',
        description: 'Defeat the Demon Archon Overlord to complete World 9!',
        targetValue: 1,
        currentValue: 0,
        isCompleted: false,
      };
    }
    switch (levelNum) {
      case 1:
        return {
          type: 'REACH_EXIT',
          title: 'ESCAPE DEMON REALM',
          description: 'Evade immortal demons and reach the exit portal!',
          targetValue: 1,
          currentValue: 0,
          isCompleted: true,
        };
      case 2:
        return {
          type: 'SURVIVE_TIME',
          title: 'SURVIVE DEMONIC PURSUIT',
          description: 'Survive for 30 seconds against immortal demons to unlock the exit!',
          targetValue: 30,
          currentValue: 0,
          isCompleted: false,
        };
      case 3:
        return {
          type: 'COLLECT_RUNES',
          title: 'COLLECT 5 ASTRAL RUNES',
          description: 'Collect all 5 Astral Runes to unseal the exit portal!',
          targetValue: 5,
          currentValue: 0,
          isCompleted: false,
        };
      case 4:
        return {
          type: 'ACTIVATE_SWITCHES',
          title: 'ACTIVATE 3 SANCTUARY ALTARS',
          description: 'Find and activate 3 Sanctuary Altars to unlock the portal!',
          targetValue: 3,
          currentValue: 0,
          isCompleted: false,
        };
      case 5:
        return {
          type: 'SURVIVE_AND_EXIT',
          title: 'SURVIVE & ESCAPE',
          description: 'Survive for 25 seconds, then reach the exit portal!',
          targetValue: 25,
          currentValue: 0,
          isCompleted: false,
        };
      case 6:
        return {
          type: 'COLLECT_RUNES',
          title: 'COLLECT 5 VOID RUNES',
          description: 'Collect all 5 Void Runes to open the gate!',
          targetValue: 5,
          currentValue: 0,
          isCompleted: false,
        };
      case 7:
        return {
          type: 'SURVIVE_TIME',
          title: 'SURVIVE THE GAUNTLET',
          description: 'Survive 35 seconds in the Gauntlet of Immortals!',
          targetValue: 35,
          currentValue: 0,
          isCompleted: false,
        };
      case 8:
        return {
          type: 'ACTIVATE_SWITCHES',
          title: 'ACTIVATE 4 DEMON ALTARS',
          description: 'Activate 4 Demon Altars to break the portal barrier!',
          targetValue: 4,
          currentValue: 0,
          isCompleted: false,
        };
      case 9:
        return {
          type: 'SURVIVE_AND_EXIT',
          title: 'FINAL PURSUIT SURVIVAL',
          description: 'Survive 30 seconds, then make your escape to the gate!',
          targetValue: 30,
          currentValue: 0,
          isCompleted: false,
        };
    }
  }

  // World 10 Objectives (Ultimate Celestial Realm)
  if (worldId === 10) {
    if (isBoss) {
      return {
        type: 'DEFEAT_BOSS',
        title: 'DEFEAT ULTIMATE OVERLORD',
        description: 'Defeat the Ultimate Overlord Sovereign to win the game!',
        targetValue: 1,
        currentValue: 0,
        isCompleted: false,
      };
    }
    switch (levelNum) {
      case 1:
        return {
          type: 'REACH_EXIT',
          title: 'CELESTIAL ESCAPE GAUNTLET',
          description: 'Navigate past immortal guardians and reach the portal!',
          targetValue: 1,
          currentValue: 0,
          isCompleted: true,
        };
      case 2:
        return {
          type: 'COLLECT_RUNES',
          title: 'COLLECT 5 STAR ORBS',
          description: 'Gather 5 Star Orbs to break the celestial barrier!',
          targetValue: 5,
          currentValue: 0,
          isCompleted: false,
        };
      case 3:
        return {
          type: 'SURVIVE_TIME',
          title: 'SURVIVE ASTRAL STORM',
          description: 'Survive for 35 seconds against Immortal Guardians!',
          targetValue: 35,
          currentValue: 0,
          isCompleted: false,
        };
      case 4:
        return {
          type: 'ACTIVATE_SWITCHES',
          title: 'ACTIVATE 4 STAR ALTARS',
          description: 'Activate all 4 Star Altars across the high platforms!',
          targetValue: 4,
          currentValue: 0,
          isCompleted: false,
        };
      case 5:
        return {
          type: 'COLLECT_RUNES',
          title: 'COLLECT 6 SOVEREIGN RUNES',
          description: 'Collect 6 Sovereign Runes to unlock the gate!',
          targetValue: 6,
          currentValue: 0,
          isCompleted: false,
        };
      case 6:
        return {
          type: 'SURVIVE_AND_EXIT',
          title: 'SURVIVE & REACH GATE',
          description: 'Survive 30 seconds, then reach the exit gate!',
          targetValue: 30,
          currentValue: 0,
          isCompleted: false,
        };
      case 7:
        return {
          type: 'ACTIVATE_SWITCHES',
          title: 'ACTIVATE 4 CELESTIAL SWITCHES',
          description: 'Activate 4 Celestial Switches to unlock the portal!',
          targetValue: 4,
          currentValue: 0,
          isCompleted: false,
        };
      case 8:
        return {
          type: 'COLLECT_RUNES',
          title: 'COLLECT 5 ZODIAC CRYSTALS',
          description: 'Collect 5 Zodiac Crystals to unseal the final approach!',
          targetValue: 5,
          currentValue: 0,
          isCompleted: false,
        };
      case 9:
        return {
          type: 'SURVIVE_TIME',
          title: 'PENULTIMATE SURVIVAL GAUNTLET',
          description: 'Survive 40 seconds of unrelenting immortal onslaught!',
          targetValue: 40,
          currentValue: 0,
          isCompleted: false,
        };
    }
  }

  return {
    type: 'REACH_EXIT',
    title: 'REACH THE EXIT',
    description: 'Reach the exit portal to complete the level!',
    targetValue: 1,
    currentValue: 0,
    isCompleted: true,
  };
}
