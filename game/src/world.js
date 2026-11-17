// Game World, Starfield, HUD & Collision Management
import { Player } from './player.js';
import { Enemy, Gem } from './enemies.js';
import { Projectile, Missile, OrbitalShield } from './weapons.js';
import { FXSystem } from './particles.js';
import { sounds } from './audio.js';
import { getRandomUpgrades } from './upgrades.js';

export const STATE_TITLE = 'title';
export const STATE_PLAYING = 'playing';
export const STATE_UPGRADE = 'upgrade';
export const STATE_PAUSED = 'paused';
export const STATE_GAMEOVER = 'gameover';

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    this.state = STATE_TITLE;
    this.score = 0;
    this.timeSurvived = 0;
    this.enemiesDefeated = 0;
    this.wave = 1;
    this.bossSpawned = false;
    this.screenShake = 0;

    this.player = new Player(this.width / 2, this.height / 2);
    this.enemies = [];
    this.projectiles = [];
    this.missiles = [];
    this.gems = [];
    this.orbitalShield = null;
    this.fx = new FXSystem();

    this.weapons = {
      spreadCount: 1,
      hasMissiles: false,
      missileTimer: 0,
    };

    this.activeUpgradeCards = [];
    this.initStars();
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 15 + Math.random() * 45,
        size: 0.8 + Math.random() * 1.8,
        alpha: 0.3 + Math.random() * 0.7,
      });
    }
  }

  initOrbitalShield(count = 2) {
    this.orbitalShield = new OrbitalShield(count, 55, 30);
  }

  start() {
    this.state = STATE_PLAYING;
    this.score = 0;
    this.timeSurvived = 0;
    this.enemiesDefeated = 0;
    this.wave = 1;
    this.bossSpawned = false;
    this.player = new Player(this.width / 2, this.height / 2);
    this.enemies = [];
    this.projectiles = [];
    this.missiles = [];
    this.gems = [];
    this.orbitalShield = null;
    this.fx.reset();
    this.weapons = { spreadCount: 1, hasMissiles: false, missileTimer: 0 };
    sounds.init();
  }

  update(dt, keys) {
    // Update Parallax Stars
    for (const star of this.stars) {
      star.y += star.speed * dt;
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
    }

    if (this.screenShake > 0) this.screenShake -= dt * 15;

    if (this.state !== STATE_PLAYING) return;

    this.timeSurvived += dt;

    // Spawn Waves
    this.updateSpawns(dt);

    // Player Update
    this.player.update(dt, keys, this.width, this.height);
    if (Math.abs(this.player.vx) + Math.abs(this.player.vy) > 10) {
      this.fx.emitThruster(this.player.x, this.player.y, this.player.angle);
    }

    // Auto-fire player weapons
    if (this.player.canShoot()) {
      this.firePlayerWeapons();
    }

    // Missiles
    if (this.weapons.hasMissiles) {
      this.weapons.missileTimer -= dt;
      if (this.weapons.missileTimer <= 0) {
        this.weapons.missileTimer = 1.4;
        const target = this.getNearestEnemy();
        if (target) {
          this.missiles.push(new Missile(this.player.x, this.player.y, target));
          sounds.playLaser();
        }
      }
    }

    // Orbital Shield
    if (this.orbitalShield) {
      this.orbitalShield.update(dt, this.player.x, this.player.y);
      const orbs = this.orbitalShield.getOrbs();
      for (const orb of orbs) {
        for (const enemy of this.enemies) {
          if (Math.hypot(enemy.x - orb.x, enemy.y - orb.y) < enemy.radius + orb.radius) {
            if (enemy.takeDamage(orb.damage * dt * 4)) {
              this.onEnemyDefeated(enemy);
            }
          }
        }
      }
    }

    // Update Projectiles
    this.projectiles = this.projectiles.filter(p => {
      const alive = p.update(dt);
      if (!alive) return false;

      if (!p.isEnemy) {
        // Player bullet hits enemy
        for (const enemy of this.enemies) {
          if (Math.hypot(enemy.x - p.x, enemy.y - p.y) < enemy.radius + p.size) {
            p.hits++;
            this.fx.emitSparks(p.x, p.y, p.color, 6);
            this.fx.addText(enemy.x, enemy.y - 12, `${p.damage}`, '#ffffff', 14);
            if (enemy.takeDamage(p.damage)) {
              this.onEnemyDefeated(enemy);
            }
            if (p.hits >= p.pierce) return false;
          }
        }
      } else {
        // Enemy bullet hits player
        if (Math.hypot(this.player.x - p.x, this.player.y - p.y) < this.player.radius + p.size) {
          if (this.player.takeDamage(p.damage)) {
            this.screenShake = 6;
            this.fx.emitExplosion(this.player.x, this.player.y, '#f43f5e', 14);
            sounds.playHit();
            if (this.player.hp <= 0) this.onGameOver();
          }
          return false;
        }
      }
      return true;
    });

    // Update Missiles
    this.missiles = this.missiles.filter(m => {
      const alive = m.update(dt, this.enemies);
      if (!alive) return false;
      for (const enemy of this.enemies) {
        if (Math.hypot(enemy.x - m.x, enemy.y - m.y) < enemy.radius + 12) {
          this.fx.emitExplosion(m.x, m.y, '#f59e0b', 20, 200);
          this.screenShake = 4;
          sounds.playExplosion();
          enemy.takeDamage(m.damage);
          if (enemy.hp <= 0) this.onEnemyDefeated(enemy);
          return false;
        }
      }
      return true;
    });

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, this.player, (bullet) => {
        this.projectiles.push(new Projectile(bullet.x, bullet.y, bullet.vx, bullet.vy, bullet.damage, bullet.color, bullet.size, 1));
      });

      // Contact damage to player
      if (Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y) < this.player.radius + enemy.radius) {
        if (this.player.takeDamage(enemy.damage)) {
          this.screenShake = 7;
          this.fx.emitExplosion(this.player.x, this.player.y, '#ef4444', 16);
          sounds.playHit();
          if (this.player.hp <= 0) this.onGameOver();
        }
      }
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);

    // Update Gems
    this.gems = this.gems.filter(g => {
      const collected = g.update(dt, this.player, this.player.magnetRange);
      if (collected) {
        sounds.playGem();
        this.score += g.value * 10;
        this.fx.emitSparks(this.player.x, this.player.y, g.color, 4);
        if (this.player.addXP(g.value)) {
          this.onLevelUp();
        }
        return false;
      }
      return true;
    });

    // Update FX
    this.fx.update(dt);
  }

  firePlayerWeapons() {
    this.player.shoot();
    sounds.playLaser();
    const nearest = this.getNearestEnemy();
    const aimAngle = nearest ? Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x) : this.player.angle;

    const count = this.weapons.spreadCount;
    const spreadAngle = 0.16;
    const baseAngle = aimAngle - ((count - 1) * spreadAngle) / 2;
    const speed = 460;

    for (let i = 0; i < count; i++) {
      const a = baseAngle + i * spreadAngle;
      const vx = Math.cos(a) * speed;
      const vy = Math.sin(a) * speed;
      this.projectiles.push(new Projectile(this.player.x, this.player.y, vx, vy, this.player.damage, '#06b6d4', 4, 1));
    }
  }

  getNearestEnemy() {
    let nearest = null;
    let minDist = Infinity;
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }
    return nearest;
  }

  updateSpawns(dt) {
    this.spawnTimer = (this.spawnTimer || 0) + dt;
    const spawnInterval = Math.max(0.45, 1.6 - this.wave * 0.15);

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      // Spawn at canvas perimeter
      const side = Math.floor(Math.random() * 4);
      let sx, sy;
      if (side === 0) { sx = Math.random() * this.width; sy = -30; }
      else if (side === 1) { sx = this.width + 30; sy = Math.random() * this.height; }
      else if (side === 2) { sx = Math.random() * this.width; sy = this.height + 30; }
      else { sx = -30; sy = Math.random() * this.height; }

      const rand = Math.random();
      let type = 'drone';
      if (this.wave >= 2 && rand < 0.35) type = 'interceptor';
      if (this.wave >= 3 && rand > 0.75) type = 'cruiser';

      this.enemies.push(new Enemy(sx, sy, type));
    }

    // Boss Spawn at 60s or Wave 5
    if (this.timeSurvived >= 50 && !this.bossSpawned) {
      this.bossSpawned = true;
      sounds.playBossAlarm();
      this.enemies.push(new Enemy(this.width / 2, -60, 'boss'));
      this.fx.addText(this.width / 2, 120, '⚠️ WARNING: CYBER DREADNOUGHT ARRIVED! ⚠️', '#f43f5e', 22);
    }

    // Advance waves
    this.wave = 1 + Math.floor(this.timeSurvived / 20);
  }

  onEnemyDefeated(enemy) {
    this.enemiesDefeated++;
    this.score += enemy.xp * 15;
    this.fx.emitExplosion(enemy.x, enemy.y, enemy.color, enemy.type === 'boss' ? 50 : 18);
    sounds.playExplosion(enemy.type === 'boss');
    this.gems.push(new Gem(enemy.x, enemy.y, enemy.xp));
    if (enemy.type === 'boss') {
      this.fx.addText(this.width / 2, 200, '🌟 DREADNOUGHT DESTROYED! +10,000 PTS 🌟', '#a855f7', 24);
      this.score += 10000;
    }
  }

  onLevelUp() {
    sounds.playLevelUp();
    this.activeUpgradeCards = getRandomUpgrades(3);
    this.state = STATE_UPGRADE;
    this.screenShake = 5;
  }

  selectUpgrade(index) {
    if (this.activeUpgradeCards[index]) {
      this.activeUpgradeCards[index].apply(this);
      this.state = STATE_PLAYING;
    }
  }

  onGameOver() {
    this.state = STATE_GAMEOVER;
    this.screenShake = 12;
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake Offset
    if (this.screenShake > 0) {
      const ox = (Math.random() - 0.5) * this.screenShake * 2;
      const oy = (Math.random() - 0.5) * this.screenShake * 2;
      ctx.translate(ox, oy);
    }

    // Background
    ctx.fillStyle = '#05060b';
    ctx.fillRect(0, 0, this.width, this.height);

    // Stars
    for (const star of this.stars) {
      ctx.fillStyle = `rgba(186, 230, 253, ${star.alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    // Retro Grid Horizon
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Gems
    for (const gem of this.gems) gem.draw(ctx);

    // Projectiles
    for (const p of this.projectiles) p.draw(ctx);
    for (const m of this.missiles) m.draw(ctx);

    // Enemies
    for (const e of this.enemies) e.draw(ctx);

    // Orbital Shield
    if (this.orbitalShield) this.orbitalShield.draw(ctx);

    // Player
    if (this.state !== STATE_GAMEOVER) {
      this.player.draw(ctx);
    }

    // FX & Particles
    this.fx.draw(ctx);

    ctx.restore();

    // Draw HUD / Overlays
    this.drawHUD(ctx);
  }

  drawHUD(ctx) {
    if (this.state === STATE_TITLE) {
      this.drawTitleScreen(ctx);
      return;
    }

    if (this.state === STATE_GAMEOVER) {
      this.drawGameOverScreen(ctx);
      return;
    }

    // Top HUD
    ctx.save();
    // XP Bar (Top of screen)
    const xpPercent = Math.min(1, this.player.xp / this.player.xpToLevel);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(0, 0, this.width, 10);
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.fillRect(0, 0, this.width * xpPercent, 10);

    // HP Bar
    const hpPercent = Math.max(0, this.player.hp / this.player.maxHp);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(24, 24, 180, 16);
    ctx.fillStyle = hpPercent > 0.3 ? '#10b981' : '#f43f5e';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.fillRect(24, 24, 180 * hpPercent, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(24, 24, 180, 16);

    // Stats Texts
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP ${Math.ceil(this.player.hp)}/${this.player.maxHp}`, 30, 36);

    ctx.font = 'bold 15px monospace';
    ctx.fillText(`LVL ${this.player.level}`, 220, 36);
    ctx.fillText(`WAVE ${this.wave}`, 300, 36);

    ctx.textAlign = 'right';
    const mins = Math.floor(this.timeSurvived / 60).toString().padStart(2, '0');
    const secs = Math.floor(this.timeSurvived % 60).toString().padStart(2, '0');
    ctx.fillText(`TIME ${mins}:${secs}`, this.width - 24, 36);
    ctx.fillText(`SCORE ${this.score}`, this.width - 150, 36);

    // Boss HP Bar (if active)
    const boss = this.enemies.find(e => e.type === 'boss');
    if (boss) {
      const bossPercent = Math.max(0, boss.hp / boss.maxHp);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(this.width / 2 - 200, 52, 400, 18);
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 12;
      ctx.fillRect(this.width / 2 - 200, 52, 400 * bossPercent, 18);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(this.width / 2 - 200, 52, 400, 18);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(boss.name, this.width / 2, 65);
    }

    ctx.restore();

    // Upgrade Selection Modal
    if (this.state === STATE_UPGRADE) {
      this.drawUpgradeModal(ctx);
    }
  }

  drawTitleScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 6, 11, 0.75)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 25;
    ctx.font = 'bold 52px monospace';
    ctx.fillText('NEON SURGE', this.width / 2, this.height / 2 - 80);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 15;
    ctx.fillText('CYBER SURVIVOR ROGUELITE', this.width / 2, this.height / 2 - 35);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.shadowBlur = 0;
    ctx.fillText('Move: WASD / Arrow Keys  |  Dash: Space  |  Auto-Fire Enabled', this.width / 2, this.height / 2 + 35);
    ctx.fillText('Destroy waves, collect glowing gems, defeat the Cyber Dreadnought!', this.width / 2, this.height / 2 + 65);

    // Blinking Prompt
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.fillText('PRESS SPACE OR CLICK TO START', this.width / 2, this.height / 2 + 130);
    }
    ctx.restore();
  }

  drawUpgradeModal(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 6, 11, 0.85)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 18;
    ctx.font = 'bold 32px monospace';
    ctx.fillText('SYSTEM OVERCLOCK // CHOOSE UPGRADE', this.width / 2, 140);

    const cardW = 240;
    const cardH = 260;
    const gap = 30;
    const totalW = 3 * cardW + 2 * gap;
    const startX = (this.width - totalW) / 2;
    const startY = 200;

    this.activeUpgradeCards.forEach((card, idx) => {
      const cx = startX + idx * (cardW + gap);
      const cy = startY;

      // Card Box
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.fillRect(cx, cy, cardW, cardH);
      ctx.strokeRect(cx, cy, cardW, cardH);

      // Icon & Name
      ctx.fillStyle = '#ffffff';
      ctx.font = '40px monospace';
      ctx.fillText(card.icon, cx + cardW / 2, cy + 60);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(card.name, cx + cardW / 2, cy + 110);

      // Desc
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText(card.desc, cx + cardW / 2, cy + 155);

      // Key shortcut
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`[ Press ${idx + 1} or Click ]`, cx + cardW / 2, cy + 220);
    });
    ctx.restore();
  }

  drawGameOverScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 6, 11, 0.88)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 24;
    ctx.font = 'bold 48px monospace';
    ctx.fillText('MISSION COMPLETED // DEBRIEF', this.width / 2, this.height / 2 - 110);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.shadowBlur = 0;
    const mins = Math.floor(this.timeSurvived / 60).toString().padStart(2, '0');
    const secs = Math.floor(this.timeSurvived % 60).toString().padStart(2, '0');
    ctx.fillText(`TIME SURVIVED: ${mins}:${secs}`, this.width / 2, this.height / 2 - 50);
    ctx.fillText(`ENEMIES ANNIHILATED: ${this.enemiesDefeated}`, this.width / 2, this.height / 2 - 15);
    ctx.fillText(`TOTAL SCORE: ${this.score}`, this.width / 2, this.height / 2 + 20);

    // Medal Rank
    const rank = this.score > 25000 ? 'S-RANK OVERLORD' : this.score > 10000 ? 'A-RANK ACE' : 'B-RANK PILOT';
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`RATING: ${rank}`, this.width / 2, this.height / 2 + 65);

    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.font = 'bold 20px monospace';
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.fillText('PRESS R OR CLICK TO RESTART', this.width / 2, this.height / 2 + 130);
    }
    ctx.restore();
  }
}
