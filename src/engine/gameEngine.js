import { TILE_TYPES } from "../config/tiles";
import { HEROES }     from "../config/heroes";
import { ENEMIES }    from "../config/enemies";

// UNITS unificado solo para lookup interno del engine
const UNITS = { ...HEROES, ...ENEMIES };

// ─── Distancia ────────────────────────────────────────────────────────────────

export function getDistance(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// ─── Movimiento (Dijkstra con moveCost por tile) ──────────────────────────────

export function getMovableTiles(unit, allUnits, mapGrid, mapWidth, mapHeight) {
  // Mapa de coste mínimo para llegar a cada celda
  // Usamos un objeto {key: cost} donde key = "row,col"
  const costMap = {};
  const startKey = `${unit.row},${unit.col}`;
  costMap[startKey] = 0;

  // Cola de prioridad simple: array de [cost, row, col] ordenado por coste
  const queue = [[0, unit.row, unit.col]];

  // Unidades que bloquean el paso (no la celda de origen)
  const blockedSet = new Set(
    allUnits
      .filter(u => u.alive && u.id !== unit.id)
      .map(u => `${u.row},${u.col}`)
  );

  const directions = [[-1,0],[1,0],[0,-1],[0,1]];

  while (queue.length > 0) {
    // Sacar el nodo de menor coste (ordenación manual O(n) — suficiente para grids pequeños)
    queue.sort((a, b) => a[0] - b[0]);
    const [cost, row, col] = queue.shift();

    // Si ya encontramos un camino más barato, descartar
    const key = `${row},${col}`;
    if (cost > (costMap[key] ?? Infinity)) continue;

    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= mapHeight || nc < 0 || nc >= mapWidth) continue;

      const tileKey = mapGrid[nr][nc];
      const tileDef = TILE_TYPES[tileKey];
      if (!tileDef || !tileDef.walkable) continue;

      const neighborKey = `${nr},${nc}`;
      const newCost = cost + tileDef.moveCost;

      // Sin suficiente movimiento para entrar
      if (newCost > unit.mov) continue;

      // Celda bloqueada por otra unidad — no se puede pasar NI quedarse
      if (blockedSet.has(neighborKey)) continue;

      if (newCost < (costMap[neighborKey] ?? Infinity)) {
        costMap[neighborKey] = newCost;
        queue.push([newCost, nr, nc]);
      }
    }
  }

  // Devolver todas las celdas alcanzables (excluir la celda de origen)
  return Object.keys(costMap)
    .filter(k => k !== startKey)
    .map(k => k.split(",").map(Number));
}

// ─── Combate ──────────────────────────────────────────────────────────────────

export function getAttackableUnits(attacker, potentialTargets) {
  return potentialTargets.filter(
    (target) => target.alive && getDistance(attacker, target) <= attacker.range
  );
}

export function calculateDamage(attacker, defender) {
  const base     = attacker.atk - defender.def;
  const variance = Math.floor(Math.random() * 5) - 1;
  return Math.max(1, base + variance);
}

/**
 * Intenta aplicar un efecto de estado al defensor tras un ataque.
 * Devuelve el efecto aplicado { type, duration, damage } o null.
 * Si el defensor ya tiene ese efecto, refresca la duración.
 */
export function tryApplyStatusEffect(attacker, defender) {
  if (!attacker.abilities?.length) return null;

  for (const ability of attacker.abilities) {
    if (Math.random() < ability.chance) {
      // Si ya tiene el efecto, solo refrescar duración
      const existing = (defender.statusEffects ?? []).find(e => e.type === ability.type);
      if (existing) {
        return { refresh: true, type: ability.type, duration: ability.duration };
      }
      return {
        refresh:  false,
        type:     ability.type,
        duration: ability.duration,
        damage:   ability.damage,
      };
    }
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function walkableCells(zone, mapGrid) {
  return zone.filter(([r, c]) => {
    const key  = mapGrid[r]?.[c];
    const tile = TILE_TYPES[key];
    return tile && tile.walkable;
  });
}

// ─── Inicialización ───────────────────────────────────────────────────────────

export function createUnitsFromMap(map) {
  const units = [];

  // Héroes
  map.playerSpawns.forEach(({ type, row, col }, index) => {
    const def = UNITS[type];
    if (!def) { console.warn(`[GameEngine] Unidad desconocida: "${type}"`); return; }
    units.push({
      id: `p${index}`, type, ...def,
      maxHp: def.hp, row, col,
      alive: true, moved: false, attacked: false,
    });
  });

  // Enemigos — posiciones aleatorias dentro de enemyDeployZone
  const rawZone    = map.enemyDeployZone ?? [];
  const validCells = walkableCells(rawZone, map.grid);
  const shuffled   = shuffle(validCells);

  map.enemySpawns.forEach(({ type, row: fbRow, col: fbCol }, index) => {
    const def = UNITS[type];
    if (!def) { console.warn(`[GameEngine] Unidad desconocida: "${type}"`); return; }

    const cell     = shuffled[index];
    const spawnRow = cell ? cell[0] : (fbRow ?? index);
    const spawnCol = cell ? cell[1] : (fbCol ?? 0);

    units.push({
      id: `e${index}`, type, ...def,
      maxHp: def.hp, row: spawnRow, col: spawnCol,
      alive: true, moved: false, attacked: false,
    });
  });

  return units;
}

// ─── IA del enemigo ───────────────────────────────────────────────────────────

export function computeEnemyAction(enemy, allUnits, mapGrid, mapWidth, mapHeight) {
  const livePlayers = allUnits.filter((u) => u.team === "player" && u.alive);
  if (livePlayers.length === 0) return { movedTo: null, attackTargetId: null };

  const sorted  = [...livePlayers].sort(
    (a, b) => getDistance(enemy, a) - getDistance(enemy, b)
  );
  const nearest = sorted[0];

  let currentRow = enemy.row;
  let currentCol = enemy.col;

  if (getDistance(enemy, nearest) > enemy.range) {
    const movableTiles = getMovableTiles(enemy, allUnits, mapGrid, mapWidth, mapHeight);
    if (movableTiles.length > 0) {
      const bestTile = movableTiles.sort((a, b) =>
        getDistance({ row: a[0], col: a[1] }, nearest) -
        getDistance({ row: b[0], col: b[1] }, nearest)
      )[0];
      currentRow = bestTile[0];
      currentCol = bestTile[1];
    }
  }

  const movedEnemy = { ...enemy, row: currentRow, col: currentCol };
  const inRange    = livePlayers.filter(
    (p) => getDistance(movedEnemy, p) <= enemy.range
  );

  let attackTargetId = null;
  if (inRange.length > 0) {
    attackTargetId = inRange.sort((a, b) => a.hp - b.hp)[0].id;
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
