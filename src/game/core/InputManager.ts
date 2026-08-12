import { InputState } from '../../types/game';

export class InputManager {
  private state: InputState = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    kick: false,
    down: false,
    spinKick: false,
  };

  private prevJump: boolean = false;
  private prevAttack: boolean = false;
  private prevKick: boolean = false;

  constructor() {
    this.bindKeyboardEvents();
  }

  private bindKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
        this.state.left = true;
      }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) {
        this.state.right = true;
      }
      if (['ArrowDown', 's', 'S'].includes(e.key)) {
        this.state.down = true;
      }
      if (['c', 'C', 'z', 'Z'].includes(e.key)) {
        this.state.spinKick = true;
      }
      if (['Space', ' ', 'ArrowUp', 'w', 'W'].includes(e.key)) {
        this.state.jump = true;
        e.preventDefault();
      }
      if (['j', 'J', 'f', 'F', 'x', 'X'].includes(e.key)) {
        this.state.attack = true;
        e.preventDefault();
      }
      if (['k', 'K', 'v', 'V'].includes(e.key)) {
        this.state.kick = true;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
        this.state.left = false;
      }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) {
        this.state.right = false;
      }
      if (['ArrowDown', 's', 'S'].includes(e.key)) {
        this.state.down = false;
      }
      if (['c', 'C', 'z', 'Z'].includes(e.key)) {
        this.state.spinKick = false;
      }
      if (['Space', ' ', 'ArrowUp', 'w', 'W'].includes(e.key)) {
        this.state.jump = false;
      }
      if (['j', 'J', 'f', 'F', 'x', 'X'].includes(e.key)) {
        this.state.attack = false;
      }
      if (['k', 'K', 'v', 'V'].includes(e.key)) {
        this.state.kick = false;
      }
    });
  }

  public setTouchState(action: keyof InputState, active: boolean) {
    this.state[action] = active;
  }

  public getState(): InputState {
    return { ...this.state };
  }

  // Helper to trigger jump press once
  public isJumpJustPressed(): boolean {
    const justPressed = this.state.jump && !this.prevJump;
    return justPressed;
  }

  // Helper to trigger attack press once
  public isAttackJustPressed(): boolean {
    const justPressed = this.state.attack && !this.prevAttack;
    return justPressed;
  }

  public updatePreviousState() {
    this.prevJump = this.state.jump;
    this.prevAttack = this.state.attack;
    this.prevKick = this.state.kick;
  }

  public resetAll() {
    this.state.left = false;
    this.state.right = false;
    this.state.jump = false;
    this.state.attack = false;
    this.state.kick = false;
    this.state.down = false;
    this.state.spinKick = false;
    this.prevJump = false;
    this.prevAttack = false;
    this.prevKick = false;
  }
}
