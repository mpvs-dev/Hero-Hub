import { useEffect, useState, useCallback } from "react";
import useGameStore from "./store/useGameStore";
import { MAPS } from "./config/maps";
import { computeEnemyAction } from "./engine/gameEngine";
import HeroLobby from "./components/HeroLobby";
import AbilitySelector from "./components/AbilitySelector";
import MapSelector from "./components/MapSelector";
import HUD from "./components/HUD";
import GameOver from "./components/GameOver";
import Grid from "./components/Grid";
import Sidebar from "./components/Sidebar";
import AbilityBar from "./components/AbilityBar";
import EnemyReveal from "./components/EnemyReveal";
import Credits from "./components/Credits";
import ModeSelector from "./components/ModeSelector";

const ENEMY_THINK_MS = 650;
const ENEMY_MOVE_MS = 200;

export function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return width;
}

// ─── Reveal de enemigos al inicio ────────────────────────────────────────────

function useEnemyReveal() {
  const phase = useGameStore((s) => s.phase);
  const currentMapKey = useGameStore((s) => s.currentMapKey);
  const [showing, setShowing] = useState(false);

  // Cuando la batalla comienza (phase pasa a "select" por primera vez)
  // activamos el reveal
  const prevPhaseRef = useState(null);

  useEffect(() => {
    const prev = prevPhaseRef[0];
    if (prev === "deploy" && phase === "select") {
      setShowing(true);
    }
    prevPhaseRef[0] = phase;
  }, [phase]);

  // Resetear al cambiar de mapa
  useEffect(() => {
    setShowing(false);
    prevPhaseRef[0] = null;
  }, [currentMapKey]);

  const onDone = useCallback(() => setShowing(false), []);

  return { showing, onDone };
}

// ─── IA del enemigo ───────────────────────────────────────────────────────────

function useEnemyAI() {
  const turn = useGameStore((s) => s.turn);
  const currentMapKey = useGameStore((s) => s.currentMapKey);
  const enemyBusy = useGameStore((s) => s.enemyBusy);
  const gameOver = useGameStore((s) => s.gameOver);
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    if (
      turn !== "enemy" ||
      enemyBusy ||
      gameOver ||
      !currentMapKey ||
      phase === "deploy"
    )
      return;

    const { setEnemyBusy, applyEnemyMove, applyEnemyAttack, finishEnemyTurn } =
      useGameStore.getState();
    const map = MAPS[currentMapKey];
    setEnemyBusy(true);

    const run = async () => {
      const enemyIds = useGameStore
        .getState()
        .units.filter((u) => u.team === "enemy" && u.alive)
        .map((u) => u.id);

      for (const enemyId of enemyIds) {
        await new Promise((r) => setTimeout(r, ENEMY_THINK_MS));
        const freshUnits = useGameStore.getState().units;
        const enemy = freshUnits.find((u) => u.id === enemyId);
        if (!enemy || !enemy.alive) continue;

        const action = computeEnemyAction(
          enemy,
          freshUnits,
          map.grid,
          map.w,
          map.h,
        );

        if (action.movedTo) {
          // applyEnemyMove ahora devuelve resultado si hay muerte por lava
          const lavaResult = applyEnemyMove(
            enemyId,
            action.movedTo.row,
            action.movedTo.col,
          );
          await new Promise((r) => setTimeout(r, ENEMY_MOVE_MS));

          if (lavaResult) {
            // Enemigo murió en la lava — verificar si el jugador gana
            if (lavaResult === "win") {
              useGameStore.setState({ gameOver: "win", enemyBusy: false });
              return;
            }
            // El propio enemigo murió, pasar al siguiente
            continue;
          }
        }

        // Verificar que siga vivo tras el movimiento
        const freshEnemy = useGameStore
          .getState()
          .units.find((u) => u.id === enemyId);
        if (!freshEnemy?.alive) continue;

        if (action.attackTargetId) {
          const freshTarget = useGameStore
            .getState()
            .units.find((u) => u.id === action.attackTargetId);
          if (freshTarget?.alive) {
            const result = applyEnemyAttack(enemyId, freshTarget.id);
            if (result === "lose") {
              useGameStore.setState({ gameOver: "lose", enemyBusy: false });
              return;
            }
          }
        }
      }

      if (useGameStore.getState().gameOver) {
        useGameStore.setState({ enemyBusy: false });
        return;
      }
      finishEnemyTurn();
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, currentMapKey, phase]);
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const SIDEBAR_W = 220;
const H_PAD = 32;
const GAP = 12;

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const units = useGameStore((s) => s.units);
  const width = useWindowWidth();
  const isMobile = width < 640;

  useEnemyAI();

  const { showing: revealShowing, onDone: revealDone } = useEnemyReveal();

  if (screen === "lobby") return <HeroLobby />;
  if (screen === "modeSelect") return <ModeSelector />;
  if (screen === "abilitySelect") return <AbilitySelector />;
  if (screen === "mapSelect") return <MapSelector />;

  const MAX_TOTAL = 900;
  const totalW = Math.min(width - H_PAD, MAX_TOTAL);
  const mapW = totalW - SIDEBAR_W - GAP;

  const liveEnemies = units.filter((u) => u.team === "enemy" && u.alive);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0e0f",
        boxSizing: "border-box",
        padding: isMobile ? "8px 8px 16px" : `12px ${H_PAD / 2}px 20px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: isMobile ? "100%" : MAX_TOTAL,
          boxSizing: "border-box",
        }}
      >
        <HUD isMobile={isMobile} />
        <GameOver />

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 10 : GAP,
            alignItems: "flex-start",
            marginTop: 10,
            width: "100%",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* Grid */}
          <div
            style={{
              flex: isMobile ? "none" : `0 0 ${mapW}px`,
              width: isMobile ? "100%" : mapW,
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <Grid
              isMobile={isMobile}
              containerWidth={isMobile ? undefined : mapW}
            />
            <AbilityBar isMobile={isMobile} />
          </div>

          {/* Sidebar */}
          <div
            style={{
              flex: isMobile ? "none" : `0 0 ${SIDEBAR_W}px`,
              width: isMobile ? "100%" : SIDEBAR_W,
              boxSizing: "border-box",
            }}
          >
            <Sidebar isMobile={isMobile} />
          </div>
        </div>
        <Credits />
      </div>

      {/* Reveal de enemigos al inicio de la batalla */}
      {revealShowing && (
        <EnemyReveal enemies={liveEnemies} onDone={revealDone} />
      )}
    </div>
  );
}
