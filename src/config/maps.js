/**
 * Propiedades:
 *  key: clave de identificación del mapa
 *  name: nombre q se muestra del mapa
 *  description: descripcion del mapa
 *  bg: color del fondo
 *  w: ancho del mapa
 *  h: alto del mapa
 *  grid: mapa creado con las claves de tiles.js
 *  playerSpawns: son donde se generan los personajes
 *  enemySpawns: son donde se generan los enemigos
 */

export const MAPS = {
  //  MAPA 1 — Ruinas del Bosque
  forest: {
    key: "forest",
    name: "Ruinas del Bosque",
    description:
      "Terreno frondoso cruzado por ríos. Usa el bosque como cobertura.",
    bg: "#0a1006",
    w: 10,
    h: 10,
    grid: [
      "GGGFGGGGGG",
      "GGGFGGWWGG",
      "GGGGGGWWGG",
      "GFGGGGGGGG",
      "GFMMGGGGGG",
      "GGGMGGGFFG",
      "GGGGGGGFFG",
      "GGGGFGGGGG",
      "WWGGFGGGGG",
      "WWGGGGGGGG",
    ],
    playerSpawns: [
      { type: "warrior", row: 7, col: 1 },
      { type: "archer", row: 8, col: 2 },
      { type: "mage", row: 9, col: 3 },
    ],
    enemySpawns: [
      { type: "orc", row: 0, col: 9 },
      { type: "goblin", row: 1, col: 8 },
      { type: "darkmage", row: 0, col: 7 },
    ],
  },
  //  MAPA 2 — Cañón del Desierto
  desert: {
    key: "desert",
    name: "Cañón del Desierto",
    description: "Pasajes estrechos entre montañas. La posición lo es todo.",
    bg: "#1a0e04",
    w: 10,
    h: 10,
    grid: [
      "SSSSMMSSSS",
      "SSSSMGMSSS",
      "SSMGGGGMSS",
      "SMGGGGGMSS",
      "MGGGGGGGMS",
      "MGGGGGGGMS",
      "SMGGGGGMSS",
      "SSMGGGGMSS",
      "SSSSMGMSSS",
      "SSSSMMSSSS",
    ],
    playerSpawns: [
      { type: "warrior", row: 5, col: 1 },
      { type: "archer", row: 4, col: 1 },
      { type: "mage", row: 6, col: 2 },
    ],
    enemySpawns: [
      { type: "orc", row: 4, col: 8 },
      { type: "goblin", row: 5, col: 8 },
      { type: "darkmage", row: 3, col: 7 },
    ],
  },
  //  MAPA 3 — Lago de Lava
  volcano: {
    key: "volcano",
    name: "Lago de Lava",
    description:
      "Plataformas de hielo sobre magma. Mantén a tus unidades en tierra segura.",
    bg: "#140804",
    w: 10,
    h: 10,
    grid: [
      "VVVVIIGGVV",
      "VVVIWWGIVV",
      "VVIWWWWIVV",
      "VIGGWWGGIV",
      "IGGGGWGGGI",
      "IGGGGWGGGI",
      "VIGGWWGGIV",
      "VVIWWWWIVV",
      "VVVIWWGIVV",
      "VVVVIIGVVV",
    ],
    playerSpawns: [
      { type: "warrior", row: 4, col: 1 },
      { type: "archer", row: 5, col: 1 },
      { type: "mage", row: 4, col: 2 },
    ],
    enemySpawns: [
      { type: "orc", row: 4, col: 8 },
      { type: "goblin", row: 5, col: 8 },
      { type: "darkmage", row: 4, col: 7 },
    ],
  },
};
