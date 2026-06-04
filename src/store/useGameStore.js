import { create } from "zustand";
import { MAPS }      from "../config/maps";
import { HEROES }    from "../config/heroes";
import { ENEMIES }   from "../config/enemies";
import { ABILITIES } from "../config/abilities";
import {
  createUnitsFromMap,
  getMovableTiles,
  getAttackableUnits,
  calculateDamage,
  checkGameOver,
  tryApplyStatusEffect,
} from "../engine/gameEngine";

const LOG_MAX = 10;

// Héroes jugables — importados directamente desde heroes.js
export const PLAYER_HEROES = Object.values(HEROES);

const useGameStore = create((set, get) => ({
  // ── Pantalla activa
  screen: "lobby", // 'lobby' | 'abilitySelect' | 'mapSelect' | 'game'

  // ── Lobby
  roster: [null, null, null],
  activeSlot: null,
  chosenAbilities: [null, null, null], // habilidad elegida por ranura

  // ── Game
  currentMapKey: null,
  units: [],
  selectedUnitId: null,
  inspectedEnemyId: null,   // enemigo inspeccionado en sidebar
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

  /** Selecciona un enemigo para inspeccionar en el sidebar */
  inspectEnemy: (unitId) =>
    set({
      inspectedEnemyId: unitId,
      selectedUnitId: null,
      movableTiles: [],
      attackableUnitIds: [],
      phase: "select",
    }),

  selectSlot: (slotIndex) => {
    set((state) => ({
      activeSlot: state.activeSlot === slotIndex ? null : slotIndex,
    }));
  },

  assignHero: (heroKey) => {
    const { roster, activeSlot } = get();
    if (activeSlot === null) return;
    const existingSlot = roster.findIndex((k) => k === heroKey);
    if (existingSlot !== -1 && existingSlot !== activeSlot) return;
    const newRoster = [...roster];
    if (newRoster[activeSlot] === heroKey) {
      newRoster[activeSlot] = null;
    } else {
      newRoster[activeSlot] = heroKey;
    }
    set({ roster: newRoster, activeSlot: null });
  },

  clearSlot: (slotIndex) => {
    set((state) => {
      const newRoster = [...state.roster];
      newRoster[slotIndex] = null;
      return { roster: newRoster, activeSlot: null };
    });
  },

  goToMapSelect: () => {
    const { roster } = get();
    if (roster.some((k) => k === null)) return;
    set({ screen: "abilitySelect", activeSlot: null });
  },

  backToLobby: () => set({ screen: "lobby" }),

  /** Asigna una habilidad a un slot del roster */
  setHeroAbility: (slotIndex, abilityKey) => {
    set(state => {
      const next = [...state.chosenAbilities];
      next[slotIndex] = next[slotIndex] === abilityKey ? null : abilityKey;
      return { chosenAbilities: next };
    });
  },

  /** Confirma habilidades y va a selección de mapa */
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
    const allUnits = createUnitsFromMap(mapWithRoster).map((u, idx) =>
      u.team === "player"
        ? {
            ...u, row: -1, col: -1, deployed: false,
            abilityKey: chosenAbilities[idx] ?? null,
            abilityCooldown: 0,
            statusEffects: [],
          }
        : { ...u, deployed: true, statusEffects: [] }
    );
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
    set({ selectedUnitId: unitId, inspectedEnemyId: null });
    if (!unit.moved) {
      const movable = getMovableTiles(unit, units, map.grid, map.w, map.h);
      const atkIds = !unit.attacked
        ? getAttackableUnits(unit, liveEnemies).map((e) => e.id)
        : [];
      set({ movableTiles: movable, attackableUnitIds: atkIds, phase: "move" });
    } else {
      const atkIds = getAttackableUnits(unit, liveEnemies).map((e) => e.id);
      set({ movableTiles: [], attackableUnitIds: atkIds, phase: "attack" });
    }
  },

  moveUnit: (unitId, row, col) => {
    const { units, _log, _deselect } = get();
    const unit = units.find((u) => u.id === unitId);
    if (!unit) return;
    const newUnits = units.map((u) =>
      u.id === unitId ? { ...u, row, col, moved: true } : u
    );
    const movedUnit = { ...unit, row, col };
    const liveEnemies = newUnits.filter((u) => u.team === "enemy" && u.alive);
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

  attackUnit: (attackerId, targetId) => {
    const { units, _log, _deselect } = get();
    const attacker = units.find((u) => u.id === attackerId);
    const target   = units.find((u) => u.id === targetId);
    if (!attacker || !target || attacker.attacked) return;

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
              type: ab.effect.statusType, duration: ab.effect.duration, damage: ab.effect.damage,
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
    _deselect();
    const result = checkGameOver(newUnits);
    if (result) set({ gameOver: result });
  },

  endPlayerTurn: () => {
    const { turn, enemyBusy, gameOver, _deselect, _log } = get();
    if (turn !== "player" || enemyBusy || gameOver) return;
    _deselect();
    set({ turn: "enemy" });
    _log("El enemigo actúa...");
  },

  // ── TURNO DEL ENEMIGO ──────────────────────────────────────

  setEnemyBusy: (busy) => set({ enemyBusy: busy }),

  applyEnemyMove: (enemyId, row, col) => {
    set((state) => ({
      units: state.units.map((u) =>
        u.id === enemyId ? { ...u, row, col, moved: true } : u
      ),
    }));
  },

  applyEnemyAttack: (enemyId, targetId) => {
    const { units, _log } = get();
    const enemy  = units.find((u) => u.id === enemyId);
    const target = units.find((u) => u.id === targetId);
    if (!enemy || !target || !target.alive) return null;

    const dmg   = calculateDamage(enemy, target);
    const newHp = Math.max(0, target.hp - dmg);
    const died  = newHp <= 0;

    // Intentar aplicar efecto de estado
    const statusResult = !died ? tryApplyStatusEffect(enemy, target) : null;

    // Construir lista de efectos actualizada en el target
    let newEffects = [...(target.statusEffects ?? [])];
    if (statusResult) {
      if (statusResult.refresh) {
        // Refrescar duración del efecto existente
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

    // Log
    let msg = `${enemy.name} ataca a ${target.name}: -${dmg} HP`;
    if (died) msg += " ¡Caído!";
    else if (statusResult && !statusResult.refresh) {
      const icons = { poison: "☠ Envenenado", burn: "🔥 Quemado", bleed: "🩸 Sangrando" };
      msg += ` · ${icons[statusResult.type] ?? statusResult.type}`;
    }
    _log(msg);

    const newUnits = units.map((u) => {
      if (u.id === targetId)
        return { ...u, hp: newHp, alive: !died, statusEffects: newEffects };
      if (u.id === enemyId)
        return { ...u, attacked: true };
      return u;
    });

    set({ units: newUnits });
    return checkGameOver(newUnits);
  },

  finishEnemyTurn: () => {
    const { roundNumber, units, _log } = get();
    const newRound = roundNumber + 1;

    let processedUnits = units.map(u => {
      if (u.team !== "player" || !u.alive) return u;

      let hp = u.hp;
      const nextEffects = [];

      // Efectos de estado negativos (veneno, quemadura, hemorragia)
      for (const effect of (u.statusEffects ?? [])) {
        hp = Math.max(0, hp - effect.damage);
        _log(`${u.name} sufre ${effect.damage} de daño por ${
          effect.type === "poison" ? "veneno" :
          effect.type === "burn"   ? "quemadura" : "hemorragia"
        } ☠`);
        if (effect.duration - 1 > 0) nextEffects.push({ ...effect, duration: effect.duration - 1 });
      }

      const died = hp <= 0;
      if (died) { _log(`${u.name} ha sucumbido a sus heridas. ¡Caído!`); }

      // Pasiva on_turn (curación)
      let finalHp = hp;
      if (!died && u.abilityKey) {
        const ab = ABILITIES[u.abilityKey];
        if (ab?.type === "passive" && ab.trigger === "on_turn" && ab.effect.type === "heal") {
          finalHp = Math.min(u.maxHp, hp + ab.effect.amount);
          if (finalHp > hp) _log(`${u.name} regenera ${finalHp - hp} HP ❤`);
        }
      }

      // Reducir cooldown de habilidad activa
      const newCooldown = Math.max(0, (u.abilityCooldown ?? 0) - 1);

      return { ...u, hp: finalHp, alive: !died, statusEffects: nextEffects, abilityCooldown: newCooldown };
    });

    const gameOverResult = checkGameOver(processedUnits);

    set({
      units: processedUnits.map(u => ({ ...u, moved: false, attacked: false, abilityUsed: false })),
      turn: "player",
      roundNumber: newRound,
      enemyBusy: false,
      ...(gameOverResult ? { gameOver: gameOverResult } : {}),
    });
    if (!gameOverResult) _log(`— Ronda ${newRound} — Tu turno.`);
  },

  /**
   * Usa la habilidad activa del héroe seleccionado.
   * targetId: id del enemigo objetivo (para single_enemy y aoe)
   * targetPos: {row, col} para aoe sin objetivo concreto
   */
  useAbility: (attackerId, targetId = null) => {
    const { units, currentMapKey, _log, _deselect } = get();
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
        .filter(e =>
          Math.abs(e.row - pivot.row) + Math.abs(e.col - pivot.col) <= (ab.aoeRadius ?? 1)
        )
        .map(e => e.id);
    } else if (ab.targetMode === "single_enemy" && targetId) {
      affectedIds = [targetId];
    }

    if (affectedIds.length === 0 && ab.targetMode !== "self") {
      _log(`${attacker.name} usa ${ab.name}: sin objetivos en rango.`);
      return;
    }

    let newUnits = units.map(u => {
      if (u.id === attackerId) return { ...u, attacked: true, abilityUsed: true, abilityCooldown: ab.cooldown };
      if (affectedIds.includes(u.id) && ab.effect.type === "damage") {
        const dmg   = ab.effect.damage ?? 0;
        const newHp = Math.max(0, u.hp - dmg);
        return { ...u, hp: newHp, alive: newHp > 0 };
      }
      return u;
    });

    _log(`${attacker.name} usa ${ab.icon} ${ab.name}: ${affectedIds.length} objetivo${affectedIds.length > 1 ? "s" : ""} afectado${affectedIds.length > 1 ? "s" : ""}.`);

    set({ units: newUnits });
    _deselect();

    const result = checkGameOver(newUnits);
    if (result) set({ gameOver: result });
  },
}));

export default useGameStore;
