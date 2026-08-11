import { SaveData } from '../../types/game';

export interface WeaponDef {
  id: string;
  name: string;
  icon: string;
  baseDamage: number;
  bladeColor: string;
  glowColor: string;
  sparkColors: string[];
  description: string;
  unlockedAtLevel: string;
  specialEffect?: 'ICE_SLOW' | 'FLAME_BURN' | 'SHADOW_CRIT' | 'GOLDEN_RADIANCE' | 'CELESTIAL_BURST';
}

export const WEAPONS: Record<string, WeaponDef> = {
  basic_sword: {
    id: 'basic_sword',
    name: 'Iron Fist Stance',
    icon: '👊',
    baseDamage: 11,
    bladeColor: '#f8fafc',
    glowColor: '#38bdf8',
    sparkColors: ['#38bdf8', '#fef08a'],
    description: 'Fundamental martial arts stance utilizing rapid jab and cross punches.',
    unlockedAtLevel: '1-1',
  },
  iron_sword: {
    id: 'iron_sword',
    name: 'Iron Knuckle Stance',
    icon: '🥊',
    baseDamage: 15,
    bladeColor: '#cbd5e1',
    glowColor: '#94a3b8',
    sparkColors: ['#94a3b8', '#e2e8f0', '#fbbf24'],
    description: 'Reinforced fist technique for heavier strikes and crushing kicks.',
    unlockedAtLevel: '2-1',
  },
  ice_blade: {
    id: 'ice_blade',
    name: 'Frost Palm Style',
    icon: '❄️',
    baseDamage: 19,
    bladeColor: '#e0f2fe',
    glowColor: '#06b6d4',
    sparkColors: ['#38bdf8', '#06b6d4', '#e0f2fe'],
    description: 'Glacial hand strikes that slow enemy movement on hit.',
    unlockedAtLevel: '3-1',
    specialEffect: 'ICE_SLOW',
  },
  flame_sword: {
    id: 'flame_sword',
    name: 'Flame Dragon Stance',
    icon: '🔥',
    baseDamage: 24,
    bladeColor: '#fef08a',
    glowColor: '#f97316',
    sparkColors: ['#f97316', '#ef4444', '#fde047'],
    description: 'Volcanic hand-to-hand style that ignites targets with burning impact.',
    unlockedAtLevel: '4-1',
    specialEffect: 'FLAME_BURN',
  },
  shadow_blade: {
    id: 'shadow_blade',
    name: 'Shadow Strike Style',
    icon: '🔮',
    baseDamage: 30,
    bladeColor: '#f3e8ff',
    glowColor: '#a855f7',
    sparkColors: ['#c084fc', '#a855f7', '#7e22ce'],
    description: 'Void martial arts style with a chance to deal critical shadow strikes.',
    unlockedAtLevel: '5-1',
    specialEffect: 'SHADOW_CRIT',
  },
  legendary_sword: {
    id: 'legendary_sword',
    name: 'Golden Palm Stance',
    icon: '👑',
    baseDamage: 36,
    bladeColor: '#fef9c3',
    glowColor: '#eab308',
    sparkColors: ['#facc15', '#eab308', '#ffffff'],
    description: 'Sacred martial art passed down through hero champions.',
    unlockedAtLevel: '6-1',
    specialEffect: 'GOLDEN_RADIANCE',
  },
  blaze_sovereign: {
    id: 'blaze_sovereign',
    name: 'Blaze Sovereign Fist',
    icon: '✨',
    baseDamage: 44,
    bladeColor: '#ffffff',
    glowColor: '#f43f5e',
    sparkColors: ['#f43f5e', '#3b82f6', '#eab308', '#10b981'],
    description: 'The supreme celestial martial art empowered to slay the Goblin King!',
    unlockedAtLevel: '6-5',
    specialEffect: 'CELESTIAL_BURST',
  },
};

export const WEAPON_ORDER = [
  'basic_sword',
  'iron_sword',
  'ice_blade',
  'flame_sword',
  'shadow_blade',
  'legendary_sword',
  'blaze_sovereign',
];

export function isWeaponUnlocked(weaponId: string, saveData: SaveData, currentLevelId?: string): boolean {
  if (weaponId === 'basic_sword') return true;

  const unlockedWorlds = saveData.unlockedWorlds || [1];
  const completed = saveData.completedLevels || [];

  let maxCompletedWorld = 1;
  for (const lvlId of completed) {
    const [wStr] = lvlId.split('-');
    const w = parseInt(wStr, 10);
    if (w > maxCompletedWorld) maxCompletedWorld = w;
  }

  const [curWStr, curLStr] = (currentLevelId || '1-1').split('-');
  const curW = parseInt(curWStr, 10) || 1;
  const curL = parseInt(curLStr, 10) || 1;

  switch (weaponId) {
    case 'iron_sword':
      return unlockedWorlds.includes(2) || maxCompletedWorld >= 1 || curW >= 2;
    case 'ice_blade':
      return unlockedWorlds.includes(3) || maxCompletedWorld >= 2 || curW >= 3;
    case 'flame_sword':
      return unlockedWorlds.includes(4) || maxCompletedWorld >= 3 || curW >= 4;
    case 'shadow_blade':
      return unlockedWorlds.includes(5) || maxCompletedWorld >= 4 || curW >= 5;
    case 'legendary_sword':
      return unlockedWorlds.includes(6) || maxCompletedWorld >= 5 || curW >= 6;
    case 'blaze_sovereign':
      return (curW === 6 && curL === 5) || completed.includes('6-4') || completed.includes('6-5');
    default:
      return false;
  }
}

export function getHighestUnlockedWeapon(saveData: SaveData, currentLevelId?: string): WeaponDef {
  for (let i = WEAPON_ORDER.length - 1; i >= 0; i--) {
    const wId = WEAPON_ORDER[i];
    if (isWeaponUnlocked(wId, saveData, currentLevelId)) {
      return WEAPONS[wId];
    }
  }
  return WEAPONS.basic_sword;
}
