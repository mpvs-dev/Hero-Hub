import Sprite from "./Sprite";
import useGameStore from "../store/useGameStore";
import { HEROES }              from "../config/heroes";
import { ENEMIES, STATUS_EFFECTS } from "../config/enemies";
import { ABILITIES }           from "../config/abilities";
const UNITS = { ...HEROES, ...ENEMIES };

// ─── Panel ────────────────────────────────────────────────────────────────────
function Panel({ title, children, style = {} }) {
  return (
    <div style={{
      background: "#13140f",
      border: "1px solid #2a2218",
      borderRadius: 4,
      padding: "10px 14px",
      ...style,
    }}>
      {title && (
        <div style={{
          fontFamily: "Cinzel, serif",
          fontSize: 9,
          letterSpacing: 2,
          color: "#5a4a2a",
          marginBottom: 8,
          paddingBottom: 5,
          borderBottom: "1px solid #1a1810",
        }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Fila de unidad ───────────────────────────────────────────────────────────
function UnitRow({ unit, isSelected, isAttackable, onClick, compact }) {
  const hpPct = Math.round((unit.hp / unit.maxHp) * 100);
  const hpColor = unit.team === "player" ? "#639922" : "#A32D2D";
  const isClickable = !!onClick && unit.alive;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 10 : 10,
        padding: compact ? "5px 6px" : "5px 6px",
        borderRadius: 3,
        marginBottom: 5,
        opacity: unit.alive ? 1 : 0.28,
        cursor: isClickable ? "pointer" : "default",
        outline: isSelected
          ? "1px solid #c9a84c"
          : isAttackable
          ? "1px solid #E24B4A"
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

// ─── Indicador de movimientos restantes ───────────────────────────────────────
function MovementPips({ unit }) {
  const total = unit.movesPerTurn ?? 1;
  if (total <= 1) return null; // no mostrar para unidades normales

  const used = unit.movesUsed ?? 0;
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
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: i < remaining ? "#7acc5a" : "#1e2218",
              border: `1px solid ${i < remaining ? "#4a8a2a" : "#2a2a18"}`,
              transition: "background 0.2s",
            }}
          />
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

// ─── Hint de fase ─────────────────────────────────────────────────────────────
function PhaseHint({ phase, attackableCount, unit }) {
  const movesLeft = unit ? (unit.movesPerTurn ?? 1) - (unit.movesUsed ?? 0) : 0;
  const canStillMove = movesLeft > 0;
  const canStillAttack = unit ? !unit.attacked : false;

  if (phase === "move" && canStillAttack) {
    return <div style={hintStyle("#1a1208", "#2a1a08", "#c9a84c")}>
      Elige una casilla dorada para mover o haz clic en un enemigo para atacar
    </div>;
  }
  if (phase === "move" && !canStillAttack) {
    return <div style={hintStyle("#0d1208", "#1a2018", "#7acc5a")}>
      Ya atacaste — elige una casilla para reposicionarte
    </div>;
  }
  if (phase === "attack" && attackableCount > 0) {
    return <div style={hintStyle("#1a0808", "#2a0808", "#e24b4a")}>
      Haz clic en un enemigo marcado para atacar
      {canStillMove && <span style={{ color: "#7acc5a" }}> · Podrás mover después</span>}
    </div>;
  }
  if (phase === "attack" && attackableCount === 0) {
    return <div style={hintStyle("#1a1810", "#2a2218", "#7a6a4a")}>
      Sin enemigos en rango de ataque
    </div>;
  }
  return null;
}

const hintStyle = (bg, border, color) => ({
  fontSize: 10,
  fontStyle: "italic",
  color, marginTop: 6,
  padding: "4px 8px",
  background: bg,
  border: `1px solid ${border}`,
  borderRadius: 3,
  lineHeight: 1.5,
});

// ─── Panel de despliegue ──────────────────────────────────────────────────────
function DeployPanel({ deployQueue, deployPending, units, onStart, compact }) {
  const allDeployed = deployQueue.length === 0;

  return (
    <Panel title="DESPLIEGUE">
      <div style={{ fontSize: 11, color: "#7a6a4a", marginBottom: 10, lineHeight: 1.5 }}>
        {allDeployed
          ? "¡Todos los héroes están listos!"
          : `Coloca a tu ${UNITS[deployPending]?.name ?? deployPending} en una casilla verde.`}
      </div>

      {units.filter(u => u.team === "player").map(u => {
        const isNext = u.type === deployPending && !u.deployed;
        const isDone = u.deployed;
        return (
          <div key={u.id} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 7px", marginBottom: 5, borderRadius: 3,
            background: isNext ? "rgba(74,223,138,0.08)" : "transparent",
            outline: isNext ? "1px solid #4adf8a" : "none",
            opacity: isDone ? 0.5 : 1,
            transition: "all 0.2s",
          }}>
            <Sprite type={u.type} size={compact ? 28 : 24} />
            <span style={{
              fontSize: compact ? 12 : 11,
              color: isNext ? "#4adf8a" : isDone ? "#5a4a2a" : "#c9b99a",
              flex: 1,
            }}>
              {u.name}
            </span>
            <span style={{ fontSize: 13 }}>
              {isDone ? "✓" : isNext ? "▶" : "○"}
            </span>
          </div>
        );
      })}

      {allDeployed && (
        <button
          onClick={onStart}
          style={{
            width: "100%", marginTop: 10,
            fontFamily: "Cinzel, serif", fontSize: 10, letterSpacing: 2,
            padding: "9px",
            background: "#0a180a", border: "1px solid #3B6D11",
            color: "#97C459", borderRadius: 3, cursor: "pointer",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#142a14"; e.currentTarget.style.borderColor = "#5a9a2a"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#0a180a"; e.currentTarget.style.borderColor = "#3B6D11"; }}
        >
          ⚔ COMENZAR BATALLA
        </button>
      )}
    </Panel>
  );
}

// ─── Sidebar principal ────────────────────────────────────────────────────────
export default function Sidebar({ isMobile = false }) {
  const {
    units, selectedUnitId, inspectedEnemyId, attackableUnitIds,
    phase, turn, gameOver, enemyBusy, battleLog,
    deployQueue, deployPending,
    selectUnit, attackUnit, endPlayerTurn, startBattle, inspectEnemy,
  } = useGameStore();

  const selUnit   = units.find(u => u.id === selectedUnitId);
  const inspEnemy = units.find(u => u.id === inspectedEnemyId);
  const players   = units.filter(u => u.team === "player");
  const enemies   = units.filter(u => u.team === "enemy");
  const compact   = isMobile;

  // ── Fase despliegue ──────────────────────────────────────────────────────
  if (phase === "deploy") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <DeployPanel
          deployQueue={deployQueue}
          deployPending={deployPending}
          units={units}
          onStart={startBattle}
          compact={compact}
        />
        <Panel title="REGISTRO">
          <div style={{ maxHeight: isMobile ? 80 : 140, overflowY: "auto" }}>
            {battleLog.map((msg, i) => (
              <div key={i} style={{
                fontSize: 10, lineHeight: 1.5, marginBottom: 2,
                color: i === 0 ? "#c9b99a" : "#3a3028",
              }}>
                {msg}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  // ── Fase combate ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

      {/* Enemigo inspeccionado */}
      {inspEnemy && !selUnit && (
        <Panel title={inspEnemy.name.toUpperCase()} style={{ borderColor: "#3a1010" }}>
          <div style={{
            display: "flex",
            flexDirection: compact ? "row" : "column",
            gap: 12,
            alignItems: compact ? "center" : "stretch",
            marginBottom: 6,
          }}>
            <div style={{ display: "flex", justifyContent: "center", flexShrink: 0 }}>
              <Sprite type={inspEnemy.type} size={compact ? 44 : 56} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: "#6a2020", fontStyle: "italic", marginBottom: 4 }}>
                {inspEnemy.class}
              </div>
              <div style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: "#5a4a2a" }}>❤ Vida</span>
                  <span style={{ fontSize: 10, color: "#e05555", fontWeight: 700 }}>
                    {inspEnemy.hp} / {inspEnemy.maxHp}
                  </span>
                </div>
                <div style={{ height: 4, background: "#1e1e18", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.round((inspEnemy.hp / inspEnemy.maxHp) * 100)}%`,
                    background: inspEnemy.hp / inspEnemy.maxHp > 0.5 ? "#c93030"
                              : inspEnemy.hp / inspEnemy.maxHp > 0.25 ? "#e06020"
                              : "#e0e020",
                    borderRadius: 2, transition: "width 0.3s",
                  }} />
                </div>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: compact ? "1fr 1fr" : "1fr",
                gap: compact ? "2px 12px" : 0,
                fontSize: compact ? 11 : 10,
                color: "#7a6a4a",
                lineHeight: 2,
              }}>
                <div>⚔ ATK {inspEnemy.atk} · 🛡 DEF {inspEnemy.def}</div>
                <div>👟 Mov {inspEnemy.mov} · 🎯 Rango {inspEnemy.range}</div>
              </div>
            </div>
          </div>

          <div style={{
            fontSize: 9, color: "#4a3028", lineHeight: 1.5, fontStyle: "italic",
            marginBottom: 8, padding: "5px 7px",
            background: "#160808", border: "1px solid #2a1010", borderRadius: 3,
          }}>
            {inspEnemy.description}
          </div>

          {inspEnemy.abilities?.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 8, fontFamily: "Cinzel, serif", letterSpacing: 2, color: "#3a2020", marginBottom: 5 }}>
                HABILIDADES
              </div>
              {inspEnemy.abilities.map(ab => {
                const cfg = STATUS_EFFECTS[ab.type];
                if (!cfg) return null;
                return (
                  <div key={ab.type} style={{
                    display: "flex", alignItems: "flex-start", gap: 7,
                    padding: "5px 7px", marginBottom: 4, borderRadius: 3,
                    background: cfg.bgColor, border: `1px solid ${cfg.border}`,
                  }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{cfg.icon}</span>
                    <div>
                      <div style={{ fontSize: 9, fontFamily: "Cinzel, serif", letterSpacing: 1, color: cfg.color, marginBottom: 1 }}>
                        {cfg.label}
                        <span style={{ color: "#3a3028", marginLeft: 6, fontSize: 8 }}>
                          {Math.round(ab.chance * 100)}%
                        </span>
                      </div>
                      <div style={{ fontSize: 8, color: "#5a4a2a", lineHeight: 1.4 }}>
                        {cfg.desc(ab.damage, ab.duration)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {inspEnemy.statusEffects?.length > 0 && (
            <div>
              <div style={{ fontSize: 8, fontFamily: "Cinzel, serif", letterSpacing: 2, color: "#3a2020", marginBottom: 5 }}>
                ESTADO ACTUAL
              </div>
              {inspEnemy.statusEffects.map(effect => {
                const cfg = STATUS_EFFECTS[effect.type];
                return cfg ? (
                  <div key={effect.type} style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "4px 7px", marginBottom: 3, borderRadius: 3,
                    background: cfg.bgColor, border: `1px solid ${cfg.border}`,
                  }}>
                    <span style={{ fontSize: 12 }}>{cfg.icon}</span>
                    <span style={{ fontSize: 9, color: cfg.color, fontFamily: "Cinzel, serif", flex: 1 }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 9, color: "#3a3028" }}>
                      {effect.duration} ronda{effect.duration > 1 ? "s" : ""}
                    </span>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </Panel>
      )}

      {/* Héroe seleccionado */}
      {selUnit && (
        <Panel title={selUnit.name.toUpperCase()}>
          <div style={{
            display: "flex",
            flexDirection: compact ? "row" : "column",
            gap: 12,
            alignItems: compact ? "center" : "stretch",
            marginBottom: 6,
          }}>
            <div style={{ display: "flex", justifyContent: "center", flexShrink: 0 }}>
              <Sprite type={selUnit.type} size={compact ? 44 : 56} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: compact ? "1fr 1fr" : "1fr",
                gap: compact ? "2px 12px" : 0,
                fontSize: compact ? 11 : 10,
                color: "#7a6a4a",
                lineHeight: 2,
              }}>
                <div>❤ {selUnit.hp} / {selUnit.maxHp}</div>
                <div>⚔ ATK {selUnit.atk} · 🛡 DEF {selUnit.def}</div>
                <div>👟 Mov {selUnit.mov}</div>
                <div>🎯 Rango {selUnit.range}</div>
              </div>
            </div>
          </div>

          {/* Indicador de movimientos — solo visible si tiene más de 1 */}
          <MovementPips unit={selUnit} />

          {/* Efectos de estado activos */}
          {(selUnit.statusEffects?.length > 0) && (
            <div style={{ marginBottom: 6, marginTop: 6 }}>
              {selUnit.statusEffects.map(effect => {
                const cfg = STATUS_EFFECTS[effect.type];
                if (!cfg) return null;
                return (
                  <div key={effect.type} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "4px 8px", marginBottom: 4, borderRadius: 3,
                    background: cfg.bgColor, border: `1px solid ${cfg.border}`,
                  }}>
                    <span style={{ fontSize: 13 }}>{cfg.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontFamily: "Cinzel, serif", letterSpacing: 1, color: cfg.color }}>
                        {cfg.label}
                      </div>
                      <div style={{ fontSize: 9, color: "#5a4a2a" }}>
                        {cfg.desc(effect.damage, effect.duration)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <PhaseHint phase={phase} attackableCount={attackableUnitIds.length} unit={selUnit} />

          {/* Habilidad pasiva */}
          {selUnit.abilityKey && (() => {
            const ab = ABILITIES[selUnit.abilityKey];
            if (!ab || ab.type !== "passive") return null;
            return (
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                marginTop: 7, padding: "5px 8px", borderRadius: 3,
                background: "#0d0e0a", border: `1px solid ${ab.color}44`,
              }}>
                <span style={{ fontSize: 14 }}>{ab.icon}</span>
                <div>
                  <div style={{ fontSize: 9, fontFamily: "Cinzel, serif", letterSpacing: 1, color: ab.color }}>
                    {ab.name} <span style={{ color: "#2a2820", fontSize: 8 }}>· PASIVA</span>
                  </div>
                  <div style={{ fontSize: 8, color: "#3a3028" }}>{ab.description}</div>
                </div>
              </div>
            );
          })()}
        </Panel>
      )}

      {/* Listas de unidades */}
      {compact ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Panel title="HÉROES">
            {players.map(p => (
              <UnitRow
                key={p.id} unit={p}
                isSelected={p.id === selectedUnitId}
                isAttackable={false}
                compact={compact}
                onClick={p.alive && turn === "player" ? () => selectUnit(p.id) : null}
              />
            ))}
          </Panel>
          <Panel title="ENEMIGOS">
            {enemies.map(e => (
              <UnitRow
                key={e.id} unit={e}
                isSelected={false}
                isAttackable={attackableUnitIds.includes(e.id)}
                compact={compact}
                onClick={attackableUnitIds.includes(e.id) ? () => attackUnit(selectedUnitId, e.id) : null}
              />
            ))}
          </Panel>
        </div>
      ) : (
        <>
          <Panel title="HÉROES">
            {players.map(p => (
              <UnitRow
                key={p.id} unit={p}
                isSelected={p.id === selectedUnitId}
                isAttackable={false}
                compact={false}
                onClick={p.alive && turn === "player" ? () => selectUnit(p.id) : null}
              />
            ))}
          </Panel>
          <Panel title="ENEMIGOS">
            {enemies.map(e => (
              <UnitRow
                key={e.id} unit={e}
                isSelected={false}
                isAttackable={attackableUnitIds.includes(e.id)}
                compact={false}
                onClick={attackableUnitIds.includes(e.id) ? () => attackUnit(selectedUnitId, e.id) : null}
              />
            ))}
          </Panel>
        </>
      )}

      {/* Registro */}
      <Panel title="REGISTRO">
        <div style={{ maxHeight: isMobile ? 72 : 130, overflowY: "auto" }}>
          {battleLog.map((msg, i) => (
            <div key={i} style={{
              fontSize: 10, lineHeight: 1.5, marginBottom: 2,
              color: i === 0 ? "#c9b99a" : "#3a3028",
              transition: "color 0.3s",
            }}>
              {msg}
            </div>
          ))}
        </div>
      </Panel>

      {/* Fin de turno */}
      {!gameOver && (
        <button
          onClick={endPlayerTurn}
          disabled={turn !== "player" || enemyBusy}
          style={{
            width: "100%",
            padding: compact ? "11px" : "10px",
            fontFamily: "Cinzel, serif",
            fontSize: compact ? 11 : 10,
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
