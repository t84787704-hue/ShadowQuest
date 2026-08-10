import React from 'react';
import { ArrowLeft, Heart, Magnet, Zap, PlusCircle, CheckCircle, Shield } from 'lucide-react';
import { GameScreen, SaveData } from '../types/game';
import { SaveSystem } from '../game/save/SaveSystem';
import { audioEngine } from '../game/audio/AudioEngine';
import { WEAPONS, WEAPON_ORDER, isWeaponUnlocked } from '../game/weapons/WeaponData';

interface UpgradesMenuProps {
  saveData: SaveData;
  onNavigate: (screen: GameScreen) => void;
  onSaveUpdate: (updatedSave: SaveData) => void;
}

export const UpgradesMenu: React.FC<UpgradesMenuProps> = ({
  saveData,
  onNavigate,
  onSaveUpdate,
}) => {
  const handleBack = () => {
    audioEngine.playButtonClick();
    onNavigate('MAIN_MENU');
  };

  const getUpgradeCost = (currentLvl: number) => (currentLvl + 1) * 20;

  const handleBuy = (key: keyof SaveData['upgrades']) => {
    const currentLvl = saveData.upgrades[key] || 0;
    const cost = getUpgradeCost(currentLvl);

    const result = SaveSystem.purchaseUpgrade(key, cost);
    if (result.success) {
      audioEngine.playCoinPickup();
      onSaveUpdate(result.data);
    } else {
      audioEngine.playEnemyHit(); // Denied sound
    }
  };

  const handleEquipWeapon = (weaponId: string) => {
    audioEngine.playButtonClick();
    const updated = { ...saveData, equippedWeaponId: weaponId };
    SaveSystem.save(updated);
    onSaveUpdate(updated);
  };

  const currentEquippedId = saveData.equippedWeaponId || 'basic_sword';

  const items = [
    {
      key: 'maxHealth' as const,
      name: 'MAX HEALTH BOOST',
      desc: '+15 Max HP per level',
      icon: Heart,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      currentLvl: saveData.upgrades.maxHealth || 0,
    },
    {
      key: 'attackPower' as const,
      name: 'MARTIAL STRIKE POWER',
      desc: '+5 Punch & Kick Damage per level',
      icon: Zap,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      currentLvl: saveData.upgrades.attackPower || 0,
    },
    {
      key: 'coinMagnet' as const,
      name: 'COIN MAGNET',
      desc: 'Attracts gold coins from further away',
      icon: Magnet,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      currentLvl: saveData.upgrades.coinMagnet || 0,
    },
    {
      key: 'moveSpeed' as const,
      name: 'HERO SPEED',
      desc: 'Increases Blaze running speed',
      icon: Zap,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/30',
      currentLvl: saveData.upgrades.moveSpeed || 0,
    },
  ];

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 flex flex-col p-6 text-slate-100 select-none overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold transition text-slate-300"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK TO MENU
        </button>

        <h2 className="text-xl font-black text-amber-400 tracking-wider">
          HERO UPGRADES & MARTIAL MASTERY
        </h2>

        <div className="text-xs text-amber-300 font-mono font-bold bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
          🪙 Coins: {saveData.coins}
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Martial Stances Section */}
        <div>
          <h3 className="text-sm font-black text-sky-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            MARTIAL ARTS STANCES & STYLES
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {WEAPON_ORDER.map((wId) => {
              const weapon = WEAPONS[wId];
              const unlocked = isWeaponUnlocked(wId, saveData);
              const isEquipped = currentEquippedId === wId;

              return (
                <div
                  key={wId}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                    isEquipped
                      ? 'bg-sky-950/80 border-sky-500 shadow-lg shadow-sky-950/50'
                      : unlocked
                      ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                      : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xl">{weapon.icon}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                        {weapon.baseDamage} DMG
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-100">{weapon.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {weapon.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    {!unlocked ? (
                      <span className="text-slate-500 font-mono font-bold">
                        Unlocks World {weapon.unlockedAtLevel}
                      </span>
                    ) : isEquipped ? (
                      <span className="flex items-center gap-1 text-sky-400 font-bold uppercase">
                        <CheckCircle className="w-3.5 h-3.5" /> EQUIPPED STANCE
                      </span>
                    ) : (
                      <button
                        onClick={() => handleEquipWeapon(wId)}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-bold transition text-[10px]"
                      >
                        EQUIP STANCE
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upgrades List Section */}
        <div>
          <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-amber-400" />
            HERO STAT BOOSTS
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => {
              const cost = getUpgradeCost(item.currentLvl);
              const isMax = item.currentLvl >= 5;
              const canAfford = saveData.coins >= cost && !isMax;

              const IconComponent = item.icon;

              return (
                <div
                  key={item.key}
                  className={`p-4 rounded-xl border bg-slate-900/90 flex flex-col justify-between ${item.borderColor}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${item.bgColor} ${item.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-100">{item.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                    {/* Level Dots */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold mr-1">LVL</span>
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`w-2.5 h-2.5 rounded-full ${
                            lvl <= item.currentLvl ? 'bg-amber-400' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Buy Button */}
                    {isMax ? (
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                        MAX LEVEL
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuy(item.key)}
                        disabled={!canAfford}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        🪙 {cost}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
