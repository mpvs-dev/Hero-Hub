import { MAPS } from "../config/maps";
import { TILE_TYPES } from "../config/tiles";
import useGameStore from "../store/useGameStore";

const PREVIEW_CELL = 8; // px por celda en el preview

function MapPreview({ map }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${map.w}, ${PREVIEW_CELL}px)`,
        gap: 1,
        marginBottom: 10,
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid #1a1810",
        flexShrink: 0,
      }}
    >
      {map.grid.flatMap((rowStr, ri) =>
        [...rowStr].map((tk, ci) => {
          const tile = TILE_TYPES[tk] ?? TILE_TYPES.G;
          return (
            <div
              key={`${ri}-${ci}`}
              style={{
                width: PREVIEW_CELL,
                height: PREVIEW_CELL,
                background: tile.bg,
              }}
            />
          );
        }),
      )}
    </div>
  );
}

function MapCard({ map, onSelect }) {
  return (
    <div
      onClick={() => onSelect(map.key)}
      style={{
        width: 320,
        padding: "14px 18px",
        background: "#13140f",
        border: "1px solid #2a2218",
        borderRadius: 4,
        cursor: "pointer",
        marginBottom: 10,
        transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#c9a84c";
        e.currentTarget.style.background = "#191a14";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#2a2218";
        e.currentTarget.style.background = "#13140f";
      }}
    >
      <MapPreview map={map} />

      <div
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: 12,
          letterSpacing: 2,
          color: "#c9a84c",
          marginBottom: 4,
        }}
      >
        {map.name}
      </div>

      <div style={{ fontSize: 12, color: "#5a4a2a", lineHeight: 1.5 }}>
        {map.description}
      </div>
    </div>
  );
}

export default function MapSelector() {
  const startMap = useGameStore((s) => s.startMap);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "85vh",
        padding: "24px 12px",
      }}
    >
      {/* Título */}
      <div
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: 26,
          letterSpacing: 5,
          color: "#c9a84c",
          marginBottom: 6,
          textAlign: "center",
        }}
      >
        ⚔ Hero Hub
      </div>

      <div
        style={{
          fontSize: 11,
          color: "#5a4a2a",
          letterSpacing: 3,
          marginBottom: 36,
          fontFamily: "Cinzel, serif",
        }}
      >
        SELECCIONA UN MAPA
      </div>

      {/* Tarjetas de mapa */}
      {Object.values(MAPS).map((map) => (
        <MapCard key={map.key} map={map} onSelect={startMap} />
      ))}
    </div>
  );
}
