import { TILE_TYPES } from "../config/tiles";
import { getMovableTiles, getAttackableUnits } from "../engine/gameEngine";
import { msgStatusTick, msgDiedFromStatus, msgLavaDamage, msgLavaTransit, msgLavaDeath } from "../config/logColors";

export { LOG_MAX } from "../config/constants";

// ─── Estado de acción de una unidad ──────────────────────────────────────────

export function canMove(unit) {
  return (unit.movesUsed ?? 0) < (unit.movesPerTurn ?? 1);
}

export function canAttack(unit) {
  return !unit.attacked;
}

export function isDone(unit) {
  return !canMove(unit) && !canAttack(unit);
}

// ─── Ticks de fin de turno ────────────────────────────────────────────────────

/**
 * Aplica efectos de estado (veneno, quemadura, hemorragia) a una unidad.
 * Devuelve { unit, logs }.
 */
export function tickStatusEffects(u) {
  if (!u.alive) return { unit: u, logs: [] };

  const logs = [];
  let hp = u.hp;
  const nextEffects = [];

  for (const effect of (u.statusEffects ?? [])) {
    hp = Math.max(0, hp - effect.damage);
    const label =
      effect.type === "poison" ? "veneno" :
      effect.type === "burn"   ? "quemadura" : "hemorragia";
    logs.push(msgStatusTick({ unitName: u.name, unitTeam: u.team, damage: effect.damage, effectLabel: label }));
    if (effect.duration - 1 > 0) {
      nextEffects.push({ ...effect, duration: effect.duration - 1 });
    }
  }

  const died = hp <= 0;
  if (died && u.statusEffects?.length > 0) {
    logs.push(msgDiedFromStatus({ unitName: u.name, unitTeam: u.team }));
  }

  return { unit: { ...u, hp, alive: !died, statusEffects: nextEffects }, logs };
}

/**
 * Aplica daño del tile actual (ej. lava al terminar el turno encima).
 * Devuelve { unit, logs } — logs son arrays de tokens.
 */
export function tickTileEffects(u, mapGrid) {
  if (!u.alive || u.row < 0) return { unit: u, logs: [] };

  const tileKey = mapGrid[u.row]?.[u.col];
  const tile = TILE_TYPES[tileKey];
  if (!tile?.effect || tile.effect.type !== "damage") return { unit: u, logs: [] };

  const dmg  = tile.effect.amount;
  const hp   = Math.max(0, u.hp - dmg);
  const died = hp <= 0;
  const logs = [msgLavaDamage({ unitName: u.name, unitTeam: u.team, damage: dmg })];
  if (died) logs.push(msgLavaDeath({ unitName: u.name, unitTeam: u.team }));

  return { unit: { ...u, hp, alive: !died }, logs };
}

/**
 * Aplica daño de lava por CADA casilla INTERMEDIA pisada durante un movimiento.
 * Devuelve { unit, logs, died } — logs son arrays de tokens.
 */
export function tickPathTileEffects(u, path, mapGrid) {
  if (!u.alive || path.length <= 1) return { unit: u, logs: [], died: false };

  const transitCells = path.slice(0, -1);
  const logs = [];
  let hp = u.hp;

  for (const { row, col } of transitCells) {
    const tileKey = mapGrid[row]?.[col];
    const tile    = TILE_TYPES[tileKey];
    if (!tile?.effect || tile.effect.type !== "damage") continue;

    hp = Math.max(0, hp - tile.effect.amount);
    logs.push(msgLavaTransit({ unitName: u.name, unitTeam: u.team, damage: tile.effect.amount }));
    if (hp <= 0) break;
  }

  const died = hp <= 0;
  if (died) logs.push(msgLavaDeath({ unitName: u.name, unitTeam: u.team }));

  return { unit: { ...u, hp, alive: !died }, logs, died };
}

// ─── Selección tras acción ────────────────────────────────────────────────────

/**
 * Dado el estado actualizado de una unidad, calcula el patch de selección
 * que debe aplicarse al store (movableTiles, attackableUnitIds, phase…).
 */
export function computeSelectionState(unit, units, map) {
  const liveEnemies    = units.filter(u => u.team === "enemy" && u.alive);
  const stillCanMove   = canMove(unit);
  const stillCanAttack = canAttack(unit);

  if (!stillCanMove && !stillCanAttack) {
    return {
      selectedUnitId: null,
      inspectedEnemyId: null,
      movableTiles: [],
      attackableUnitIds: [],
      phase: "select",
    };
  }

  if (stillCanMove && !stillCanAttack) {
    const movable = getMovableTiles(unit, units, map.grid, map.w, map.h);
    return { movableTiles: movable, attackableUnitIds: [], phase: "move" };
  }

  if (!stillCanMove && stillCanAttack) {
    const atkIds = getAttackableUnits(unit, liveEnemies).map(e => e.id);
    return { movableTiles: [], attackableUnitIds: atkIds, phase: "attack" };
  }

  // Puede ambas — mostrar movimiento + atacables
  const movable = getMovableTiles(unit, units, map.grid, map.w, map.h);
  const atkIds  = getAttackableUnits(unit, liveEnemies).map(e => e.id);
  return { movableTiles: movable, attackableUnitIds: atkIds, phase: "move" };
}

// ─── Reset de selección ───────────────────────────────────────────────────────

export const DESELECT_STATE = {
  selectedUnitId: null,
  inspectedEnemyId: null,
  movableTiles: [],
  attackableUnitIds: [],
  phase: "select",
};
