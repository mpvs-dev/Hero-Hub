import { MAPS }     from "../config/maps";
import useGameStore from "../store/useGameStore";

const TURN_STYLE = {
  player: { bg: "#0c1a08", border: "#3B6D11", color: "#97C459" },
  enemy:  { bg: "#1a0808", border: "#7a1a1a", color: "#e24b4a" },
};

export default function HUD({ isMobile = false }) {
  const { currentMapKey, turn, roundNumber, resetMap, exitToMenu } = useGameStore();
  const map = MAPS[currentMapKey];
  if (!map) return null;

  const ts = TURN_STYLE[turn];

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: isMobile ? "7px 10px" : "8px 14px",
      background: "#13140f",
      border: "1px solid #2a2218",
      borderRadius: 5,
      gap: 8,
      flexWrap: isMobile ? "wrap" : "nowrap",
    }}>
      {/* Izquierda: nombre + turno */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{
          fontFamily: "Cinzel, serif",
          fontSize: isMobile ? 10 : 11,
          letterSpacing: 2,
          color: "#c9a84c",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: isMobile ? 100 : "none",
        }}>
          {map.name}
        </span>

        <span style={{
          fontFamily: "Cinzel, serif",
          fontSize: isMobile ? 9 : 10,
          letterSpacing: 1,
          padding: "3px 8px",
          borderRadius: 3,
          background: ts.bg,
          border: `1px solid ${ts.border}`,
          color: ts.color,
          whiteSpace: "nowrap",
          transition: "all 0.3s",
          flexShrink: 0,
        }}>
          {turn === "player"
            ? `Turno ${roundNumber}`
            : `Enemigo ${roundNumber}`}
        </span>
      </div>

      {/* Derecha: botones */}
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        <HUDButton onClick={resetMap} small={isMobile}>↺</HUDButton>
        <HUDButton onClick={exitToMenu} small={isMobile}>← Lobby</HUDButton>
      </div>
    </div>
  );
}

function HUDButton({ onClick, children, small }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "Cinzel, serif",
        fontSize: small ? 9 : 9,
        letterSpacing: 1,
        padding: small ? "4px 8px" : "4px 10px",
        background: "#13140f",
        border: "1px solid #2a2218",
        color: "#7a6a4a",
        borderRadius: 3,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "#c9a84c";
        e.currentTarget.style.color = "#c9a84c";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "#2a2218";
        e.currentTarget.style.color = "#7a6a4a";
      }}
    >
      {children}
    </button>
  );
}
