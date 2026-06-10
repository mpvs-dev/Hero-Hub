import { TILE_TYPES } from "../config/tiles";
import { HEROES }     from "../config/heroes";
import { ENEMIES }    from "../config/enemies";

const UNITS = { ...HEROES, ...ENEMIES };

// ─── Distancia Manhattan ──────────────────────────────────────────────────────

export function getDistance(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// ─── Movimiento (Dijkstra con moveCost por tile) ──────────────────────────────

/**
 * Ejecuta Dijkstra desde la posición del unit.
 * Devuelve { tiles, parentMap, startKey } para poder reconstruir caminos.
 *   tiles     → array de [row, col] alcanzables (sin incluir la celda de origen)
 *   parentMap → Map<"row,col", "row,col"> para reconstruir el camino completo
 *   startKey  → "row,col" del origen
 */
export function getMovableTilesWithPaths(unit, allUnits, mapGrid, mapWidth, mapHeight) {
  const costMap   = {};
  const parentMap = new Map();
  const startKey  = `${unit.row},${unit.col}`;
  costMap[startKey] = 0;

  const queue = [[0, unit.row, unit.col]];

  const blockedSet = new Set(
    allUnits
      .filter(u => u.alive && u.id !== unit.id)
      .map(u => `${u.row},${u.col}`)
  );

  const directions = [[-1,0],[1,0],[0,-1],[0,1]];

  while (queue.length > 0) {
    queue.sort((a, b) => a[0] - b[0]);
    const [cost, row, col] = queue.shift();

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

      if (newCost > unit.mov) continue;
      if (blockedSet.has(neighborKey)) continue;

      if (newCost < (costMap[neighborKey] ?? Infinity)) {
        costMap[neighborKey] = newCost;
        parentMap.set(neighborKey, key); // de dónde venimos
        queue.push([newCost, nr, nc]);
      }
    }
  }

  const tiles = Object.keys(costMap)
    .filter(k => k !== startKey)
    .map(k => k.split(",").map(Number));

  return { tiles, parentMap, startKey };
}

/**
 * Wrapper de compatibilidad — devuelve solo los tiles.
 */
export function getMovableTiles(unit, allUnits, mapGrid, mapWidth, mapHeight) {
  return getMovableTilesWithPaths(unit, allUnits, mapGrid, mapWidth, mapHeight).tiles;
}

/**
 * Reconstruye el camino completo desde el origen hasta destRow/destCol
 * usando el parentMap de getMovableTilesWithPaths.
 * Devuelve [{row,col}, ...] SIN incluir la celda de origen.
 */
export function getPathTo(destRow, destCol, parentMap, startKey) {
  const path = [];
  let current = `${destRow},${destCol}`;

  while (current && current !== startKey) {
    const [r, c] = current.split(",").map(Number);
    path.unshift({ row: r, col: c });
    current = parentMap.get(current);
  }

  return path;
}

// ─── Combate ──────────────────────────────────────────────────────────────────

export function getAttackableUnits(attacker, potentialTargets) {
  return potentialTargets.filter(
    target => target.alive && getDistance(attacker, target) <= attacker.range
  );
}

export function calculateDamage(attacker, defender) {
  const base     = attacker.atk - defender.def;
  const variance = Math.floor(Math.random() * 5) - 1;
  return Math.max(1, base + variance);
}

export function tryApplyStatusEffect(attacker, defender) {
  if (!attacker.abilities?.length) return null;

  for (const ability of attacker.abilities) {
    if (Math.random() < ability.chance) {
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

// ─── Helpers internos de IA ───────────────────────────────────────────────────

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

/**
 * Dado un conjunto de tiles alcanzables, devuelve el mejor
 * según una función de puntuación (mayor = mejor).
 */
function bestTile(movableTiles, scoreFn) {
  if (movableTiles.length === 0) return null;
  return movableTiles.reduce((best, tile) => {
    return scoreFn(tile) > scoreFn(best) ? tile : best;
  }, movableTiles[0]);
}

/**
 * Devuelve true si una posición está en rango de ataque de algún jugador vivo.
 * Útil para que el Goblin evite posiciones peligrosas.
 */
function isExposedToPlayers(row, col, players, enemyRange) {
  return players.some(p => getDistance({ row, col }, p) <= p.range);
}

/**
 * Penalización por tile peligroso (lava).
 */
function tileDanger(row, col, mapGrid) {
  const key  = mapGrid[row]?.[col];
  const tile = TILE_TYPES[key];
  return tile?.effect?.type === "damage" ? tile.effect.amount : 0;
}

// ─── Perfiles de comportamiento de IA ────────────────────────────────────────

/**
 * ORC — Bruto agresivo
 * Prioridad: héroe con menos HP (rematar al débil).
 * Movimiento: directo hacia el objetivo, sin rodeos.
 * No huye nunca.
 */
function orcAction(enemy, allUnits, mapGrid, mapWidth, mapHeight) {
  const livePlayers = allUnits.filter(u => u.team === "player" && u.alive);
  if (livePlayers.length === 0) return { movedTo: null, attackTargetId: null };

  // Prioriza el héroe con menos HP (rematar)
  const target = [...livePlayers].sort((a, b) => a.hp - b.hp)[0];

  const movableTiles = getMovableTiles(enemy, allUnits, mapGrid, mapWidth, mapHeight);
  let currentPos = { row: enemy.row, col: enemy.col };

  if (getDistance(enemy, target) > enemy.range && movableTiles.length > 0) {
    // Moverse lo más cerca posible del objetivo, evitar lava
    const best = bestTile(movableTiles, ([r, c]) => {
      const distScore  = -getDistance({ row: r, col: c }, target);
      const lavaScore  = -tileDanger(r, c, mapGrid) * 2;
      return distScore + lavaScore;
    });
    if (best) currentPos = { row: best[0], col: best[1] };
  }

  // Atacar desde la nueva posición
  const movedEnemy   = { ...enemy, ...currentPos };
  const inRange      = livePlayers.filter(p => getDistance(movedEnemy, p) <= enemy.range);
  const attackTarget = inRange.length > 0
    ? [...inRange].sort((a, b) => a.hp - b.hp)[0]  // rematar al más débil
    : null;

  return {
    movedTo: (currentPos.row !== enemy.row || currentPos.col !== enemy.col) ? currentPos : null,
    attackTargetId: attackTarget?.id ?? null,
  };
}

/**
 * GOBLIN — Oportunista y cobarde
 * Prioridad: héroe con más daño recibido (HP% más bajo).
 * Movimiento: flanquear (preferir tiles que no estén en línea directa).
 * Huye si su propio HP < 30%.
 * Evita quedar expuesto a múltiples héroes.
 */
function goblinAction(enemy, allUnits, mapGrid, mapWidth, mapHeight) {
  const livePlayers = allUnits.filter(u => u.team === "player" && u.alive);
  if (livePlayers.length === 0) return { movedTo: null, attackTargetId: null };

  const hpRatio     = enemy.hp / (enemy.maxHp ?? enemy.hp);
  const isScared    = hpRatio < 0.3;
  const movableTiles = getMovableTiles(enemy, allUnits, mapGrid, mapWidth, mapHeight);
  let currentPos    = { row: enemy.row, col: enemy.col };

  if (isScared) {
    // HUIR: moverse lo más lejos posible de todos los héroes
    if (movableTiles.length > 0) {
      const best = bestTile(movableTiles, ([r, c]) => {
        const safetyScore = livePlayers.reduce(
          (sum, p) => sum + getDistance({ row: r, col: c }, p), 0
        );
        const lavaScore = -tileDanger(r, c, mapGrid) * 3;
        return safetyScore + lavaScore;
      });
      if (best) currentPos = { row: best[0], col: best[1] };
    }
    // Cuando huye no ataca
    return {
      movedTo: (currentPos.row !== enemy.row || currentPos.col !== enemy.col) ? currentPos : null,
      attackTargetId: null,
    };
  }

  // Objetivo: el héroe con menor HP%
  const target = [...livePlayers].sort(
    (a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp)
  )[0];

  if (getDistance(enemy, target) > enemy.range && movableTiles.length > 0) {
    const best = bestTile(movableTiles, ([r, c]) => {
      const distScore = -getDistance({ row: r, col: c }, target);

      // Bonificación por flanquear: no estar en la misma fila/columna que el target
      const flankBonus = (r !== target.row && c !== target.col) ? 1.5 : 0;

      // Penalización por quedar expuesto a muchos héroes
      const exposedCount = livePlayers.filter(
        p => getDistance({ row: r, col: c }, p) <= p.range
      ).length;
      const exposureScore = -exposedCount * 2;

      const lavaScore = -tileDanger(r, c, mapGrid) * 2;

      return distScore + flankBonus + exposureScore + lavaScore;
    });
    if (best) currentPos = { row: best[0], col: best[1] };
  }

  // Atacar desde la nueva posición
  const movedEnemy   = { ...enemy, ...currentPos };
  const inRange      = livePlayers.filter(p => getDistance(movedEnemy, p) <= enemy.range);
  // Prioriza el héroe con menor HP%
  const attackTarget = inRange.length > 0
    ? [...inRange].sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0]
    : null;

  return {
    movedTo: (currentPos.row !== enemy.row || currentPos.col !== enemy.col) ? currentPos : null,
    attackTargetId: attackTarget?.id ?? null,
  };
}

/**
 * DARKMAGE — Hechicero conservador
 * Prioridad: héroe con más ATK (eliminar amenazas primero).
 * Movimiento: mantiene distancia ÓPTIMA = su rango de ataque (3).
 *   - Si está demasiado lejos, se acerca hasta rango.
 *   - Si está demasiado cerca, se aleja para no ser golpeado en CaC.
 * Nunca entra en casilla adyacente a un héroe si puede evitarlo.
 */
function darkMageAction(enemy, allUnits, mapGrid, mapWidth, mapHeight) {
  const livePlayers = allUnits.filter(u => u.team === "player" && u.alive);
  if (livePlayers.length === 0) return { movedTo: null, attackTargetId: null };

  // Prioriza al héroe con más ATK (la mayor amenaza)
  const target = [...livePlayers].sort((a, b) => b.atk - a.atk)[0];

  const optimalRange   = enemy.range;       // 3 para el Darkmage
  const dangerDistance = 1;                 // distancia a la que un CaC puede golpearle
  const distToTarget   = getDistance(enemy, target);

  const movableTiles = getMovableTiles(enemy, allUnits, mapGrid, mapWidth, mapHeight);
  let currentPos     = { row: enemy.row, col: enemy.col };

  if (movableTiles.length > 0) {
    const best = bestTile(movableTiles, ([r, c]) => {
      const posToTarget = getDistance({ row: r, col: c }, target);

      // Puntuar por estar exactamente en rango óptimo
      const rangeDiff  = Math.abs(posToTarget - optimalRange);
      const rangeScore = -rangeDiff * 3;

      // Penalizar mucho estar adyacente a cualquier héroe CaC
      const meleeThreats = livePlayers.filter(
        p => p.range === 1 && getDistance({ row: r, col: c }, p) <= dangerDistance
      ).length;
      const meleeScore = -meleeThreats * 8;

      // Penalizar estar en rango de ataque de cualquier héroe
      const inAttackRange = livePlayers.filter(
        p => getDistance({ row: r, col: c }, p) <= p.range
      ).length;
      const exposureScore = -inAttackRange * 2;

      // Evitar lava
      const lavaScore = -tileDanger(r, c, mapGrid) * 4;

      return rangeScore + meleeScore + exposureScore + lavaScore;
    });
    if (best) currentPos = { row: best[0], col: best[1] };
  }

  // Atacar: desde la nueva posición, priorizar el de más ATK en rango
  const movedEnemy = { ...enemy, ...currentPos };
  const inRange    = livePlayers.filter(p => getDistance(movedEnemy, p) <= enemy.range);
  const attackTarget = inRange.length > 0
    ? [...inRange].sort((a, b) => b.atk - a.atk)[0]  // eliminar al más peligroso
    : null;

  return {
    movedTo: (currentPos.row !== enemy.row || currentPos.col !== enemy.col) ? currentPos : null,
    attackTargetId: attackTarget?.id ?? null,
  };
}

/**
 * Comportamiento genérico de fallback para tipos no definidos.
 * Simple: acercarse al más cercano y atacar al de menos HP.
 */
function genericAction(enemy, allUnits, mapGrid, mapWidth, mapHeight) {
  const livePlayers = allUnits.filter(u => u.team === "player" && u.alive);
  if (livePlayers.length === 0) return { movedTo: null, attackTargetId: null };

  const nearest = [...livePlayers].sort(
    (a, b) => getDistance(enemy, a) - getDistance(enemy, b)
  )[0];

  const movableTiles = getMovableTiles(enemy, allUnits, mapGrid, mapWidth, mapHeight);
  let currentPos     = { row: enemy.row, col: enemy.col };

  if (getDistance(enemy, nearest) > enemy.range && movableTiles.length > 0) {
    const best = bestTile(movableTiles, ([r, c]) =>
      -getDistance({ row: r, col: c }, nearest)
    );
    if (best) currentPos = { row: best[0], col: best[1] };
  }

  const movedEnemy   = { ...enemy, ...currentPos };
  const inRange      = livePlayers.filter(p => getDistance(movedEnemy, p) <= enemy.range);
  const attackTarget = inRange.length > 0
    ? [...inRange].sort((a, b) => a.hp - b.hp)[0]
    : null;

  return {
    movedTo: (currentPos.row !== enemy.row || currentPos.col !== enemy.col) ? currentPos : null,
    attackTargetId: attackTarget?.id ?? null,
  };
}

// ─── Dispatcher principal ─────────────────────────────────────────────────────

/**
 * Selecciona el perfil de IA según el tipo de enemigo y delega.
 * Añadir nuevos tipos es tan simple como agregar un case.
 */
export function computeEnemyAction(enemy, allUnits, mapGrid, mapWidth, mapHeight) {
  switch (enemy.type) {
    case "orc":
      return orcAction(enemy, allUnits, mapGrid, mapWidth, mapHeight);
    case "goblin":
      return goblinAction(enemy, allUnits, mapGrid, mapWidth, mapHeight);
    case "darkmage":
      return darkMageAction(enemy, allUnits, mapGrid, mapWidth, mapHeight);
    default:
      return genericAction(enemy, allUnits, mapGrid, mapWidth, mapHeight);
  }
}

// ─── Inicialización ───────────────────────────────────────────────────────────

export function createUnitsFromMap(map) {
  const units = [];

  map.playerSpawns.forEach(({ type, row, col }, index) => {
    const def = UNITS[type];
    if (!def) { console.warn(`[GameEngine] Unidad desconocida: "${type}"`); return; }
    units.push({
      id: `p${index}`, type, ...def,
      maxHp: def.hp, row, col,
      alive: true, movesUsed: 0, attacked: false,
      movesPerTurn: def.movesPerTurn ?? 1,
    });
  });

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
      alive: true, movesUsed: 0, attacked: false,
      movesPerTurn: 1,
    });
  });

  return units;
}

// ─── Estado del juego ─────────────────────────────────────────────────────────

export function checkGameOver(units) {
  const players = units.filter(u => u.team === "player");
  const enemies = units.filter(u => u.team === "enemy");
  if (players.every(u => !u.alive)) return "lose";
  if (enemies.every(u => !u.alive)) return "win";
  return null;
}
