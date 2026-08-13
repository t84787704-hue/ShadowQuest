import { InputState } from '../../types/game';

export class Input3DManager {
  private keys: { [key: string]: boolean } = {};
  private touchMoveX: number = 0;
  private touchMoveZ: number = 0;
  private touchJump: boolean = false;
  private touchAttack: boolean = false;
  private touchKick: boolean = false;

  private prevJump: boolean = false;
  private prevAttack: boolean = false;
  private prevKick: boolean = false;

  constructor() {
    this.bindKeyboard();
  }

  private bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (['Space', ' ', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  public setTouchJoystick(x: number, z: number) {
    this.touchMoveX = x;
    this.touchMoveZ = z;
  }

  public setTouchAction(action: 'jump' | 'attack' | 'kick', active: boolean) {
    if (action === 'jump') this.touchJump = active;
    if (action === 'attack') this.touchAttack = active;
    if (action === 'kick') this.touchKick = active;
  }

  public getMovementVector(): { x: number; z: number } {
    let x = 0;
    let z = 0;

    if (this.keys['a'] || this.keys['arrowleft']) x -= 1;
    if (this.keys['d'] || this.keys['arrowright']) x += 1;
    if (this.keys['w'] || this.keys['arrowup']) z -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) z += 1;

    // Add touch joystick contribution
    x += this.touchMoveX;
    z += this.touchMoveZ;

    // Normalize length if > 1
    const len = Math.hypot(x, z);
    if (len > 1) {
      x /= len;
      z /= len;
    }

    return { x, z };
  }

  public isJumpPressed(): boolean {
    return (
      Boolean(this.keys[' ']) ||
      Boolean(this.keys['space']) ||
      Boolean(this.keys['w']) ||
      Boolean(this.keys['arrowup']) ||
      this.touchJump
    );
  }

  public isJumpJustPressed(): boolean {
    const current = this.isJumpPressed();
    const justPressed = current && !this.prevJump;
    return justPressed;
  }

  public isAttackPressed(): boolean {
    return Boolean(this.keys['j']) || Boolean(this.keys['f']) || this.touchAttack;
  }

  public isKickPressed(): boolean {
    return Boolean(this.keys['k']) || Boolean(this.keys['v']) || this.touchKick;
  }

  public updatePreviousState() {
    this.prevJump = this.isJumpPressed();
    this.prevAttack = this.isAttackPressed();
    this.prevKick = this.isKickPressed();
  }

  public syncFrom2DInput(inputState: InputState) {
    if (inputState.left) this.touchMoveX = -1;
    else if (inputState.right) this.touchMoveX = 1;
    else this.touchMoveX = 0;

    this.touchJump = inputState.jump;
    this.touchAttack = inputState.attack;
    this.touchKick = inputState.kick;
  }

  public reset() {
    this.keys = {};
    this.touchMoveX = 0;
    this.touchMoveZ = 0;
    this.touchJump = false;
    this.touchAttack = false;
    this.touchKick = false;
    this.prevJump = false;
    this.prevAttack = false;
    this.prevKick = false;
  }
}
