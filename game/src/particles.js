// Particle & FX Engine (Neon Sparks, Exhaust, Explosions, Floating Damage Text)
export class Particle {
  constructor(x, y, vx, vy, color, life, size = 3, shape = 'circle') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.shape = shape;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    if (this.shape === 'square') {
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class FloatingText {
  constructor(x, y, text, color = '#38bdf8', size = 16, duration = 0.8) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.life = duration;
    this.maxLife = duration;
    this.vy = -35;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.font = `bold ${this.size}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

export class FXSystem {
  constructor() {
    this.particles = [];
    this.texts = [];
  }

  reset() {
    this.particles = [];
    this.texts = [];
  }

  emitExplosion(x, y, color = '#f43f5e', count = 24, speed = 180) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed;
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const life = 0.3 + Math.random() * 0.45;
      const size = 2 + Math.random() * 4;
      this.particles.push(new Particle(x, y, vx, vy, color, life, size));
    }
  }

  emitSparks(x, y, color = '#38bdf8', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 120;
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      this.particles.push(new Particle(x, y, vx, vy, color, 0.2 + Math.random() * 0.2, 2));
    }
  }

  emitThruster(x, y, angle, color = '#06b6d4') {
    const spread = (Math.random() - 0.5) * 0.5;
    const a = angle + Math.PI + spread;
    const spd = 80 + Math.random() * 80;
    const vx = Math.cos(a) * spd;
    const vy = Math.sin(a) * spd;
    this.particles.push(new Particle(x, y, vx, vy, color, 0.2, 2.5));
  }

  addText(x, y, text, color = '#38bdf8', size = 16) {
    this.texts.push(new FloatingText(x, y, text, color, size));
  }

  update(dt) {
    this.particles = this.particles.filter(p => p.update(dt));
    this.texts = this.texts.filter(t => t.update(dt));
  }

  draw(ctx) {
    for (const p of this.particles) p.draw(ctx);
    for (const t of this.texts) t.draw(ctx);
  }
}
