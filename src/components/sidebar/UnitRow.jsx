import Sprite from "../Sprite";

export default function UnitRow({ unit, isSelected, isAttackable, onClick, compact }) {
  const hpPct     = Math.round((unit.hp / unit.maxHp) * 100);
  const hpColor   = unit.team === "player" ? "#639922" : "#A32D2D";
  const isClickable = !!onClick && unit.alive;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "5px 6px",
        borderRadius: 3,
        marginBottom: 5,
        opacity: unit.alive ? 1 : 0.28,
        cursor: isClickable ? "pointer" : "default",
        outline: isSelected   ? "1px solid #c9a84c"
               : isAttackable ? "1px solid #E24B4A"
               : "none",
        transition: "background 0.1s",
      }}
      onMouseEnter={e => { if (isClickable) e.currentTarget.style.background = "#1e1e18"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      <Sprite type={unit.type} size={compact ? 28 : 26} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: compact ? 12 : 11,
          fontWeight: 600,
          color: "#c9b99a",
          marginBottom: 3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {unit.name}
        </div>
        <div style={{
          width: "100%", height: compact ? 5 : 4,
          background: "#1e1e18", borderRadius: 2, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: `${hpPct}%`,
            background: hpColor, borderRadius: 2,
            transition: "width 0.3s",
          }} />
        </div>
      </div>

      <span style={{
        fontSize: compact ? 11 : 10,
        color: "#5a4a2a",
        minWidth: 40,
        textAlign: "right",
        flexShrink: 0,
      }}>
        {unit.alive ? `${unit.hp}/${unit.maxHp}` : "✝"}
      </span>
    </div>
  );
}
