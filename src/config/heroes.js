/*
 * Héroes controlados por el jugador.
 *
 * Propiedades de stats:
 *   hp    → puntos de vida máximos
 *   atk   → poder de ataque base
 *   def   → defensa (reduce el daño recibido)
 *   mov   → puntos de movimiento por turno
 *   range → rango de ataque en casillas (1 = adyacente)
 */
export const HEROES = {
  warrior: {
    key: 'warrior',
    name: 'Guerrero',
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
};
