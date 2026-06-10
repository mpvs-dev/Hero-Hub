/**
 * Grid.jsx
 * Renderiza el mapa con animaciones de movimiento paso a paso.
 *
 * Cuando una unidad se mueve:
 *  1. moveUnit() actualiza la posición final en el store
 *  2. useMovementAnimation detecta el cambio y anima el sprite
 *     por cada casilla del camino real (pathfinding)
 *  3. Durante la animación:
 *     - El tile real NO muestra el sprite de la unidad (está en el overlay)
 *     - PathTrail dibuja puntos y líneas sobre el camino recorrido
 *     - Los clicks están deshabilitados
 */

import { MAPS }       from "../config/maps";
import { TILE_TYPES } from "../config/tiles";
import Tile           from "./Tile";
import UnitToken      from "./UnitToken";
import useGameStore   from "../store/useGameStore";
import useMovementAnimation from "../hooks/useMovementAnimation";

const GAP     = 2;
const PADDING = 2;
const STEP_MS = 130; // debe coincidir con useMovementAnimation

function getTileSize(isMobile, mapW, containerWidth) {
  if (isMobile) {
    const vw = typeof window !== "undefined" ? window.innerWidth : 375;
    const available = Math.min(vw * 0.95, 500);
    return Math.floor((available - mapW * GAP) / mapW);
  }
  const usable = containerWidth - (mapW - 1) * GAP - PADDING * 2;
  const size   = Math.floor(usable / mapW);
  return Math.max(28, Math.min(56, size));
}

// ─── Rastro del camino ────────────────────────────────────────────────────────

function PathTrail({ path, currentStep, tileSize }) {
  if (!path || path.length === 0) return null;

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 4,
        overflow: "visible",
      }}
    >
      {/* Línea punteada entre pasos ya recorridos */}
      {path.map(({ row, col }, i) => {
        if (i === 0) return null;
        const prev = path[i - 1];
        const x1 = PADDING + prev.col * (tileSize + GAP) + tileSize / 2;
        const y1 = PADDING + prev.row * (tileSize + GAP) + tileSize / 2;
        const x2 = PADDING + col      * (tileSize + GAP) + tileSize / 2;
        const y2 = PADDING + row      * (tileSize + GAP) + tileSize / 2;
        // Casillas ya recorridas vs pendientes
        const done = i <= currentStep;
        return (
          <line
            key={`line-${row}-${col}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={done ? "rgba(201,168,76,0.7)" : "rgba(201,168,76,0.25)"}
            strokeWidth={done ? 2 : 1.5}
            strokeDasharray={done ? "none" : "3 4"}
            style={{ transition: "stroke 0.1s, stroke-width 0.1s" }}
          />
        );
      })}

      {/* Punto en cada casilla del camino */}
      {path.map(({ row, col }, i) => {
        const cx = PADDING + col * (tileSize + GAP) + tileSize / 2;
        const cy = PADDING + row * (tileSize + GAP) + tileSize / 2;
        const done    = i < currentStep;
        const current = i === currentStep;
        const r       = current ? tileSize * 0.14 : tileSize * 0.09;

        return (
          <circle
            key={`dot-${row}-${col}`}
            cx={cx} cy={cy} r={r}
            fill={
              current ? "rgba(255,220,100,0.9)" :
              done    ? "rgba(201,168,76,0.75)" :
                        "rgba(201,168,76,0.25)"
            }
            stroke={current ? "rgba(255,255,200,0.6)" : "none"}
            strokeWidth={1}
            style={{ transition: "fill 0.1s, r 0.1s" }}
          />
        );
      })}
    </svg>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Grid({ isMobile = false, containerWidth = 540 }) {
  const {
    currentMapKey, units, selectedUnitId, inspectedEnemyId,
    movableTiles, attackableUnitIds, phase, turn,
    deployZoneTiles, deployPending,
    selectUnit, moveUnit, attackUnit, deployHero, inspectEnemy,
  } = useGameStore();

  const map = MAPS[currentMapKey];
  if (!map) return null;

  const TILE_SIZE = getTileSize(isMobile, map.w, containerWidth);

  const {
    animatingUnit,
    animUnitData,
    animPos,
    animPath,
    currentStep,
    isAnimating,
  } = useMovementAnimation(units, currentMapKey, TILE_SIZE, GAP);

  const handleTileClick = (row, col) => {
    if (isAnimating) return;

    if (phase === "deploy") {
      deployHero(row, col);
      return;
    }

    const unitOnTile = units.find(u => u.alive && u.row === row && u.col === col);

    if (unitOnTile?.team === "player" && turn === "player") {
      selectUnit(unitOnTile.id);
      return;
    }

    if (
      (phase === "move" || phase === "attack") &&
      unitOnTile &&
      attackableUnitIds.includes(unitOnTile.id)
    ) {
      attackUnit(selectedUnitId, unitOnTile.id);
      return;
    }

    if (phase === "move" && movableTiles.some(([r, c]) => r === row && c === col)) {
      moveUnit(selectedUnitId, row, col);
      return;
    }

    if (unitOnTile?.team === "enemy") {
      inspectEnemy(unitOnTile.id);
    }
  };

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <div style={{ overflowX: isMobile ? "auto" : "hidden", overflowY: "visible" }}>

        {/* Contenedor relativo para el overlay */}
        <div style={{ position: "relative", width: "fit-content" }}>

          {/* Grid de tiles */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${map.w}, ${TILE_SIZE}px)`,
            gap: GAP,
            background: map.bg,
            padding: PADDING,
            borderRadius: 5,
            border: `1px solid ${map.bg}`,
            width: "fit-content",
            cursor: isAnimating ? "wait" : "default",
          }}>
            {map.grid.flatMap((rowStr, ri) =>
              [...rowStr].map((tileKey, ci) => {
                const unit         = units.find(u => u.alive && u.row === ri && u.col === ci);
                const isMovable    = movableTiles.some(([r, c]) => r === ri && c === ci);
                const isAttackable = !!unit && attackableUnitIds.includes(unit.id);
                const isSelected   = unit?.id === selectedUnitId;
                const isDeployable =
                  phase === "deploy" && !!deployPending &&
                  deployZoneTiles.some(([r, c]) => r === ri && c === ci) && !unit;
                const isInspectable = unit?.team === "enemy" && !isAttackable;
                const isInspected   = unit?.id === inspectedEnemyId;

                // Ocultar sprite de la unidad que está en el overlay animado
                const hiddenByAnim = unit?.id === animatingUnit;

                return (
                  <Tile
                    key={`${ri}-${ci}`}
                    row={ri}
                    col={ci}
                    tileKey={tileKey}
                    unit={hiddenByAnim ? null : (unit ?? null)}
                    isMovable={isMovable}
                    isAttackable={isAttackable}
                    isSelected={isSelected}
                    isDeployable={isDeployable}
                    isInspectable={isInspectable}
                    isInspected={isInspected}
                    tileSize={TILE_SIZE}
                    onClick={() => handleTileClick(ri, ci)}
                  />
                );
              })
            )}
          </div>

          {/* ── Overlay: rastro + sprite animado ── */}
          {isAnimating && animUnitData && (
            <div style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 10,
            }}>
              {/* Rastro SVG */}
              <PathTrail
                path={animPath}
                currentStep={currentStep}
                tileSize={TILE_SIZE}
              />

              {/* Sprite con transición CSS */}
              <div style={{
                position: "absolute",
                left: animPos.x,
                top: animPos.y,
                width: TILE_SIZE,
                height: TILE_SIZE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: `left ${STEP_MS}ms linear, top ${STEP_MS}ms linear`,
                zIndex: 11,
                filter: "drop-shadow(0 0 5px rgba(201,168,76,0.7))",
                willChange: "left, top",
              }}>
                <UnitToken unit={animUnitData} tileSize={TILE_SIZE} />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Leyenda */}
      {!isMobile && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "5px 14px",
          marginTop: 8,
          paddingLeft: 2,
        }}>
          {[
            { color: "#4a9f6a", label: "Despliegue" },
            { color: "#c9a84c", label: "Movimiento" },
            { color: "#E24B4A", label: "Atacable"   },
          ].map(({ color, label }) => (
            <LegendDot key={label} color={color} label={label} />
          ))}
          <div style={{ width: 1, background: "#2a2218", margin: "0 4px" }} />
          {Object.values(TILE_TYPES).map(tile => (
            <LegendDot key={tile.key} color={tile.bg} label={tile.name} />
          ))}
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      fontSize: 10, color: "#4a3f2f", fontFamily: "Crimson Text, serif",
    }}>
      <div style={{ width: 8, height: 8, background: color, borderRadius: 2, flexShrink: 0 }} />
      {label}
    </div>
  );
}
