import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { InputManager } from '../game/core/InputManager';

interface MobileControlsProps {
  inputManager: InputManager;
  opacity?: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  inputManager,
  opacity = 0.85,
}) => {
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    // Max movement radius inside base circle
    const maxRadius = rect.width / 2 - 12;
    const clampedDistance = Math.min(distance, maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDistance;
    const knobY = Math.sin(angle) * clampedDistance;

    setJoystickPos({ x: knobX, y: knobY });

    // Directional activation threshold based on horizontal offset
    const normX = dx / (maxRadius || 1);
    const deadzone = 0.18;

    if (normX < -deadzone) {
      inputManager.setTouchState('left', true);
      inputManager.setTouchState('right', false);
    } else if (normX > deadzone) {
      inputManager.setTouchState('right', true);
      inputManager.setTouchState('left', false);
    } else {
      inputManager.setTouchState('left', false);
      inputManager.setTouchState('right', false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!joystickRef.current) return;

    activePointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    setIsDragging(true);
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || e.pointerId !== activePointerIdRef.current) return;
    e.preventDefault();
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activePointerIdRef.current && activePointerIdRef.current !== null) return;
    e.preventDefault();

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}

    activePointerIdRef.current = null;
    setIsDragging(false);
    setJoystickPos({ x: 0, y: 0 });

    inputManager.setTouchState('left', false);
    inputManager.setTouchState('right', false);
  };

  // Action button touch handler (ATTACK, JUMP)
  const handleActionTouch = (action: 'jump' | 'attack', active: boolean) => (
    e: React.TouchEvent | React.MouseEvent
  ) => {
    e.preventDefault();
    inputManager.setTouchState(action, active);
  };

  // Safety cleanup on unmount
  useEffect(() => {
    return () => {
      inputManager.setTouchState('left', false);
      inputManager.setTouchState('right', false);
    };
  }, [inputManager]);

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-20 flex justify-between items-end p-4 sm:p-6"
      style={{ opacity }}
    >
      {/* Left Side: Virtual Joystick */}
      <div
        ref={joystickRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-900/80 border-2 border-sky-500/50 shadow-[0_0_20px_rgba(56,189,248,0.25)] flex items-center justify-center relative touch-none pointer-events-auto cursor-pointer"
      >
        {/* Subtle Directional Arrows */}
        <ChevronLeft className="absolute left-2.5 w-5 h-5 text-sky-400/50 pointer-events-none" />
        <ChevronRight className="absolute right-2.5 w-5 h-5 text-sky-400/50 pointer-events-none" />

        {/* Joystick Thumb / Knob */}
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-sky-400 via-sky-500 to-sky-700 border-2 border-sky-200 shadow-xl flex items-center justify-center absolute pointer-events-none"
          style={{
            transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-sky-100/80 border border-sky-300 shadow-inner" />
        </div>
      </div>

      {/* Right Side: Action Buttons (ATTACK, JUMP) */}
      <div className="flex gap-3 pointer-events-auto items-center">
        {/* ATTACK Button */}
        <button
          onTouchStart={handleActionTouch('attack', true)}
          onTouchEnd={handleActionTouch('attack', false)}
          onTouchCancel={handleActionTouch('attack', false)}
          onMouseDown={handleActionTouch('attack', true)}
          onMouseUp={handleActionTouch('attack', false)}
          onMouseLeave={handleActionTouch('attack', false)}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-600/80 active:bg-amber-500 text-amber-100 border-2 border-amber-400/60 active:border-amber-200 rounded-2xl flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all touch-none"
        >
          <span className="text-2xl sm:text-3xl leading-none">👊</span>
          <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">
            ATTACK
          </span>
        </button>

        {/* JUMP Button */}
        <button
          onTouchStart={handleActionTouch('jump', true)}
          onTouchEnd={handleActionTouch('jump', false)}
          onTouchCancel={handleActionTouch('jump', false)}
          onMouseDown={handleActionTouch('jump', true)}
          onMouseUp={handleActionTouch('jump', false)}
          onMouseLeave={handleActionTouch('jump', false)}
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

