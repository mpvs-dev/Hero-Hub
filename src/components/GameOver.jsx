import useGameStore from "../store/useGameStore";

const CONFIG = {
  win: {
    bg: "#0a180a",
    border: "#3B6D11",
    color: "#97C459",
    label: "⚔ VICTORIA",
  },
  lose: {
    bg: "#180a0a",
    border: "#7a1818",
    color: "#E24B4A",
    label: "☠ DERROTA",
  },
};

export default function GameOver() {
  const { gameOver, resetMap, exitToMenu } = useGameStore();
  if (!gameOver) return null;

  const cfg = CONFIG[gameOver];

  return (
    <div
      style={{
        textAlign: "center",
        padding: "14px 16px",
        borderRadius: 5,
        marginBottom: 10,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <div
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: 18,
          letterSpacing: 4,
          color: cfg.color,
          marginBottom: 10,
        }}
      >
        {cfg.label}
      </div>

      <GameOverButton onClick={resetMap}>Jugar de nuevo</GameOverButton>
      <GameOverButton onClick={exitToMenu} style={{ marginLeft: 8 }}>
        Cambiar mapa
      </GameOverButton>
    </div>
  );
}

function GameOverButton({ onClick, children, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "Cinzel, serif",
        fontSize: 10,
        letterSpacing: 1,
        padding: "6px 16px",
        background: "#13140f",
        border: "1px solid #2a2218",
        color: "#c9a84c",
        borderRadius: 3,
        cursor: "pointer",
        margin: 2,
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#c9a84c";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#2a2218";
      }}
    >
      {children}
    </button>
  );
}
