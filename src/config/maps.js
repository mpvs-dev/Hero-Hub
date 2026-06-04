/**
 * Propiedades:
 *  key: clave de identificación del mapa
 *  name: nombre del mapa
 *  description: descripcion del mapa
 *  bg: color del fondo
 *  w: ancho del mapa
 *  h: alto del mapa
 *  grid: mapa creado con las claves de tiles.js
 *  playerSpawns: posiciones por defecto de los héroes (fallback)
 *  enemySpawns: tipos de enemigos a generar (sin posición fija)
 *  deployZone: casillas donde el jugador coloca sus héroes
 *  enemyDeployZone: casillas donde los enemigos aparecen aleatoriamente
 */

export const MAPS = {
  //  MAPA 1 — Ruinas del Bosque
  forest: {
    key: "forest",
    name: "Ruinas del Bosque",
    description: "Terreno frondoso cruzado por ríos. Usa el bosque como cobertura.",
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
      { type: "archer",  row: 8, col: 2 },
      { type: "mage",    row: 9, col: 3 },
    ],
    // Solo los tipos; las posiciones se sortean aleatoriamente en enemyDeployZone
    enemySpawns: [
      { type: "orc"      },
      { type: "goblin"   },
      { type: "darkmage" },
    ],
    // Esquina inferior-izquierda (lado del jugador)
    deployZone: [
      [6, 0], [6, 1], [6, 2],
      [7, 0], [7, 1], [7, 2], [7, 3],
      [8, 2], [8, 3],
      [9, 3], [9, 4],
    ],
    // Esquina superior-derecha (lado del enemigo) — solo celdas caminables
    enemyDeployZone: [
      [0, 6], [0, 7], [0, 8], [0, 9],
      [1, 5], [1, 6],
      [2, 5], [2, 6],
      [3, 5], [3, 6], [3, 7], [3, 8], [3, 9],
      [4, 5], [4, 6],
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
      { type: "archer",  row: 4, col: 1 },
      { type: "mage",    row: 6, col: 2 },
    ],
    enemySpawns: [
      { type: "orc"      },
      { type: "goblin"   },
      { type: "darkmage" },
    ],
    // Columnas izquierdas del pasillo central
    deployZone: [
      [3, 1],
      [4, 1], [4, 2],
      [5, 1], [5, 2],
      [6, 1], [6, 2],
      [7, 2],
    ],
    // Columnas derechas del pasillo central (lado opuesto)
    enemyDeployZone: [
      [2, 6], [2, 7],
      [3, 6], [3, 7], [3, 8],
      [4, 6], [4, 7], [4, 8],
      [5, 6], [5, 7], [5, 8],
      [6, 6], [6, 7],
    ],
  },

  //  MAPA 3 — Lago de Lava
  volcano: {
    key: "volcano",
    name: "Lago de Lava",
    description: "Plataformas de hielo sobre magma. Mantén a tus unidades en tierra segura.",
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
      { type: "archer",  row: 5, col: 1 },
      { type: "mage",    row: 4, col: 2 },
    ],
    enemySpawns: [
      { type: "orc"      },
      { type: "goblin"   },
      { type: "darkmage" },
    ],
    // Plataformas del lado izquierdo
    deployZone: [
      [3, 1], [3, 2],
      [4, 1], [4, 2], [4, 3],
      [5, 1], [5, 2], [5, 3],
      [6, 1], [6, 2],
    ],
    // Plataformas del lado derecho (simétricas)
    enemyDeployZone: [
      [3, 7], [3, 8],
      [4, 6], [4, 7], [4, 8],
      [5, 6], [5, 7], [5, 8],
      [6, 7], [6, 8],
    ],
  },
};
