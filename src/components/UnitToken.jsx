import Sprite from "./Sprite";
import { STATUS_EFFECTS } from "../config/enemies";

const SPRITE_SIZE = 38;
const HP_BAR_COLOR = { player: "#97C459", enemy: "#E24B4A" };

export default function UnitToken({ unit, tileSize }) {
  const hpPct = Math.round((unit.hp / unit.maxHp) * 100);
  const activeEffects = (unit.statusEffects ?? []).filter(e => e.duration > 0);

  return (
    <div style={{
      position: "relative",
      zIndex: 2,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      pointerEvents: "none",
    }}>
      {/* Íconos de efectos de estado — arriba del sprite */}
      {activeEffects.length > 0 && (
        <div style={{
          display: "flex",
          gap: 2,
          marginBottom: 1,
          zIndex: 3,
        }}>
          {activeEffects.map(effect => {
            const cfg = STATUS_EFFECTS[effect.type];
            if (!cfg) return null;
            return (
              <div
                key={effect.type}
                title={`${cfg.label} (${effect.duration} ronda${effect.duration > 1 ? "s" : ""})`}
                style={{
                  fontSize: Math.max(8, Math.round(tileSize * 0.18)),
                  lineHeight: 1,
                  background: cfg.bgColor,
                  border: `1px solid ${cfg.border}`,
                  borderRadius: 2,
                  padding: "0 2px",
                  color: cfg.color,
                }}
              >
                {cfg.icon}
              </div>
            );
          })}
        </div>
      )}

      {/* Sprite del personaje */}
      <Sprite type={unit.type} size={SPRITE_SIZE} />

      {/* Barra de HP */}
      <div style={{
        width: tileSize - 10,
        height: 3,
        background: "rgba(0,0,0,0.6)",
        borderRadius: 2,
        marginTop: 2,
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <div style={{
          height: "100%",
          width: `${hpPct}%`,
          background: HP_BAR_COLOR[unit.team] ?? "#888",
          borderRadius: 2,
          transition: "width 0.3s ease",
        }} />
      </div>
    </div>
  );
}
