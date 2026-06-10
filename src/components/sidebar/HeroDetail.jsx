import Sprite        from "../Sprite";
import Panel         from "./Panel";
import MovementPips  from "./MovementPips";
import PhaseHint     from "./PhaseHint";
import { STATUS_EFFECTS } from "../../config/enemies";
import { ABILITIES }      from "../../config/abilities";

export default function HeroDetail({ unit, phase, attackableCount, compact }) {
  return (
    <Panel title={unit.name.toUpperCase()}>
      {/* Sprite + stats */}
      <div style={{
        display: "flex",
        flexDirection: compact ? "row" : "column",
        gap: 12,
        alignItems: compact ? "center" : "stretch",
        marginBottom: 6,
      }}>
        <div style={{ display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <Sprite type={unit.type} size={compact ? 44 : 56} />
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
            <div>❤ {unit.hp} / {unit.maxHp}</div>
            <div>⚔ ATK {unit.atk} · 🛡 DEF {unit.def}</div>
            <div>👟 Mov {unit.mov}</div>
            <div>🎯 Rango {unit.range}</div>
          </div>
        </div>
      </div>

      {/* Pips de movimiento — solo si movesPerTurn > 1 */}
      <MovementPips unit={unit} />

      {/* Efectos de estado activos */}
      {unit.statusEffects?.length > 0 && (
        <div style={{ marginBottom: 6, marginTop: 6 }}>
          {unit.statusEffects.map(effect => {
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
                  <div style={{
                    fontSize: 10, fontFamily: "Cinzel, serif",
                    letterSpacing: 1, color: cfg.color,
                  }}>
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

      <PhaseHint phase={phase} attackableCount={attackableCount} unit={unit} />

      {/* Habilidad pasiva */}
      {unit.abilityKey && (() => {
        const ab = ABILITIES[unit.abilityKey];
        if (!ab || ab.type !== "passive") return null;
        return (
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            marginTop: 7, padding: "5px 8px", borderRadius: 3,
            background: "#0d0e0a",
            border: `1px solid ${ab.color}44`,
          }}>
            <span style={{ fontSize: 14 }}>{ab.icon}</span>
            <div>
              <div style={{
                fontSize: 9, fontFamily: "Cinzel, serif",
                letterSpacing: 1, color: ab.color,
              }}>
                {ab.name} <span style={{ color: "#2a2820", fontSize: 8 }}>· PASIVA</span>
              </div>
              <div style={{ fontSize: 8, color: "#3a3028" }}>{ab.description}</div>
            </div>
          </div>
        );
      })()}
    </Panel>
  );
}
