import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
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

  const upTriggeredRef = useRef<boolean>(false);
  const downTriggeredRef = useRef<boolean>(false);

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

    // Directional thresholds
    const normX = dx / (maxRadius || 1);
    const normY = dy / (maxRadius || 1);

    const deadzone = 0.20;
    const upThreshold = -0.45;
    const downThreshold = 0.45;

    // 1. HORIZONTAL MOVEMENT (LEFT / RIGHT)
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

    // 2. VERTICAL UP (JUMP)
    if (normY < upThreshold) {
      if (!upTriggeredRef.current) {
        upTriggeredRef.current = true;
        inputManager.setTouchState('jump', true);
        window.setTimeout(() => {
          inputManager.setTouchState('jump', false);
        }, 60);
      }
    } else if (normY >= upThreshold + 0.18) {
      // Returned toward center/neutral: re-arm jump trigger
      upTriggeredRef.current = false;
      inputManager.setTouchState('jump', false);
    }

    // 3. VERTICAL DOWN (CROUCH & SPINNING LOW KICK)
    if (normY > downThreshold) {
      inputManager.setTouchState('down', true);
      if (!downTriggeredRef.current) {
        downTriggeredRef.current = true;
        inputManager.setTouchState('spinKick', true);
        window.setTimeout(() => {
          inputManager.setTouchState('spinKick', false);
        }, 60);
      }
    } else if (normY <= downThreshold - 0.18) {
      // Returned toward center/neutral: re-arm spin kick trigger
      downTriggeredRef.current = false;
      inputManager.setTouchState('down', false);
      inputManager.setTouchState('spinKick', false);
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

    upTriggeredRef.current = false;
    downTriggeredRef.current = false;

    inputManager.setTouchState('left', false);
    inputManager.setTouchState('right', false);
    inputManager.setTouchState('jump', false);
    inputManager.setTouchState('down', false);
    inputManager.setTouchState('spinKick', false);
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
      inputManager.setTouchState('jump', false);
      inputManager.setTouchState('down', false);
      inputManager.setTouchState('spinKick', false);
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
        className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-slate-900/85 border-2 border-sky-500/60 shadow-[0_0_25px_rgba(56,189,248,0.3)] flex items-center justify-center relative touch-none pointer-events-auto cursor-pointer"
      >
        {/* Directional Action Indicators on Joystick Ring */}
        <div className="absolute top-1.5 flex flex-col items-center pointer-events-none opacity-75">
          <ArrowUp className="w-4 h-4 text-sky-400" />
          <span className="text-[8px] font-black text-sky-300 tracking-tighter -mt-0.5">JUMP</span>
        </div>

        <div className="absolute bottom-1.5 flex flex-col items-center pointer-events-none opacity-75">
          <span className="text-[8px] font-black text-amber-300 tracking-tighter -mb-0.5">SPIN</span>
          <RotateCw className="w-4 h-4 text-amber-400" />
        </div>

        <ChevronLeft className="absolute left-2 w-5 h-5 text-sky-400/60 pointer-events-none" />
        <ChevronRight className="absolute right-2 w-5 h-5 text-sky-400/60 pointer-events-none" />

        {/* Joystick Thumb / Knob */}
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-sky-400 via-sky-500 to-sky-700 border-2 border-sky-200 shadow-2xl flex items-center justify-center absolute pointer-events-none"
          style={{
            transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <div className="w-4 h-4 rounded-full bg-sky-100/90 border border-sky-300 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-600" />
          </div>
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

