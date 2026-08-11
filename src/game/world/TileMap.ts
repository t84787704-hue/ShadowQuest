import { Rect } from '../../types/game';
import { Entity } from '../entities/Entity';
import { getTilePalette } from '../render/EnvironmentRenderer';

export enum TileType {
  EMPTY = 0,
  GRASS_TOP = 1,
  DIRT_MIDDLE = 2,
  STONE_PLATFORM = 3,
  WOOD_BRIDGE = 4,
  HAZARD_SPIKES = 5,
  BREAKABLE_WALL = 6,
  FAKE_WALL = 7,
}

export class TileMap {
  public tileSize: number = 32;
  public cols: number;
  public rows: number;
  public grid: number[][];
  public widthInPixels: number;
  public heightInPixels: number;
  public levelId: string;

  constructor(cols: number, rows: number, gridData: number[][], levelId: string = '1-1') {
    this.cols = cols;
    this.rows = rows;
    this.grid = gridData;
    this.widthInPixels = cols * this.tileSize;
    this.heightInPixels = rows * this.tileSize;
    this.levelId = levelId;
  }

  public getTileAtPixel(x: number, y: number): number {
    const col = Math.floor(x / this.tileSize);
    const row = Math.floor(y / this.tileSize);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return TileType.EMPTY;
    }
    return this.grid[row][col];
  }

  public getTile(col: number, row: number): number {
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
      tile === TileType.WOOD_BRIDGE ||
      tile === TileType.BREAKABLE_WALL
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

    const palette = getTilePalette(this.levelId);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.grid[r][c];
        if (tile === TileType.EMPTY) continue;

        const px = Math.round(c * this.tileSize - offsetX);
        const py = Math.round(r * this.tileSize - offsetY);

        switch (tile) {
          case TileType.GRASS_TOP:
            // Earth Dirt Base
            ctx.fillStyle = palette.topBase;
            ctx.fillRect(px, py + 8, this.tileSize, this.tileSize - 8);

            // Soil texture detail
            ctx.fillStyle = palette.middlePebble1;
            ctx.fillRect(px + 4, py + 18, 3, 3);
            ctx.fillRect(px + 22, py + 14, 4, 4);

            // Top Cover Layer
            ctx.fillStyle = palette.topCover;
            ctx.fillRect(px, py, this.tileSize, 8);

            // Bright Blades
            ctx.fillStyle = palette.topBlades;
            ctx.fillRect(px + 2, py - 3, 3, 5);
            ctx.fillRect(px + 10, py - 4, 4, 6);
            ctx.fillRect(px + 18, py - 3, 3, 5);
            ctx.fillRect(px + 26, py - 4, 4, 6);

            // Detail accent occasionally
            if ((c * 7 + r) % 5 === 0 && palette.flowerColor) {
              ctx.fillStyle = palette.flowerColor;
              ctx.fillRect(px + 12, py - 6, 3, 3);
            }
            break;

          case TileType.DIRT_MIDDLE:
            // Soil Dirt Tile
            ctx.fillStyle = palette.middleDirt;
            ctx.fillRect(px, py, this.tileSize, this.tileSize);

            // Pebble and rock inclusions
            ctx.fillStyle = palette.middlePebble1;
            ctx.fillRect(px + 6, py + 6, 6, 6);
            ctx.fillRect(px + 20, py + 18, 5, 5);
            ctx.fillStyle = palette.middlePebble2;
            ctx.fillRect(px + 14, py + 8, 4, 4);
            break;

          case TileType.STONE_PLATFORM:
            // Stone Platform Tile
            ctx.fillStyle = palette.stoneMain;
            ctx.fillRect(px, py, this.tileSize, this.tileSize);

            // Mortar Outlines
            ctx.strokeStyle = palette.stoneStroke;
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

            // Accent Top Layer
            ctx.fillStyle = palette.stoneAccent;
            ctx.fillRect(px, py, this.tileSize, 3);
            break;

          case TileType.WOOD_BRIDGE:
            // Wooden Plank Bridge Tile
            ctx.fillStyle = palette.woodMain;
            ctx.fillRect(px, py + 4, this.tileSize, 16);

            // Plank Gaps
            ctx.fillStyle = palette.woodGap;
            ctx.fillRect(px + 10, py + 4, 2, 16);
            ctx.fillRect(px + 22, py + 4, 2, 16);

            // Iron/Metal Nails
            ctx.fillStyle = palette.woodNails;
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

          case TileType.BREAKABLE_WALL:
            // Cracked Brick / Wall Block with golden crack highlights
            ctx.fillStyle = palette.stoneMain;
            ctx.fillRect(px, py, this.tileSize, this.tileSize);

            ctx.strokeStyle = palette.stoneStroke;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px, py, this.tileSize, this.tileSize);

            // Visible Crack Lines & Golden Glow
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px + 4, py + 6);
            ctx.lineTo(px + 14, py + 18);
            ctx.lineTo(px + 22, py + 12);
            ctx.lineTo(px + 28, py + 26);
            ctx.stroke();

            // Subtle sparkling clue particle dots
            const timeGlow = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(250, 204, 21, ${0.4 + timeGlow * 0.4})`;
            ctx.fillRect(px + 8, py + 8, 3, 3);
            ctx.fillRect(px + 20, py + 20, 3, 3);
            break;

          case TileType.FAKE_WALL:
            // Fake Passage Wall - looks like stone but with a faint shimmering curtain
            ctx.fillStyle = palette.stoneMain;
            ctx.fillRect(px, py, this.tileSize, this.tileSize);

            // Translucent Shimmer overlay
            const shimmerPulse = Math.sin(Date.now() * 0.004 + c * 0.5) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(56, 189, 248, ${0.12 + shimmerPulse * 0.18})`;
            ctx.fillRect(px, py, this.tileSize, this.tileSize);

            // Subtle vine or fissure outline hint
            ctx.strokeStyle = palette.stoneAccent;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px + 16, py);
            ctx.lineTo(px + 16, py + this.tileSize);
            ctx.stroke();
            break;
        }
      }
    }
  }
}
