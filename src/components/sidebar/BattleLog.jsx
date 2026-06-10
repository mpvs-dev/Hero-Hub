/**
 * BattleLog.jsx
 * Renderiza el battle log con colores persistentes por token.
 *
 * Cada entrada del log es un array de tokens: [{ text, type }, ...]
 * Los colores de cada type se definen exclusivamente en logColors.js.
 */

import Panel from "./Panel";
import { LOG_COLORS, DOT_COLORS, dominantType } from "../../config/logColors";

// ─── Entrada individual ───────────────────────────────────────────────────────

function LogEntry({ tokens, isLatest }) {
  const dominant = dominantType(tokens);
  const dotColor = DOT_COLORS[dominant] ?? DOT_COLORS.system;

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 6,
      marginBottom: 4,
      opacity: isLatest ? 1 : 0.5,
      transition: "opacity 0.3s",
    }}>
      {/* Punto lateral con color del tipo dominante */}
      <div style={{
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: isLatest ? dotColor : DOT_COLORS.system,
        flexShrink: 0,
        marginTop: 4,
        transition: "background 0.3s",
      }} />

      {/* Tokens inline con color individual */}
      <span style={{ fontSize: 10, lineHeight: 1.55, flex: 1 }}>
        {tokens.map((tok, i) => (
          <span
            key={i}
            style={{
              color: isLatest
                ? (LOG_COLORS[tok.type] ?? LOG_COLORS.system)
                : LOG_COLORS.system,
              transition: "color 0.3s",
            }}
          >
            {tok.text}
          </span>
        ))}
      </span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function BattleLog({ log, maxHeight }) {
  return (
    <Panel title="REGISTRO">
      <div style={{ maxHeight, overflowY: "auto" }}>
        {log.map((entry, i) => {
          // Retrocompatibilidad: si la entrada es string en vez de array de tokens
          const tokens = Array.isArray(entry)
            ? entry
            : [{ text: String(entry), type: "system" }];
          return (
            <LogEntry key={i} tokens={tokens} isLatest={i === 0} />
          );
        })}
      </div>
    </Panel>
  );
}
