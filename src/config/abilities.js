export const ABILITIES = {

  // ── GUERRERO ──────────────────────────────────────────────────────────────
  iron_blood: {
    key: 'iron_blood',
    name: 'Sangre de Hierro',
    icon: '🩸',
    type: 'passive',
    trigger: 'on_turn',
    description: 'Regenera 2 HP al inicio de cada turno. No puede superar el HP máximo.',
    color: '#e05555',
    effect: { type: 'heal', amount: 2 },
  },

  seismic_strike: {
    key: 'seismic_strike',
    name: 'Golpe Sísmico',
    icon: '💥',
    type: 'active',
    description: 'Golpea el suelo y libera una onda que daña a todos los enemigos adyacentes.',
    color: '#c9a84c',
    cooldown: 3,
    apCost: 1,
    targetMode: 'aoe',
    range: 1,
    aoeRadius: 1,
    effect: { type: 'damage', damage: 10 },
  },

  // ── ARQUERO ───────────────────────────────────────────────────────────────

  poison_tip: {
    key: 'poison_tip',
    name: 'Punta Envenenada',
    icon: '☠',
    type: 'passive',
    trigger: 'on_attack',
    description: 'Cada ataque tiene un 40% de envenenar al objetivo (2 dmg/turno, 3 rondas).',
    color: '#7acc2a',
    effect: { type: 'status', statusType: 'poison', chance: 0.4, damage: 2, duration: 3 },
  },

  arrow_rain: {
    key: 'arrow_rain',
    name: 'Lluvia de Flechas',
    icon: '🏹',
    type: 'active',
    description: 'Dispara flechas a todos los enemigos dentro del rango de ataque.',
    color: '#80c0ff',
    cooldown: 3,
    apCost: 1,
    targetMode: 'all_enemies',
    range: 3,
    effect: { type: 'damage', damage: 6 },
  },

  // ── MAGO ──────────────────────────────────────────────────────────────────

  fire_aura: {
    key: 'fire_aura',
    name: 'Aura Ígnea',
    icon: '🔥',
    type: 'passive',
    trigger: 'on_attack',
    description: 'Cada ataque tiene un 50% de quemar al objetivo (4 dmg/turno, 2 rondas).',
    color: '#ff7730',
    effect: { type: 'status', statusType: 'burn', chance: 0.5, damage: 4, duration: 2 },
  },

  meteor: {
    key: 'meteor',
    name: 'Meteorito',
    icon: '☄️',
    type: 'active',
    description: 'Invoca un meteorito sobre un enemigo. Daño masivo en área de 1 casilla.',
    color: '#c084ff',
    cooldown: 4,
    apCost: 1,
    targetMode: 'aoe',
    range: 4,
    aoeRadius: 1,
    effect: { type: 'damage', damage: 18 },
  },
};

// Qué habilidades puede elegir cada héroe (2 opciones)
export const HERO_ABILITY_POOL = {
  warrior: ['iron_blood', 'seismic_strike'],
  archer: ['poison_tip', 'arrow_rain'],
  mage: ['fire_aura', 'meteor'],
};
