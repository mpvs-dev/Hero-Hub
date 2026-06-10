export default function MovementPips({ unit }) {
  const total = unit.movesPerTurn ?? 1;
  if (total <= 1) return null;

  const used      = unit.movesUsed ?? 0;
  const remaining = total - used;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginTop: 5,
      padding: "4px 8px",
      background: "#0d100a",
      border: "1px solid #2a3018",
      borderRadius: 3,
    }}>
      <span style={{ fontSize: 9, color: "#5a6a3a", fontFamily: "Cinzel, serif", letterSpacing: 1 }}>
        MOVIMIENTOS
      </span>
      <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: "50%",
            background: i < remaining ? "#7acc5a" : "#1e2218",
            border: `1px solid ${i < remaining ? "#4a8a2a" : "#2a2a18"}`,
            transition: "background 0.2s",
          }} />
        ))}
      </div>
      <span style={{
        fontSize: 10,
        color: remaining > 0 ? "#7acc5a" : "#3a3a28",
        fontFamily: "Cinzel, serif",
        marginLeft: 4,
      }}>
        {remaining}/{total}
      </span>
    </div>
  );
}
