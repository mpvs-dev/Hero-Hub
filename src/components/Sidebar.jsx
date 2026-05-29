import Sprite from "./Sprite";
import useGameStore from "../store/useGameStore";

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Panel({ title, children, style = {} }) {
  return (
    <div
      style={{
        background: "#13140f",
        border: "1px solid #2a2218",
        borderRadius: 4,
        padding: "9px 11px",
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 9,
            letterSpacing: 2,
            color: "#5a4a2a",
            marginBottom: 7,
            paddingBottom: 4,
            borderBottom: "1px solid #1a1810",
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function UnitRow({ unit, isSelected, isAttackable, onClick }) {
  const hpPct = Math.round((unit.hp / unit.maxHp) * 100);
  const hpBarColor = unit.team === "player" ? "#639922" : "#A32D2D";
  const isClickable = !!onClick && unit.alive;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "3px 5px",
        borderRadius: 3,
        marginBottom: 4,
        opacity: unit.alive ? 1 : 0.28,
        cursor: isClickable ? "pointer" : "default",
        outline: isSelected
          ? "1px solid #c9a84c"
          : isAttackable
            ? "1px solid #E24B4A"
            : "none",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        if (isClickable) e.currentTarget.style.background = "#1e1e18";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <Sprite type={unit.type} size={22} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#c9b99a",
            marginBottom: 2,
          }}
        >
          {unit.name}
        </div>
        <div
          style={{
            width: "100%",
            height: 4,
            background: "#1e1e18",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${hpPct}%`,
              background: hpBarColor,
              borderRadius: 2,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      <span
        style={{
          fontSize: 10,
          color: "#5a4a2a",
          minWidth: 34,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {unit.alive ? `${unit.hp}/${unit.maxHp}` : "✝"}
      </span>
    </div>
  );
}

function PhaseHint({ phase, attackableCount }) {
  if (phase === "move") {
    return (
      <div style={hintStyle("#1a1208", "#2a1a08", "#c9a84c")}>
        Elige una casilla dorada para mover
      </div>
    );
  }
  if (phase === "attack" && attackableCount > 0) {
    return (
      <div style={hintStyle("#1a0808", "#2a0808", "#e24b4a")}>
        Haz clic en un enemigo marcado
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

const hintStyle = (bg, border, color) => ({
  fontSize: 10,
  fontStyle: "italic",
  color,
  marginTop: 5,
  padding: "3px 7px",
  background: bg,
  border: `1px solid ${border}`,
  borderRadius: 3,
  lineHeight: 1.4,
});

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Sidebar() {
  const {
    units,
    selectedUnitId,
    attackableUnitIds,
    phase,
    turn,
    gameOver,
    enemyBusy,
    battleLog,
    selectUnit,
    attackUnit,
    skipMove,
    endPlayerTurn,
  } = useGameStore();

  const selUnit = units.find((u) => u.id === selectedUnitId);
  const players = units.filter((u) => u.team === "player");
  const enemies = units.filter((u) => u.team === "enemy");

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 7,
      }}
    >
      {/* ── Unidad seleccionada ── */}
      {selUnit && (
        <Panel title={selUnit.name.toUpperCase()}>
          {/* Sprite grande */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <Sprite type={selUnit.type} size={52} />
          </div>

          {/* Stats */}
          <div style={{ fontSize: 10, color: "#7a6a4a", lineHeight: 2.1 }}>
            <div>
              ❤ {selUnit.hp} / {selUnit.maxHp}
            </div>
            <div>
              ⚔ ATK {selUnit.atk} &nbsp;·&nbsp; 🛡 DEF {selUnit.def}
            </div>
            <div>
              👟 Mov {selUnit.mov} &nbsp;·&nbsp; 🎯 Rango {selUnit.range}
            </div>
          </div>

          {/* Indicador de fase */}
          <PhaseHint phase={phase} attackableCount={attackableUnitIds.length} />

          {/* Botón: atacar sin moverse */}
          {phase === "move" && !selUnit.attacked && (
            <button
              onClick={() => skipMove(selectedUnitId)}
              style={{
                width: "100%",
                marginTop: 6,
                fontFamily: "Cinzel, serif",
                fontSize: 9,
                letterSpacing: 1,
                padding: "5px",
                background: "#0a0c08",
                border: "1px solid #2a2218",
                color: "#7a6a4a",
                borderRadius: 3,
                cursor: "pointer",
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
              Atacar sin moverse →
            </button>
          )}
        </Panel>
      )}

      {/* ── Héroes ── */}
      <Panel title="HÉROES">
        {players.map((p) => (
          <UnitRow
            key={p.id}
            unit={p}
            isSelected={p.id === selectedUnitId}
            isAttackable={false}
            onClick={
              p.alive && turn === "player" ? () => selectUnit(p.id) : null
            }
          />
        ))}
      </Panel>

      {/* ── Enemigos ── */}
      <Panel title="ENEMIGOS">
        {enemies.map((e) => (
          <UnitRow
            key={e.id}
            unit={e}
            isSelected={false}
            isAttackable={attackableUnitIds.includes(e.id)}
            onClick={
              attackableUnitIds.includes(e.id)
                ? () => attackUnit(selectedUnitId, e.id)
                : null
            }
          />
        ))}
      </Panel>

      {/* ── Registro de batalla ── */}
      <Panel title="REGISTRO" style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ maxHeight: 140, overflow: "hidden" }}>
          {battleLog.map((msg, i) => (
            <div
              key={i}
              style={{
                fontSize: 10,
                lineHeight: 1.5,
                marginBottom: 2,
                color: i === 0 ? "#c9b99a" : "#3a3028",
                transition: "color 0.3s",
              }}
            >
              {msg}
            </div>
          ))}
        </div>
      </Panel>

      {/* ── Botón de fin de turno ── */}
      {!gameOver && (
        <button
          onClick={endPlayerTurn}
          disabled={turn !== "player" || enemyBusy}
          style={{
            width: "100%",
            padding: "9px",
            fontFamily: "Cinzel, serif",
            fontSize: 10,
            letterSpacing: 2,
            background: turn === "player" ? "#0c180a" : "#0d0e0f",
            border: `1px solid ${turn === "player" ? "#3B6D11" : "#1a2218"}`,
            color: turn === "player" ? "#97C459" : "#3a4a2a",
            borderRadius: 4,
            cursor: turn === "player" ? "pointer" : "default",
            opacity: enemyBusy ? 0.3 : 1,
            transition: "all 0.2s",
          }}
        >
          {turn === "player" ? "TERMINAR TURNO →" : "⋯ Enemigo actuando"}
        </button>
      )}
    </div>
  );
}
