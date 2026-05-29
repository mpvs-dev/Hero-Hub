import { useState } from "react";
import { UNITS } from "../config/units";

// ─── Paleta de colores para sprites de respaldo ────────────────────────────────
const FALLBACK = {
  warrior: {
    bg: "#2a4a1a",
    border: "#5a9a4a",
    glyph: "⚔",
    glyphColor: "#c9a84c",
  },
  archer: {
    bg: "#0d3060",
    border: "#1a6ab5",
    glyph: "🏹",
    glyphColor: "#80c0ff",
  },
  mage: { bg: "#2a1a60", border: "#7050c0", glyph: "✦", glyphColor: "#c080ff" },
  orc: { bg: "#4a1010", border: "#9a2020", glyph: "☠", glyphColor: "#ff6050" },
  goblin: {
    bg: "#1a3a10",
    border: "#4a8a20",
    glyph: "⚡",
    glyphColor: "#b0ff60",
  },
  darkmage: {
    bg: "#120820",
    border: "#5020a0",
    glyph: "☽",
    glyphColor: "#c060ff",
  },
};

const FALLBACK_DEFAULT = {
  bg: "#1a1a1a",
  border: "#3a3a3a",
  glyph: "?",
  glyphColor: "#888",
};

// ─── SVG de respaldo ───────────────────────────────────────────────────────────
function FallbackSprite({ type, size }) {
  const style = FALLBACK[type] ?? FALLBACK_DEFAULT;
  const fontSize = Math.round(size * 0.42);
  const radius = Math.round(size * 0.12);

  return (
    <div
      style={{
        width: size,
        height: size,
        background: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius: radius,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        color: style.glyphColor,
        flexShrink: 0,
        boxSizing: "border-box",
        userSelect: "none",
      }}
    >
      {style.glyph}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Sprite({ type, size = 48 }) {
  const [imgError, setImgError] = useState(false);
  const def = UNITS[type];

  // Intentar cargar la imagen PNG del sprite
  if (def?.spriteUrl && !imgError) {
    return (
      <img
        src={def.spriteUrl}
        width={size}
        height={size}
        alt={def.name ?? type}
        style={{
          imageRendering: "pixelated",
          display: "block",
          borderRadius: 2,
          flexShrink: 0,
        }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback SVG si la imagen no existe o falló
  return <FallbackSprite type={type} size={size} />;
}
