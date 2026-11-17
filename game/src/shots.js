// Deterministic Screenshot Engine for ?shot=1-title|2-combat|3-boss|4-gameover
import { World, STATE_TITLE, STATE_PLAYING, STATE_GAMEOVER } from './world.js';
import { Enemy, Gem } from './enemies.js';
import { Projectile, Missile } from './weapons.js';

export function runShot(world, shotName) {
  if (shotName === '1-title' || shotName === 'start') {
    world.state = STATE_TITLE;
    world.draw();
    return;
  }

  if (shotName === '2-combat' || shotName === 'play') {
    world.start();
    world.timeSurvived = 32;
    world.score = 8450;
    world.player.level = 4;
    world.player.hp = 85;
    world.player.x = 420;
    world.player.y = 340;
    world.weapons.spreadCount = 3;
    world.initOrbitalShield(2);

    // Populate combat enemies
    world.enemies = [
      new Enemy(280, 220, 'drone'),
      new Enemy(330, 190, 'drone'),
      new Enemy(560, 260, 'drone'),
      new Enemy(610, 310, 'drone'),
      new Enemy(220, 380, 'interceptor'),
      new Enemy(680, 420, 'cruiser'),
    ];

    // Gems
    world.gems = [
      new Gem(380, 300, 10),
      new Gem(460, 280, 25),
      new Gem(500, 390, 10),
    ];

    // Flying lasers
    world.projectiles = [
      new Projectile(440, 320, 300, -100, 15, '#06b6d4', 4, 1),
      new Projectile(440, 330, 320, -20, 15, '#06b6d4', 4, 1),
      new Projectile(440, 340, 300, 80, 15, '#06b6d4', 4, 1),
      new Projectile(640, 410, -200, -50, 15, '#eab308', 5, 1),
    ];

    // Particles & Damage text
    world.fx.emitExplosion(310, 200, '#10b981', 20);
    world.fx.addText(310, 185, 'CRIT 30', '#38bdf8', 16);
    world.fx.addText(680, 395, '25', '#ffffff', 14);

    world.draw();
    return;
  }

  if (shotName === '3-boss' || shotName === 'boss') {
    world.start();
    world.timeSurvived = 65;
    world.score = 24800;
    world.player.level = 7;
    world.player.hp = 92;
    world.player.x = 480;
    world.player.y = 480;
    world.weapons.spreadCount = 5;
    world.weapons.hasMissiles = true;
    world.initOrbitalShield(3);

    // Spawn Boss
    const boss = new Enemy(480, 180, 'boss');
    boss.hp = 1150;
    world.enemies = [
      boss,
      new Enemy(220, 260, 'interceptor'),
      new Enemy(740, 280, 'cruiser'),
    ];

    // Boss radial barrage
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8 + 0.3;
      world.projectiles.push(new Projectile(boss.x, boss.y, Math.cos(a) * 160, Math.sin(a) * 160, 20, '#a855f7', 6, 1));
    }

    // Missiles tracking
    world.missiles.push(new Missile(460, 440, boss, 40));

    world.fx.emitExplosion(480, 180, '#f43f5e', 35, 240);
    world.fx.addText(480, 140, 'CRIT 95', '#f43f5e', 20);

    world.draw();
    return;
  }

  if (shotName === '4-gameover' || shotName === 'end') {
    world.start();
    world.state = STATE_GAMEOVER;
    world.timeSurvived = 184;
    world.score = 36900;
    world.enemiesDefeated = 142;
    world.draw();
    return;
  }
}
