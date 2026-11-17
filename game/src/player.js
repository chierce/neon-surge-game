// Player Ship & Controls
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.speed = 220;
    this.radius = 14;
    this.hp = 100;
    this.maxHp = 100;
    this.level = 1;
    this.xp = 0;
    this.xpToLevel = 60;
    this.iFrames = 0;
    this.dashCooldown = 0;
    this.dashDuration = 0;
    this.fireTimer = 0;
    this.fireRate = 0.22;
    this.damage = 15;
    this.magnetRange = 100;
    this.trailTimer = 0;
  }

  update(dt, keys, canvasW, canvasH) {
    // Movement with WASD + Arrow Keys
    let inputX = 0;
    let inputY = 0;
    if (keys['a'] || keys['arrowleft']) inputX -= 1;
    if (keys['d'] || keys['arrowright']) inputX += 1;
    if (keys['w'] || keys['arrowup']) inputY -= 1;
    if (keys['s'] || keys['arrowdown']) inputY += 1;

    if (inputX !== 0 || inputY !== 0) {
      const len = Math.hypot(inputX, inputY);
      inputX /= len;
      inputY /= len;
    }

    // Dash
    if (keys[' '] && this.dashCooldown <= 0 && (inputX || inputY)) {
      this.dashDuration = 0.12;
      this.dashCooldown = 1.2;
      this.iFrames = 0.15;
    }

    if (this.dashDuration > 0) {
      const dashSpeed = this.speed * 3.5;
      this.vx = inputX * dashSpeed;
      this.vy = inputY * dashSpeed;
      this.dashDuration -= dt;
    } else {
      this.vx = inputX * this.speed;
      this.vy = inputY * this.speed;
    }

    this.dashCooldown -= dt;
    this.iFrames -= dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Bounds clamp
    this.x = Math.max(this.radius, Math.min(canvasW - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(canvasH - this.radius, this.y));

    // Face direction of movement (or aim)
    if (Math.abs(this.vx) + Math.abs(this.vy) > 10) {
      this.angle = Math.atan2(this.vy, this.vx);
    }

    // Autofire timer
    if (this.fireTimer > 0) this.fireTimer -= dt;
    this.trailTimer -= dt;
  }

  canShoot() {
    return this.fireTimer <= 0;
  }

  shoot() {
    this.fireTimer = this.fireRate;
  }

  takeDamage(amount) {
    if (this.iFrames > 0) return false;
    this.hp -= amount;
    this.iFrames = 0.5;
    return true;
  }

  addXP(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToLevel) {
      this.xp -= this.xpToLevel;
      this.level++;
      this.xpToLevel = Math.floor(this.xpToLevel * 1.4);
      return true; // Level up!
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Ship body
    const alpha = this.iFrames > 0 ? 0.4 + Math.sin(Date.now() * 0.03) * 0.3 : 1;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#06b6d4';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 14;

    // Main fuselage
    ctx.beginPath();
    ctx.moveTo(this.radius * 1.5, 0);
    ctx.lineTo(-this.radius, -this.radius * 0.75);
    ctx.lineTo(-this.radius * 0.4, 0);
    ctx.lineTo(-this.radius, this.radius * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Core cockpit
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(this.radius * 0.2, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
