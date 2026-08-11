import React from 'react';
import { Pause, Heart, Coins } from 'lucide-react';

interface HUDProps {
  currentHp: number;
  maxHp: number;
  coins: number;
  levelTitle: string;
  weaponName?: string;
  weaponIcon?: string;
  onPauseClick: () => void;
  onDebugClick?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  currentHp,
  maxHp,
  coins,
  levelTitle,
  weaponName,
  weaponIcon,
  onPauseClick,
  onDebugClick,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

  return (
    <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-none z-10 select-none">
      {/* Top Left: HP Bar, Coins & Weapon */}
      <div className="flex flex-col gap-1.5">
        {/* Health Bar */}
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700/80 rounded-full px-3 py-1.5 shadow-lg">
          <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
          <div className="flex flex-col">
            <div className="flex justify-between items-center text-xs text-slate-200 font-bold mb-0.5">
              <span>HP</span>
              <span>{Math.ceil(currentHp)} / {maxHp}</span>
            </div>
            <div className="w-28 sm:w-36 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 transition-all duration-300 rounded-full"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Coins Counter & Weapon Indicator Row */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-amber-500/30 rounded-full px-3 py-1 w-fit shadow-lg">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-amber-300 font-black text-xs sm:text-sm tracking-wide">
              🪙 {coins}
            </span>
          </div>

          {weaponName && (
            <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur border border-sky-500/40 rounded-full px-2.5 py-1 w-fit shadow-lg">
              <span className="text-xs">{weaponIcon || '👊'}</span>
              <span className="text-sky-300 font-bold text-xs tracking-wide">
                {weaponName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Top Center: Level Title */}
      <div className="hidden sm:flex bg-slate-900/70 backdrop-blur border border-slate-700/60 rounded-lg px-4 py-1 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
          {levelTitle}
        </span>
      </div>

      {/* Top Right: Debug & Pause Buttons */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {onDebugClick && (
          <button
            onClick={onDebugClick}
            className="w-10 h-10 bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 border border-amber-500/50 rounded-xl flex items-center justify-center shadow-lg transition cursor-pointer"
            title="Open Developer Debug Menu"
          >
            <span className="text-base">🛠️</span>
          </button>
        )}

        <button
          onClick={onPauseClick}
          className="w-10 h-10 bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-200 border border-slate-700 rounded-xl flex items-center justify-center shadow-lg transition cursor-pointer"
          title="Pause Game"
        >
          <Pause className="w-5 h-5 text-amber-400 fill-amber-400" />
        </button>
      </div>
    </div>
  );
};
