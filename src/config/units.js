/*
 * Propiedades de stats:
 *   hp    → puntos de vida máximos
 *   atk   → poder de ataque base
 *   def   → defensa (reduce el daño recibido)
 *   mov   → casillas que puede moverse por turno
 *   range → rango de ataque en casillas (1 = adyacente)
 */
export const UNITS = {

  // HÉROES

  warrior: {
    key: 'warrior',
    name: 'Gerrero',
    team: 'player',
    class: 'Guerrero',
    description: 'Tanque cuerpo a cuerpo. Alta defensa y HP, rango corto.',
    hp: 40,
    atk: 12,
    def: 5,
    mov: 3,
    range: 1,
    spriteUrl: '/assets/sprites/warrior.png',
  },
  archer: {
    key: 'archer',
    name: 'Arquero',
    team: 'player',
    class: 'Arquero',
    description: 'Atacante a distancia. Alta movilidad y rango de 3 casillas.',
    hp: 28,
    atk: 10,
    def: 2,
    mov: 4,
    range: 3,
    spriteUrl: '/assets/sprites/archer.png',
  },
  mage: {
    key: 'mage',
    name: 'Mago',
    team: 'player',
    class: 'Mago',
    description: 'Mayor daño del equipo pero muy frágil. Rango 2.',
    hp: 22,
    atk: 16,
    def: 1,
    mov: 3,
    range: 2,
    spriteUrl: '/assets/sprites/mage.png',
  },

  // ENEMIGOS

  orc: {
    key: 'orc',
    name: 'Orco',
    team: 'enemy',
    class: 'Bruto',
    description: 'Guerrero orco. Resistente y con buen ataque cuerpo a cuerpo.',
    hp: 30,
    atk: 10,
    def: 3,
    mov: 3,
    range: 1,
    spriteUrl: '/assets/sprites/orc.png',
  },
  goblin: {
    key: 'goblin',
    name: 'Goblin',
    team: 'enemy',
    class: 'Explorador',
    description: 'Pequeño y veloz. Siempre ataca al héroe con menos HP.',
    hp: 18,
    atk: 8,
    def: 1,
    mov: 4,
    range: 1,
    spriteUrl: '/assets/sprites/goblin.png',
  },
  darkmage: {
    key: 'darkmage',
    name: 'Mago Oscuro',
    team: 'enemy',
    class: 'Hechicero',
    description: 'Mago oscuro con gran daño a distancia pero baja defensa.',
    hp: 22,
    atk: 14,
    def: 1,
    mov: 2,
    range: 3,
    spriteUrl: '/assets/sprites/darkmage.png',
  },
};
