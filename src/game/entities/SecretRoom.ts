import { SecretRoomDef } from '../../types/game';
import { Player } from './Player';
import { TileMap, TileType } from '../world/TileMap';

export class SecretRoom {
  public def: SecretRoomDef;
  public found: boolean = false;
  public rewardClaimed: boolean = false;

  constructor(def: SecretRoomDef, isFoundInitially: boolean = false) {
    this.def = def;
    this.found = isFoundInitially;
    this.rewardClaimed = !!def.rewardClaimed;
  }

  public checkDiscoveryTrigger(player: Player, tileMap: TileMap): boolean {
    if (this.found) return false;

    const pBounds = player.getBounds();

    // Check if player enters room bounding box
    const inRoomBounds =
      pBounds.x + pBounds.width >= this.def.x &&
      pBounds.x <= this.def.x + this.def.width &&
      pBounds.y + pBounds.height >= this.def.y &&
      pBounds.y <= this.def.y + this.def.height;

    // Check entrance tile
    const entranceCol = Math.floor(this.def.entranceX / tileMap.tileSize);
    const entranceRow = Math.floor(this.def.entranceY / tileMap.tileSize);
    const currentTile = tileMap.getTile(entranceCol, entranceRow);

    let isTriggered = false;

    if (this.def.entranceType === 'BREAKABLE_WALL') {
      if (currentTile === TileType.EMPTY || inRoomBounds) {
        isTriggered = true;
      }
    } else if (this.def.entranceType === 'FAKE_WALL') {
      if (inRoomBounds) {
        isTriggered = true;
      }
    } else {
      if (inRoomBounds) {
        isTriggered = true;
      }
    }

    if (isTriggered) {
      this.found = true;
      this.def.discovered = true;
      return true;
    }

    return false;
  }

  public checkRewardTrigger(player: Player): boolean {
    if (!this.found || this.rewardClaimed) return false;

    const pBounds = player.getBounds();
    const rewardRect = {
      x: this.def.rewardX - 20,
      y: this.def.rewardY - 20,
      width: 40,
      height: 40,
    };

    if (
      pBounds.x + pBounds.width >= rewardRect.x &&
      pBounds.x <= rewardRect.x + rewardRect.width &&
      pBounds.y + pBounds.height >= rewardRect.y &&
      pBounds.y <= rewardRect.y + rewardRect.height
    ) {
      this.rewardClaimed = true;
      this.def.rewardClaimed = true;
      return true;
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    const time = Date.now() * 0.003;

    // Entrance hint aura if not found
    if (!this.found) {
      const ex = Math.round(this.def.entranceX - offsetX);
      const ey = Math.round(this.def.entranceY - offsetY);

      ctx.save();
      const glow = Math.sin(time * 2) * 0.4 + 0.6;
      ctx.strokeStyle = `rgba(250, 204, 21, ${glow * 0.6})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(ex - 2, ey - 2, this.def.entranceWidth + 4, this.def.entranceHeight + 4);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✦', ex + this.def.entranceWidth / 2, ey - 6 + Math.sin(time * 3) * 3);
      ctx.restore();
    }

    // Secret Reward Altar / Chest if found & unclaimed
    if (this.found && !this.rewardClaimed) {
      const rx = Math.round(this.def.rewardX - offsetX);
      const ry = Math.round(this.def.rewardY - offsetY);

      ctx.save();

      // Glowing Aura Platform underneath reward
      const pulse = Math.sin(time * 3) * 4;
      const grad = ctx.createRadialGradient(rx, ry, 5, rx, ry, 35 + pulse);
      grad.addColorStop(0, 'rgba(250, 204, 21, 0.7)');
      grad.addColorStop(0.6, 'rgba(56, 189, 248, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rx, ry, 35 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Golden Treasure Chest / Relic Altar
      ctx.fillStyle = '#b45309';
      ctx.fillRect(rx - 16, ry - 12, 32, 24);

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx - 16, ry - 12, 32, 24);

      // Gold Band & Lock
      ctx.fillStyle = '#facc15';
      ctx.fillRect(rx - 16, ry - 2, 32, 4);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(rx - 4, ry - 4, 8, 8);

      // Floating Title above Altar
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✦ CLAIM SECRET TREASURE ✦', rx, ry - 22 + Math.sin(time * 4) * 3);

      ctx.restore();
    }
  }
}
