export type WeatherType = 'LEAVES_AND_RAIN' | 'SAND_STORM' | 'SNOW' | 'EMBERS' | 'DARK_SPORES' | 'CASTLE_DUST';

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  vRot: number;
  swayPhase: number;
  swaySpeed: number;
  type: 'leaf' | 'rain' | 'snowflake' | 'ember' | 'sand' | 'spore';
}

export class WeatherSystem {
  private particles: WeatherParticle[] = [];
  private weatherType: WeatherType = 'LEAVES_AND_RAIN';
  private maxParticles: number = 60;
  private time: number = 0;

  public init(levelId: string) {
    const [wStr] = levelId.split('-');
    const w = parseInt(wStr, 10) || 1;

    switch (w) {
      case 2:
        this.weatherType = 'SAND_STORM';
        this.maxParticles = 50;
        break;
      case 3:
        this.weatherType = 'SNOW';
        this.maxParticles = 75;
        break;
      case 4:
        this.weatherType = 'EMBERS';
        this.maxParticles = 65;
        break;
      case 5:
        this.weatherType = 'DARK_SPORES';
        this.maxParticles = 50;
        break;
      case 6:
        this.weatherType = 'CASTLE_DUST';
        this.maxParticles = 45;
        break;
      case 1:
      default:
        this.weatherType = 'LEAVES_AND_RAIN';
        this.maxParticles = 60;
        break;
    }

    this.particles = [];
  }

  public update(dt: number, viewportWidth: number, viewportHeight: number, offsetX: number, offsetY: number) {
    this.time += dt;

    // Maintain particle count in camera viewport space
    const pad = 60;
    while (this.particles.length < this.maxParticles) {
      this.particles.push(this.spawnParticle(viewportWidth, viewportHeight, pad, true));
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.swayPhase += p.swaySpeed * dt * 3;
      p.rotation += p.vRot * dt * 60;

      if (p.type === 'snowflake') {
        p.x += (p.vx + Math.sin(p.swayPhase) * 1.2) * dt * 60;
        p.y += p.vy * dt * 60;
      } else if (p.type === 'leaf') {
        p.x += (p.vx + Math.sin(p.swayPhase) * 2.2) * dt * 60;
        p.y += (p.vy + Math.cos(p.swayPhase * 0.5) * 0.3) * dt * 60;
      } else if (p.type === 'rain') {
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
      } else if (p.type === 'ember') {
        p.x += (p.vx + Math.sin(p.swayPhase) * 1.5) * dt * 60;
        p.y += p.vy * dt * 60; // Embers float upward (negative vy)
      } else if (p.type === 'sand') {
        p.x += p.vx * dt * 60;
        p.y += (p.vy + Math.sin(p.swayPhase) * 0.8) * dt * 60;
      } else if (p.type === 'spore') {
        p.x += (p.vx + Math.sin(p.swayPhase) * 1.0) * dt * 60;
        p.y += (p.vy + Math.cos(p.swayPhase) * 1.0) * dt * 60;
      }

      // Recycle particles when off-screen
      const rx = p.x - offsetX;
      const ry = p.y - offsetY;

      if (
        rx < -pad ||
        rx > viewportWidth + pad ||
        ry < -pad ||
        ry > viewportHeight + pad
      ) {
        this.particles[i] = this.spawnParticle(viewportWidth, viewportHeight, pad, false, offsetX, offsetY);
      }
    }
  }

  private spawnParticle(
    vWidth: number,
    vHeight: number,
    pad: number,
    initialRandom: boolean,
    offsetX: number = 0,
    offsetY: number = 0
  ): WeatherParticle {
    let screenX = Math.random() * (vWidth + pad * 2) - pad;
    let screenY = initialRandom ? Math.random() * (vHeight + pad * 2) - pad : -pad + 5;

    const leafColors = ['#22c55e', '#16a34a', '#84cc16', '#f59e0b', '#d97706'];
    const snowColors = ['#ffffff', '#e0f2fe', '#bae6fd', '#f0f9ff'];
    const emberColors = ['#ef4444', '#f97316', '#facc15', '#dc2626'];
    const sandColors = ['#f59e0b', '#d97706', '#fde047', '#b45309'];
    const sporeColors = ['#38bdf8', '#a855f7', '#34d399', '#f472b6'];

    let type: WeatherParticle['type'] = 'leaf';
    let vx = 0;
    let vy = 1;
    let size = 3;
    let color = '#ffffff';
    let alpha = 0.8;
    let vRot = (Math.random() - 0.5) * 0.08;

    switch (this.weatherType) {
      case 'SNOW':
        type = 'snowflake';
        vx = (Math.random() - 0.5) * 0.8;
        vy = Math.random() * 1.2 + 0.8;
        size = Math.random() * 3 + 1.5;
        color = snowColors[Math.floor(Math.random() * snowColors.length)];
        alpha = Math.random() * 0.5 + 0.4;
        break;

      case 'EMBERS':
        type = 'ember';
        if (!initialRandom) screenY = vHeight + pad - 5; // Spawn embers near bottom
        vx = (Math.random() - 0.5) * 1.2;
        vy = -(Math.random() * 1.5 + 0.8); // float upward
        size = Math.random() * 3 + 1.5;
        color = emberColors[Math.floor(Math.random() * emberColors.length)];
        alpha = Math.random() * 0.6 + 0.3;
        break;

      case 'SAND_STORM':
        type = 'sand';
        if (!initialRandom) screenX = -pad + 5; // Spawn from left edge
        vx = Math.random() * 3.5 + 2.0;
        vy = (Math.random() - 0.5) * 0.6;
        size = Math.random() * 2.5 + 1.0;
        color = sandColors[Math.floor(Math.random() * sandColors.length)];
        alpha = Math.random() * 0.5 + 0.3;
        break;

      case 'DARK_SPORES':
        type = 'spore';
        vx = (Math.random() - 0.5) * 0.6;
        vy = (Math.random() - 0.5) * 0.6;
        size = Math.random() * 3.5 + 1.5;
        color = sporeColors[Math.floor(Math.random() * sporeColors.length)];
        alpha = Math.random() * 0.5 + 0.3;
        break;

      case 'CASTLE_DUST':
        type = 'spore';
        vx = (Math.random() - 0.5) * 0.4;
        vy = -(Math.random() * 0.6 + 0.2);
        size = Math.random() * 2.5 + 1.0;
        color = '#fef08a';
        alpha = Math.random() * 0.4 + 0.2;
        break;

      case 'LEAVES_AND_RAIN':
      default:
        if (Math.random() > 0.45) {
          type = 'leaf';
          vx = Math.random() * 0.8 + 0.2;
          vy = Math.random() * 1.2 + 0.9;
          size = Math.random() * 3 + 2.5;
          color = leafColors[Math.floor(Math.random() * leafColors.length)];
          alpha = Math.random() * 0.4 + 0.5;
        } else {
          type = 'rain';
          vx = -0.8;
          vy = Math.random() * 4.5 + 5.5;
          size = Math.random() * 1.5 + 1.0;
          color = '#38bdf8';
          alpha = Math.random() * 0.3 + 0.25;
        }
        break;
    }

    const worldX = offsetX + screenX;
    const worldY = offsetY + screenY;

    return {
      x: worldX,
      y: worldY,
      vx,
      vy,
      size,
      color,
      alpha,
      rotation: Math.random() * Math.PI * 2,
      vRot,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 1.5 + 0.5,
      type,
    };
  }

  public render(
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    offsetY: number
  ) {
    ctx.save();
    for (const p of this.particles) {
      const px = p.x - offsetX;
      const py = p.y - offsetY;

      ctx.globalAlpha = p.alpha;

      if (p.type === 'leaf') {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.8, p.size * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'rain') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + p.vx * 2, py + p.vy * 2.5);
        ctx.stroke();
      } else if (p.type === 'snowflake') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'ember') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
