// Neon Surge: Main Bootstrap & Input Controller
import { World, STATE_TITLE, STATE_PLAYING, STATE_UPGRADE, STATE_GAMEOVER } from './world.js';
import { runShot } from './shots.js';
import { sounds } from './audio.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const world = new World(canvas);

  // Check URL query parameters for screenshot rendering
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    runShot(world, shot);
    // Mark done for automation capture
    window.__SHOT_READY = true;
    return;
  }

  // Keyboard state
  const keys = {};

  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if (e.key === ' ' || e.key.startsWith('Arrow')) {
      e.preventDefault();
    }

    if (world.state === STATE_TITLE) {
      if (key === ' ' || key === 'enter') {
        world.start();
      }
    } else if (world.state === STATE_UPGRADE) {
      if (key === '1') world.selectUpgrade(0);
      if (key === '2') world.selectUpgrade(1);
      if (key === '3') world.selectUpgrade(2);
    } else if (world.state === STATE_GAMEOVER) {
      if (key === 'r') {
        world.start();
      }
    }

    if (key === 'm') {
      sounds.toggleMute();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  // Canvas Mouse Click
  canvas.addEventListener('click', (e) => {
    sounds.init();
    if (world.state === STATE_TITLE) {
      world.start();
    } else if (world.state === STATE_UPGRADE) {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const cardW = 240;
      const cardH = 260;
      const gap = 30;
      const totalW = 3 * cardW + 2 * gap;
      const startX = (canvas.width - totalW) / 2;
      const startY = 200;

      for (let i = 0; i < 3; i++) {
        const cx = startX + i * (cardW + gap);
        if (clickX >= cx && clickX <= cx + cardW && clickY >= startY && clickY <= startY + cardH) {
          world.selectUpgrade(i);
          break;
        }
      }
    } else if (world.state === STATE_GAMEOVER) {
      world.start();
    }
  });

  // Game Loop
  let lastTime = performance.now();
  function loop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    world.update(dt, keys);
    world.draw();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
