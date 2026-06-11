import { useState } from "react";
import useGameStore from "../store/useGameStore";
import Sprite from "./Sprite";
import Credits from "./Credits";

const MODES = [
  {
    key: "campaign",
    icon: "⚔",
    name: "Campaña",
    subtitle: "Conquista los mapas",
    description:
      "Elige un campo de batalla y despliega tu escuadrón. Cada mapa tiene terrenos y zonas de despliegue distintos. Derrota a todos los enemigos para ganar.",
    available: true,
    color: "#c9a84c",
    colorBg: "#1a1608",
    colorBorder: "#3a2e10",
    colorBorderHov: "#c9a84c",
    tag: null,
  },
  {
    key: "infinite",
    icon: "∞",
    name: "Modo Infinito",
    subtitle: "Resiste las oleadas",
    description:
      "Oleadas interminables de enemigos cada vez más difíciles. ¿Cuántas rondas aguantará tu escuadrón? Compite por la puntuación más alta.",
    available: false,
    color: "#c084ff",
    colorBg: "#130820",
    colorBorder: "#2a1060",
    colorBorderHov: "#7040c0",
    tag: "Próximamente",
  },
  {
    key: "versus",
    icon: "⚡",
    name: "Versus",
    subtitle: "Jugador contra jugador",
    description:
      "Enfrenta tus heroes al de otro jugador en el mismo dispositivo. Turnos alternos, estrategia pura. Que gane el mejor comandante.",
    available: false,
    color: "#E24B4A",
    colorBg: "#180808",
    colorBorder: "#4a1010",
    colorBorderHov: "#8a2020",
    tag: "Próximamente",
  },
];

function ModeCard({ mode, onClick }) {
  const [hov, setHov] = useState(false);
  const active = hov && mode.available;

  return (
    <div
      onClick={() => mode.available && onClick(mode.key)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        padding: "28px 24px 24px",
        borderRadius: 6,
        border: `1.5px solid ${active ? mode.colorBorderHov : mode.colorBorder}`,
        background: active ? mode.colorBg : "#0f1008",
        cursor: mode.available ? "pointer" : "default",
        transition: "all 0.2s",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        opacity: mode.available ? 1 : 0.55,
        boxShadow: active ? `0 0 32px ${mode.color}18` : "none",
      }}
    >
      {/* Badge "Próximamente" */}
      {mode.tag && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            fontSize: 8,
            fontFamily: "Cinzel, serif",
            letterSpacing: 2,
            padding: "3px 8px",
            borderRadius: 3,
            color: mode.color,
            background: mode.colorBg,
            border: `1px solid ${mode.colorBorder}`,
          }}
        >
          {mode.tag}
        </div>
      )}

      {/* Icono */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 5,
          background: mode.colorBg,
          border: `1.5px solid ${active ? mode.colorBorderHov : mode.colorBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          transition: "border-color 0.2s",
          flexShrink: 0,
        }}
      >
        {mode.icon}
      </div>

      {/* Texto */}
      <div>
        <div
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 16,
            letterSpacing: 2,
            color: active ? mode.color : "#c9b99a",
            marginBottom: 4,
            transition: "color 0.2s",
          }}
        >
          {mode.name}
        </div>
        <div
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 9,
            letterSpacing: 2,
            color: mode.color,
            opacity: 0.6,
            marginBottom: 12,
          }}
        >
          {mode.subtitle.toUpperCase()}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#4a3f2f",
            lineHeight: 1.6,
          }}
        >
          {mode.description}
        </div>
      </div>

      {/* CTA */}
      {mode.available && (
        <div
          style={{
            marginTop: "auto",
            fontSize: 9,
            fontFamily: "Cinzel, serif",
            letterSpacing: 2,
            color: active ? mode.color : "#2a2218",
            transition: "color 0.2s",
          }}
        >
          {active ? "SELECCIONAR →" : "···"}
        </div>
      )}
    </div>
  );
}

export default function ModeSelector() {
  const { selectMode, backToLobby, roster } = useGameStore();

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
        padding: "44px 24px 100px",
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
          radial-gradient(ellipse 40% 50% at 80% 100%, rgba(100,50,180,0.03) 0%, transparent 60%),
          radial-gradient(ellipse 40% 50% at 10% 60%,  rgba(226,75,74,0.03)  0%, transparent 60%)
        `,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.02,
          backgroundImage:
            "repeating-linear-gradient(0deg, #c9a84c 0px, #c9a84c 1px, transparent 1px, transparent 48px)",
        }}
      />

      {/* Cabecera */}
      <div
        style={{ textAlign: "center", marginBottom: 48, position: "relative" }}
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
              width: 60,
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
              width: 60,
              height: 1,
              background: "linear-gradient(90deg, #3a3028, transparent)",
            }}
          />
        </div>

        <div
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 34,
            letterSpacing: 8,
            color: "#c9a84c",
            lineHeight: 1,
            marginBottom: 12,
            textShadow: "0 0 60px rgba(201,168,76,0.2)",
          }}
        >
          MODO DE JUEGO
        </div>

        <div
          style={{
            fontFamily: "Crimson Text, serif",
            fontSize: 13,
            color: "#3a3028",
            letterSpacing: 2,
            fontStyle: "italic",
          }}
        >
          Elige cómo quieres combatir con tu escuadrón
        </div>
      </div>

      {/* Grid de modos */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          width: "100%",
          maxWidth: 820,
        }}
      >
        {MODES.map((mode) => (
          <ModeCard key={mode.key} mode={mode} onClick={selectMode} />
        ))}
      </div>

      {/* Resumen del escuadrón */}
      <div
        style={{
          marginTop: 28,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 16px",
          background: "#111209",
          border: "1px solid #2a2218",
          borderRadius: 4,
        }}
      >
        {roster.map((key, i) =>
          key ? (
            <Sprite key={i} type={key} size={20} />
          ) : (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                borderRadius: 2,
                background: "#1a1810",
              }}
            />
          ),
        )}
        <div
          style={{
            width: 1,
            height: 16,
            background: "#2a2218",
            margin: "0 4px",
          }}
        />
        <span
          style={{
            fontSize: 8,
            fontFamily: "Cinzel, serif",
            letterSpacing: 2,
            color: "#3a3028",
          }}
        >
          ESCUADRÓN LISTO
        </span>
      </div>

      {/* Botón volver */}
      <button
        onClick={backToLobby}
        style={{
          position: "fixed",
          bottom: 28,
          left: 28,
          fontFamily: "Cinzel, serif",
          fontSize: 10,
          letterSpacing: 2,
          padding: "12px 22px",
          background: "#0d0e0f",
          border: "1.5px solid #2a2218",
          color: "#5a4a2a",
          borderRadius: 4,
          cursor: "pointer",
          transition: "all 0.2s",
          zIndex: 10,
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
        ← Escuadrón
      </button>
      <Credits />
    </div>
  );
}
