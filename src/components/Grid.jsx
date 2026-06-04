import { MAPS }       from "../config/maps";
import { TILE_TYPES } from "../config/tiles";
import Tile           from "./Tile";
import useGameStore   from "../store/useGameStore";

// Tamaño de tile calculado para caber exactamente en containerWidth
function getTileSize(isMobile, mapW, containerWidth) {
  if (isMobile) {
    const vw = typeof window !== "undefined" ? window.innerWidth : 375;
    const available = Math.min(vw * 0.95, 500);
    return Math.floor((available - mapW * 2) / mapW); // gap=2 entre tiles
  }
  // Desktop: containerWidth es el ancho exacto disponible para el mapa
  // gap total = (mapW - 1) * 2 + padding 4
  const usable = containerWidth - (mapW - 1) * 2 - 4;
  const size   = Math.floor(usable / mapW);
  return Math.max(28, Math.min(56, size));
}

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

  const handleTileClick = (row, col) => {
    if (phase === "deploy") {
      deployHero(row, col);
      return;
    }

    const unitOnTile = units.find(u => u.alive && u.row === row && u.col === col);

    if (unitOnTile?.team === "player" && turn === "player") {
      selectUnit(unitOnTile.id);
      return;
    }

    // Click en enemigo atacable en fase move o attack → atacar directamente
    if (
      (phase === "move" || phase === "attack") &&
      unitOnTile &&
      attackableUnitIds.includes(unitOnTile.id)
    ) {
      attackUnit(selectedUnitId, unitOnTile.id);
      return;
    }

    // Click en casilla movible → mover
    if (
      phase === "move" &&
      movableTiles.some(([r, c]) => r === row && c === col)
    ) {
      moveUnit(selectedUnitId, row, col);
      return;
    }
    // Click en enemigo NO atacable → mostrar su info en el sidebar
    if (unitOnTile?.team === "enemy") {
      inspectEnemy(unitOnTile.id);
      return;
    }
  };

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      {/* Mapa — scrollable si es necesario en mobile */}
      <div style={{ overflowX: isMobile ? "auto" : "hidden", overflowY: "visible" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${map.w}, ${TILE_SIZE}px)`,
          gap: 2,
          background: map.bg,
          padding: 2,
          borderRadius: 5,
          border: `1px solid ${map.bg}`,
          width: "fit-content",
        }}>
          {map.grid.flatMap((rowStr, ri) =>
            [...rowStr].map((tileKey, ci) => {
              const unit = units.find(u => u.alive && u.row === ri && u.col === ci);
              const isMovable    = movableTiles.some(([r, c]) => r === ri && c === ci);
              const isAttackable = !!unit && attackableUnitIds.includes(unit.id);
              const isSelected   = unit?.id === selectedUnitId;
              const isDeployable =
                phase === "deploy" && !!deployPending &&
                deployZoneTiles.some(([r, c]) => r === ri && c === ci) && !unit;
              const isInspectable = unit?.team === "enemy" && !isAttackable;
              const isInspected   = unit?.id === inspectedEnemyId;

              return (
                <Tile
                  key={`${ri}-${ci}`}
                  tileKey={tileKey}
                  unit={unit ?? null}
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
      </div>

      {/* Leyenda — se oculta en mobile para ahorrar espacio */}
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
