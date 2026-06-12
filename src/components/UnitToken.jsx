import { useState, useEffect, useRef } from "react";
import Sprite from "./Sprite";
import { STATUS_EFFECTS } from "../config/enemies";
import { UNIT_TOKEN_SPRITE_SIZE } from "../config/constants";

const HP_BAR_COLOR = { player: "#97C459", enemy: "#E24B4A" };

// ─── Número flotante de daño ──────────────────────────────────────────────────
function DamageNumber({ value, type = "damage" }) {
  // type: "damage" | "heal" | "status"
  const color =
    type === "heal"   ? "#7acc5a" :
    type === "status" ? "#c9a84c" :
    "#E24B4A";

  const prefix = type === "heal" ? "+" : "-";

  return (
    <div style={{
      position: "absolute",
      top: -8,
      left: "50%",
      transform: "translateX(-50%)",
      pointerEvents: "none",
      zIndex: 10,
      fontFamily: "Cinzel, serif",
      fontSize: 13,
      fontWeight: 700,
      color,
      textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.6)",
      whiteSpace: "nowrap",
      animation: "floatUp 0.9s ease-out forwards",
    }}>
      {prefix}{value}
    </div>
  );
}

// ─── Hook: detecta cambios de HP y lanza animaciones ─────────────────────────

function useDamageAnimations(unit) {
  const [animations, setAnimations] = useState([]);
  const prevHpRef = useRef(unit.hp);
  const prevAliveRef = useRef(unit.alive);

  useEffect(() => {
    const prevHp    = prevHpRef.current;
    const prevAlive = prevAliveRef.current;
    const delta     = unit.hp - prevHp;

    // Solo animar si el HP cambió y la unidad ya existía
    if (delta !== 0 && prevAlive) {
      const id   = Date.now() + Math.random();
      const type = delta > 0 ? "heal" : "damage";
      setAnimations(prev => [...prev, { id, value: Math.abs(delta), type }]);
      // Limpiar tras la animación
      setTimeout(() => {
        setAnimations(prev => prev.filter(a => a.id !== id));
      }, 950);
    }

    prevHpRef.current    = unit.hp;
    prevAliveRef.current = unit.alive;
  }, [unit.hp, unit.alive]);

  return animations;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function UnitToken({ unit, tileSize }) {
  const hpPct        = Math.round((unit.hp / unit.maxHp) * 100);
  const activeEffects = (unit.statusEffects ?? []).filter(e => e.duration > 0);
  const animations   = useDamageAnimations(unit);

  return (
    <>
      {/* Keyframes inyectados una sola vez via <style> */}
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0);    }
          20%  { opacity: 1; transform: translateX(-50%) translateY(-6px); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-22px);}
        }
      `}</style>

      <div style={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
      }}>
        {/* Números flotantes de daño/curación */}
        {animations.map(anim => (
          <DamageNumber key={anim.id} value={anim.value} type={anim.type} />
        ))}

        {/* Íconos de efectos de estado */}
        {activeEffects.length > 0 && (
          <div style={{ display: "flex", gap: 2, marginBottom: 1, zIndex: 3 }}>
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

        {/* Sprite */}
        <Sprite type={unit.type} size={UNIT_TOKEN_SPRITE_SIZE} />

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
    </>
  );
}
