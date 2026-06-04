import { create } from "zustand";
import { MAPS }      from "../config/maps";
import { HEROES }    from "../config/heroes";
import { ENEMIES }   from "../config/enemies";
import { ABILITIES } from "../config/abilities";
import { TILE_TYPES } from "../config/tiles";
import {
  createUnitsFromMap,
  getMovableTiles,
  getAttackableUnits,
  calculateDamage,
  checkGameOver,
  tryApplyStatusEffect,
} from "../engine/gameEngine";

const LOG_MAX = 10;

export const PLAYER_HEROES = Object.values(HEROES);

// ─── Helper: ¿puede esta unidad moverse todavía? ─────────────────────────────
function canMove(unit) {
  return (unit.movesUsed ?? 0) < (unit.movesPerTurn ?? 1);
}

// ─── Helper: ¿puede atacar todavía? ─────────────────────────────────────────
function canAttack(unit) {
  return !unit.attacked;
}

// ─── Helper: ¿ha agotado todas sus acciones? ────────────────────────────────
function isDone(unit) {
  return !canMove(unit) && !canAttack(unit);
}

// ─── Helper: aplica efectos de estado a una unidad ──────────────────────────
function tickStatusEffects(u) {
  if (!u.alive) return { unit: u, logs: [] };
  const logs = [];
  let hp = u.hp;
  const nextEffects = [];

  for (const effect of (u.statusEffects ?? [])) {
    hp = Math.max(0, hp - effect.damage);
    const label =
      effect.type === "poison"  ? "veneno" :
      effect.type === "burn"    ? "quemadura" : "hemorragia";
    logs.push(`${u.name} sufre ${effect.damage} de daño por ${label} ☠`);
    if (effect.duration - 1 > 0) {
      nextEffects.push({ ...effect, duration: effect.duration - 1 });
    }
  }

  const died = hp <= 0;
  if (died && u.statusEffects?.length > 0) {
    logs.push(`${u.name} ha sucumbido a sus heridas. ¡Caído!`);
  }

  return { unit: { ...u, hp, alive: !died, statusEffects: nextEffects }, logs };
}

// ─── Helper: aplica daño de tile de lava ────────────────────────────────────
function tickTileEffects(u, mapGrid) {
  if (!u.alive || u.row < 0) return { unit: u, logs: [] };
  const tileKey = mapGrid[u.row]?.[u.col];
  const tile = TILE_TYPES[tileKey];
  if (!tile?.effect || tile.effect.type !== "damage") return { unit: u, logs: [] };

  const dmg  = tile.effect.amount;
  const hp   = Math.max(0, u.hp - dmg);
  const died = hp <= 0;
  const logs = [`${u.name} recibe ${dmg} de daño por la lava 🔥`];
  if (died) logs.push(`${u.name} ha sido consumido por la lava. ¡Caído!`);

  return { unit: { ...u, hp, alive: !died }, logs };
}

// ─── Helper: recalcula el estado de selección tras una acción ────────────────
// Devuelve el patch de estado a aplicar con set()
function computeSelectionState(unit, units, map) {
  const liveEnemies = units.filter(u => u.team === "enemy" && u.alive);

  const stillCanMove   = canMove(unit);
  const stillCanAttack = canAttack(unit);

  if (!stillCanMove && !stillCanAttack) {
    // Agotó todo — deseleccionar
    return {
      selectedUnitId: null,
      inspectedEnemyId: null,
      movableTiles: [],
      attackableUnitIds: [],
      phase: "select",
    };
  }

  if (stillCanMove && !stillCanAttack) {
    // Solo puede moverse (ya atacó)
    const movable = getMovableTiles(unit, units, map.grid, map.w, map.h);
    return { movableTiles: movable, attackableUnitIds: [], phase: "move" };
  }

  if (!stillCanMove && stillCanAttack) {
    // Solo puede atacar (agotó movimientos)
    const atkIds = getAttackableUnits(unit, liveEnemies).map(e => e.id);
    return { movableTiles: [], attackableUnitIds: atkIds, phase: "attack" };
  }

  // Puede ambas cosas — mostrar movimiento + atacables simultáneamente
  const movable = getMovableTiles(unit, units, map.grid, map.w, map.h);
  const atkIds  = getAttackableUnits(unit, liveEnemies).map(e => e.id);
  return { movableTiles: movable, attackableUnitIds: atkIds, phase: "move" };
}

const useGameStore = create((set, get) => ({
  // ── Pantalla activa
  screen: "lobby",

  // ── Lobby
  roster: [null, null, null],
  activeSlot: null,
  chosenAbilities: [null, null, null],

  // ── Game
  currentMapKey: null,
  units: [],
  selectedUnitId: null,
  inspectedEnemyId: null,
  movableTiles: [],
  attackableUnitIds: [],
  phase: "select",

  // Deploy
  deployQueue: [],
  deployPending: null,
  deployZoneTiles: [],

  turn: "player",
  roundNumber: 1,
  battleLog: [],
  gameOver: null,
  enemyBusy: false,

  _log: (message) =>
    set((state) => ({
      battleLog: [message, ...state.battleLog].slice(0, LOG_MAX),
    })),

  _deselect: () =>
    set({
      selectedUnitId: null,
      inspectedEnemyId: null,
      movableTiles: [],
      attackableUnitIds: [],
      phase: "select",
    }),

  inspectEnemy: (unitId) =>
    set({
      inspectedEnemyId: unitId,
      selectedUnitId: null,
      movableTiles: [],
      attackableUnitIds: [],
      phase: "select",
    }),

  selectSlot: (slotIndex) =>
    set((state) => ({
      activeSlot: state.activeSlot === slotIndex ? null : slotIndex,
    })),

  assignHero: (heroKey) => {
    const { roster, activeSlot } = get();
    if (activeSlot === null) return;
    const existingSlot = roster.findIndex((k) => k === heroKey);
    if (existingSlot !== -1 && existingSlot !== activeSlot) return;
    const newRoster = [...roster];
    newRoster[activeSlot] = newRoster[activeSlot] === heroKey ? null : heroKey;
    set({ roster: newRoster, activeSlot: null });
  },

  clearSlot: (slotIndex) =>
    set((state) => {
      const newRoster = [...state.roster];
      newRoster[slotIndex] = null;
      return { roster: newRoster, activeSlot: null };
    }),

  goToMapSelect: () => {
    const { roster } = get();
    if (roster.some((k) => k === null)) return;
    set({ screen: "abilitySelect", activeSlot: null });
  },

  backToLobby: () => set({ screen: "lobby" }),

  setHeroAbility: (slotIndex, abilityKey) =>
    set(state => {
      const next = [...state.chosenAbilities];
      next[slotIndex] = next[slotIndex] === abilityKey ? null : abilityKey;
      return { chosenAbilities: next };
    }),

  confirmAbilities: () => {
    const { chosenAbilities, roster } = get();
    if (roster.some((_, i) => chosenAbilities[i] === null)) return;
    set({ screen: "mapSelect" });
  },

  // ── MAPA ───────────────────────────────────────────────────

  startMap: (mapKey) => {
    const { roster, chosenAbilities } = get();
    const map = MAPS[mapKey];
    const customSpawns = roster.map((heroKey, i) => ({
      type: heroKey,
      row: map.playerSpawns[i]?.row ?? i,
      col: map.playerSpawns[i]?.col ?? 0,
    }));
    const mapWithRoster = { ...map, playerSpawns: customSpawns };

    const rawUnits = createUnitsFromMap(mapWithRoster);
    const playerUnits = rawUnits.filter(u => u.team === "player");
    const enemyUnits  = rawUnits.filter(u => u.team === "enemy");

    const allUnits = [
      ...playerUnits.map((u, idx) => ({
        ...u,
        row: -1, col: -1, deployed: false,
        abilityKey: chosenAbilities[idx] ?? null,
        abilityCooldown: 0,
        statusEffects: [],
        // movesPerTurn viene del HEROES definition a través de createUnitsFromMap
        movesUsed: 0,
      })),
      ...enemyUnits.map(u => ({
        ...u,
        deployed: true,
        statusEffects: [],
        movesPerTurn: 1,
        movesUsed: 0,
      })),
    ];

    const deployQueue = customSpawns.map((s) => s.type);
    set({
      screen: "game",
      currentMapKey: mapKey,
      units: allUnits,
      selectedUnitId: null,
      movableTiles: [],
      attackableUnitIds: [],
      phase: "deploy",
      deployQueue,
      deployPending: deployQueue[0] ?? null,
      deployZoneTiles: map.deployZone ?? [],
      turn: "player",
      roundNumber: 1,
      battleLog: [`⚔ ${map.name} — Coloca a tus héroes.`],
      gameOver: null,
      enemyBusy: false,
    });
  },

  resetMap: () => {
    const { currentMapKey, startMap } = get();
    if (currentMapKey) startMap(currentMapKey);
  },

  exitToMenu: () =>
    set({
      screen: "lobby",
      currentMapKey: null,
      units: [],
      selectedUnitId: null,
      inspectedEnemyId: null,
      movableTiles: [],
      attackableUnitIds: [],
      phase: "select",
      deployQueue: [],
      deployPending: null,
      deployZoneTiles: [],
      turn: "player",
      roundNumber: 1,
      battleLog: [],
      gameOver: null,
      enemyBusy: false,
      chosenAbilities: [null, null, null],
    }),

  // ── DESPLIEGUE ─────────────────────────────────────────────

  deployHero: (row, col) => {
    const { units, deployQueue, deployPending, deployZoneTiles, _log } = get();
    if (!deployPending) return;
    const inZone = deployZoneTiles.some(([r, c]) => r === row && c === col);
    if (!inZone) return;
    const occupied = units.some((u) => u.alive && u.row === row && u.col === col);
    if (occupied) return;
    const targetUnit = units.find(
      (u) => u.team === "player" && !u.deployed && u.type === deployPending
    );
    if (!targetUnit) return;

    const newUnits = units.map((u) =>
      u.id === targetUnit.id ? { ...u, row, col, deployed: true } : u
    );
    const newQueue = deployQueue.slice(1);
    const nextPending = newQueue[0] ?? null;
    _log(
      nextPending
        ? `${targetUnit.name} desplegado. Ahora coloca: ${HEROES[nextPending]?.name ?? nextPending}.`
        : `${targetUnit.name} desplegado. ¡Todo listo!`
    );
    set({ units: newUnits, deployQueue: newQueue, deployPending: nextPending });
  },

  startBattle: () => {
    const { deployQueue, _log } = get();
    if (deployQueue.length > 0) return;
    _log("¡La batalla comienza! — Tu turno.");
    set({ phase: "select" });
  },

  // ── TURNO DEL JUGADOR ──────────────────────────────────────

  selectUnit: (unitId) => {
    const { units, turn, gameOver, currentMapKey, _log } = get();
    if (turn !== "player" || gameOver) return;

    const unit = units.find((u) => u.id === unitId);
    if (!unit || !unit.alive || unit.team !== "player") return;

    if (isDone(unit)) {
      _log(`${unit.name} ya actuó este turno.`);
      return;
    }

    const map = MAPS[currentMapKey];
    const selectionPatch = computeSelectionState(unit, units, map);
    set({ selectedUnitId: unitId, inspectedEnemyId: null, ...selectionPatch });
  },

  moveUnit: (unitId, row, col) => {
    const { units, currentMapKey, _log } = get();
    const unit = units.find((u) => u.id === unitId);
    if (!unit || !canMove(unit)) return;

    const newMovesUsed = (unit.movesUsed ?? 0) + 1;
    const newUnits = units.map((u) =>
      u.id === unitId ? { ...u, row, col, movesUsed: newMovesUsed } : u
    );

    set({ units: newUnits });

    const updatedUnit = { ...unit, row, col, movesUsed: newMovesUsed };
    const map = MAPS[currentMapKey];
    const selectionPatch = computeSelectionState(updatedUnit, newUnits, map);

    const movesLeft = (updatedUnit.movesPerTurn ?? 1) - newMovesUsed;
    if (movesLeft > 0 && !canAttack(updatedUnit)) {
      _log(`${unit.name} se mueve. (${movesLeft} movimiento${movesLeft > 1 ? "s" : ""} restante${movesLeft > 1 ? "s" : ""})`);
    } else if (movesLeft > 0) {
      _log(`${unit.name} avanza.`);
    } else {
      _log(`${unit.name} se mueve.`);
    }

    set(selectionPatch);
  },

  attackUnit: (attackerId, targetId) => {
    const { units, currentMapKey, _log } = get();
    const attacker = units.find((u) => u.id === attackerId);
    const target   = units.find((u) => u.id === targetId);
    if (!attacker || !target || !canAttack(attacker)) return;

    const dmg   = calculateDamage(attacker, target);
    const newHp = Math.max(0, target.hp - dmg);
    const died  = newHp <= 0;

    let logMsg = `${attacker.name} ataca a ${target.name}: -${dmg} HP${died ? " ¡Vencido!" : ""}`;

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
              type: ab.effect.statusType,
              duration: ab.effect.duration,
              damage: ab.effect.damage,
            });
            const icons = { poison: "☠ Envenenado", burn: "🔥 Quemado", bleed: "🩸 Sangrando" };
            logMsg += ` · ${icons[ab.effect.statusType] ?? ab.effect.statusType}`;
          }
        }
      }
    }

    _log(logMsg);

    const newUnits = units.map((u) => {
      if (u.id === targetId)   return { ...u, hp: newHp, alive: !died, statusEffects: newTargetEffects };
      if (u.id === attackerId) return { ...u, attacked: true };
      return u;
    });

    set({ units: newUnits });

    const updatedAttacker = { ...attacker, attacked: true };
    const map = MAPS[currentMapKey];
    const selectionPatch = computeSelectionState(updatedAttacker, newUnits, map);

    // Si puede moverse todavía, avisar
    if (canMove(updatedAttacker)) {
      const movesLeft = (updatedAttacker.movesPerTurn ?? 1) - (updatedAttacker.movesUsed ?? 0);
      _log(`${attacker.name} aún puede moverse (${movesLeft} movimiento${movesLeft > 1 ? "s" : ""}).`);
    }

    set(selectionPatch);

    const result = checkGameOver(newUnits);
    if (result) set({ gameOver: result, ...{ selectedUnitId: null, movableTiles: [], attackableUnitIds: [], phase: "select" } });
  },

  endPlayerTurn: () => {
    const { turn, enemyBusy, gameOver, units, currentMapKey, _deselect, _log } = get();
    if (turn !== "player" || enemyBusy || gameOver) return;

    // Aplicar daño de lava a héroes al terminar el turno
    const map = MAPS[currentMapKey];
    let processedUnits = [...units];
    const lavaMsgs = [];

    processedUnits = processedUnits.map(u => {
      if (u.team !== "player" || !u.alive) return u;
      const { unit: afterTile, logs } = tickTileEffects(u, map.grid);
      lavaMsgs.push(...logs);
      return afterTile;
    });

    lavaMsgs.forEach(msg => _log(msg));
    _deselect();

    const lavaResult = checkGameOver(processedUnits);
    if (lavaResult) {
      set({ units: processedUnits, gameOver: lavaResult });
      return;
    }

    set({ units: processedUnits, turn: "enemy" });
    _log("El enemigo actúa...");
  },

  // ── TURNO DEL ENEMIGO ──────────────────────────────────────

  setEnemyBusy: (busy) => set({ enemyBusy: busy }),

  applyEnemyMove: (enemyId, row, col) =>
    set((state) => ({
      units: state.units.map((u) =>
        u.id === enemyId ? { ...u, row, col, movesUsed: (u.movesUsed ?? 0) + 1 } : u
      ),
    })),

  applyEnemyAttack: (enemyId, targetId) => {
    const { units, _log } = get();
    const enemy  = units.find((u) => u.id === enemyId);
    const target = units.find((u) => u.id === targetId);
    if (!enemy || !target || !target.alive) return null;

    const dmg   = calculateDamage(enemy, target);
    const newHp = Math.max(0, target.hp - dmg);
    const died  = newHp <= 0;

    const statusResult = !died ? tryApplyStatusEffect(enemy, target) : null;

    let newEffects = [...(target.statusEffects ?? [])];
    if (statusResult) {
      if (statusResult.refresh) {
        newEffects = newEffects.map(e =>
          e.type === statusResult.type ? { ...e, duration: statusResult.duration } : e
        );
      } else {
        newEffects.push({
          type:     statusResult.type,
          duration: statusResult.duration,
          damage:   statusResult.damage,
        });
      }
    }

    let msg = `${enemy.name} ataca a ${target.name}: -${dmg} HP`;
    if (died) msg += " ¡Caído!";
    else if (statusResult && !statusResult.refresh) {
      const icons = { poison: "☠ Envenenado", burn: "🔥 Quemado", bleed: "🩸 Sangrando" };
      msg += ` · ${icons[statusResult.type] ?? statusResult.type}`;
    }
    _log(msg);

    const newUnits = units.map((u) => {
      if (u.id === targetId) return { ...u, hp: newHp, alive: !died, statusEffects: newEffects };
      if (u.id === enemyId)  return { ...u, attacked: true };
      return u;
    });

    set({ units: newUnits });
    return checkGameOver(newUnits);
  },

  finishEnemyTurn: () => {
    const { roundNumber, units, currentMapKey, _log } = get();
    const newRound = roundNumber + 1;
    const map = MAPS[currentMapKey];
    const allLogs = [];

    // 1. Tick de efectos de estado + lava en TODAS las unidades
    let processedUnits = units.map(u => {
      if (!u.alive) return u;
      const { unit: afterStatus, logs: statusLogs } = tickStatusEffects(u);
      allLogs.push(...statusLogs);
      const { unit: afterTile, logs: tileLogs } = tickTileEffects(afterStatus, map.grid);
      allLogs.push(...tileLogs);
      return afterTile;
    });

    allLogs.forEach(msg => _log(msg));

    const gameOverResult = checkGameOver(processedUnits);

    // 2. Pasiva on_turn (curación) — solo jugadores vivos
    processedUnits = processedUnits.map(u => {
      if (u.team !== "player" || !u.alive || !u.abilityKey) return u;
      const ab = ABILITIES[u.abilityKey];
      if (ab?.type === "passive" && ab.trigger === "on_turn" && ab.effect.type === "heal") {
        const healed = Math.min(u.maxHp, u.hp + ab.effect.amount);
        if (healed > u.hp) _log(`${u.name} regenera ${healed - u.hp} HP ❤`);
        return { ...u, hp: healed };
      }
      return u;
    });

    // 3. Resetear flags de turno — movesUsed vuelve a 0 para todos
    processedUnits = processedUnits.map(u => ({
      ...u,
      movesUsed: 0,
      attacked: false,
      abilityUsed: false,
      abilityCooldown: Math.max(0, (u.abilityCooldown ?? 0) - 1),
    }));

    set({
      units: processedUnits,
      turn: "player",
      roundNumber: newRound,
      enemyBusy: false,
      ...(gameOverResult ? { gameOver: gameOverResult } : {}),
    });

    if (!gameOverResult) _log(`— Ronda ${newRound} — Tu turno.`);
  },

  useAbility: (attackerId, targetId = null) => {
    const { units, currentMapKey, _log } = get();
    const attacker = units.find(u => u.id === attackerId);
    if (!attacker || !attacker.alive || attacker.abilityUsed) return;

    const ab = ABILITIES[attacker.abilityKey];
    if (!ab || ab.type !== "active") return;
    if ((attacker.abilityCooldown ?? 0) > 0) return;

    const liveEnemies = units.filter(u => u.team === "enemy" && u.alive);
    let affectedIds = [];

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
      _log(`${attacker.name} usa ${ab.name}: sin objetivos en rango.`);
      return;
    }

    const newUnits = units.map(u => {
      if (u.id === attackerId) return { ...u, attacked: true, abilityUsed: true, abilityCooldown: ab.cooldown };
      if (affectedIds.includes(u.id) && ab.effect.type === "damage") {
        const newHp = Math.max(0, u.hp - (ab.effect.damage ?? 0));
        return { ...u, hp: newHp, alive: newHp > 0 };
      }
      return u;
    });

    _log(`${attacker.name} usa ${ab.icon} ${ab.name}: ${affectedIds.length} objetivo${affectedIds.length > 1 ? "s" : ""} afectado${affectedIds.length > 1 ? "s" : ""}.`);

    set({ units: newUnits });

    const updatedAttacker = { ...attacker, attacked: true };
    const map = MAPS[currentMapKey];
    const selectionPatch = computeSelectionState(updatedAttacker, newUnits, map);

    if (canMove(updatedAttacker)) {
      const movesLeft = (updatedAttacker.movesPerTurn ?? 1) - (updatedAttacker.movesUsed ?? 0);
      _log(`${attacker.name} aún puede moverse (${movesLeft} movimiento${movesLeft > 1 ? "s" : ""}).`);
    }

    set(selectionPatch);

    const result = checkGameOver(newUnits);
    if (result) set({ gameOver: result, selectedUnitId: null, movableTiles: [], attackableUnitIds: [], phase: "select" });
  },
}));

export default useGameStore;
