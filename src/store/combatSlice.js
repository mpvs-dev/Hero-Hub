/**
 * combatSlice.js
 * Turno del jugador: selección, movimiento, ataque, habilidades y fin de turno.
 */

import { MAPS }      from "../config/maps";
import { ABILITIES } from "../config/abilities";
import {
  calculateDamage,
  checkGameOver,
  getMovableTilesWithPaths,
  getPathTo,
} from "../engine/gameEngine";
import {
  canMove,
  canAttack,
  isDone,
  tickTileEffects,
  tickPathTileEffects,
  computeSelectionState,
  DESELECT_STATE,
} from "./helpers";
import {
  msgAttack, msgMove, msgAdvance, msgCanMove,
  msgAlreadyActed, msgAbility, msgAbilityNoTargets,
  msgLavaTransit, msgLavaDeath, msgEnemyTurn,
} from "../config/logColors";

export const combatState = {
  selectedUnitId:    null,
  inspectedEnemyId:  null,
  movableTiles:      [],
  attackableUnitIds: [],
};

export function createCombatSlice(set, get) {
  return {
    // ── Utilidades de selección ──────────────────────────────
    _deselect: () => set(DESELECT_STATE),

    inspectEnemy: (unitId) =>
      set({
        inspectedEnemyId: unitId,
        selectedUnitId: null,
        movableTiles: [],
        attackableUnitIds: [],
        phase: "select",
      }),

    // ── Acciones del jugador ─────────────────────────────────
    selectUnit: (unitId) => {
      const { units, turn, gameOver, currentMapKey } = get();
      if (turn !== "player" || gameOver) return;

      const unit = units.find(u => u.id === unitId);
      if (!unit || !unit.alive || unit.team !== "player") return;

      if (isDone(unit)) {
        get()._log(msgAlreadyActed({ unitName: unit.name }));
        return;
      }

      const map = MAPS[currentMapKey];
      set({
        selectedUnitId: unitId,
        inspectedEnemyId: null,
        ...computeSelectionState(unit, units, map),
      });
    },

    moveUnit: (unitId, row, col) => {
      const { units, currentMapKey } = get();
      const unit = units.find(u => u.id === unitId);
      if (!unit || !canMove(unit)) return;

      const map          = MAPS[currentMapKey];
      const newMovesUsed = (unit.movesUsed ?? 0) + 1;

      // Reconstruir el camino para detectar lava en tránsito
      const { parentMap, startKey } = getMovableTilesWithPaths(unit, units, map.grid, map.w, map.h);
      const path = getPathTo(row, col, parentMap, startKey);

      // Aplicar daño de lava en casillas intermedias
      const { unit: unitAfterPath, logs: pathLogs, died: diedOnPath } =
        tickPathTileEffects(unit, path, map.grid);

      pathLogs.forEach(msg => get()._log(msg));

      // Actualizar posición + movesUsed + HP tras tránsito
      let newUnits = units.map(u =>
        u.id === unitId
          ? { ...unitAfterPath, row, col, movesUsed: newMovesUsed }
          : u
      );

      set({ units: newUnits });

      // Si murió cruzando la lava, verificar game over y deseleccionar
      if (diedOnPath) {
        const result = checkGameOver(newUnits);
        if (result) set({ gameOver: result, ...DESELECT_STATE });
        else get()._deselect();
        return;
      }

      const updatedUnit = { ...unitAfterPath, row, col, movesUsed: newMovesUsed };
      const movesLeft   = (updatedUnit.movesPerTurn ?? 1) - newMovesUsed;

      if (movesLeft > 0 && !canAttack(updatedUnit)) {
        get()._log(msgMove({ unitName: unit.name, unitTeam: unit.team, movesLeft }));
      } else {
        get()._log(msgAdvance({ unitName: unit.name, unitTeam: unit.team }));
      }

      set(computeSelectionState(updatedUnit, newUnits, map));
    },

    attackUnit: (attackerId, targetId) => {
      const { units, currentMapKey } = get();
      const attacker = units.find(u => u.id === attackerId);
      const target   = units.find(u => u.id === targetId);
      if (!attacker || !target || !canAttack(attacker)) return;

      const dmg   = calculateDamage(attacker, target);
      const newHp = Math.max(0, target.hp - dmg);
      const died  = newHp <= 0;

      // Pasiva on_attack
      let newTargetEffects = [...(target.statusEffects ?? [])];

      if (!died && attacker.abilityKey) {
        const ab = ABILITIES[attacker.abilityKey];
        if (ab?.type === "passive" && ab.trigger === "on_attack" && ab.effect.type === "status") {
          if (Math.random() < ab.effect.chance) {
            const already = newTargetEffects.find(e => e.type === ab.effect.statusType);
            if (already) {
              newTargetEffects = newTargetEffects.map(e =>
                e.type === ab.effect.statusType ? { ...e, duration: ab.effect.duration } : e
              );
            } else {
              newTargetEffects.push({
                type:     ab.effect.statusType,
                duration: ab.effect.duration,
                damage:   ab.effect.damage,
              });
            }
          }
        }
      }

      const STATUS_ICONS = { poison: "☠ Envenenado", burn: "🔥 Quemado", bleed: "🩸 Sangrando" };
      const newEffect = newTargetEffects.find(
        e => !(target.statusEffects ?? []).find(o => o.type === e.type)
      );
      const statusName = !died && newEffect ? (STATUS_ICONS[newEffect.type] ?? newEffect.type) : null;

      get()._log(msgAttack({
        attackerName: attacker.name,
        attackerTeam: attacker.team,
        targetName:   target.name,
        targetTeam:   target.team,
        damage:       dmg,
        died,
        statusName,
      }));

      const newUnits = units.map(u => {
        if (u.id === targetId)   return { ...u, hp: newHp, alive: !died, statusEffects: newTargetEffects };
        if (u.id === attackerId) return { ...u, attacked: true };
        return u;
      });
      set({ units: newUnits });

      const updatedAttacker = { ...attacker, attacked: true };
      const map = MAPS[currentMapKey];

      if (canMove(updatedAttacker)) {
        const movesLeft = (updatedAttacker.movesPerTurn ?? 1) - (updatedAttacker.movesUsed ?? 0);
        get()._log(msgCanMove({ unitName: attacker.name, unitTeam: attacker.team, movesLeft }));
      }
      set(computeSelectionState(updatedAttacker, newUnits, map));

      const result = checkGameOver(newUnits);
      if (result) set({ gameOver: result, ...DESELECT_STATE });
    },

    useAbility: (attackerId, targetId = null) => {
      const { units, currentMapKey } = get();
      const attacker = units.find(u => u.id === attackerId);
      if (!attacker || !attacker.alive || attacker.abilityUsed) return;

      const ab = ABILITIES[attacker.abilityKey];
      if (!ab || ab.type !== "active" || (attacker.abilityCooldown ?? 0) > 0) return;

      const liveEnemies = units.filter(u => u.team === "enemy" && u.alive);
      let affectedIds   = [];

      if (ab.targetMode === "all_enemies") {
        affectedIds = liveEnemies
          .filter(e => Math.abs(e.row - attacker.row) + Math.abs(e.col - attacker.col) <= ab.range)
          .map(e => e.id);
      } else if (ab.targetMode === "aoe" && targetId) {
        const pivot = units.find(u => u.id === targetId);
        if (!pivot) return;
        affectedIds = liveEnemies
          .filter(e => Math.abs(e.row - pivot.row) + Math.abs(e.col - pivot.col) <= (ab.aoeRadius ?? 1))
          .map(e => e.id);
      } else if (ab.targetMode === "single_enemy" && targetId) {
        affectedIds = [targetId];
      }

      if (affectedIds.length === 0 && ab.targetMode !== "self") {
        get()._log(msgAbilityNoTargets({ unitName: attacker.name, unitTeam: attacker.team, abilityName: ab.name }));
        return;
      }

      const newUnits = units.map(u => {
        if (u.id === attackerId)
          return { ...u, attacked: true, abilityUsed: true, abilityCooldown: ab.cooldown };
        if (affectedIds.includes(u.id) && ab.effect.type === "damage") {
          const newHp = Math.max(0, u.hp - (ab.effect.damage ?? 0));
          return { ...u, hp: newHp, alive: newHp > 0 };
        }
        return u;
      });

      get()._log(msgAbility({
        unitName: attacker.name, unitTeam: attacker.team,
        abilityIcon: ab.icon, abilityName: ab.name,
        count: affectedIds.length,
      }));
      set({ units: newUnits });

      const updatedAttacker = { ...attacker, attacked: true };
      const map = MAPS[currentMapKey];
      if (canMove(updatedAttacker)) {
        const movesLeft = (updatedAttacker.movesPerTurn ?? 1) - (updatedAttacker.movesUsed ?? 0);
        get()._log(msgCanMove({ unitName: attacker.name, unitTeam: attacker.team, movesLeft }));
      }
      set(computeSelectionState(updatedAttacker, newUnits, map));

      const result = checkGameOver(newUnits);
      if (result) set({ gameOver: result, ...DESELECT_STATE });
    },

    // ── Fin de turno del jugador ─────────────────────────────
    endPlayerTurn: () => {
      const { turn, enemyBusy, gameOver, units, currentMapKey } = get();
      if (turn !== "player" || enemyBusy || gameOver) return;

      const map     = MAPS[currentMapKey];
      const allLogs = [];

      // Daño de lava a héroes al terminar su turno
      const processedUnits = units.map(u => {
        if (u.team !== "player" || !u.alive) return u;
        const { unit: afterTile, logs } = tickTileEffects(u, map.grid);
        allLogs.push(...logs);
        return afterTile;
      });

      allLogs.forEach(msg => get()._log(msg));
      get()._deselect();

      const lavaResult = checkGameOver(processedUnits);
      if (lavaResult) {
        set({ units: processedUnits, gameOver: lavaResult });
        return;
      }

      set({ units: processedUnits, turn: "enemy" });
      get()._log(msgEnemyTurn());
    },
  };
}
