/**
 * Propiedades:
 *   key       → clave de un carácter usada en el grid del mapa
 *   name      → nombre que se muestra en la leyenda
 *   walkable  → si las unidades pueden moverse a este tile
 *   moveCost  → puntos de movimiento que cuesta entrar (1 = normal)
 *   bg        → color de fondo CSS del tile
 *   decorUrl  → ruta a imagen de decoración PNG
 *   effect    → efecto al terminar un turno encima del tile (opcional)
 */

export const TILE_TYPES = {
  G: {
    key: "G",
    name: "Pradera",
    walkable: true,
    moveCost: 1,
    bg: "#1e3210",
    decorUrl: null,
    effect: null,
  },
  F: {
    key: "F",
    name: "Bosque",
    walkable: true,
    moveCost: 2,
    bg: "#0f2008",
    decorUrl: null,
    effect: null,
  },
  M: {
    key: "M",
    name: "Montaña",
    walkable: false,
    moveCost: 0,
    bg: "#2e2a26",
    decorUrl: null,
    effect: null,
  },

  W: {
    key: "W",
    name: "Agua",
    walkable: false,
    moveCost: 0,
    bg: "#08203a",
    decorUrl: null,
    effect: null,
  },
  S: {
    key: "S",
    name: "Arena",
    walkable: true,
    moveCost: 1,
    bg: "#3c2e10",
    decorUrl: null,
    effect: null,
  },
  I: {
    key: "I",
    name: "Hielo",
    walkable: true,
    moveCost: 1,
    bg: "#14283c",
    decorUrl: null,
    effect: null,
  },
  V: {
    key: "V",
    name: "Lava",
    walkable: false,
    moveCost: 0,
    bg: "#3a1408",
    decorUrl: null,
    effect: { type: "damage", amount: 3 },
  },
};
