import { SecretRoomDef, LevelState } from '../../types/game';
import { Player } from './Player';
import { TileMap } from '../world/TileMap';
import { ParticleSystem } from '../core/ParticleSystem';
import { Camera } from '../core/Camera';
import { audioEngine } from '../audio/AudioEngine';
import { SaveSystem } from '../save/SaveSystem';
import { SecretRoom } from './SecretRoom';

export class SecretRoomManager {
  public secretRoomDefs: SecretRoomDef[];
  public rooms: SecretRoom[];
  public levelId: string;
  public discoveredCount: number = 0;
  public totalRooms: number = 0;
  public discoveredRoomIds: Set<number> = new Set();
  public claimedRewardIds: Set<number> = new Set();

  public discoveryBannerTimer: number = 0;
  public discoveryBannerText: string = '';
  public discoveryBannerSubtext: string = '';

  constructor(secretRooms: SecretRoomDef[], levelId: string) {
    this.secretRoomDefs = secretRooms || [];
    this.levelId = levelId;
    this.totalRooms = this.secretRoomDefs.length;

    // Load previously discovered rooms from SaveSystem
    const savedData = SaveSystem.load();
    const alreadyDiscovered = savedData.discoveredSecretRooms?.[levelId] || [];

    this.rooms = this.secretRoomDefs.map((def) => {
      const isFound = alreadyDiscovered.includes(def.id);
      if (isFound) {
        def.discovered = true;
        this.discoveredRoomIds.add(def.id);
      }
      return new SecretRoom(def, isFound);
    });

    this.discoveredCount = this.discoveredRoomIds.size;
  }

  public getLevelStatePartial(): Partial<LevelState> {
    return {
      secretRoomsFound: this.discoveredCount,
      totalSecretRooms: this.totalRooms,
    };
  }

  public update(
    dt: number,
    player: Player,
    tileMap: TileMap,
    particles: ParticleSystem,
    camera: Camera,
    spawnEliteEnemyCallback: (x: number, y: number, enemyClass: string, worldTheme: number) => void
  ) {
    if (this.discoveryBannerTimer > 0) {
      this.discoveryBannerTimer -= dt;
    }

    for (const room of this.rooms) {
      // 1. Check Secret Room Discovery
      if (!room.found) {
        const justDiscovered = room.checkDiscoveryTrigger(player, tileMap);

        if (justDiscovered) {
          this.discoveredRoomIds.add(room.def.id);
          this.discoveredCount = this.discoveredRoomIds.size;

          // Save discovery immediately
          SaveSystem.recordSecretRoomDiscovered(this.levelId, room.def.id);

          // Audio & Camera FX
          audioEngine.playSecretDiscovered();
          camera.addShake(0.2, 7);

          // Banner Notification
          this.discoveryBannerTimer = 3.8;
          this.discoveryBannerText = '✦ SECRET AREA DISCOVERED! ✦';
          this.discoveryBannerSubtext = room.def.title.toUpperCase();

          // Particle burst
          particles.createVictoryConfetti(room.def.entranceX + 16, room.def.entranceY + 16);
          particles.createFloatingText(
            player.x,
            player.y - 40,
            `🌟 SECRET ROOM (${this.discoveredCount}/${this.totalRooms})!`,
            '#facc15',
            20
          );

          // Performance-optimized spawn: Spawn elite room guardian only now!
          if (
            room.def.challengeType === 'ELITE_COMBAT' &&
            room.def.eliteEnemyX !== undefined &&
            room.def.eliteEnemyY !== undefined
          ) {
            const eClass = room.def.eliteEnemyClass || 'ELITE_FIGHTER';
            spawnEliteEnemyCallback(room.def.eliteEnemyX, room.def.eliteEnemyY, eClass, room.def.worldTheme);
          }
        }
      }

      // 2. Check Secret Reward Collection
      if (room.found && !room.rewardClaimed) {
        const justClaimed = room.checkRewardTrigger(player);

        if (justClaimed) {
          this.claimedRewardIds.add(room.def.id);

          // Apply Reward to Save System and Player
          const res = SaveSystem.claimSecretRoomReward(this.levelId, room.def.id, room.def.rewardType);

          audioEngine.playVictory();

          // Apply real-time player stat changes
          if (res.maxHpGain > 0) {
            player.stats.maxHp += res.maxHpGain;
            player.stats.currentHp = Math.min(player.stats.maxHp, player.stats.currentHp + 40); // Heal player on HP upgrade
          }
          if (res.attackGain > 0) {
            player.stats.attackDamage += res.attackGain;
          }

          // Visual Feedback
          particles.createVictoryConfetti(room.def.rewardX, room.def.rewardY);

          let rewardLabel = `+${res.coinGain} COINS!`;
          if (res.maxHpGain > 0) rewardLabel = `PERMANENT +${res.maxHpGain} MAX HP & FULL HEAL!`;
          if (res.attackGain > 0) rewardLabel = `PERMANENT +${res.attackGain} ATTACK DAMAGE!`;
          if (room.def.rewardType === 'ANCIENT_RELIC') rewardLabel = `🏆 ANCIENT RELIC UNLOCKED! +100 COINS!`;
          if (room.def.rewardType === 'RARE_WEAPON') rewardLabel = `⚔️ RARE MARTIAL BLADE UNLOCKED!`;

          particles.createFloatingText(room.def.rewardX, room.def.rewardY - 30, rewardLabel, '#38bdf8', 20);
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    for (const room of this.rooms) {
      room.render(ctx, offsetX, offsetY);
    }

    // Render Discovery Banner Overlay
    if (this.discoveryBannerTimer > 0) {
      const alpha = Math.min(1.0, this.discoveryBannerTimer);
      ctx.save();
      ctx.globalAlpha = alpha;

      const w = ctx.canvas.width;
      const bannerY = 85;

      // Dark Banner Bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;

      ctx.fillRect(w / 2 - 210, bannerY, 420, 52);
      ctx.strokeRect(w / 2 - 210, bannerY, 420, 52);

      // Main Text
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.discoveryBannerText, w / 2, bannerY + 22);

      // Subtitle Text
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(this.discoveryBannerSubtext, w / 2, bannerY + 40);

      ctx.restore();
    }
  }
}

