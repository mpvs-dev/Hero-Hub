import { MAPS } from "../config/maps";
import { TILE_TYPES } from "../config/tiles";
import Tile from "./Tile";
import useGameStore from "../store/useGameStore";

export const TILE_SIZE = 52; // px por tile

export default function Grid() {
  const {
    currentMapKey,
    units,
    selectedUnitId,
    movableTiles,
    attackableUnitIds,
    phase,
    turn,
    selectUnit,
    moveUnit,
    attackUnit,
  } = useGameStore();

  const map = MAPS[currentMapKey];
  if (!map) return null;

  // ── Manejador de click sobre un tile ──────────────────────
  const handleTileClick = (row, col) => {
    const unitOnTile = units.find(
      (u) => u.alive && u.row === row && u.col === col,
    );

    // Click en héroe → seleccionar
    if (unitOnTile?.team === "player" && turn === "player") {
      selectUnit(unitOnTile.id);
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

    // Click en enemigo atacable → atacar
    if (
      phase === "attack" &&
      unitOnTile &&
      attackableUnitIds.includes(unitOnTile.id)
    ) {
      attackUnit(selectedUnitId, unitOnTile.id);
      return;
    }
  };

  return (
    <div>
      {/* ── Mapa ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${map.w}, ${TILE_SIZE}px)`,
          gap: 2,
          background: map.bg,
          padding: 2,
          borderRadius: 5,
          border: `1px solid ${map.bg}`,
          flexShrink: 0,
        }}
      >
        {map.grid.flatMap((rowStr, ri) =>
          [...rowStr].map((tileKey, ci) => {
            const unit = units.find(
              (u) => u.alive && u.row === ri && u.col === ci,
            );
            const isMovable = movableTiles.some(
              ([r, c]) => r === ri && c === ci,
            );
            const isAttackable = !!unit && attackableUnitIds.includes(unit.id);
            const isSelected = unit?.id === selectedUnitId;

            return (
              <Tile
                key={`${ri}-${ci}`}
                tileKey={tileKey}
                unit={unit ?? null}
                isMovable={isMovable}
                isAttackable={isAttackable}
                isSelected={isSelected}
                tileSize={TILE_SIZE}
                onClick={() => handleTileClick(ri, ci)}
              />
            );
          }),
        )}
      </div>

      {/* ── Leyenda ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "5px 14px",
          marginTop: 8,
          paddingLeft: 2,
        }}
      >
        {/* Leyenda de highlights */}
        {[
          { color: "#c9a84c", label: "Movimiento" },
          { color: "#E24B4A", label: "Atacable" },
        ].map(({ color, label }) => (
          <LegendDot key={label} color={color} label={label} />
        ))}

        {/* Separador */}
        <div style={{ width: 1, background: "#2a2218", margin: "0 4px" }} />

        {/* Leyenda de tiles */}
        {Object.values(TILE_TYPES).map((tile) => (
          <LegendDot key={tile.key} color={tile.bg} label={tile.name} />
        ))}
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        color: "#4a3f2f",
        fontFamily: "Crimson Text, serif",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          background: color,
          borderRadius: 2,
          flexShrink: 0,
        }}
      />
      {label}
    </div>
  );
}
