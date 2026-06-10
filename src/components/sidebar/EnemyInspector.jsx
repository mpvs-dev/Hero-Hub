/**
 * EnemyInspector.jsx
 * Panel de detalle del enemigo inspeccionado.
 * Cuando el enemigo es atacable, muestra preview de daño estimado.
 */

import Sprite from "../Sprite";
import Panel  from "./Panel";
import { STATUS_EFFECTS } from "../../config/enemies";

// ─── Preview de daño ──────────────────────────────────────────────────────────

function DamagePreview({ attacker, defender }) {
  if (!attacker || !defender) return null;

  const base   = attacker.atk - defender.def;
  const minDmg = Math.max(1, base - 1); // varianza mínima
  const maxDmg = Math.max(1, base + 3); // varianza máxima
  const kills  = defender.hp <= minDmg;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 10px",
      marginBottom: 8,
      background: kills ? "#1a0808" : "#0f1008",
      border: `1px solid ${kills ? "#7a1a1a" : "#2a3018"}`,
      borderRadius: 3,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12 }}>⚔</span>
        <span style={{
          fontFamily: "Cinzel, serif",
          fontSize: 9,
          letterSpacing: 1,
          color: kills ? "#e05555" : "#7a9a4a",
        }}>
          {kills ? "GOLPE LETAL" : "DAÑO ESTIMADO"}
        </span>
      </div>
      <span style={{
        fontFamily: "Cinzel, serif",
        fontSize: 13,
        fontWeight: 700,
        color: kills ? "#E24B4A" : "#c9b99a",
        letterSpacing: 1,
      }}>
        {minDmg === maxDmg ? minDmg : `${minDmg}–${maxDmg}`}
      </span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function EnemyInspector({ unit, compact, isAttackable, attacker }) {
  return (
    <Panel title={unit.name.toUpperCase()} style={{ borderColor: isAttackable ? "#5a1010" : "#3a1010" }}>

      {/* Preview de daño — solo cuando es atacable y hay héroe seleccionado */}
      {isAttackable && attacker && (
        <DamagePreview attacker={attacker} defender={unit} />
      )}

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
          <div style={{ fontSize: 9, color: "#6a2020", fontStyle: "italic", marginBottom: 4 }}>
            {unit.class}
          </div>

          {/* Barra de HP */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 10, color: "#5a4a2a" }}>❤ Vida</span>
              <span style={{ fontSize: 10, color: "#e05555", fontWeight: 700 }}>
                {unit.hp} / {unit.maxHp}
              </span>
            </div>
            <div style={{ height: 4, background: "#1e1e18", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.round((unit.hp / unit.maxHp) * 100)}%`,
                background: unit.hp / unit.maxHp > 0.5 ? "#c93030"
                          : unit.hp / unit.maxHp > 0.25 ? "#e06020"
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
            <div>⚔ ATK {unit.atk} · 🛡 DEF {unit.def}</div>
            <div>👟 Mov {unit.mov} · 🎯 Rango {unit.range}</div>
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div style={{
        fontSize: 9, color: "#4a3028", lineHeight: 1.5, fontStyle: "italic",
        marginBottom: 8, padding: "5px 7px",
        background: "#160808", border: "1px solid #2a1010", borderRadius: 3,
      }}>
        {unit.description}
      </div>

      {/* Habilidades del enemigo */}
      {unit.abilities?.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{
            fontSize: 8, fontFamily: "Cinzel, serif",
            letterSpacing: 2, color: "#3a2020", marginBottom: 5,
          }}>
            HABILIDADES
          </div>
          {unit.abilities.map(ab => {
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
                  <div style={{
                    fontSize: 9, fontFamily: "Cinzel, serif",
                    letterSpacing: 1, color: cfg.color, marginBottom: 1,
                  }}>
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

      {/* Efectos activos */}
      {unit.statusEffects?.length > 0 && (
        <div>
          <div style={{
            fontSize: 8, fontFamily: "Cinzel, serif",
            letterSpacing: 2, color: "#3a2020", marginBottom: 5,
          }}>
            ESTADO ACTUAL
          </div>
          {unit.statusEffects.map(effect => {
            const cfg = STATUS_EFFECTS[effect.type];
            return cfg ? (
              <div key={effect.type} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "4px 7px", marginBottom: 3, borderRadius: 3,
                background: cfg.bgColor, border: `1px solid ${cfg.border}`,
              }}>
                <span style={{ fontSize: 12 }}>{cfg.icon}</span>
                <span style={{
                  fontSize: 9, color: cfg.color,
                  fontFamily: "Cinzel, serif", flex: 1,
                }}>
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
  );
}
