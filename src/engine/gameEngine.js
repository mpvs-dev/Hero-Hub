import { TILE_TYPES } from "../config/tiles";
import { UNITS } from "../config/units";

// ─── Distancia y posición ─────────────────────────────────────────────────────

export function getDistance(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// ─── Movimiento ───────────────────────────────────────────────────────────────

export function getMovableTiles(unit, allUnits, mapGrid, mapWidth, mapHeight) {
  const tiles = [];

  for (let row = 0; row < mapHeight; row++) {
    for (let col = 0; col < mapWidth; col++) {
      const tileKey = mapGrid[row][col];
      const tileDef = TILE_TYPES[tileKey];

      // Tile bloqueado o desconocido
      if (!tileDef || !tileDef.walkable) continue;

      const dist = getDistance(unit, { row, col });

      // La casilla de origen no cuenta
      if (dist === 0) continue;

      // Fuera de rango
      if (dist > unit.mov) continue;

      // Casilla ocupada por otra unidad
      const occupied = allUnits.some(
        (u) => u.alive && u.id !== unit.id && u.row === row && u.col === col,
      );
      if (occupied) continue;

      tiles.push([row, col]);
    }
  }

  return tiles;
}

// ─── Combate ──────────────────────────────────────────────────────────────────

export function getAttackableUnits(attacker, potentialTargets) {
  return potentialTargets.filter(
    (target) => target.alive && getDistance(attacker, target) <= attacker.range,
  );
}

export function calculateDamage(attacker, defender) {
  const base = attacker.atk - defender.def;
  const variance = Math.floor(Math.random() * 5) - 1; // -1 a +3
  return Math.max(1, base + variance);
}

// ─── Inicialización ───────────────────────────────────────────────────────────

export function createUnitsFromMap(map) {
  const units = [];

  map.playerSpawns.forEach(({ type, row, col }, index) => {
    const def = UNITS[type];
    if (!def) {
      console.warn(`[GameEngine] Unidad desconocida: "${type}"`);
      return;
    }
    units.push({
      id: `p${index}`,
      type,
      ...def,
      maxHp: def.hp,
      row,
      col,
      alive: true,
      moved: false,
      attacked: false,
    });
  });

  map.enemySpawns.forEach(({ type, row, col }, index) => {
    const def = UNITS[type];
    if (!def) {
      console.warn(`[GameEngine] Unidad desconocida: "${type}"`);
      return;
    }
    units.push({
      id: `e${index}`,
      type,
      ...def,
      maxHp: def.hp,
      row,
      col,
      alive: true,
      moved: false,
      attacked: false,
    });
  });

  return units;
}

// ─── IA del enemigo ───────────────────────────────────────────────────────────

export function computeEnemyAction(
  enemy,
  allUnits,
  mapGrid,
  mapWidth,
  mapHeight,
) {
  const livePlayers = allUnits.filter((u) => u.team === "player" && u.alive);

  if (livePlayers.length === 0) {
    return { movedTo: null, attackTargetId: null };
  }

  // Ordenar jugadores por distancia al enemigo
  const sorted = [...livePlayers].sort(
    (a, b) => getDistance(enemy, a) - getDistance(enemy, b),
  );
  const nearest = sorted[0];

  let currentRow = enemy.row;
  let currentCol = enemy.col;

  // Moverse si el objetivo está fuera de rango de ataque
  if (getDistance(enemy, nearest) > enemy.range) {
    const movableTiles = getMovableTiles(
      enemy,
      allUnits,
      mapGrid,
      mapWidth,
      mapHeight,
    );

    if (movableTiles.length > 0) {
      // Elegir la casilla que nos deja más cerca del objetivo
      const bestTile = movableTiles.sort((a, b) => {
        const distA = getDistance({ row: a[0], col: a[1] }, nearest);
        const distB = getDistance({ row: b[0], col: b[1] }, nearest);
        return distA - distB;
      })[0];

      currentRow = bestTile[0];
      currentCol = bestTile[1];
    }
  }

  // Verificar ataque desde la nueva posición
  const movedEnemy = { ...enemy, row: currentRow, col: currentCol };
  const inRange = livePlayers.filter(
    (p) => getDistance(movedEnemy, p) <= enemy.range,
  );

  let attackTargetId = null;

  if (inRange.length > 0) {
    // Atacar al héroe con menos HP (más fácil de eliminar)
    const target = inRange.sort((a, b) => a.hp - b.hp)[0];
    attackTargetId = target.id;
  }

  const moved = currentRow !== enemy.row || currentCol !== enemy.col;

  return {
    movedTo: moved ? { row: currentRow, col: currentCol } : null,
    attackTargetId,
  };
}

// ─── Estado del juego ─────────────────────────────────────────────────────────

export function checkGameOver(units) {
  const players = units.filter((u) => u.team === "player");
  const enemies = units.filter((u) => u.team === "enemy");

  if (players.every((u) => !u.alive)) return "lose";
  if (enemies.every((u) => !u.alive)) return "win";
  return null;
}
