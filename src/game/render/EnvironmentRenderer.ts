export interface TilePalette {
  topBase: string;
  topCover: string;
  topBlades: string;
  flowerColor?: string;
  middleDirt: string;
  middlePebble1: string;
  middlePebble2: string;
  stoneMain: string;
  stoneStroke: string;
  stoneAccent: string;
  woodMain: string;
  woodGap: string;
  woodNails: string;
}

// Tile Palettes by World
export function getTilePalette(levelId: string): TilePalette {
  const [wStr] = levelId.split('-');
  const w = parseInt(wStr, 10) || 1;

  switch (w) {
    case 2: // DESERT
      return {
        topBase: '#b45309',
        topCover: '#f59e0b',
        topBlades: '#fde047',
        flowerColor: '#fbbf24',
        middleDirt: '#b45309',
        middlePebble1: '#78350f',
        middlePebble2: '#d97706',
        stoneMain: '#d97706',
        stoneStroke: '#78350f',
        stoneAccent: '#f59e0b',
        woodMain: '#a16207',
        woodGap: '#78350f',
        woodNails: '#fef08a',
      };

    case 3: // ICE
      return {
        topBase: '#0284c7',
        topCover: '#e0f2fe',
        topBlades: '#ffffff',
        flowerColor: '#7dd3fc',
        middleDirt: '#1e40af',
        middlePebble1: '#1e3a8a',
        middlePebble2: '#38bdf8',
        stoneMain: '#38bdf8',
        stoneStroke: '#1e3a8a',
        stoneAccent: '#bae6fd',
        woodMain: '#475569',
        woodGap: '#1e293b',
        woodNails: '#94a3b8',
      };

    case 4: // VOLCANO
      return {
        topBase: '#18181b',
        topCover: '#27272a',
        topBlades: '#ef4444',
        flowerColor: '#dc2626',
        middleDirt: '#18181b',
        middlePebble1: '#09090b',
        middlePebble2: '#7f1d1d',
        stoneMain: '#3f3f46',
        stoneStroke: '#18181b',
        stoneAccent: '#b91c1c',
        woodMain: '#292524',
        woodGap: '#0c0a09',
        woodNails: '#ea580c',
      };

    case 5: // DARK LANDS
      return {
        topBase: '#1e1b4b',
        topCover: '#3b0764',
        topBlades: '#06b6d4',
        flowerColor: '#a855f7',
        middleDirt: '#1e1b4b',
        middlePebble1: '#0f172a',
        middlePebble2: '#581c87',
        stoneMain: '#334155',
        stoneStroke: '#0f172a',
        stoneAccent: '#a855f7',
        woodMain: '#1e293b',
        woodGap: '#020617',
        woodNails: '#38bdf8',
      };

    case 6: // GOBLIN KING CITADEL
      return {
        topBase: '#0f172a',
        topCover: '#1e293b',
        topBlades: '#f59e0b',
        flowerColor: '#fbbf24',
        middleDirt: '#0f172a',
        middlePebble1: '#020617',
        middlePebble2: '#475569',
        stoneMain: '#1e293b',
        stoneStroke: '#020617',
        stoneAccent: '#fbbf24',
        woodMain: '#78350f',
        woodGap: '#020617',
        woodNails: '#f59e0b',
      };

    case 1: // NATURE
    default:
      return {
        topBase: '#78350f',
        topCover: '#15803d',
        topBlades: '#22c55e',
        flowerColor: '#fef08a',
        middleDirt: '#78350f',
        middlePebble1: '#451a03',
        middlePebble2: '#a16207',
        stoneMain: '#475569',
        stoneStroke: '#1e293b',
        stoneAccent: '#16a34a',
        woodMain: '#92400e',
        woodGap: '#451a03',
        woodNails: '#cbd5e1',
      };
  }
}

export class EnvironmentRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    levelId: string,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number
  ) {
    const [wStr, lStr] = levelId.split('-');
    const w = parseInt(wStr, 10) || 1;
    const l = parseInt(lStr, 10) || 1;

    switch (w) {
      case 1:
        this.renderWorld1(ctx, l, offsetX, offsetY, width, height);
        break;
      case 2:
        this.renderWorld2(ctx, l, offsetX, offsetY, width, height);
        break;
      case 3:
        this.renderWorld3(ctx, l, offsetX, offsetY, width, height);
        break;
      case 4:
        this.renderWorld4(ctx, l, offsetX, offsetY, width, height);
        break;
      case 5:
        this.renderWorld5(ctx, l, offsetX, offsetY, width, height);
        break;
      case 6:
        this.renderWorld6(ctx, l, offsetX, offsetY, width, height);
        break;
      default:
        this.renderWorld1(ctx, 1, offsetX, offsetY, width, height);
        break;
    }
  }

  // ==================== WORLD 1: NATURE ADVENTURE ====================
  private static renderWorld1(
    ctx: CanvasRenderingContext2D,
    levelNum: number,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number
  ) {
    if (levelNum === 1) {
      // 1-1 Green Forest: Beautiful, rich, vibrant daylight woodland
      // 1. Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.4, '#38bdf8');
      skyGrad.addColorStop(0.7, '#7dd3fc');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Glowing Sun & Atmospheric Sun Rays
      const sunX = width * 0.78 - offsetX * 0.02;
      const sunY = 70 - offsetY * 0.02;

      // Sun Outer Glow
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 120);
      sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.6)');
      sunGlow.addColorStop(0.5, 'rgba(253, 224, 71, 0.25)');
      sunGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
      ctx.fill();

      // Core Sun Disc
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
      ctx.fill();

      // Gentle Sun Rays Filtering Down
      ctx.fillStyle = 'rgba(255, 255, 220, 0.06)';
      for (let r = 0; r < 4; r++) {
        const rayAngle = r * 0.3 + 0.4;
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(sunX - Math.cos(rayAngle) * 600, sunY + Math.sin(rayAngle) * 600);
        ctx.lineTo(sunX - Math.cos(rayAngle + 0.12) * 600, sunY + Math.sin(rayAngle + 0.12) * 600);
        ctx.closePath();
        ctx.fill();
      }

      // 3. Layer 1: Distant Majestic Mountain Peaks
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -50; x <= width + 50; x += 60) {
        const mountainY = height - 170 - Math.sin((x + offsetX * 0.08) * 0.005) * 65 - Math.cos(x * 0.01) * 20;
        ctx.lineTo(x, mountainY);
      }
      ctx.lineTo(width, height);
      ctx.fill();

      // Distant Mountain Snow / Highlight Peaks
      ctx.fillStyle = 'rgba(224, 242, 254, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -50; x <= width + 50; x += 60) {
        const peakY = height - 170 - Math.sin((x + offsetX * 0.08) * 0.005) * 65 - Math.cos(x * 0.01) * 20;
        ctx.lineTo(x, peakY + 12);
      }
      ctx.lineTo(width, height);
      ctx.fill();

      // 4. Layer 2: Mid-distance Forest Hills & Pine Canopy
      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -50; x <= width + 50; x += 40) {
        ctx.lineTo(x, height - 110 - Math.sin((x + offsetX * 0.22) * 0.01) * 40);
      }
      ctx.lineTo(width, height);
      ctx.fill();

      // Pine Silhouettes on Mid Hills
      const pineSpacing = 70;
      const startPine = Math.floor((offsetX * 0.22 - 100) / pineSpacing);
      ctx.fillStyle = '#0f766e';
      for (let i = startPine; i < startPine + 20; i++) {
        const px = i * pineSpacing - offsetX * 0.22;
        const py = height - 110 - Math.sin((i * pineSpacing) * 0.01) * 40;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 10, py + 28);
        ctx.lineTo(px + 10, py + 28);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(px, py - 8);
        ctx.lineTo(px - 7, py + 14);
        ctx.lineTo(px + 7, py + 14);
        ctx.closePath();
        ctx.fill();
      }

      // 5. Layer 3: Closer Parallax Ancient Oak Trees & Lush Boughs
      const oakSpacing = 220;
      const startOak = Math.floor((offsetX * 0.45 - 120) / oakSpacing);
      for (let i = startOak; i < startOak + 10; i++) {
        const tx = i * oakSpacing - offsetX * 0.45;
        const ty = height - 145 - (i % 3) * 15;

        // Textured Trunk & Branches
        ctx.fillStyle = '#451a03';
        ctx.fillRect(tx, ty, 20, 80);
        ctx.fillRect(tx - 18, ty + 15, 24, 10);
        ctx.fillRect(tx + 14, ty + 22, 22, 9);

        // Deep Shadow Foliage
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.arc(tx + 10, ty - 18, 38, 0, Math.PI * 2);
        ctx.arc(tx - 18, ty + 4, 28, 0, Math.PI * 2);
        ctx.arc(tx + 38, ty + 6, 28, 0, Math.PI * 2);
        ctx.fill();

        // Mid Green Foliage
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(tx + 8, ty - 22, 32, 0, Math.PI * 2);
        ctx.arc(tx - 14, ty + 2, 22, 0, Math.PI * 2);
        ctx.arc(tx + 30, ty + 2, 22, 0, Math.PI * 2);
        ctx.fill();

        // Bright Leaf Highlights
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(tx + 4, ty - 28, 22, 0, Math.PI * 2);
        ctx.arc(tx - 10, ty - 6, 15, 0, Math.PI * 2);
        ctx.arc(tx + 22, ty - 6, 15, 0, Math.PI * 2);
        ctx.fill();

        // Vines hanging down
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(tx - 12, ty + 22, 3, 24);
        ctx.fillRect(tx + 24, ty + 26, 3, 20);
      }

      // 6. Foreground Ambient Forest Details (Rocks, Boulders, Wildflowers)
      const fgSpacing = 180;
      const startFg = Math.floor((offsetX * 0.85 - 100) / fgSpacing);
      for (let i = startFg; i < startFg + 12; i++) {
        const fx = i * fgSpacing - offsetX * 0.85;
        const fy = height - 38;

        if (i % 2 === 0) {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(fx, fy, 14, Math.PI, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#16a34a';
          ctx.beginPath();
          ctx.arc(fx, fy - 6, 11, Math.PI * 1.1, Math.PI * 1.9);
          ctx.fill();
        } else {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(fx - 10, fy + 4, 20, 8);

          const flowerColors = ['#fef08a', '#f43f5e', '#38bdf8', '#facc15'];
          for (let f = -8; f <= 8; f += 5) {
            ctx.fillStyle = flowerColors[Math.abs(i + f) % flowerColors.length];
            ctx.beginPath();
            ctx.arc(fx + f, fy + 2, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Ambient Floating Leaf Spores in air
      const time = Date.now() * 0.0015;
      ctx.fillStyle = 'rgba(34, 197, 94, 0.65)';
      for (let p = 0; p < 12; p++) {
        const px = ((p * 110 + time * 35) % (width + 100)) - 50;
        const py = 120 + Math.sin(time + p) * 35 + (p * 25) % (height - 200);
        ctx.beginPath();
        ctx.arc(px, py, 2.5 + (p % 2), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (levelNum === 2) {
      // 1-2 Ancient Ruins: Overcast twilight sky, crumbling stone temples, grand ruin pillars, overgrown ivy, floating ancient spirit particles
      // 1. Twilight / Moody Overcast Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.4, '#1e293b');
      skyGrad.addColorStop(0.7, '#334155');
      skyGrad.addColorStop(1, '#475569');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Soft Sun Break Glow behind Clouds
      const sunX = width * 0.72 - offsetX * 0.03;
      const sunY = 90 - offsetY * 0.02;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 140);
      sunGlow.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
      sunGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
      sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 140, 0, Math.PI * 2);
      ctx.fill();

      // Soft God Rays through cloud breaks
      ctx.fillStyle = 'rgba(253, 224, 71, 0.04)';
      for (let r = 0; r < 5; r++) {
        const rayAngle = r * 0.28 + 0.3;
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(sunX - Math.cos(rayAngle) * 700, sunY + Math.sin(rayAngle) * 700);
        ctx.lineTo(sunX - Math.cos(rayAngle + 0.10) * 700, sunY + Math.sin(rayAngle + 0.10) * 700);
        ctx.closePath();
        ctx.fill();
      }

      // 2. Layer 1: Distant Ancient Temple Silhouette & Ruined Mountains
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -50; x <= width + 50; x += 50) {
        const mY = height - 160 - Math.sin((x + offsetX * 0.06) * 0.006) * 50;
        ctx.lineTo(x, mY);
      }
      ctx.lineTo(width, height);
      ctx.fill();

      // Distant Collapsed Temple Arches on Horizon
      const archSpacing = 320;
      const startArch = Math.floor((offsetX * 0.08 - 100) / archSpacing);
      ctx.fillStyle = '#1e293b';
      for (let i = startArch; i < startArch + 6; i++) {
        const ax = i * archSpacing - offsetX * 0.08;
        const ay = height - 210;
        ctx.fillRect(ax, ay, 20, 110);
        ctx.fillRect(ax + 70, ay, 20, 110);
        ctx.beginPath();
        ctx.arc(ax + 45, ay, 45, Math.PI, 0);
        ctx.fill();
      }

      // 3. Layer 2: Mid-ground Broken Columns & Fluted Ruined Pillars
      const pillarSpacing = 160;
      const startPillar = Math.floor((offsetX * 0.22 - 100) / pillarSpacing);
      for (let i = startPillar; i < startPillar + 12; i++) {
        const px = i * pillarSpacing - offsetX * 0.22;
        const py = height - 240 + (i % 3) * 15;

        // Main Column Body
        ctx.fillStyle = '#334155';
        ctx.fillRect(px, py, 32, 160);

        // Fluted Column lines
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px + 6, py, 4, 160);
        ctx.fillRect(px + 22, py, 4, 160);

        // Broken Capital Top
        ctx.fillStyle = '#475569';
        ctx.fillRect(px - 8, py - 12, 48, 16);

        // Overgrown Ivy / Moss on Columns
        ctx.fillStyle = '#15803d';
        ctx.fillRect(px + 2, py + 20, 12, 50);
        ctx.fillRect(px + 18, py + 60, 10, 45);
        ctx.beginPath();
        ctx.arc(px + 8, py + 72, 10, 0, Math.PI * 2);
        ctx.arc(px + 24, py + 107, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Layer 3: Closer Ruined Stone Archways & Wall Sections
      const wallSpacing = 280;
      const startWall = Math.floor((offsetX * 0.45 - 120) / wallSpacing);
      for (let i = startWall; i < startWall + 8; i++) {
        const wx = i * wallSpacing - offsetX * 0.45;
        const wy = height - 160;

        // Ruined Wall Blocks
        ctx.fillStyle = '#475569';
        ctx.fillRect(wx, wy, 80, 70);
        ctx.fillRect(wx + 15, wy - 30, 50, 30);

        // Mortar lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.strokeRect(wx, wy, 80, 70);
        ctx.beginPath();
        ctx.moveTo(wx, wy + 35);
        ctx.lineTo(wx + 80, wy + 35);
        ctx.stroke();

        // Hanging Vines
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(wx + 10, wy + 10, 4, 40);
        ctx.fillRect(wx + 40, wy - 20, 3, 55);
        ctx.fillRect(wx + 65, wy + 20, 4, 35);
      }

      // 5. Foreground Ambient Floating Ancient Particles
      const time = Date.now() * 0.0012;
      for (let p = 0; p < 16; p++) {
        const px = ((p * 95 + time * 28) % (width + 80)) - 40;
        const py = 100 + Math.sin(time * 1.2 + p * 0.8) * 40 + (p * 22) % (height - 180);
        ctx.fillStyle = p % 2 === 0 ? 'rgba(250, 204, 21, 0.65)' : 'rgba(56, 189, 248, 0.60)';
        ctx.beginPath();
        ctx.arc(px, py, 2.0 + (p % 3) * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (levelNum === 3) {
      // 1-3 River Valley: Flowing water at horizon, sunrise horizon, stone bridge arches
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.5, '#60a5fa');
      skyGrad.addColorStop(1, '#fed7aa');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant Mountains
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -50; x <= width + 50; x += 60) {
        ctx.lineTo(x, height - 160 - Math.sin((x + offsetX * 0.15) * 0.007) * 55);
      }
      ctx.lineTo(width, height);
      ctx.fill();

      // Flowing River Horizon Strip
      const riverY = height - 70;
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, riverY, width, 70);
      ctx.fillStyle = '#38bdf8';
      const wave = Math.sin(Date.now() / 300) * 8;
      for (let x = 0; x < width; x += 60) {
        ctx.fillRect(x + wave, riverY + 12, 30, 4);
        ctx.fillRect(x - wave + 20, riverY + 32, 25, 3);
      }
    } else if (levelNum === 4) {
      // 1-4 Misty Peaks: Cool high mountain peaks with fog layers
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.5, '#334155');
      skyGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Jagged High Peaks
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -50; x <= width + 50; x += 70) {
        const peakY = height - 220 - Math.abs(Math.sin((x + offsetX * 0.12) * 0.009)) * 90;
        ctx.lineTo(x, peakY);
      }
      ctx.lineTo(width, height);
      ctx.fill();

      // Drifting Fog/Mist Bands
      const mistShift = (Date.now() / 50) % width;
      ctx.fillStyle = 'rgba(241, 245, 249, 0.25)';
      ctx.fillRect(0, height - 150, width, 45);
      ctx.fillRect(-mistShift, height - 100, width * 2, 35);
    } else {
      // 1-5 Mountain Fortress: Dramatic sunset sky, ancient fortress silhouette
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#451a03');
      skyGrad.addColorStop(0.4, '#9a3412');
      skyGrad.addColorStop(0.8, '#f97316');
      skyGrad.addColorStop(1, '#fde047');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Fortress Castle Silhouette
      const fortX = width * 0.5 - offsetX * 0.15;
      ctx.fillStyle = '#1c1917';
      // Main Keep
      ctx.fillRect(fortX, height - 240, 140, 160);
      // Towers
      ctx.fillRect(fortX - 30, height - 280, 45, 200);
      ctx.fillRect(fortX + 125, height - 280, 45, 200);
      // Spire tops
      ctx.beginPath();
      ctx.moveTo(fortX - 30, height - 280);
      ctx.lineTo(fortX - 8, height - 320);
      ctx.lineTo(fortX + 15, height - 280);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(fortX + 125, height - 280);
      ctx.lineTo(fortX + 147, height - 320);
      ctx.lineTo(fortX + 170, height - 280);
      ctx.fill();
    }
  }

  // ==================== WORLD 2: DESERT ====================
  private static renderWorld2(
    ctx: CanvasRenderingContext2D,
    levelNum: number,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number
  ) {
    if (levelNum === 1) {
      // 2-1 Desert: Bright hot sky, blazing sun, golden sand dunes, palm trees
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#b45309');
      skyGrad.addColorStop(0.4, '#f59e0b');
      skyGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Blazing Sun
      const sunX = width * 0.7 - offsetX * 0.02;
      ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
      ctx.beginPath();
      ctx.arc(sunX, 65, 75, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sunX, 65, 32, 0, Math.PI * 2);
      ctx.fill();

      // Far Sand Dunes
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -50; x <= width + 50; x += 50) {
        ctx.lineTo(x, height - 130 - Math.sin((x + offsetX * 0.15) * 0.007) * 40);
      }
      ctx.lineTo(width, height);
      ctx.fill();

      // Near Dunes
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -50; x <= width + 50; x += 40) {
        ctx.lineTo(x, height - 85 - Math.sin((x + offsetX * 0.35) * 0.01) * 25);
      }
      ctx.lineTo(width, height);
      ctx.fill();

      // Palm Trees
      const palmSpacing = 220;
      const startPalm = Math.floor((offsetX * 0.5 - 100) / palmSpacing);
      for (let i = startPalm; i < startPalm + 8; i++) {
        const px = i * palmSpacing - offsetX * 0.5;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px, height - 120, 10, 50);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(px + 5, height - 125, 24, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (levelNum === 2) {
      // 2-2 Ancient Desert Ruins: Sandstone obelisks, temple pillars, warm golden hour sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#7c2d12');
      skyGrad.addColorStop(0.5, '#ea580c');
      skyGrad.addColorStop(1, '#fde047');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Sandstone Obelisks in parallax
      const obeliskSpacing = 200;
      const startO = Math.floor((offsetX * 0.25 - 100) / obeliskSpacing);
      for (let i = startO; i < startO + 8; i++) {
        const ox = i * obeliskSpacing - offsetX * 0.25;
        ctx.fillStyle = '#b45309';
        ctx.fillRect(ox, height - 230, 22, 160);
        // Pyramid top
        ctx.beginPath();
        ctx.moveTo(ox, height - 230);
        ctx.lineTo(ox + 11, height - 255);
        ctx.lineTo(ox + 22, height - 230);
        ctx.fill();
      }

      // Dunes
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -50; x <= width + 50; x += 50) {
        ctx.lineTo(x, height - 100 - Math.sin((x + offsetX * 0.3) * 0.008) * 30);
      }
      ctx.lineTo(width, height);
      ctx.fill();
    } else if (levelNum === 3) {
      // 2-3 Canyon: Towering red cliff walls on both sides
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#881337');
      skyGrad.addColorStop(0.5, '#9f1239');
      skyGrad.addColorStop(1, '#fb923c');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Massive Red Rock Cliffs
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -50; x <= width + 50; x += 60) {
        ctx.lineTo(x, height - 200 - Math.sin((x + offsetX * 0.2) * 0.01) * 60);
      }
      ctx.lineTo(width, height);
      ctx.fill();
    } else if (levelNum === 4) {
      // 2-4 Sandstorm: Dark amber sky, swirling sand particles overlay
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#78350f');
      skyGrad.addColorStop(0.5, '#b45309');
      skyGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Swirling Sand Particle haze
      ctx.fillStyle = 'rgba(254, 240, 138, 0.3)';
      const stormShift = (Date.now() / 20) % width;
      for (let i = 0; i < 40; i++) {
        const sx = (i * 90 + stormShift) % (width + 100) - 50;
        const sy = (i * 27) % height;
        ctx.fillRect(sx, sy, 25, 3);
      }
    } else {
      // 2-5 Desert Temple: Twilight desert sky, massive Egyptian/desert temple facade
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#451a03');
      skyGrad.addColorStop(0.5, '#b45309');
      skyGrad.addColorStop(1, '#fde047');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Temple Facade
      const tempX = width * 0.45 - offsetX * 0.15;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(tempX, height - 250, 220, 170);
      // Grand Portal Door
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(tempX + 70, height - 170, 80, 90);
      // Statues flanking portal
      ctx.fillStyle = '#b45309';
      ctx.fillRect(tempX + 30, height - 190, 25, 110);
      ctx.fillRect(tempX + 165, height - 190, 25, 110);
    }
  }

  // ==================== WORLD 3: ICE ====================
  private static renderWorld3(
    ctx: CanvasRenderingContext2D,
    levelNum: number,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number
  ) {
    if (levelNum === 1) {
      // 3-1 Snow Forest: Crisp winter sky, snow-capped pine trees
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.5, '#0284c7');
      skyGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Snowy Pines
      const pineSpacing = 140;
      const startPine = Math.floor((offsetX * 0.4 - 100) / pineSpacing);
      for (let i = startPine; i < startPine + 12; i++) {
        const px = i * pineSpacing - offsetX * 0.4;
        const py = height - 140;
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(px, py + 60);
        ctx.lineTo(px + 15, py);
        ctx.lineTo(px + 30, py + 60);
        ctx.fill();
        // Snow top
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(px + 5, py + 20);
        ctx.lineTo(px + 15, py);
        ctx.lineTo(px + 25, py + 20);
        ctx.fill();
      }
    } else if (levelNum === 2) {
      // 3-2 Frozen Lake: Bright ice sky, crystalline lake reflection in background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0369a1');
      skyGrad.addColorStop(0.5, '#38bdf8');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Snowy Mountains
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -50; x <= width + 50; x += 60) {
        ctx.lineTo(x, height - 170 - Math.sin((x + offsetX * 0.15) * 0.008) * 50);
      }
      ctx.lineTo(width, height);
      ctx.fill();

      // Frozen Lake Surface
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, height - 60, width, 60);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, height - 60, width, 4);
    } else if (levelNum === 3) {
      // 3-3 Ice Caves: Deep blue icy cavern interior, glowing cyan icicles
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.5, '#1e3a8a');
      skyGrad.addColorStop(1, '#1e40af');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Icicles hanging from top
      ctx.fillStyle = '#38bdf8';
      for (let x = 0; x < width + 40; x += 30) {
        const iceLen = 30 + Math.abs(Math.sin(x * 0.05)) * 40;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 10, iceLen);
        ctx.lineTo(x + 20, 0);
        ctx.fill();
      }
    } else if (levelNum === 4) {
      // 3-4 Blizzard Peaks: Heavy wind-blown snow effect, sharp icy peaks
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.5, '#1e293b');
      skyGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Falling Snow Flakes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const snowShift = (Date.now() / 15) % width;
      for (let i = 0; i < 60; i++) {
        const sx = (i * 70 - snowShift) % (width + 100) + 50;
        const sy = (i * 19 + Date.now() / 20) % height;
        ctx.fillRect(sx, sy, 3, 3);
      }
    } else {
      // 3-5 Ice Fortress: Aurora Borealis dancing overhead, giant frozen citadel
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Aurora Borealis
      const auroraGrad = ctx.createLinearGradient(0, 40, width, 120);
      auroraGrad.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
      auroraGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.5)');
      auroraGrad.addColorStop(1, 'rgba(168, 85, 247, 0.4)');
      ctx.fillStyle = auroraGrad;
      ctx.beginPath();
      ctx.moveTo(0, 80);
      for (let x = 0; x <= width; x += 40) {
        ctx.lineTo(x, 70 + Math.sin((x + Date.now() / 100) * 0.01) * 30);
      }
      ctx.lineTo(width, 160);
      ctx.lineTo(0, 160);
      ctx.fill();

      // Ice Fortress Spires
      const fortX = width * 0.5 - offsetX * 0.12;
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(fortX, height - 230, 120, 150);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(fortX + 10, height - 230);
      ctx.lineTo(fortX + 60, height - 290);
      ctx.lineTo(fortX + 110, height - 230);
      ctx.fill();
    }
  }

  // ==================== WORLD 4: VOLCANO ====================
  private static renderWorld4(
    ctx: CanvasRenderingContext2D,
    levelNum: number,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number
  ) {
    if (levelNum === 1) {
      // 4-1 Volcanic Valley: Dark ash sky, smoking volcano peaks, lava rivers in background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#1c1917');
      skyGrad.addColorStop(0.5, '#44403c');
      skyGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Volcanic Mountains
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -50; x <= width + 50; x += 80) {
        ctx.lineTo(x, height - 180 - Math.abs(Math.sin((x + offsetX * 0.12) * 0.008)) * 80);
      }
      ctx.lineTo(width, height);
      ctx.fill();

      // Lava River at bottom background
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(0, height - 40, width, 40);
    } else if (levelNum === 2) {
      // 4-2 Lava Caves: Dark basalt cave, glowing red lava pools along bottom
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#18181b');
      skyGrad.addColorStop(0.7, '#27272a');
      skyGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Lava Falls in background
      for (let x = 120; x < width + 100; x += 220) {
        const lx = x - (offsetX * 0.2) % 220;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(lx, 0, 16, height);
      }
    } else if (levelNum === 3) {
      // 4-3 Burning Mountain: Active erupting volcano peak in background with ash clouds
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#450a0a');
      skyGrad.addColorStop(0.5, '#991b1b');
      skyGrad.addColorStop(1, '#dc2626');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Erupting Peak
      const volcX = width * 0.6 - offsetX * 0.15;
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(volcX - 120, height);
      ctx.lineTo(volcX - 30, height - 240);
      ctx.lineTo(volcX + 30, height - 240);
      ctx.lineTo(volcX + 120, height);
      ctx.fill();

      // Eruption Glow & Plume
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(volcX, height - 240, 40, 0, Math.PI * 2);
      ctx.fill();
    } else if (levelNum === 4) {
      // 4-4 Magma Fortress: Dark obsidian fortress with fiery red sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#2e1065');
      skyGrad.addColorStop(0.5, '#7f1d1d');
      skyGrad.addColorStop(1, '#ef4444');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Obsidian Fortress
      const fortX = width * 0.5 - offsetX * 0.15;
      ctx.fillStyle = '#09090b';
      ctx.fillRect(fortX, height - 230, 150, 150);
      // Glowing Lava Windows
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(fortX + 30, height - 190, 20, 30);
      ctx.fillRect(fortX + 100, height - 190, 20, 30);
    } else {
      // 4-5 Volcano Boss Arena: Giant volcanic caldera, massive roaring lava falls, embers
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#180202');
      skyGrad.addColorStop(0.4, '#450a0a');
      skyGrad.addColorStop(0.8, '#b91c1c');
      skyGrad.addColorStop(1, '#f97316');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Falling Ember Particles
      ctx.fillStyle = '#fde047';
      const emberShift = (Date.now() / 10) % height;
      for (let i = 0; i < 35; i++) {
        const ex = (i * 85) % width;
        const ey = (height - ((i * 37 + emberShift) % height));
        ctx.fillRect(ex, ey, 3, 3);
      }
    }
  }

  // ==================== WORLD 5: DARK LANDS ====================
  private static renderWorld5(
    ctx: CanvasRenderingContext2D,
    levelNum: number,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number
  ) {
    if (levelNum === 1) {
      // 5-1 Haunted Forest: Eerie purple sky, full pale moon, gnarled dead trees, purple fog
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#090d16');
      skyGrad.addColorStop(0.5, '#1e1b4b');
      skyGrad.addColorStop(1, '#3b0764');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Pale Moon
      const moonX = width * 0.75 - offsetX * 0.02;
      ctx.fillStyle = 'rgba(241, 245, 249, 0.2)';
      ctx.beginPath();
      ctx.arc(moonX, 70, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.arc(moonX, 70, 24, 0, Math.PI * 2);
      ctx.fill();

      // Gnarled Dead Trees
      const treeSpacing = 160;
      const startT = Math.floor((offsetX * 0.45 - 100) / treeSpacing);
      for (let i = startT; i < startT + 10; i++) {
        const tx = i * treeSpacing - offsetX * 0.45;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(tx, height - 150, 12, 80);
        // Spooky branches
        ctx.beginPath();
        ctx.moveTo(tx + 6, height - 120);
        ctx.lineTo(tx - 20, height - 160);
        ctx.lineTo(tx + 26, height - 170);
        ctx.stroke();
      }
    } else if (levelNum === 2) {
      // 5-2 Ruined Village: Dark stormy night, abandoned broken cottages
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(0.5, '#111827');
      skyGrad.addColorStop(1, '#1f2937');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Cottage Silhouettes
      const houseSpacing = 220;
      const startH = Math.floor((offsetX * 0.3 - 100) / houseSpacing);
      for (let i = startH; i < startH + 8; i++) {
        const hx = i * houseSpacing - offsetX * 0.3;
        ctx.fillStyle = '#030712';
        ctx.fillRect(hx, height - 160, 90, 80);
        // Broken roof
        ctx.beginPath();
        ctx.moveTo(hx - 10, height - 160);
        ctx.lineTo(hx + 35, height - 200);
        ctx.lineTo(hx + 100, height - 160);
        ctx.fill();
      }
    } else if (levelNum === 3) {
      // 5-3 Shadow Caves: Bioluminescent magenta/cyan mushrooms and crystal clusters
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(0.6, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Glowing Mushroom Clusters
      for (let x = 80; x < width + 100; x += 180) {
        const mx = x - (offsetX * 0.3) % 180;
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(mx, height - 80, 18, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(mx + 30, height - 70, 12, Math.PI, 0);
        ctx.fill();
      }
    } else if (levelNum === 4) {
      // 5-4 Dark Castle: Gothic storm sky, dark castle spires with gargoyles
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, '#0f172a');
      skyGrad.addColorStop(1, '#312e81');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Gothic Castle Spires
      const fortX = width * 0.5 - offsetX * 0.15;
      ctx.fillStyle = '#020617';
      ctx.fillRect(fortX, height - 250, 140, 170);
      ctx.beginPath();
      ctx.moveTo(fortX + 10, height - 250);
      ctx.lineTo(fortX + 70, height - 320);
      ctx.lineTo(fortX + 130, height - 250);
      ctx.fill();
    } else {
      // 5-5 Final Castle/Boss Arena: Blood-red moon sky, supreme dark lord throne arena
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#180202');
      skyGrad.addColorStop(0.4, '#450a0a');
      skyGrad.addColorStop(0.8, '#881337');
      skyGrad.addColorStop(1, '#312e81');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Blood Red Moon
      const moonX = width * 0.5 - offsetX * 0.02;
      ctx.fillStyle = 'rgba(225, 29, 72, 0.3)';
      ctx.beginPath();
      ctx.arc(moonX, 90, 65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(moonX, 90, 32, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ==================== WORLD 6: GOBLIN KING'S CITADEL ====================
  private static renderWorld6(
    ctx: CanvasRenderingContext2D,
    levelNum: number,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number
  ) {
    if (levelNum === 1) {
      // 6-1 Citadel Gates: Stormy crimson/violet sky, iron gates
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, '#1e1b4b');
      skyGrad.addColorStop(1, '#831843');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Iron Gate Towers
      const gateX = width * 0.5 - offsetX * 0.15;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(gateX - 40, height - 260, 50, 180);
      ctx.fillRect(gateX + 110, height - 260, 50, 180);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(gateX + 20, height - 200, 80, 10);
    } else if (levelNum === 2) {
      // 6-2 Ancient Citadel Ruins: Weathered arches, gargoyle battlements
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#090d16');
      skyGrad.addColorStop(0.5, '#1e293b');
      skyGrad.addColorStop(1, '#475569');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Ruined Stone Pillars
      for (let x = 100; x < width + 100; x += 200) {
        const px = x - (offsetX * 0.2) % 200;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, height - 240, 26, 170);
      }
    } else if (levelNum === 3) {
      // 6-3 Inner Keep: Towering peak spires, lightning sky flashes
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, '#311b92');
      skyGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant Spire
      const spireX = width * 0.5 - offsetX * 0.1;
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(spireX - 40, height);
      ctx.lineTo(spireX, height - 310);
      ctx.lineTo(spireX + 40, height);
      ctx.fill();
    } else if (levelNum === 4) {
      // 6-4 Royal Chambers: Royal purple & golden hall banners
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#1e1b4b');
      skyGrad.addColorStop(0.5, '#581c87');
      skyGrad.addColorStop(1, '#831843');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Royal Banners in background
      for (let x = 80; x < width + 100; x += 160) {
        const bx = x - (offsetX * 0.15) % 160;
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(bx, 40, 30, 100);
        ctx.fillStyle = '#be123c';
        ctx.fillRect(bx + 4, 44, 22, 90);
      }
    } else {
      // 6-5 GOBLIN KING'S THRONE ROOM (FINAL BATTLE): Royal Gold & Crimson Throne Room
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#450a0a');
      skyGrad.addColorStop(0.4, '#7f1d1d');
      skyGrad.addColorStop(0.8, '#f59e0b');
      skyGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Colossal Golden Throne in background
      const throneX = width * 0.5 - offsetX * 0.05;
      ctx.fillStyle = '#b45309';
      ctx.fillRect(throneX - 50, height - 220, 100, 140);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(throneX - 40, height - 210, 80, 120);
      ctx.fillStyle = '#be123c'; // Ruby back cushion
      ctx.fillRect(throneX - 30, height - 190, 60, 90);

      // Crown ornament atop throne
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(throneX - 25, height - 220);
      ctx.lineTo(throneX - 15, height - 245);
      ctx.lineTo(throneX, height - 225);
      ctx.lineTo(throneX + 15, height - 245);
      ctx.lineTo(throneX + 25, height - 220);
      ctx.fill();

      // Burning Golden Braziers
      const brazierShift = Math.sin(Date.now() / 150) * 4;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(throneX - 110, height - 130 + brazierShift, 16, 0, Math.PI * 2);
      ctx.arc(throneX + 110, height - 130 + brazierShift, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
