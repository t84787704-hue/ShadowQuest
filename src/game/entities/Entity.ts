import { Rect } from '../../types/game';

export class Entity {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public vx: number = 0;
  public vy: number = 0;
  public facingRight: boolean = true;
  public isGrounded: boolean = false;
  public isAlive: boolean = true;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  public getBounds(): Rect {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  public intersects(other: Entity | Rect): boolean {
    const r1 = this.getBounds();
    const r2 = 'getBounds' in other ? other.getBounds() : other;
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }
}
