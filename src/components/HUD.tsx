import React from 'react';
import { Pause, Heart, Coins } from 'lucide-react';

interface HUDProps {
  currentHp: number;
  maxHp: number;
  coins: number;
  levelTitle: string;
  weaponName?: string;
  weaponIcon?: string;
  isGodMode?: boolean;
  secretRoomsDiscovered?: number;
  totalSecretRooms?: number;
  onGodModeToggle?: () => void;
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
  isGodMode,
  secretRoomsDiscovered = 0,
  totalSecretRooms = 0,
  onGodModeToggle,
  onPauseClick,
  onDebugClick,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

  return (
    <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between pointer-events-none z-10 select-none">
      {/* Top Left: HP Bar, Coins, Secret Rooms & Weapon */}
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

        {/* Coins Counter, Weapon Indicator & Secret Rooms Row */}
        <div className="flex items-center gap-2 flex-wrap">
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

          {typeof totalSecretRooms === 'number' && totalSecretRooms > 0 && (
            <div
              className={`flex items-center gap-1.5 backdrop-blur border rounded-full px-2.5 py-1 w-fit shadow-lg transition-all duration-300 ${
                secretRoomsDiscovered > 0
                  ? 'bg-amber-950/90 border-amber-400/80 text-amber-300 shadow-amber-500/20'
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-300'
              }`}
            >
              <span className="text-xs">🔍</span>
              <span className="font-extrabold text-xs tracking-wide">
                SECRET ROOMS:{' '}
                <span
                  className={
                    secretRoomsDiscovered > 0
                      ? 'text-amber-300 font-black'
                      : 'text-slate-300 font-bold'
                  }
                >
                  {secretRoomsDiscovered}/{totalSecretRooms}
                </span>
              </span>
            </div>
          )}

          {onGodModeToggle && (
            <button
              onClick={onGodModeToggle}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider transition cursor-pointer pointer-events-auto border shadow-lg ${
                isGodMode
                  ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse shadow-amber-500/50'
                  : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-amber-300 hover:border-amber-500/50'
              }`}
              title="Toggle God Mode (Press 'G' key)"
            >
              <span>⚡</span>
              <span>{isGodMode ? 'GOD MODE ON' : 'GOD MODE'}</span>
            </button>
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
