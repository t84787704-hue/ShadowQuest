import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, Sword } from 'lucide-react';
import { InputManager } from '../game/core/InputManager';

interface MobileControlsProps {
  inputManager: InputManager;
  opacity?: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  inputManager,
  opacity = 0.85,
}) => {
  const handleTouch = (action: 'left' | 'right' | 'jump' | 'attack', active: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    inputManager.setTouchState(action, active);
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-20 flex justify-between items-end p-4 sm:p-6"
      style={{ opacity }}
    >
      {/* Left Side: D-Pad Navigation (LEFT, RIGHT) */}
      <div className="flex gap-3 pointer-events-auto items-center">
        <button
          onTouchStart={handleTouch('left', true)}
          onTouchEnd={handleTouch('left', false)}
          onTouchCancel={handleTouch('left', false)}
          onMouseDown={handleTouch('left', true)}
          onMouseUp={handleTouch('left', false)}
          onMouseLeave={handleTouch('left', false)}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900/80 active:bg-sky-600/90 text-slate-100 border-2 border-sky-500/40 active:border-sky-300 rounded-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-all touch-none"
        >
          <ChevronLeft className="w-10 h-10 stroke-[3]" />
        </button>

        <button
          onTouchStart={handleTouch('right', true)}
          onTouchEnd={handleTouch('right', false)}
          onTouchCancel={handleTouch('right', false)}
          onMouseDown={handleTouch('right', true)}
          onMouseUp={handleTouch('right', false)}
          onMouseLeave={handleTouch('right', false)}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900/80 active:bg-sky-600/90 text-slate-100 border-2 border-sky-500/40 active:border-sky-300 rounded-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-all touch-none"
        >
          <ChevronRight className="w-10 h-10 stroke-[3]" />
        </button>
      </div>

      {/* Right Side: Action Buttons (ATTACK, JUMP) */}
      <div className="flex gap-3 pointer-events-auto items-center">
        {/* ATTACK Button */}
        <button
          onTouchStart={handleTouch('attack', true)}
          onTouchEnd={handleTouch('attack', false)}
          onTouchCancel={handleTouch('attack', false)}
          onMouseDown={handleTouch('attack', true)}
          onMouseUp={handleTouch('attack', false)}
          onMouseLeave={handleTouch('attack', false)}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-600/80 active:bg-amber-500 text-amber-100 border-2 border-amber-400/60 active:border-amber-200 rounded-2xl flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all touch-none"
        >
          <Sword className="w-8 h-8 stroke-[2.5]" />
          <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">
            ATTACK
          </span>
        </button>

        {/* JUMP Button */}
        <button
          onTouchStart={handleTouch('jump', true)}
          onTouchEnd={handleTouch('jump', false)}
          onTouchCancel={handleTouch('jump', false)}
          onMouseDown={handleTouch('jump', true)}
          onMouseUp={handleTouch('jump', false)}
          onMouseLeave={handleTouch('jump', false)}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-sky-600/80 active:bg-sky-500 text-sky-100 border-2 border-sky-400/60 active:border-sky-200 rounded-2xl flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all touch-none"
        >
          <ArrowUp className="w-8 h-8 stroke-[2.5]" />
          <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">
            JUMP
          </span>
        </button>
      </div>
    </div>
  );
};
