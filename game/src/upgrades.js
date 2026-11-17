// Roguelite Upgrade Deck
export const UPGRADE_POOL = [
  {
    id: 'plasma_blaster',
    name: 'Overclock Blaster',
    desc: '+30% Attack Speed and +5 Damage',
    icon: '⚡',
    apply: (game) => {
      game.player.fireRate *= 0.75;
      game.player.damage += 5;
    }
  },
  {
    id: 'multishot',
    name: 'Spread Cannon',
    desc: 'Fires 2 additional spread lasers',
    icon: '💥',
    apply: (game) => {
      game.weapons.spreadCount = (game.weapons.spreadCount || 1) + 2;
    }
  },
  {
    id: 'orbital_shield',
    name: 'Orbital Aegis',
    desc: 'Spins defensive energy orbs that damage enemies',
    icon: '🛡️',
    apply: (game) => {
      if (!game.orbitalShield) {
        game.initOrbitalShield(2);
      } else {
        game.orbitalShield.count += 1;
        game.orbitalShield.damage += 15;
      }
    }
  },
  {
    id: 'homing_missile',
    name: 'Quantum Missiles',
    desc: 'Periodically launches seeking micromissiles',
    icon: '🚀',
    apply: (game) => {
      game.weapons.hasMissiles = true;
      game.weapons.missileTimer = 0.5;
    }
  },
  {
    id: 'nano_hull',
    name: 'Titan Nano-Hull',
    desc: '+40 Max HP and instant full repair',
    icon: '❤️',
    apply: (game) => {
      game.player.maxHp += 40;
      game.player.hp = game.player.maxHp;
    }
  },
  {
    id: 'magnetic_vortex',
    name: 'Vortex Siphon',
    desc: '+60% Gem attraction range',
    icon: '🧲',
    apply: (game) => {
      game.player.magnetRange += 80;
    }
  },
  {
    id: 'kinetic_thrusters',
    name: 'Hyper Thrusters',
    desc: '+25% Movement Speed & faster Dash recovery',
    icon: '💨',
    apply: (game) => {
      game.player.speed *= 1.25;
    }
  }
];

export function getRandomUpgrades(count = 3) {
  const shuffled = [...UPGRADE_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
