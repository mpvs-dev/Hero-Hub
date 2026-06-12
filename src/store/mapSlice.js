import { MAPS }    from "../config/maps";
import { HEROES }  from "../config/heroes";
import { createUnitsFromMap } from "../engine/gameEngine";
import { LOG_MAX } from "./helpers";
import { msgDeploy, msgBattleStart, msgMapStart } from "../config/logColors";

export const mapState = {
  currentMapKey:  null,
  units:          [],
  phase:          "select", // 'deploy' | 'select' | 'move' | 'attack'
  deployQueue:    [],
  deployPending:  null,
  deployZoneTiles:[],
  turn:           "player",
  roundNumber:    1,
  battleLog:      [],
  gameOver:       null,
  enemyBusy:      false,
};

export function createMapSlice(set, get) {
  return {
    // ── Inicio de mapa ───────────────────────────────────────
    startMap: (mapKey) => {
      const { roster, chosenAbilities, currentLevel } = get();
      const map = MAPS[mapKey];

      const customSpawns = roster.map((heroKey, i) => ({
        type: heroKey,
        row:  map.playerSpawns[i]?.row ?? i,
        col:  map.playerSpawns[i]?.col ?? 0,
      }));

      const rawUnits    = createUnitsFromMap({ ...map, playerSpawns: customSpawns }, currentLevel);
      const playerUnits = rawUnits.filter(u => u.team === "player");
      const enemyUnits  = rawUnits.filter(u => u.team === "enemy");

      const allUnits = [
        ...playerUnits.map((u, idx) => ({
          ...u,
          row: -1, col: -1,
          deployed: false,
          abilityKey: chosenAbilities[idx] ?? null,
          abilityCooldown: 0,
          statusEffects: [],
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

      const deployQueue = customSpawns.map(s => s.type);

      set({
        screen: "game",
        currentMapKey: mapKey,
        units: allUnits,
        selectedUnitId: null,
        inspectedEnemyId: null,
        movableTiles: [],
        attackableUnitIds: [],
        phase: "deploy",
        deployQueue,
        deployPending: deployQueue[0] ?? null,
        deployZoneTiles: map.deployZone ?? [],
        turn: "player",
        roundNumber: 1,
        battleLog: [msgMapStart(map.name)],
        gameOver: null,
        enemyBusy: false,
      });
    },

    resetMap: () => {
      const { currentMapKey } = get();
      if (currentMapKey) get().startMap(currentMapKey);
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

    // ── Despliegue ───────────────────────────────────────────
    deployHero: (row, col) => {
      const { units, deployQueue, deployPending, deployZoneTiles } = get();
      const _log = get()._log;

      if (!deployPending) return;

      const inZone   = deployZoneTiles.some(([r, c]) => r === row && c === col);
      const occupied = units.some(u => u.alive && u.row === row && u.col === col);
      if (!inZone || occupied) return;

      const targetUnit = units.find(
        u => u.team === "player" && !u.deployed && u.type === deployPending
      );
      if (!targetUnit) return;

      const newUnits   = units.map(u =>
        u.id === targetUnit.id ? { ...u, row, col, deployed: true } : u
      );
      const newQueue   = deployQueue.slice(1);
      const nextPending = newQueue[0] ?? null;

      _log(msgDeploy({
        unitName: targetUnit.name,
        nextName: nextPending ? (HEROES[nextPending]?.name ?? nextPending) : null,
      }));

      set({ units: newUnits, deployQueue: newQueue, deployPending: nextPending });
    },

    startBattle: () => {
      const { deployQueue } = get();
      if (deployQueue.length > 0) return;
      get()._log(msgBattleStart());
      set({ phase: "select" });
    },
  };
}
