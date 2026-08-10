export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  vy: number;
  fontSize: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'spark' | 'star' | 'coin';
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += 0.12 * dt * 60; // Gravity on particles
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt * 60;
      ft.life += dt;
      ft.alpha = Math.max(0, 1 - ft.life / ft.maxLife);

      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      const px = p.x - offsetX;
      const py = p.y - offsetY;

      if (p.shape === 'spark') {
        ctx.fillRect(px - p.size, py - p.size / 2, p.size * 2, p.size / 2);
      } else if (p.shape === 'star') {
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      const px = ft.x - offsetX;
      const py = ft.y - offsetY;

      ctx.strokeText(ft.text, px, py);
      ctx.fillText(ft.text, px, py);
    }
    ctx.restore();
  }

  public createFloatingText(x: number, y: number, text: string, color: string = '#fef08a', fontSize: number = 14) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      life: 0,
      maxLife: 0.8,
      vy: -1.2,
      fontSize,
    });
  }

  public createJumpDust(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 1.5,
        size: Math.random() * 3 + 2,
        color: '#e2e8f0',
        alpha: 0.8,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2,
      });
    }
  }

  public createSlashSparks(x: number, y: number, facingRight: boolean, sparkColors: string[] = ['#38bdf8', '#fef08a']) {
    const dir = facingRight ? 1 : -1;
    for (let i = 0; i < 16; i++) {
      const color = sparkColors[i % sparkColors.length];
      this.particles.push({
        x: x,
        y: y + (Math.random() - 0.5) * 22,
        vx: dir * (Math.random() * 4.5 + 2),
        vy: (Math.random() - 0.5) * 4.5,
        size: Math.random() * 3.5 + 2,
        color: color,
        alpha: 1,
        life: 0,
        maxLife: 0.28 + Math.random() * 0.15,
        shape: 'spark',
      });
    }
  }

  public createHitBloodOrSparks(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5 - 1,
        size: Math.random() * 4 + 2,
        color: i % 3 === 0 ? '#ef4444' : '#fbbf24',
        alpha: 1,
        life: 0,
        maxLife: 0.3,
      });
    }
  }

  public createCoinSparkle(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3 - 2,
        size: Math.random() * 3 + 2,
        color: '#facc15',
        alpha: 1,
        life: 0,
        maxLife: 0.4,
        shape: 'star',
      });
    }
  }

  public createVictoryConfetti(x: number, y: number) {
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 100,
        y: y + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 3,
        size: Math.random() * 4 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.5,
      });
    }
  }

  public clear() {
    this.particles = [];
    this.floatingTexts = [];
  }
}
