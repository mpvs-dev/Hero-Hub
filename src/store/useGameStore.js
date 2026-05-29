import { create } from "zustand";
import { MAPS } from "../config/maps";
import {
  createUnitsFromMap,
  getMovableTiles,
  getAttackableUnits,
  calculateDamage,
  checkGameOver,
} from "../engine/gameEngine";

const LOG_MAX = 10;

const useGameStore = create((set, get) => ({
  currentMapKey: null, // clave del mapa activo
  units: [], // todas las unidades (héroes + enemigos)

  selectedUnitId: null, // id de la unidad seleccionada
  movableTiles: [], // [[row, col], ...] casillas de movimiento
  attackableUnitIds: [], // ['e0', 'e1'] ids de enemigos atacables
  phase: "select", // 'select' | 'move' | 'attack'

  turn: "player", // 'player' | 'enemy'
  roundNumber: 1,
  battleLog: [], // mensajes de batalla (más reciente primero)
  gameOver: null, // null | 'win' | 'lose'
  enemyBusy: false, // true mientras la IA ejecuta su turno

  //  HELPERS INTERNOS

  _log: (message) =>
    set((state) => ({
      battleLog: [message, ...state.battleLog].slice(0, LOG_MAX),
    })),

  _deselect: () =>
    set({
      selectedUnitId: null,
      movableTiles: [],
      attackableUnitIds: [],
      phase: "select",
    }),

  //  ACCIONES — MAPA

  /** Carga un mapa y reinicia todo el estado de partida */
  startMap: (mapKey) => {
    const map = MAPS[mapKey];
    const units = createUnitsFromMap(map);
    set({
      currentMapKey: mapKey,
      units,
      selectedUnitId: null,
      movableTiles: [],
      attackableUnitIds: [],
      phase: "select",
      turn: "player",
      roundNumber: 1,
      battleLog: [`⚔ ${map.name} — ¡Tu turno!`],
      gameOver: null,
      enemyBusy: false,
    });
  },

  /** Reinicia el mapa actual */
  resetMap: () => {
    const { currentMapKey, startMap } = get();
    if (currentMapKey) startMap(currentMapKey);
  },

  /** Vuelve al menú de selección de mapas */
  exitToMenu: () =>
    set({
      currentMapKey: null,
      units: [],
      selectedUnitId: null,
      movableTiles: [],
      attackableUnitIds: [],
      phase: "select",
      turn: "player",
      roundNumber: 1,
      battleLog: [],
      gameOver: null,
      enemyBusy: false,
    }),

  // ═══════════════════════════════════════════
  //  ACCIONES — TURNO DEL JUGADOR
  // ═══════════════════════════════════════════

  /** Selecciona un héroe y calcula sus opciones */
  selectUnit: (unitId) => {
    const { units, turn, gameOver, currentMapKey, _log, _deselect } = get();
    if (turn !== "player" || gameOver) return;

    const unit = units.find((u) => u.id === unitId);
    if (!unit || !unit.alive || unit.team !== "player") return;

    if (unit.moved && unit.attacked) {
      _log(`${unit.name} ya actuó este turno.`);
      return;
    }

    const map = MAPS[currentMapKey];
    const liveEnemies = units.filter((u) => u.team === "enemy" && u.alive);

    set({ selectedUnitId: unitId });

    if (!unit.moved) {
      // Mostrar casillas de movimiento + posibles ataques desde posición actual
      const movable = getMovableTiles(unit, units, map.grid, map.w, map.h);
      const atkIds = !unit.attacked
        ? getAttackableUnits(unit, liveEnemies).map((e) => e.id)
        : [];
      set({ movableTiles: movable, attackableUnitIds: atkIds, phase: "move" });
    } else {
      // Ya se movió — solo mostrar opciones de ataque
      const atkIds = getAttackableUnits(unit, liveEnemies).map((e) => e.id);
      set({ movableTiles: [], attackableUnitIds: atkIds, phase: "attack" });
    }
  },

  /** Mueve la unidad seleccionada a [row, col] */
  moveUnit: (unitId, row, col) => {
    const { units, _log, _deselect } = get();
    const unit = units.find((u) => u.id === unitId);
    if (!unit) return;

    const newUnits = units.map((u) =>
      u.id === unitId ? { ...u, row, col, moved: true } : u,
    );
    const movedUnit = { ...unit, row, col };
    const liveEnemies = newUnits.filter((u) => u.team === "enemy" && u.alive);

    // Calcular si hay enemigos atacables desde la nueva posición
    const atkIds = !unit.attacked
      ? getAttackableUnits(movedUnit, liveEnemies).map((e) => e.id)
      : [];

    set({ units: newUnits });

    if (atkIds.length > 0) {
      set({ movableTiles: [], attackableUnitIds: atkIds, phase: "attack" });
      _log(`${unit.name} avanza. ¡Selecciona un objetivo!`);
    } else {
      _deselect();
      _log(`${unit.name} se mueve.`);
    }
  },

  /** Ataca a una unidad enemiga */
  attackUnit: (attackerId, targetId) => {
    const { units, _log, _deselect } = get();
    const attacker = units.find((u) => u.id === attackerId);
    const target = units.find((u) => u.id === targetId);

    if (!attacker || !target || attacker.attacked) return;

    const dmg = calculateDamage(attacker, target);
    const newHp = Math.max(0, target.hp - dmg);
    const died = newHp <= 0;

    _log(
      `${attacker.name} ataca a ${target.name}: -${dmg} HP${died ? " ¡Vencido!" : ""}`,
    );

    const newUnits = units.map((u) => {
      if (u.id === targetId) return { ...u, hp: newHp, alive: !died };
      if (u.id === attackerId) return { ...u, attacked: true };
      return u;
    });

    set({ units: newUnits });
    _deselect();

    const result = checkGameOver(newUnits);
    if (result) set({ gameOver: result });
  },

  /** Salta el movimiento para atacar desde la posición actual */
  skipMove: (unitId) => {
    const { units, _log } = get();
    const unit = units.find((u) => u.id === unitId);
    if (!unit) return;

    const newUnits = units.map((u) =>
      u.id === unitId ? { ...u, moved: true } : u,
    );
    const liveEnemies = newUnits.filter((u) => u.team === "enemy" && u.alive);
    const atkIds = getAttackableUnits(unit, liveEnemies).map((e) => e.id);

    set({
      units: newUnits,
      movableTiles: [],
      attackableUnitIds: atkIds,
      phase: "attack",
    });
    _log(`${unit.name} mantiene posición.`);
  },

  /** Termina el turno del jugador e inicia el del enemigo */
  endPlayerTurn: () => {
    const { turn, enemyBusy, gameOver, _deselect, _log } = get();
    if (turn !== "player" || enemyBusy || gameOver) return;
    _deselect();
    set({ turn: "enemy" });
    _log("El enemigo actúa...");
  },

  // ═══════════════════════════════════════════
  //  ACCIONES — TURNO DEL ENEMIGO (llamadas desde App.jsx)
  //  El bucle async de la IA vive en App.jsx para poder
  //  hacer await sin bloquear el store.
  // ═══════════════════════════════════════════

  setEnemyBusy: (busy) => set({ enemyBusy: busy }),

  /** Aplica el movimiento de un enemigo */
  applyEnemyMove: (enemyId, row, col) => {
    set((state) => ({
      units: state.units.map((u) =>
        u.id === enemyId ? { ...u, row, col, moved: true } : u,
      ),
    }));
  },

  /** Aplica el ataque de un enemigo y devuelve el resultado de game over */
  applyEnemyAttack: (enemyId, targetId) => {
    const { units, _log } = get();
    const enemy = units.find((u) => u.id === enemyId);
    const target = units.find((u) => u.id === targetId);
    if (!enemy || !target || !target.alive) return null;

    const dmg = calculateDamage(enemy, target);
    const newHp = Math.max(0, target.hp - dmg);
    const died = newHp <= 0;

    _log(
      `${enemy.name} ataca a ${target.name}: -${dmg} HP${died ? " ¡Caído!" : ""}`,
    );

    const newUnits = units.map((u) => {
      if (u.id === targetId) return { ...u, hp: newHp, alive: !died };
      if (u.id === enemyId) return { ...u, attacked: true };
      return u;
    });

    set({ units: newUnits });
    return checkGameOver(newUnits);
  },

  /** Finaliza el turno del enemigo y comienza el siguiente del jugador */
  finishEnemyTurn: () => {
    const { roundNumber, _log } = get();
    const newRound = roundNumber + 1;
    set((state) => ({
      units: state.units.map((u) => ({ ...u, moved: false, attacked: false })),
      turn: "player",
      roundNumber: newRound,
      enemyBusy: false,
    }));
    _log(`— Ronda ${newRound} — Tu turno.`);
  },
}));

export default useGameStore;
