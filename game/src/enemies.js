// Enemies & Boss AI Engine
export class Enemy {
  constructor(x, y, type = 'drone') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.flash = 0;

    if (type === 'drone') {
      this.hp = 25;
      this.maxHp = 25;
      this.speed = 110;
      this.radius = 12;
      this.color = '#10b981'; // Neon Emerald
      this.xp = 10;
      this.damage = 10;
    } else if (type === 'interceptor') {
      this.hp = 45;
      this.maxHp = 45;
      this.speed = 160;
      this.radius = 14;
      this.color = '#f43f5e'; // Neon Rose
      this.xp = 25;
      this.damage = 15;
      this.dashTimer = 2.0;
    } else if (type === 'cruiser') {
      this.hp = 140;
      this.maxHp = 140;
      this.speed = 65;
      this.radius = 22;
      this.color = '#eab308'; // Neon Amber
      this.xp = 60;
      this.damage = 25;
      this.shootCooldown = 2.5;
    } else if (type === 'boss') {
      this.hp = 1800;
      this.maxHp = 1800;
      this.speed = 45;
      this.radius = 48;
      this.color = '#c084fc'; // Neon Purple Boss
      this.xp = 500;
      this.damage = 35;
      this.attackTimer = 2.0;
      this.phase = 1;
      this.name = 'CYBER DREADNOUGHT MK-VII';
    }
  }

  update(dt, player, spawnBullet) {
    if (this.flash > 0) this.flash -= dt;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.angle = Math.atan2(dy, dx);

    if (this.type === 'drone') {
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
    } else if (this.type === 'interceptor') {
      this.dashTimer -= dt;
      let spd = this.speed;
      if (this.dashTimer <= 0) {
        spd = this.speed * 2.2;
        if (this.dashTimer < -0.5) this.dashTimer = 2.0;
      }
      this.vx = (dx / dist) * spd;
      this.vy = (dy / dist) * spd;
    } else if (this.type === 'cruiser') {
      // Keep distance and shoot
      if (dist > 180) {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      } else {
        this.vx = 0;
        this.vy = 0;
      }
      this.shootCooldown -= dt;
      if (this.shootCooldown <= 0 && spawnBullet) {
        this.shootCooldown = 2.4;
        const bSpeed = 160;
        spawnBullet({
          x: this.x,
          y: this.y,
          vx: (dx / dist) * bSpeed,
          vy: (dy / dist) * bSpeed,
          damage: 15,
          color: '#eab308',
          size: 5,
          pierce: 1,
          isEnemy: true,
        });
      }
    } else if (this.type === 'boss') {
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;

      this.attackTimer -= dt;
      if (this.attackTimer <= 0 && spawnBullet) {
        this.attackTimer = 1.8;
        // 8-way radial burst
        const bulletsCount = 8;
        for (let i = 0; i < bulletsCount; i++) {
          const a = (i * Math.PI * 2) / bulletsCount + this.angle;
          spawnBullet({
            x: this.x,
            y: this.y,
            vx: Math.cos(a) * 150,
            vy: Math.sin(a) * 150,
            damage: 20,
            color: '#a855f7',
            size: 6,
            pierce: 1,
            isEnemy: true,
          });
        }
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  takeDamage(amt) {
    this.hp -= amt;
    this.flash = 0.1;
    return this.hp <= 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const mainColor = this.flash > 0 ? '#ffffff' : this.color;
    ctx.fillStyle = mainColor;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.type === 'boss' ? 20 : 10;

    if (this.type === 'drone') {
      ctx.beginPath();
      ctx.moveTo(this.radius, 0);
      ctx.lineTo(-this.radius, -this.radius * 0.7);
      ctx.lineTo(-this.radius * 0.4, 0);
      ctx.lineTo(-this.radius, this.radius * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'interceptor') {
      ctx.beginPath();
      ctx.moveTo(this.radius * 1.3, 0);
      ctx.lineTo(-this.radius, -this.radius * 0.6);
      ctx.lineTo(-this.radius * 0.6, 0);
      ctx.lineTo(-this.radius, this.radius * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'cruiser') {
      // Octagonal armored core
      ctx.beginPath();
      const sides = 8;
      for (let i = 0; i < sides; i++) {
        const a = (i * Math.PI * 2) / sides;
        const px = Math.cos(a) * this.radius;
        const py = Math.sin(a) * this.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'boss') {
      // Giant Mech Dreadnought
      ctx.beginPath();
      ctx.moveTo(this.radius, 0);
      ctx.lineTo(this.radius * 0.4, -this.radius * 0.9);
      ctx.lineTo(-this.radius * 0.6, -this.radius * 0.8);
      ctx.lineTo(-this.radius, 0);
      ctx.lineTo(-this.radius * 0.6, this.radius * 0.8);
      ctx.lineTo(this.radius * 0.4, this.radius * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Core glow
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export class Gem {
  constructor(x, y, value = 10) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 5;
    this.color = value >= 50 ? '#ec4899' : '#06b6d4';
    this.collected = false;
  }

  update(dt, player, magnetRadius) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < magnetRadius) {
      const speed = 360 * (1 - dist / magnetRadius) + 120;
      this.x += (dx / dist) * speed * dt;
      this.y += (dy / dist) * speed * dt;
    }

    if (dist < player.radius + this.radius) {
      this.collected = true;
      return true;
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.radius);
    ctx.lineTo(this.x + this.radius, this.y);
    ctx.lineTo(this.x, this.y + this.radius);
    ctx.lineTo(this.x - this.radius, this.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
