import { MAPS } from "../config/maps";
import useGameStore from "../store/useGameStore";

const TURN_STYLE = {
  player: { bg: "#0c1a08", border: "#3B6D11", color: "#97C459" },
  enemy: { bg: "#1a0808", border: "#7a1a1a", color: "#e24b4a" },
};

export default function HUD() {
  const { currentMapKey, turn, roundNumber, resetMap, exitToMenu } =
    useGameStore();
  const map = MAPS[currentMapKey];
  if (!map) return null;

  const ts = TURN_STYLE[turn];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
        padding: "8px 12px",
        background: "#13140f",
        border: "1px solid #2a2218",
        borderRadius: 5,
      }}
    >
      {/* Izquierda: nombre + turno */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 11,
            letterSpacing: 2,
            color: "#c9a84c",
          }}
        >
          {map.name}
        </span>

        <span
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 10,
            letterSpacing: 1,
            padding: "3px 9px",
            borderRadius: 3,
            background: ts.bg,
            border: `1px solid ${ts.border}`,
            color: ts.color,
            transition: "all 0.3s",
          }}
        >
          {turn === "player"
            ? `Tu Turno · Ronda ${roundNumber}`
            : `Enemigo · Ronda ${roundNumber}`}
        </span>
      </div>

      {/* Derecha: botones */}
      <div style={{ display: "flex", gap: 5 }}>
        <HUDButton onClick={resetMap}>↺ Reiniciar</HUDButton>
        <HUDButton onClick={exitToMenu}>← Mapas</HUDButton>
      </div>
    </div>
  );
}

function HUDButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "Cinzel, serif",
        fontSize: 9,
        letterSpacing: 1,
        padding: "4px 10px",
        background: "#13140f",
        border: "1px solid #2a2218",
        color: "#7a6a4a",
        borderRadius: 3,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#c9a84c";
        e.currentTarget.style.color = "#c9a84c";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#2a2218";
        e.currentTarget.style.color = "#7a6a4a";
      }}
    >
      {children}
    </button>
  );
}
