import { useState, useEffect } from "react";
import Sprite from "./Sprite";
import useGameStore, { PLAYER_HEROES } from "../store/useGameStore";

// ─── Hook de ancho ────────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// ─── Stat bar ─────────────────────────────────────────────────────────────────
const STAT_CFG = {
  hp: { label: "HP", icon: "❤", color: "#e05555", max: 50 },
  atk: { label: "ATK", icon: "⚔", color: "#c9a84c", max: 20 },
  def: { label: "DEF", icon: "🛡", color: "#5a9fd4", max: 10 },
  mov: { label: "MOV", icon: "👟", color: "#7acc5a", max: 6 },
  range: { label: "RNG", icon: "🎯", color: "#c084ff", max: 4 },
  movesPerTurn: { label: "TURNOS MOV", icon: "🔄", color: "#4adfc0", max: 3 },
};

function StatBar({ statKey, value }) {
  const cfg = STAT_CFG[statKey];
  const pct = Math.min(100, Math.round((value / cfg.max) * 100));
  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 3,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "#5a4a2a",
            letterSpacing: 1,
            fontFamily: "Cinzel, serif",
          }}
        >
          {cfg.icon} {cfg.label}
        </span>
        <span style={{ fontSize: 10, color: cfg.color, fontWeight: 700 }}>
          {value}
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: "#1a1810",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: cfg.color,
            borderRadius: 2,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─── Card de héroe dentro del modal ──────────────────────────────────────────
function HeroCard({ hero, isTaken, isCurrent, onPick }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={() => !isTaken && onPick(hero.key)}
      onMouseEnter={() => !isTaken && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "14px 12px 12px",
        borderRadius: 4,
        border: isCurrent
          ? "1.5px solid #c9a84c"
          : hov
            ? "1px solid #4a3a1a"
            : "1px solid #1e1c14",
        background: isCurrent ? "#1a1608" : hov ? "#161410" : "#13120c",
        cursor: isTaken ? "not-allowed" : "pointer",
        opacity: isTaken ? 0.28 : 1,
        transition: "all 0.15s",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxShadow: isCurrent
          ? "0 0 20px rgba(201,168,76,0.08)"
          : hov
            ? "0 4px 16px rgba(0,0,0,0.4)"
            : "none",
      }}
    >
      {isCurrent && (
        <div
          style={{
            position: "absolute",
            top: 7,
            right: 8,
            fontSize: 8,
            color: "#c9a84c",
            fontFamily: "Cinzel, serif",
            letterSpacing: 1,
          }}
        >
          ✓ ELEGIDO
        </div>
      )}

      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}
      >
        <Sprite type={hero.key} size={56} />
      </div>

      <div
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: 11,
          letterSpacing: 1,
          color: "#c9b99a",
          textAlign: "center",
          marginBottom: 2,
        }}
      >
        {hero.name}
      </div>

      <div
        style={{
          fontSize: 9,
          color: "#5a4a2a",
          textAlign: "center",
          fontStyle: "italic",
          marginBottom: 8,
        }}
      >
        {hero.class}
      </div>

      <div
        style={{
          fontSize: 9,
          color: "#3a3028",
          lineHeight: 1.5,
          marginBottom: 10,
          minHeight: 40,
        }}
      >
        {hero.description}
      </div>

      <div style={{ marginTop: "auto" }}>
        {["hp", "atk", "def", "mov", "range", "movesPerTurn"].map((k) => (
          <StatBar key={k} statKey={k} value={hero[k]} />
        ))}
      </div>
    </div>
  );
}

// ─── Modal de selección ───────────────────────────────────────────────────────
function HeroPickerModal({ slotIndex, roster, onPick, onClose, width }) {
  const isXs = width < 480;
  const isSm = width < 768;
  // 1 col en xs, 2 en sm, 3 en md+
  const cols = isXs ? 1 : isSm ? 2 : 3;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.82)",
          zIndex: 100,
          backdropFilter: "blur(3px)",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 101,
          width: isXs ? "94vw" : isSm ? "90vw" : "min(720px, 96vw)",
          maxHeight: isXs ? "90vh" : "88vh",
          background: "#0f1008",
          border: "1px solid #3a3220",
          borderRadius: 6,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(201,168,76,0.08)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: isXs ? "14px 16px 12px" : "18px 24px 14px",
            borderBottom: "1px solid #1a1810",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: isXs ? 10 : 13,
                letterSpacing: isXs ? 1 : 3,
                color: "#c9a84c",
              }}
            >
              RANURA {slotIndex + 1} — ELIGE UN HÉROE
            </div>
            {!isXs && (
              <div
                style={{
                  fontSize: 10,
                  color: "#3a3028",
                  marginTop: 3,
                  letterSpacing: 1,
                }}
              >
                Haz clic en la card del héroe que quieres asignar
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0,
              background: "none",
              border: "1px solid #2a2218",
              color: "#5a4a2a",
              borderRadius: 3,
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "Cinzel, serif",
              fontSize: 10,
              letterSpacing: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#c9a84c";
              e.currentTarget.style.color = "#c9a84c";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2a2218";
              e.currentTarget.style.color = "#5a4a2a";
            }}
          >
            ✕
          </button>
        </div>

        {/* Grid de cards */}
        <div
          style={{
            overflowY: "auto",
            padding: isXs ? "12px 12px 16px" : "20px 24px 24px",
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: isXs ? 8 : 12,
            alignItems: "start",
          }}
        >
          {PLAYER_HEROES.map((hero) => {
            const takenByOther = roster.findIndex((k) => k === hero.key);
            const isTaken = takenByOther !== -1 && takenByOther !== slotIndex;
            const isCurrent = roster[slotIndex] === hero.key;
            return (
              <HeroCard
                key={hero.key}
                hero={hero}
                isTaken={isTaken}
                isCurrent={isCurrent}
                onPick={onPick}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Pedestal / ranura ────────────────────────────────────────────────────────
function HeroSlot({ index, heroKey, onClick, size }) {
  const hero = heroKey ? PLAYER_HEROES.find((h) => h.key === heroKey) : null;
  const [hov, setHov] = useState(false);
  const labels = ["Primer héroe", "Segundo héroe", "Tercer héroe"];

  // Tamaños responsivos del pedestal
  const boxW = size === "sm" ? 100 : size === "md" ? 130 : 140;
  const boxH = size === "sm" ? 120 : size === "md" ? 150 : 170;
  const spriteS = size === "sm" ? 40 : size === "md" ? 52 : 64;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: boxW,
          height: boxH,
          borderRadius: 6,
          border: hero
            ? `1.5px solid ${hov ? "#c9a84c" : "#3a3220"}`
            : `1.5px dashed ${hov ? "#4adf8a" : "#2a2820"}`,
          background: hero
            ? hov
              ? "#161610"
              : "#111209"
            : hov
              ? "#0c100e"
              : "#0d0e0f",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: size === "sm" ? 6 : 10,
          transition: "all 0.2s",
          position: "relative",
          boxShadow: hero
            ? hov
              ? "0 0 24px rgba(201,168,76,0.1)"
              : "none"
            : hov
              ? "0 0 20px rgba(74,223,138,0.06)"
              : "none",
        }}
      >
        {/* Número */}
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 8,
            fontFamily: "Cinzel, serif",
            fontSize: 7,
            letterSpacing: 2,
            color: hero ? "#3a3028" : hov ? "#4adf8a" : "#252520",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        {hero ? (
          <>
            <Sprite type={hero.key} size={spriteS} />
            <div
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: size === "sm" ? 8 : 10,
                letterSpacing: 1,
                color: "#c9b99a",
                textAlign: "center",
              }}
            >
              {hero.name}
            </div>
            {size !== "sm" && (
              <div
                style={{ fontSize: 9, color: "#5a4a2a", fontStyle: "italic" }}
              >
                {hero.class}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: size === "sm" ? 6 : 8,
                marginTop: 2,
              }}
            >
              {["hp", "atk", "def"].map((k) => (
                <div key={k} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 7, color: "#3a3028" }}>
                    {STAT_CFG[k].icon}
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      color: STAT_CFG[k].color,
                      fontFamily: "Cinzel, serif",
                    }}
                  >
                    {hero[k]}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                width: spriteS * 0.85,
                height: spriteS * 0.85,
                borderRadius: "50%",
                border: `1.5px dashed ${hov ? "#4adf8a44" : "#2a2820"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: size === "sm" ? 18 : 24,
                color: hov ? "#4adf8a33" : "#1e1e18",
                transition: "all 0.2s",
              }}
            >
              ⊕
            </div>
            <div
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: size === "sm" ? 7 : 9,
                letterSpacing: 1,
                color: hov ? "#4adf8a" : "#2a2820",
                textAlign: "center",
                transition: "color 0.2s",
              }}
            >
              {hov ? "ELEGIR" : "VACÍO"}
            </div>
          </>
        )}
      </div>

      {/* Etiqueta */}
      {size !== "sm" && (
        <div
          style={{
            marginTop: 10,
            fontFamily: "Cinzel, serif",
            fontSize: 8,
            letterSpacing: 2,
            color: hero ? "#5a4a2a" : "#2a2820",
            textTransform: "uppercase",
          }}
        >
          {labels[index]}
        </div>
      )}

      {/* Línea decorativa */}
      <div
        style={{
          marginTop: 6,
          width: hero ? (size === "sm" ? 60 : 90) : size === "sm" ? 28 : 40,
          height: 1,
          background: hero
            ? "linear-gradient(90deg, transparent, #3a3028, transparent)"
            : "linear-gradient(90deg, transparent, #1e1e18, transparent)",
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function HeroLobby() {
  const { roster, goToMapSelect } = useGameStore();
  const [openSlot, setOpenSlot] = useState(null);

  const width = useWindowWidth();
  const isXs = width < 480;
  const isSm = width < 768;

  // Tamaño de pedestal según viewport
  const slotSize = isXs ? "sm" : isSm ? "md" : "lg";
  // Gap entre pedestales
  const slotGap = isXs ? 12 : isSm ? 20 : 32;

  const rosterComplete = roster.every((k) => k !== null);
  const emptyCount = roster.filter((k) => k === null).length;

  const handlePick = (heroKey) => {
    const { roster: r } = useGameStore.getState();
    const existing = r.findIndex((k) => k === heroKey);
    if (existing !== -1 && existing !== openSlot) return;
    const newRoster = [...r];
    newRoster[openSlot] = newRoster[openSlot] === heroKey ? null : heroKey;
    useGameStore.setState({ roster: newRoster });
    setOpenSlot(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0e0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        padding: isXs ? "24px 12px 90px" : "0 16px 90px",
      }}
    >
      {/* Fondo decorativo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `
          radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.04) 0%, transparent 70%),
          radial-gradient(ellipse 40% 60% at 20% 100%, rgba(74,100,50,0.05) 0%, transparent 60%),
          radial-gradient(ellipse 30% 50% at 80% 100%, rgba(50,74,100,0.05) 0%, transparent 60%)
        `,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.025,
          backgroundImage:
            "repeating-linear-gradient(0deg, #c9a84c 0px, #c9a84c 1px, transparent 1px, transparent 48px)",
        }}
      />

      {/* ── Cabecera ── */}
      <div
        style={{
          textAlign: "center",
          marginBottom: isXs ? 32 : 52,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: isXs ? 36 : 60,
              height: 1,
              background: "linear-gradient(90deg, transparent, #3a3028)",
            }}
          />
          <div
            style={{
              fontSize: 9,
              color: "#3a3028",
              fontFamily: "Cinzel, serif",
              letterSpacing: 4,
            }}
          >
            HERO HUB
          </div>
          <div
            style={{
              width: isXs ? 36 : 60,
              height: 1,
              background: "linear-gradient(90deg, #3a3028, transparent)",
            }}
          />
        </div>

        <div
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: isXs ? 26 : isSm ? 32 : 38,
            letterSpacing: isXs ? 4 : 8,
            color: "#c9a84c",
            lineHeight: 1,
            marginBottom: 10,
            textShadow: "0 0 60px rgba(201,168,76,0.2)",
          }}
        >
          ESCUADRÓN
        </div>

        <div
          style={{
            fontFamily: "Crimson Text, serif",
            fontSize: isXs ? 11 : 13,
            color: "#3a3028",
            letterSpacing: isXs ? 1 : 2,
            fontStyle: "italic",
          }}
        >
          Elige a tus tres guerreros antes de partir a la batalla
        </div>
      </div>

      {/* ── Ranuras centrales ── */}
      <div
        style={{
          display: "flex",
          gap: slotGap,
          alignItems: "flex-start",
          position: "relative",
          // En xs apilamos si no caben los 3 en horizontal
          flexWrap: isXs ? "wrap" : "nowrap",
          justifyContent: "center",
        }}
      >
        {/* Línea conectora (solo md+) */}
        {!isXs && (
          <div
            style={{
              position: "absolute",
              top: slotSize === "md" ? 75 : 85,
              left: 20,
              right: 20,
              height: 1,
              background:
                "linear-gradient(90deg, transparent, #1e1c14 20%, #1e1c14 80%, transparent)",
              pointerEvents: "none",
            }}
          />
        )}

        {roster.map((heroKey, i) => (
          <HeroSlot
            key={i}
            index={i}
            heroKey={heroKey}
            size={slotSize}
            onClick={() => setOpenSlot(i)}
          />
        ))}
      </div>

      {/* ── Instrucción ── */}
      <div
        style={{
          marginTop: isXs ? 24 : 36,
          fontFamily: "Cinzel, serif",
          fontSize: isXs ? 8 : 9,
          letterSpacing: isXs ? 1 : 3,
          color: rosterComplete ? "#5a4a2a" : "#2a2820",
          textAlign: "center",
          transition: "color 0.3s",
          padding: "0 16px",
        }}
      >
        {rosterComplete
          ? "ESCUADRÓN LISTO — Pulsa EMPEZAR en la esquina inferior"
          : "HAZ CLIC EN UNA RANURA PARA ELEGIR TU HÉROE"}
      </div>

      {/* ── Botón flotante inferior derecha ── */}
      <div
        style={{
          position: "fixed",
          bottom: isXs ? 14 : 28,
          right: isXs ? 12 : 28,
          zIndex: 10,
        }}
      >
        <button
          onClick={goToMapSelect}
          disabled={!rosterComplete}
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: isXs ? 9 : 11,
            letterSpacing: isXs ? 1 : 3,
            padding: isXs ? "11px 18px" : "14px 28px",
            background: rosterComplete ? "#0c1a0a" : "#0d0e0f",
            border: `1.5px solid ${rosterComplete ? "#3B6D11" : "#1a1a18"}`,
            color: rosterComplete ? "#97C459" : "#252522",
            borderRadius: 4,
            cursor: rosterComplete ? "pointer" : "default",
            transition: "all 0.2s",
            boxShadow: rosterComplete
              ? "0 8px 32px rgba(60,109,17,0.25)"
              : "none",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            if (!rosterComplete) return;
            e.currentTarget.style.background = "#142a14";
            e.currentTarget.style.borderColor = "#5aaa22";
            e.currentTarget.style.color = "#b8e870";
            e.currentTarget.style.boxShadow =
              "0 12px 40px rgba(60,109,17,0.35)";
          }}
          onMouseLeave={(e) => {
            if (!rosterComplete) return;
            e.currentTarget.style.background = "#0c1a0a";
            e.currentTarget.style.borderColor = "#3B6D11";
            e.currentTarget.style.color = "#97C459";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(60,109,17,0.25)";
          }}
        >
          {rosterComplete
            ? "EMPEZAR CAMPAÑA →"
            : `${emptyCount} RANURA${emptyCount > 1 ? "S" : ""} VACÍA${emptyCount > 1 ? "S" : ""}`}
        </button>
      </div>

      {/* ── Modal ── */}
      {openSlot !== null && (
        <HeroPickerModal
          slotIndex={openSlot}
          roster={roster}
          onPick={handlePick}
          onClose={() => setOpenSlot(null)}
          width={width}
        />
      )}
    </div>
  );
}
