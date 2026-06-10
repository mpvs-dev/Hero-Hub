/**
 * useGameStore.js
 * Ensambla todos los slices en un único store de Zustand.
 * Este archivo no contiene lógica — solo conecta las piezas.
 */

import { create } from "zustand";
import { LOG_MAX }                        from "./helpers";
import { lobbyState,  createLobbySlice }  from "./lobbySlice";
import { mapState,    createMapSlice }    from "./mapSlice";
import { combatState, createCombatSlice } from "./combatSlice";
import { enemyState,  createEnemySlice }  from "./enemySlice";

export { PLAYER_HEROES } from "./lobbySlice";

const useGameStore = create((set, get) => ({
  // ── Estado inicial (unión de todos los slices) ────────────
  ...lobbyState,
  ...mapState,
  ...combatState,
  ...enemyState,

  // ── Log compartido (usado por todos los slices via get()._log) ──
  // Acepta string (retrocompatibilidad) o array de tokens [{text, type}]
  battleLog: [],
  _log: (message) =>
    set((state) => {
      const entry = Array.isArray(message)
        ? message
        : [{ text: String(message), type: "system" }];
      return { battleLog: [entry, ...state.battleLog].slice(0, LOG_MAX) };
    }),

  // ── Slices ────────────────────────────────────────────────
  ...createLobbySlice(set, get),
  ...createMapSlice(set, get),
  ...createCombatSlice(set, get),
  ...createEnemySlice(set, get),
}));

export default useGameStore;
