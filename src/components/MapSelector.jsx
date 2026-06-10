import { useState, useEffect } from "react";
import { MAPS }            from "../config/maps";
import { TILE_TYPES }      from "../config/tiles";
import useGameStore        from "../store/useGameStore";
import Sprite              from "./Sprite";
import { PLAYER_HEROES }   from "../store/useGameStore";
import Credits         from './Credits';


// ─── Hook de ancho de ventana ─────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// ─── Breakpoints ──────────────────────────────────────────────────────────────
// xs  < 480   → 1 columna
// sm  480–767 → 2 columnas
// md  768+    → 3 columnas
function useCols(width) {
  if (width < 480) return 1;
  if (width < 768) return 2;
  return 3;
}

// ─── Preview del mapa ─────────────────────────────────────────────────────────
function MapPreview({ map }) {
  // Convertir zonas a Set de "row-col" para lookup O(1)
  const playerZone = new Set(
    (map.deployZone ?? []).map(([r, c]) => `${r}-${c}`)
  );
  const enemyZone = new Set(
    (map.enemyDeployZone ?? []).map(([r, c]) => `${r}-${c}`)
  );

  return (
    <div style={{
      width: "100%",
      aspectRatio: `${map.w} / ${map.h}`,
      overflow: "hidden",
      position: "relative",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        display: "grid",
        gridTemplateColumns: `repeat(${map.w}, 1fr)`,
        gridTemplateRows:    `repeat(${map.h}, 1fr)`,
        gap: 0,
      }}>
        {map.grid.flatMap((rowStr, ri) =>
          [...rowStr].map((tk, ci) => {
            const tile      = TILE_TYPES[tk] ?? TILE_TYPES.G;
            const key       = `${ri}-${ci}`;
            const inPlayer  = playerZone.has(key);
            const inEnemy   = enemyZone.has(key);

            return (
              <div
                key={key}
                style={{
                  background: inPlayer ? "#2a6a1a"
                            : inEnemy  ? "#7a1a1a"
                            : tile.bg,
                  // Borde sutil para resaltar la zona dentro del tile
                  outline: inPlayer ? "1px solid #3aaa2a"
                         : inEnemy  ? "1px solid #cc2a2a"
                         : "none",
                  outlineOffset: "-1px",
                  position: "relative",
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Leyenda de tiles ─────────────────────────────────────────────────────────
function MapLegend({ map }) {
  const present = [...new Set(map.grid.flatMap(r => [...r]))];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", marginTop: 8 }}>
      {present.map(tk => {
        const tile = TILE_TYPES[tk];
        if (!tile) return null;
        return (
          <div key={tk} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 7, height: 7, borderRadius: 1,
              background: tile.bg, flexShrink: 0,
              border: "1px solid rgba(255,255,255,0.06)",
            }} />
            <span style={{ fontSize: 8, color: "#3a3028", fontFamily: "Cinzel, serif", letterSpacing: 0.5 }}>
              {tile.name}
            </span>
          </div>
        );
      })}
      {[
        { color: "#2a6a1a", border: "#3aaa2a", label: "Zona aliada"  },
        { color: "#7a1a1a", border: "#cc2a2a", label: "Zona enemiga" },
      ].map(({ color, border, label }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{
            width: 7, height: 7, borderRadius: 1,
            background: color, flexShrink: 0,
            outline: `1px solid ${border}`, outlineOffset: "-1px",
          }} />
          <span style={{ fontSize: 8, color: "#3a3028", fontFamily: "Cinzel, serif", letterSpacing: 0.5 }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Card de mapa ─────────────────────────────────────────────────────────────
function MapCard({ map, onSelect }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={() => onSelect(map.key)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%",
        padding: "10px 10px 14px",
        background:   hov ? "#161610" : "#111209",
        border:       `1.5px solid ${hov ? "#c9a84c" : "#2a2218"}`,
        borderRadius: 5,
        cursor:       "pointer",
        transition:   "all 0.18s",
        display:      "flex",
        flexDirection:"column",
        boxSizing:    "border-box",
        boxShadow:    hov
          ? "0 0 28px rgba(201,168,76,0.1), 0 8px 24px rgba(0,0,0,0.5)"
          : "0 4px 12px rgba(0,0,0,0.4)",
      }}
    >
      {/* Preview */}
      <div style={{
        borderRadius: 3,
        overflow: "hidden",
        border: `1px solid ${hov ? "#3a3220" : "#1a1810"}`,
        marginBottom: 12,
        width: "100%",
        transition: "border-color 0.18s",
      }}>
        <MapPreview map={map} />
      </div>

      {/* Nombre */}
      <div style={{
        fontFamily: "Cinzel, serif",
        fontSize: 11,
        letterSpacing: 2,
        color: hov ? "#e0c060" : "#c9a84c",
        marginBottom: 6,
        transition: "color 0.18s",
      }}>
        {map.name}
      </div>

      {/* Descripción */}
      <div style={{
        fontSize: 10,
        color: "#4a3f2f",
        lineHeight: 1.55,
        marginBottom: 10,
        flexGrow: 1,
      }}>
        {map.description}
      </div>

      {/* Dimensiones */}
      <div style={{
        fontSize: 8,
        color: "#2a2218",
        fontFamily: "Cinzel, serif",
        letterSpacing: 1,
        marginBottom: 6,
      }}>
        {map.w} × {map.h} CASILLAS
      </div>

      <MapLegend map={map} />

      {/* CTA hover */}
      <div style={{
        marginTop: 12,
        fontSize: 9,
        fontFamily: "Cinzel, serif",
        letterSpacing: 2,
        color: hov ? "#c9a84c" : "#1e1e18",
        textAlign: "center",
        transition: "color 0.18s",
      }}>
        {hov ? "SELECCIONAR →" : "···"}
      </div>
    </div>
  );
}

// ─── Resumen del escuadrón ────────────────────────────────────────────────────
function RosterSummary({ roster, compact }) {
  return (
    <div style={{
      display: "flex",
      flexWrap: compact ? "wrap" : "nowrap",
      justifyContent: "center",
      gap: compact ? 8 : 12,
      padding: compact ? "8px 12px" : "10px 18px",
      background: "#111209",
      border: "1px solid #2a2218",
      borderRadius: 4,
    }}>
      {roster.map((key, i) => {
        const hero = key ? PLAYER_HEROES.find(h => h.key === key) : null;
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 7,
            paddingRight: (!compact && i < 2) ? 12 : 0,
            borderRight:  (!compact && i < 2) ? "1px solid #1e1c14" : "none",
          }}>
            {hero
              ? <Sprite type={hero.key} size={compact ? 18 : 22} />
              : <div style={{ width: compact ? 18 : 22, height: compact ? 18 : 22, borderRadius: 2, background: "#1a1810" }} />
            }
            <div>
              <div style={{
                fontFamily: "Cinzel, serif",
                fontSize: compact ? 8 : 9,
                letterSpacing: 1,
                color: hero ? "#c9b99a" : "#2a2218",
              }}>
                {hero ? hero.name : "Vacío"}
              </div>
              {!compact && (
                <div style={{ fontSize: 8, color: "#3a3028", fontStyle: "italic" }}>
                  {hero ? hero.class : "—"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MapSelector() {
  const startMap    = useGameStore(s => s.startMap);
  const backToLobby = useGameStore(s => s.backToLobby);
  const roster      = useGameStore(s => s.roster);

  const width   = useWindowWidth();
  const cols    = useCols(width);
  const isXs    = width < 480;
  const isSm    = width < 768;
  const maps    = Object.values(MAPS);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0e0f",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      overflowX: "hidden",
      boxSizing: "border-box",
      // Padding lateral pequeño en móvil, generoso en desktop
      padding: isXs
        ? "28px 12px 100px"
        : isSm
        ? "36px 20px 100px"
        : "44px 32px 100px",
    }}>

      {/* Fondo decorativo */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,0.03) 0%, transparent 70%),
          radial-gradient(ellipse 40% 50% at 10% 100%, rgba(50,74,40,0.04) 0%, transparent 60%)
        `,
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.02,
        backgroundImage: "repeating-linear-gradient(0deg, #c9a84c 0px, #c9a84c 1px, transparent 1px, transparent 48px)",
      }} />

      {/* ── Cabecera ── */}
      <div style={{
        textAlign: "center",
        marginBottom: isXs ? 24 : 32,
        position: "relative",
        width: "100%",
      }}>
        {/* Línea decorativa */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "center", gap: 16, marginBottom: 12,
        }}>
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, transparent, #3a3028)" }} />
          <div style={{ fontSize: 9, color: "#3a3028", fontFamily: "Cinzel, serif", letterSpacing: 4 }}>
            HERO HUB
          </div>
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, #3a3028, transparent)" }} />
        </div>

        {/* Título — escala con el viewport */}
        <div style={{
          fontFamily: "Cinzel, serif",
          fontSize: isXs ? 22 : isSm ? 28 : 34,
          letterSpacing: isXs ? 4 : 8,
          color: "#c9a84c",
          lineHeight: 1,
          marginBottom: 10,
          textShadow: "0 0 60px rgba(201,168,76,0.18)",
        }}>
          CAMPO DE BATALLA
        </div>

        <div style={{
          fontFamily: "Crimson Text, serif",
          fontSize: isXs ? 11 : 13,
          color: "#3a3028",
          letterSpacing: 2,
          fontStyle: "italic",
          marginBottom: isXs ? 14 : 20,
        }}>
          Elige el terreno donde luchará tu escuadrón
        </div>

        {/* Resumen del equipo */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <RosterSummary roster={roster} compact={isXs} />
        </div>
      </div>

      {/* ── Grid de mapas ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: isXs ? 10 : 14,
        width: "100%",
        maxWidth: cols === 3 ? 900 : cols === 2 ? 620 : 360,
      }}>
        {maps.map(map => (
          <MapCard key={map.key} map={map} onSelect={startMap} />
        ))}
      </div>

      {/* Instrucción */}
      <div style={{
        marginTop: 20,
        fontFamily: "Cinzel, serif",
        fontSize: isXs ? 8 : 9,
        letterSpacing: isXs ? 1 : 3,
        color: "#2a2820",
        textAlign: "center",
        padding: "0 12px",
      }}>
        HAZ CLIC EN UN MAPA PARA DESPLEGAR TU ESCUADRÓN
      </div>

      {/* ── Botón volver — fixed bottom-left ── */}
      <button
        onClick={backToLobby}
        style={{
          position: "fixed",
          bottom: isXs ? 16 : 28,
          left:   isXs ? 12 : 28,
          fontFamily: "Cinzel, serif",
          fontSize: isXs ? 9 : 10,
          letterSpacing: 2,
          padding: isXs ? "10px 16px" : "12px 22px",
          background: "#0d0e0f",
          border: "1.5px solid #2a2218",
          color: "#5a4a2a",
          borderRadius: 4,
          cursor: "pointer",
          transition: "all 0.2s",
          zIndex: 10,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = "#c9a84c";
          e.currentTarget.style.color = "#c9a84c";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "#2a2218";
          e.currentTarget.style.color = "#5a4a2a";
        }}
      >
        ← Escuadrón
      </button>
      <Credits/>
    </div>
  );
}
