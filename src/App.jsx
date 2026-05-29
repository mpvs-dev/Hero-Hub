/**
 * App  —  src/App.jsx
 *
 * Componente raíz. Orquesta:
 * - Selección de mapa vs juego activo
 * - Bucle de IA del enemigo (async, con animación por pasos)
 */

import { useEffect }    from 'react';
import useGameStore     from './store/useGameStore';
import { MAPS }         from './config/maps';
import { computeEnemyAction, calculateDamage } from './engine/gameEngine';

import MapSelector from './components/MapSelector';
import HUD         from './components/HUD';
import GameOver    from './components/GameOver';
import Grid        from './components/Grid';
import Sidebar     from './components/Sidebar';

// ─── Constantes de animación ──────────────────────────────────────────────────
const ENEMY_THINK_MS  = 650; // pausa antes de que cada enemigo actúe
const ENEMY_MOVE_MS   = 200; // pausa tras mover, antes de atacar

// ─── Bucle de IA del enemigo ──────────────────────────────────────────────────
/**
 * Se ejecuta cuando turn === 'enemy'.
 * Itera sobre cada enemigo vivo, calcula su acción y la aplica
 * con pequeñas pausas para que el jugador pueda seguir la animación.
 */
function useEnemyAI() {
  const turn         = useGameStore(s => s.turn);
  const currentMapKey = useGameStore(s => s.currentMapKey);
  const enemyBusy    = useGameStore(s => s.enemyBusy);
  const gameOver     = useGameStore(s => s.gameOver);

  useEffect(() => {
    if (turn !== 'enemy' || enemyBusy || gameOver || !currentMapKey) return;

    const {
      setEnemyBusy,
      applyEnemyMove,
      applyEnemyAttack,
      finishEnemyTurn,
    } = useGameStore.getState();

    const map = MAPS[currentMapKey];
    setEnemyBusy(true);

    const run = async () => {
      // Snapshot inicial de los enemigos vivos al empezar el turno
      const enemyIds = useGameStore
        .getState()
        .units
        .filter(u => u.team === 'enemy' && u.alive)
        .map(u => u.id);

      for (const enemyId of enemyIds) {
        await new Promise(resolve => setTimeout(resolve, ENEMY_THINK_MS));

        // Leer estado fresco en cada iteración (las unidades cambian)
        const freshUnits = useGameStore.getState().units;
        const enemy      = freshUnits.find(u => u.id === enemyId);
        if (!enemy || !enemy.alive) continue;

        // Calcular acción con el engine
        const action = computeEnemyAction(
          enemy, freshUnits, map.grid, map.w, map.h
        );

        // Aplicar movimiento
        if (action.movedTo) {
          applyEnemyMove(enemyId, action.movedTo.row, action.movedTo.col);
          await new Promise(resolve => setTimeout(resolve, ENEMY_MOVE_MS));
        }

        // Aplicar ataque
        if (action.attackTargetId) {
          const freshTarget = useGameStore
            .getState()
            .units
            .find(u => u.id === action.attackTargetId);

          if (freshTarget?.alive) {
            const result = applyEnemyAttack(enemyId, freshTarget.id);

            // El juego puede haber terminado tras este ataque
            if (result === 'lose') {
              useGameStore.setState({ gameOver: 'lose', enemyBusy: false });
              return;
            }
          }
        }
      }

      // Verificar victoria inesperada (todos los enemigos muertos)
      const state = useGameStore.getState();
      if (state.gameOver) {
        useGameStore.setState({ enemyBusy: false });
        return;
      }

      // Pasar al siguiente turno del jugador
      finishEnemyTurn();
    };

    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, currentMapKey]);
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function App() {
  const currentMapKey = useGameStore(s => s.currentMapKey);

  // Activar la IA del enemigo
  useEnemyAI();

  // Sin mapa → selector
  if (!currentMapKey) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 12 }}>
        <MapSelector />
      </div>
    );
  }

  // Con mapa → tablero de juego
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 12 }}>
      <HUD />
      <GameOver />
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Grid />
        <Sidebar />
      </div>
    </div>
  );
}
