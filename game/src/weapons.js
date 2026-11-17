// Weapons & Projectiles Engine
export class Projectile {
  constructor(x, y, vx, vy, damage, color = '#06b6d4', size = 4, pierce = 1) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.color = color;
    this.size = size;
    this.pierce = pierce;
    this.hits = 0;
    this.life = 1.6;
    this.isEnemy = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    return this.life > 0 && this.hits < this.pierce;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;

    const angle = Math.atan2(this.vy, this.vx);
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(this.size * 2, 0);
    ctx.lineTo(-this.size, this.size);
    ctx.lineTo(-this.size, -this.size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

export class Missile {
  constructor(x, y, target, damage = 40) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = 280;
    this.angle = Math.random() * Math.PI * 2;
    this.turnSpeed = 4.5;
    this.life = 2.5;
    this.color = '#f59e0b';
    this.hits = 0;
    this.pierce = 1;
    this.isEnemy = false;
  }

  update(dt, enemies) {
    this.life -= dt;
    if (this.life <= 0) return false;

    // Pick target if lost
    if (!this.target || this.target.hp <= 0) {
      this.target = enemies[0] || null;
    }

    if (this.target) {
      const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      let diff = targetAngle - this.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.turnSpeed * dt);
    }

    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    return this.hits < this.pierce;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;

    // Missile body
    ctx.fillRect(-8, -2, 16, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-10, -3, 4, 6);

    ctx.restore();
  }
}

export class OrbitalShield {
  constructor(count = 2, radius = 55, damage = 25) {
    this.count = count;
    this.radius = radius;
    this.damage = damage;
    this.angle = 0;
    this.color = '#a855f7';
  }

  update(dt, playerX, playerY) {
    this.angle += dt * 3.2;
    this.playerX = playerX;
    this.playerY = playerY;
  }

  getOrbs() {
    const orbs = [];
    for (let i = 0; i < this.count; i++) {
      const a = this.angle + (i * Math.PI * 2) / this.count;
      orbs.push({
        x: this.playerX + Math.cos(a) * this.radius,
        y: this.playerY + Math.sin(a) * this.radius,
        damage: this.damage,
        radius: 8,
      });
    }
    return orbs;
  }

  draw(ctx) {
    const orbs = this.getOrbs();
    ctx.save();
    for (const orb of orbs) {
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();

      // Connecting energy ring
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.playerX, this.playerY, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}
