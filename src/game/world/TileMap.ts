import { Rect } from '../../types/game';
import { Entity } from '../entities/Entity';

export enum TileType {
  EMPTY = 0,
  GRASS_TOP = 1,
  DIRT_MIDDLE = 2,
  STONE_PLATFORM = 3,
  WOOD_BRIDGE = 4,
  HAZARD_SPIKES = 5,
}

export class TileMap {
  public tileSize: number = 32;
  public cols: number;
  public rows: number;
  public grid: number[][];
  public widthInPixels: number;
  public heightInPixels: number;

  constructor(cols: number, rows: number, gridData: number[][]) {
    this.cols = cols;
    this.rows = rows;
    this.grid = gridData;
    this.widthInPixels = cols * this.tileSize;
    this.heightInPixels = rows * this.tileSize;
  }

  public getTileAtPixel(x: number, y: number): number {
    const col = Math.floor(x / this.tileSize);
    const row = Math.floor(y / this.tileSize);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return TileType.EMPTY;
    }
    return this.grid[row][col];
  }

  public isSolidTile(tile: number): boolean {
    return (
      tile === TileType.GRASS_TOP ||
      tile === TileType.DIRT_MIDDLE ||
      tile === TileType.STONE_PLATFORM ||
      tile === TileType.WOOD_BRIDGE
    );
  }

  public resolveEntityCollision(entity: Entity) {
    // 1. Horizontal Movement & Collision
    entity.x += entity.vx;
    let bounds = entity.getBounds();

    const startCol = Math.floor(bounds.x / this.tileSize);
    const endCol = Math.floor((bounds.x + bounds.width) / this.tileSize);
    const startRow = Math.floor(bounds.y / this.tileSize);
    const endRow = Math.floor((bounds.y + bounds.height) / this.tileSize);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
          const tile = this.grid[r][c];
          if (this.isSolidTile(tile)) {
            const tileRect: Rect = {
              x: c * this.tileSize,
              y: r * this.tileSize,
              width: this.tileSize,
              height: this.tileSize,
            };

            if (this.checkAABB(bounds, tileRect)) {
              if (entity.vx > 0) {
                entity.x = tileRect.x - entity.width - 0.01;
                entity.vx = 0;
              } else if (entity.vx < 0) {
                entity.x = tileRect.x + tileRect.width + 0.01;
                entity.vx = 0;
              }
            }
          }
        }
      }
    }

    // 2. Vertical Movement & Collision
    entity.isGrounded = false;
    entity.y += entity.vy;
    bounds = entity.getBounds();

    const vStartCol = Math.floor(bounds.x / this.tileSize);
    const vEndCol = Math.floor((bounds.x + bounds.width) / this.tileSize);
    const vStartRow = Math.floor(bounds.y / this.tileSize);
    const vEndRow = Math.floor((bounds.y + bounds.height) / this.tileSize);

    for (let r = vStartRow; r <= vEndRow; r++) {
      for (let c = vStartCol; c <= vEndCol; c++) {
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
          const tile = this.grid[r][c];
          if (this.isSolidTile(tile)) {
            const tileRect: Rect = {
              x: c * this.tileSize,
              y: r * this.tileSize,
              width: this.tileSize,
              height: this.tileSize,
            };

            if (this.checkAABB(bounds, tileRect)) {
              if (entity.vy > 0) {
                entity.y = tileRect.y - entity.height;
                entity.vy = 0;
                entity.isGrounded = true;
              } else if (entity.vy < 0) {
                entity.y = tileRect.y + tileRect.height;
                entity.vy = 0;
              }
            }
          }
        }
      }
    }
  }

  private checkAABB(r1: Rect, r2: Rect): boolean {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number, viewportWidth: number, viewportHeight: number) {
    const startCol = Math.max(0, Math.floor(offsetX / this.tileSize));
    const endCol = Math.min(this.cols - 1, Math.ceil((offsetX + viewportWidth) / this.tileSize));
    const startRow = Math.max(0, Math.floor(offsetY / this.tileSize));
    const endRow = Math.min(this.rows - 1, Math.ceil((offsetY + viewportHeight) / this.tileSize));

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.grid[r][c];
        if (tile === TileType.EMPTY) continue;

        const px = Math.round(c * this.tileSize - offsetX);
        const py = Math.round(r * this.tileSize - offsetY);

        switch (tile) {
          case TileType.GRASS_TOP:
            // Earth Dirt Base
            ctx.fillStyle = '#78350f';
            ctx.fillRect(px, py + 8, this.tileSize, this.tileSize - 8);

            // Soil texture detail
            ctx.fillStyle = '#581c87';
            ctx.fillRect(px + 4, py + 18, 3, 3);
            ctx.fillRect(px + 22, py + 14, 4, 4);

            // Lush Organic Grass Top
            ctx.fillStyle = '#15803d'; // Rich Forest Green
            ctx.fillRect(px, py, this.tileSize, 8);

            // Bright Grass Blades
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(px + 2, py - 3, 3, 5);
            ctx.fillRect(px + 10, py - 4, 4, 6);
            ctx.fillRect(px + 18, py - 3, 3, 5);
            ctx.fillRect(px + 26, py - 4, 4, 6);

            // Small yellow wildflower detail occasionally
            if ((c * 7 + r) % 5 === 0) {
              ctx.fillStyle = '#fef08a';
              ctx.fillRect(px + 12, py - 6, 3, 3);
            }
            break;

          case TileType.DIRT_MIDDLE:
            // Soil Dirt Tile
            ctx.fillStyle = '#78350f';
            ctx.fillRect(px, py, this.tileSize, this.tileSize);

            // Pebble and rock inclusions
            ctx.fillStyle = '#451a03';
            ctx.fillRect(px + 6, py + 6, 6, 6);
            ctx.fillRect(px + 20, py + 18, 5, 5);
            ctx.fillStyle = '#a16207';
            ctx.fillRect(px + 14, py + 8, 4, 4);
            break;

          case TileType.STONE_PLATFORM:
            // Ancient Stone Platform Tile
            ctx.fillStyle = '#475569'; // Slate Stone
            ctx.fillRect(px, py, this.tileSize, this.tileSize);

            // Brick Mortar Outlines
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px, py, this.tileSize, this.tileSize);
            ctx.beginPath();
            ctx.moveTo(px, py + 16);
            ctx.lineTo(px + this.tileSize, py + 16);
            ctx.moveTo(px + 16, py);
            ctx.lineTo(px + 16, py + 16);
            ctx.moveTo(px + 8, py + 16);
            ctx.lineTo(px + 8, py + 32);
            ctx.stroke();

            // Mossy Top Layer
            ctx.fillStyle = '#16a34a';
            ctx.fillRect(px, py, this.tileSize, 3);
            break;

          case TileType.WOOD_BRIDGE:
            // Wooden Plank Bridge Tile
            ctx.fillStyle = '#92400e'; // Warm Wood
            ctx.fillRect(px, py + 4, this.tileSize, 16);

            // Plank Gaps
            ctx.fillStyle = '#451a03';
            ctx.fillRect(px + 10, py + 4, 2, 16);
            ctx.fillRect(px + 22, py + 4, 2, 16);

            // Iron Nails
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(px + 4, py + 6, 2, 2);
            ctx.fillRect(px + 16, py + 6, 2, 2);
            ctx.fillRect(px + 28, py + 6, 2, 2);
            break;

          case TileType.HAZARD_SPIKES:
            // Spikes with Blood/Metallic Gleam
            ctx.fillStyle = '#64748b';
            for (let i = 0; i < 4; i++) {
              ctx.beginPath();
              ctx.moveTo(px + i * 8, py + this.tileSize);
              ctx.lineTo(px + i * 8 + 4, py + this.tileSize - 18);
              ctx.lineTo(px + i * 8 + 8, py + this.tileSize);
              ctx.closePath();
              ctx.fill();

              // Sharp Silver Tip
              ctx.fillStyle = '#f8fafc';
              ctx.fillRect(px + i * 8 + 3, py + this.tileSize - 18, 2, 4);
              ctx.fillStyle = '#64748b';
            }
            break;
        }
      }
    }
  }
}
