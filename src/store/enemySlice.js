/**
 * enemySlice.js
 * Turno del enemigo: aplicar movimientos, ataques y fin de turno con ticks.
 * La IA en sí vive en gameEngine.js — este slice solo aplica sus decisiones.
 */

import { MAPS }      from "../config/maps";
import { ABILITIES } from "../config/abilities";
import {
  calculateDamage,
  checkGameOver,
  tryApplyStatusEffect,
  getMovableTilesWithPaths,
  getPathTo,
} from "../engine/gameEngine";
import {
  tickStatusEffects,
  tickTileEffects,
  tickPathTileEffects,
} from "./helpers";
import {
  msgAttack, msgStatusTick, msgDiedFromStatus,
  msgLavaDamage, msgLavaTransit, msgLavaDeath,
  msgHeal, msgTurn,
} from "../config/logColors";

export const enemyState = {
  enemyBusy: false,
};

export function createEnemySlice(set, get) {
  return {
    setEnemyBusy: (busy) => set({ enemyBusy: busy }),

    applyEnemyMove: (enemyId, row, col) => {
      const { units, currentMapKey } = get();
      const enemy = units.find(u => u.id === enemyId);
      if (!enemy) return;

      const map = MAPS[currentMapKey];

      // Reconstruir el camino para detectar lava en tránsito
      const { parentMap, startKey } = getMovableTilesWithPaths(
        enemy, units, map.grid, map.w, map.h
      );
      const path = getPathTo(row, col, parentMap, startKey);

      const { unit: afterPath, logs: pathLogs, died } = tickPathTileEffects(enemy, path, map.grid);
      pathLogs.forEach(msg => get()._log(msg));

      const newUnits = units.map(u =>
        u.id === enemyId
          ? { ...afterPath, row, col, movesUsed: (u.movesUsed ?? 0) + 1 }
          : u
      );
      set({ units: newUnits });

      // Devolver si murió en tránsito para que App.jsx lo gestione
      return died ? checkGameOver(newUnits) : null;
    },

    applyEnemyAttack: (enemyId, targetId) => {
      const { units } = get();
      const enemy  = units.find(u => u.id === enemyId);
      const target = units.find(u => u.id === targetId);
      if (!enemy || !target || !target.alive) return null;

      const dmg   = calculateDamage(enemy, target);
      const newHp = Math.max(0, target.hp - dmg);
      const died  = newHp <= 0;

      // Intentar aplicar efecto de estado
      const statusResult = !died ? tryApplyStatusEffect(enemy, target) : null;
      let newEffects = [...(target.statusEffects ?? [])];

      if (statusResult) {
        if (statusResult.refresh) {
          newEffects = newEffects.map(e =>
            e.type === statusResult.type
              ? { ...e, duration: statusResult.duration }
              : e
          );
        } else {
          newEffects.push({
            type:     statusResult.type,
            duration: statusResult.duration,
            damage:   statusResult.damage,
          });
        }
      }

      // Log con tokens
      const STATUS_ICONS = { poison: "☠ Envenenado", burn: "🔥 Quemado", bleed: "🩸 Sangrando" };
      const statusName = (!died && statusResult && !statusResult.refresh)
        ? (STATUS_ICONS[statusResult.type] ?? statusResult.type)
        : null;

      get()._log(msgAttack({
        attackerName: enemy.name,
        attackerTeam: enemy.team,
        targetName:   target.name,
        targetTeam:   target.team,
        damage:       dmg,
        died,
        statusName,
      }));

      const newUnits = units.map(u => {
        if (u.id === targetId) return { ...u, hp: newHp, alive: !died, statusEffects: newEffects };
        if (u.id === enemyId)  return { ...u, attacked: true };
        return u;
      });
      set({ units: newUnits });

      return checkGameOver(newUnits);
    },

    finishEnemyTurn: () => {
      const { roundNumber, units, currentMapKey } = get();
      const map      = MAPS[currentMapKey];
      const newRound = roundNumber + 1;
      const allLogs  = [];

      // 1. Tick efectos de estado + lava en TODAS las unidades
      let processed = units.map(u => {
        if (!u.alive) return u;
        const { unit: afterStatus, logs: sLogs } = tickStatusEffects(u);
        allLogs.push(...sLogs);
        const { unit: afterTile,   logs: tLogs } = tickTileEffects(afterStatus, map.grid);
        allLogs.push(...tLogs);
        return afterTile;
      });

      allLogs.forEach(msg => get()._log(msg));
      const gameOverResult = checkGameOver(processed);

      // 2. Pasiva on_turn (curación) — solo jugadores vivos
      processed = processed.map(u => {
        if (u.team !== "player" || !u.alive || !u.abilityKey) return u;
        const ab = ABILITIES[u.abilityKey];
        if (ab?.type === "passive" && ab.trigger === "on_turn" && ab.effect.type === "heal") {
          const healed = Math.min(u.maxHp, u.hp + ab.effect.amount);
          if (healed > u.hp) get()._log(msgHeal({ unitName: u.name, amount: healed - u.hp }));
          return { ...u, hp: healed };
        }
        return u;
      });

      // 3. Resetear flags de acción para el siguiente turno
      processed = processed.map(u => ({
        ...u,
        movesUsed:      0,
        attacked:       false,
        abilityUsed:    false,
        abilityCooldown: Math.max(0, (u.abilityCooldown ?? 0) - 1),
      }));

      set({
        units:       processed,
        turn:        "player",
        roundNumber: newRound,
        enemyBusy:   false,
        ...(gameOverResult ? { gameOver: gameOverResult } : {}),
      });

      if (!gameOverResult) get()._log(msgTurn(newRound));
    },
  };
}
