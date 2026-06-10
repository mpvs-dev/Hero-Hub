import { TILE_TYPES } from "../config/tiles";
import UnitToken from "./UnitToken";

const HIGHLIGHT = {
  selected:   { outline: "2.5px solid #ffffff", overlay: null },
  attackable: { outline: "2.5px solid #E24B4A", overlay: "rgba(220,60,60,0.20)" },
  movable:    { outline: "2.5px solid #c9a84c", overlay: "rgba(200,160,60,0.20)" },
  deployable: { outline: "2.5px solid #4adf8a", overlay: "rgba(60,200,100,0.18)" },
  inspected:  { outline: "2.5px solid #e07040", overlay: "rgba(200,80,40,0.12)" },
  none:       { outline: "none", overlay: null },
};

function getHighlight(isSelected, isAttackable, isMovable, isDeployable, isInspected) {
  if (isSelected)   return HIGHLIGHT.selected;
  if (isAttackable) return HIGHLIGHT.attackable;
  if (isMovable)    return HIGHLIGHT.movable;
  if (isDeployable) return HIGHLIGHT.deployable;
  if (isInspected)  return HIGHLIGHT.inspected;
  return HIGHLIGHT.none;
}

export default function Tile({
  tileKey,
  unit,
  isMovable,
  isAttackable,
  isSelected,
  isDeployable,
  isInspectable,
  isInspected,
  tileSize,
  onClick,
  // Coordenadas para que EnemyReveal pueda localizar la casilla
  row,
  col,
}) {
  const tile      = TILE_TYPES[tileKey] ?? TILE_TYPES.G;
  const highlight = getHighlight(isSelected, isAttackable, isMovable, isDeployable, isInspected);
  const isClickable = isMovable || isAttackable || isDeployable || isInspectable || unit?.team === "player";

  return (
    <div
      onClick={onClick}
      data-tile={`${row}-${col}`}
      style={{
        width: tileSize,
        height: tileSize,
        background: tile.bg,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isClickable ? "pointer" : "default",
        outline: highlight.outline,
        outlineOffset: "-2.5px",
        borderRadius: 2,
        boxSizing: "border-box",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Imagen de decoración */}
      {!unit && tile.decorUrl && (
        <img
          src={tile.decorUrl}
          alt=""
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.65,
            imageRendering: "pixelated",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Overlay de highlight */}
      {highlight.overlay && (
        <div style={{
          position: "absolute", inset: 0,
          background: highlight.overlay,
          pointerEvents: "none",
          zIndex: 1,
        }} />
      )}

      {/* Unidad */}
      {unit && <UnitToken unit={unit} tileSize={tileSize} />}
    </div>
  );
}
