import { BOSS_HP_MULTIPLIER, BOSS_ATK_MULTIPLIER, BOSS_DEF_MULTIPLIER } from "./constants";

export const ENEMIES = {
  orc: {
    key: 'orc',
    name: 'Orco',
    team: 'enemy',
    class: 'Bruto',
    description: 'Guerrero orco. Sus golpes brutales provocan hemorragias peligrosas.',
    hp: 30,
    atk: 10,
    def: 3,
    mov: 3,
    range: 1,
    spriteUrl: '/assets/sprites/orc.png',
    abilities: [
      { type: 'bleed', chance: 0.45, duration: 3, damage: 3 },
    ],
  },
  goblin: {
    key: 'goblin',
    name: 'Goblin',
    team: 'enemy',
    class: 'Explorador',
    description: 'Pequeño y veloz. Sus armas envenenadas debilitan lentamente.',
    hp: 18,
    atk: 8,
    def: 1,
    mov: 4,
    range: 1,
    spriteUrl: '/assets/sprites/goblin.png',
    abilities: [
      { type: 'poison', chance: 0.5, duration: 3, damage: 2 },
    ],
  },
  darkmage: {
    key: 'darkmage',
    name: 'Mago Oscuro',
    team: 'enemy',
    class: 'Hechicero',
    description: 'Lanza maldiciones ígneas que queman a sus objetivos durante varios turnos.',
    hp: 22,
    atk: 14,
    def: 1,
    mov: 2,
    range: 3,
    spriteUrl: '/assets/sprites/darkmage.png',
    abilities: [
      { type: 'burn', chance: 0.55, duration: 2, damage: 4 },
    ],
  },
};

// Configuración visual de cada efecto de estado
export const STATUS_EFFECTS = {
  poison: {
    label: 'Veneno',
    icon: '☠',
    color: '#7acc2a',
    bgColor: '#1a2a0a',
    border: '#4a8a10',
    desc: (dmg, dur) => `Pierde ${dmg} HP al inicio de cada turno (${dur} ronda${dur > 1 ? 's' : ''})`,
  },
  burn: {
    label: 'Quemadura',
    icon: '🔥',
    color: '#ff7730',
    bgColor: '#2a1008',
    border: '#aa3010',
    desc: (dmg, dur) => `Pierde ${dmg} HP al inicio de cada turno (${dur} ronda${dur > 1 ? 's' : ''})`,
  },
  bleed: {
    label: 'Hemorragia',
    icon: '🩸',
    color: '#e02020',
    bgColor: '#2a0808',
    border: '#880808',
    desc: (dmg, dur) => `Pierde ${dmg} HP al inicio de cada turno (${dur} ronda${dur > 1 ? 's' : ''})`,
  },
};

export const BOSS_MULTIPLIERS = {
  hp:  BOSS_HP_MULTIPLIER,
  atk: BOSS_ATK_MULTIPLIER,
  def: BOSS_DEF_MULTIPLIER,
};

// Helper — devuelve el enemy def con stats de jefe aplicados
export function getBossStats(enemyDef) {
  return {
    ...enemyDef,
    hp: Math.round(enemyDef.hp * BOSS_MULTIPLIERS.hp),
    atk: Math.round(enemyDef.atk * BOSS_MULTIPLIERS.atk),
    def: Math.round(enemyDef.def * BOSS_MULTIPLIERS.def),
    name: `${enemyDef.name} Jefe`,
    isBossUnit: true,
  };
}