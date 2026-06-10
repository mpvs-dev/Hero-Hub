const hintStyle = (bg, border, color) => ({
  fontSize: 10,
  fontStyle: "italic",
  color,
  marginTop: 6,
  padding: "4px 8px",
  background: bg,
  border: `1px solid ${border}`,
  borderRadius: 3,
  lineHeight: 1.5,
});

export default function PhaseHint({ phase, attackableCount, unit }) {
  const movesLeft      = unit ? (unit.movesPerTurn ?? 1) - (unit.movesUsed ?? 0) : 0;
  const canStillMove   = movesLeft > 0;
  const canStillAttack = unit ? !unit.attacked : false;

  if (phase === "move" && canStillAttack) {
    return (
      <div style={hintStyle("#1a1208", "#2a1a08", "#c9a84c")}>
        Elige una casilla dorada para mover o haz clic en un enemigo para atacar
      </div>
    );
  }
  if (phase === "move" && !canStillAttack) {
    return (
      <div style={hintStyle("#0d1208", "#1a2018", "#7acc5a")}>
        Ya atacaste — elige una casilla para reposicionarte
      </div>
    );
  }
  if (phase === "attack" && attackableCount > 0) {
    return (
      <div style={hintStyle("#1a0808", "#2a0808", "#e24b4a")}>
        Haz clic en un enemigo marcado para atacar
        {canStillMove && (
          <span style={{ color: "#7acc5a" }}> · Podrás mover después</span>
        )}
      </div>
    );
  }
  if (phase === "attack" && attackableCount === 0) {
    return (
      <div style={hintStyle("#1a1810", "#2a2218", "#7a6a4a")}>
        Sin enemigos en rango de ataque
      </div>
    );
  }
  return null;
}
