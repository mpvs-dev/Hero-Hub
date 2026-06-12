// src/components/MapSelector.jsx

import { useState, useEffect } from "react";
import { MAPS } from "../config/maps";
import { TILE_TYPES } from "../config/tiles";
import useGameStore from "../store/useGameStore";
import Sprite from "./Sprite";
import { PLAYER_HEROES } from "../store/useGameStore";
import Credits from "./Credits";

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

function useCols(width) {
  if (width < 480) return 1;
  if (width < 768) return 2;
  return 3;
}

function MapPreview({ map }) {
  const playerZone = new Set(
    (map.deployZone ?? []).map(([r, c]) => `${r}-${c}`),
  );
  const enemyZone = new Set(
    (map.enemyDeployZone ?? []).map(([r, c]) => `${r}-${c}`),
  );
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: `${map.w} / ${map.h}`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: `repeat(${map.w}, 1fr)`,
          gridTemplateRows: `repeat(${map.h}, 1fr)`,
          gap: 0,
        }}
      >
        {map.grid.flatMap((rowStr, ri) =>
          [...rowStr].map((tk, ci) => {
            const tile = TILE_TYPES[tk] ?? TILE_TYPES.G;
            const key = `${ri}-${ci}`;
            const inPlayer = playerZone.has(key);
            const inEnemy = enemyZone.has(key);
            return (
              <div
                key={key}
                style={{
                  background: inPlayer
                    ? "#2a6a1a"
                    : inEnemy
                      ? "#7a1a1a"
                      : tile.bg,
                  outline: inPlayer
                    ? "1px solid #3aaa2a"
                    : inEnemy
                      ? "1px solid #cc2a2a"
                      : "none",
                  outlineOffset: "-1px",
                }}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}

function MapLegend({ map }) {
  const present = [...new Set(map.grid.flatMap((r) => [...r]))];
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px 10px",
        marginTop: 8,
      }}
    >
      {present.map((tk) => {
        const tile = TILE_TYPES[tk];
        if (!tile) return null;
        return (
          <div
            key={tk}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: 1,
                background: tile.bg,
                flexShrink: 0,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            />
            <span
              style={{
                fontSize: 8,
                color: "#3a3028",
                fontFamily: "Cinzel, serif",
                letterSpacing: 0.5,
              }}
            >
              {tile.name}
            </span>
          </div>
        );
      })}
      {[
        { color: "#2a6a1a", border: "#3aaa2a", label: "Zona aliada" },
        { color: "#7a1a1a", border: "#cc2a2a", label: "Zona enemiga" },
      ].map(({ color, border, label }) => (
        <div
          key={label}
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: 1,
              background: color,
              flexShrink: 0,
              outline: `1px solid ${border}`,
              outlineOffset: "-1px",
            }}
          />
          <span
            style={{
              fontSize: 8,
              color: "#3a3028",
              fontFamily: "Cinzel, serif",
              letterSpacing: 0.5,
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Card de mapa ─────────────────────────────────────────────────────────────
function MapCard({ map, onSelect, isUnlocked, completedLevels }) {
  const [hov, setHov] = useState(false);
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel); // ← AÑADIR
  const goToAbilitySelect = useGameStore((s) => s.goToAbilitySelect); // ← AÑADIR
  const active = hov && isUnlocked;
  const totalLevels = map.levels?.length ?? 5;
  const completedCount = (completedLevels ?? -1) + 1; // 0 = ninguno completado
  const allDone = completedCount >= totalLevels;

  return (
    <div
      onClick={() => {
        if (!isUnlocked) return;
        const completed = completedLevels ?? -1;
        const totalLevels = map.levels?.length ?? 5;
        const next = Math.min(completed + 1, totalLevels - 1);
        setCurrentLevel(next);
        goToAbilitySelect(map.key);
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%",
        padding: "10px 10px 14px",
        background: active ? "#161610" : "#111209",
        border: `1.5px solid ${active ? "#c9a84c" : isUnlocked ? "#2a2218" : "#1a1810"}`,
        borderRadius: 5,
        cursor: isUnlocked ? "pointer" : "default",
        transition: "all 0.18s",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        position: "relative",
        boxShadow: active
          ? "0 0 28px rgba(201,168,76,0.1), 0 8px 24px rgba(0,0,0,0.5)"
          : "0 4px 12px rgba(0,0,0,0.4)",
      }}
    >
      {!isUnlocked && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            borderRadius: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "rgba(13,14,15,0.75)",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 28, lineHeight: 1 }}>🔒</div>
          <div
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: 9,
              letterSpacing: 2,
              color: "#5a4a3a",
            }}
          >
            BLOQUEADO
          </div>
        </div>
      )}

      {/* Número de orden */}
      <div
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: 8,
          letterSpacing: 2,
          color: isUnlocked ? "#5a4a2a" : "#2a2218",
          marginBottom: 6,
        }}
      >
        {String(map.order).padStart(2, "0")}
        {allDone && isUnlocked && (
          <span
            style={{
              marginLeft: 8,
              fontSize: 7,
              letterSpacing: 2,
              padding: "1px 6px",
              borderRadius: 3,
              color: "#97C459",
              background: "#0a180a",
              border: "1px solid #3B6D11",
            }}
          >
            ✓ COMPLETO
          </span>
        )}
      </div>

      {/* Preview */}
      <div
        style={{
          borderRadius: 3,
          overflow: "hidden",
          border: `1px solid ${active ? "#3a3220" : "#1a1810"}`,
          marginBottom: 10,
          width: "100%",
          transition: "border-color 0.18s",
          // ✅ FIX 3: atenuar visualmente el preview si está bloqueado
          opacity: isUnlocked ? 1 : 0.35,
          filter: isUnlocked ? "none" : "grayscale(0.6)",
        }}
      >
        <MapPreview map={map} />
      </div>

      {/* Nombre */}
      <div
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: 11,
          letterSpacing: 2,
          color: isUnlocked ? (active ? "#e0c060" : "#c9a84c") : "#3a3028",
          marginBottom: 4,
          transition: "color 0.18s",
        }}
      >
        {map.name}
      </div>

      {/* Descripción */}
      <div
        style={{
          fontSize: 10,
          color: isUnlocked ? "#4a3f2f" : "#2a2218",
          lineHeight: 1.55,
          marginBottom: 10,
          flexGrow: 1,
        }}
      >
        {map.description}
      </div>

      {/* Progreso de niveles — solo si desbloqueado */}
      {isUnlocked && map.levels && (
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: 8,
                letterSpacing: 1,
                color: "#3a3028",
              }}
            >
              NIVELES
            </span>
            <span
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: 8,
                letterSpacing: 1,
                color: completedCount > 0 ? "#c9a84c" : "#2a2218",
              }}
            >
              {completedCount}/{totalLevels}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {map.levels.map((lv, i) => {
              const done = i < completedCount;
              const isNext = i === completedCount; // primer nivel sin completar
              const locked = i > completedCount; // aún no alcanzado
              const isBoss = lv.isBoss;

              return (
                <div
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (locked) return;
                    setCurrentLevel(i);
                    goToAbilitySelect(map.key);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 8px",
                    borderRadius: 3,
                    border: `1px solid ${
                      done
                        ? isBoss
                          ? "#4a1010"
                          : "#2a3a18"
                        : isNext
                          ? isBoss
                            ? "#7a1818"
                            : "#3B6D11"
                          : "#1a1810"
                    }`,
                    background: done
                      ? isBoss
                        ? "#180808"
                        : "#0c1408"
                      : isNext
                        ? isBoss
                          ? "#1a0808"
                          : "#0a1808"
                        : "#0d0e0a",
                    cursor: locked ? "default" : "pointer",
                    opacity: locked ? 0.35 : 1,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (locked) return;
                    e.currentTarget.style.borderColor = isBoss
                      ? "#E24B4A"
                      : "#c9a84c";
                    e.currentTarget.style.background = isBoss
                      ? "#220a0a"
                      : "#111a08";
                  }}
                  onMouseLeave={(e) => {
                    if (locked) return;
                    e.currentTarget.style.borderColor = done
                      ? isBoss
                        ? "#4a1010"
                        : "#2a3a18"
                      : isNext
                        ? isBoss
                          ? "#7a1818"
                          : "#3B6D11"
                        : "#1a1810";
                    e.currentTarget.style.background = done
                      ? isBoss
                        ? "#180808"
                        : "#0c1408"
                      : isNext
                        ? isBoss
                          ? "#1a0808"
                          : "#0a1808"
                        : "#0d0e0a";
                  }}
                >
                  {/* Indicador de estado */}
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      background: done
                        ? isBoss
                          ? "#7a1818"
                          : "#3B6D11"
                        : isNext
                          ? isBoss
                            ? "#4a1010"
                            : "#1a3a10"
                          : "#1a1810",
                      border: `1px solid ${
                        done
                          ? isBoss
                            ? "#E24B4A"
                            : "#97C459"
                          : isNext
                            ? isBoss
                              ? "#E24B4A"
                              : "#5a9a2a"
                            : "#2a2218"
                      }`,
                      color: done
                        ? isBoss
                          ? "#E24B4A"
                          : "#97C459"
                        : isNext
                          ? isBoss
                            ? "#E24B4A"
                            : "#5a9a2a"
                          : "#2a2218",
                    }}
                  >
                    {done ? "✓" : isNext ? (isBoss ? "☠" : "▶") : String(i + 1)}
                  </div>

                  {/* Nombre del nivel */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: 9,
                        letterSpacing: 1,
                        color: done
                          ? isBoss
                            ? "#7a3030"
                            : "#4a6a2a"
                          : isNext
                            ? isBoss
                              ? "#E24B4A"
                              : "#97C459"
                            : "#2a2218",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {isBoss ? "⚠ " : ""}
                      {lv.name}
                    </div>
                  </div>

                  {/* Número de nivel */}
                  <div
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: 8,
                      letterSpacing: 1,
                      color: locked ? "#1a1810" : "#3a3028",
                      flexShrink: 0,
                    }}
                  >
                    {locked ? "🔒" : `NV ${i + 1}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <MapLegend map={map} />

      {/* CTA */}
      <div
        style={{
          marginTop: 10,
          fontSize: 9,
          fontFamily: "Cinzel, serif",
          letterSpacing: 2,
          color: isUnlocked ? (active ? "#c9a84c" : "#1e1e18") : "transparent",
          textAlign: "center",
          transition: "color 0.18s",
        }}
      >
        {isUnlocked &&
          (active ? (allDone ? "VOLVER A JUGAR →" : "CONTINUAR →") : "···")}
      </div>
    </div>
  );
}

function RosterSummary({ roster, compact }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: compact ? "wrap" : "nowrap",
        justifyContent: "center",
        gap: compact ? 8 : 12,
        padding: compact ? "8px 12px" : "10px 18px",
        background: "#111209",
        border: "1px solid #2a2218",
        borderRadius: 4,
      }}
    >
      {roster.map((key, i) => {
        const hero = key ? PLAYER_HEROES.find((h) => h.key === key) : null;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              paddingRight: !compact && i < 2 ? 12 : 0,
              borderRight: !compact && i < 2 ? "1px solid #1e1c14" : "none",
            }}
          >
            {hero ? (
              <Sprite type={hero.key} size={compact ? 18 : 22} />
            ) : (
              <div
                style={{
                  width: compact ? 18 : 22,
                  height: compact ? 18 : 22,
                  borderRadius: 2,
                  background: "#1a1810",
                }}
              />
            )}
            <div>
              <div
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: compact ? 8 : 9,
                  letterSpacing: 1,
                  color: hero ? "#c9b99a" : "#2a2218",
                }}
              >
                {hero ? hero.name : "Vacío"}
              </div>
              {!compact && (
                <div
                  style={{ fontSize: 8, color: "#3a3028", fontStyle: "italic" }}
                >
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
  const goToAbilitySelect = useGameStore((s) => s.goToAbilitySelect);
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel);
  const backToModeSelect = useGameStore((s) => s.backToModeSelect);
  const roster = useGameStore((s) => s.roster);
  // ✅ FIX 2: fallback a [] por si progressSlice aún no está conectado
  const unlockedMaps = useGameStore((s) => s.unlockedMaps) ?? [];
  const mapLevels = useGameStore((s) => s.mapLevels) ?? {};

  const width = useWindowWidth();
  const cols = useCols(width);
  const isXs = width < 480;
  const isSm = width < 768;
  const maps = Object.values(MAPS).sort((a, b) => a.order - b.order);

  const handleSelectMap = (mapKey) => {
    const completed = mapLevels[mapKey] ?? -1;
    const totalLevels = MAPS[mapKey]?.levels?.length ?? 5;
    const next = Math.min(completed + 1, totalLevels - 1);
    setCurrentLevel(next);
    goToAbilitySelect(mapKey);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0e0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflowX: "hidden",
        boxSizing: "border-box",
        padding: isXs
          ? "28px 12px 100px"
          : isSm
            ? "36px 20px 100px"
            : "44px 32px 100px",
      }}
    >
      {/* Fondo decorativo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `
          radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,0.03) 0%, transparent 70%),
          radial-gradient(ellipse 40% 50% at 10% 100%, rgba(50,74,40,0.04) 0%, transparent 60%)
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
        style={{
          textAlign: "center",
          marginBottom: isXs ? 24 : 32,
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            marginBottom: 12,
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
            fontSize: isXs ? 22 : isSm ? 28 : 34,
            letterSpacing: isXs ? 4 : 8,
            color: "#c9a84c",
            lineHeight: 1,
            marginBottom: 10,
            textShadow: "0 0 60px rgba(201,168,76,0.18)",
          }}
        >
          CAMPO DE BATALLA
        </div>
        <div
          style={{
            fontFamily: "Crimson Text, serif",
            fontSize: isXs ? 11 : 13,
            color: "#3a3028",
            letterSpacing: 2,
            fontStyle: "italic",
            marginBottom: isXs ? 14 : 20,
          }}
        >
          Elige el terreno donde luchará tu escuadrón
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <RosterSummary roster={roster} compact={isXs} />
        </div>
      </div>

      {/* Grid de mapas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: isXs ? 10 : 14,
          width: "100%",
          maxWidth: cols === 3 ? 900 : cols === 2 ? 620 : 360,
        }}
      >
        {maps.map((map) => {
          const isUnlocked = unlockedMaps.includes(map.key);
          return (
            <MapCard
              key={map.key}
              map={map}
              isUnlocked={isUnlocked}
              completedLevels={mapLevels[map.key] ?? -1}
              onSelect={handleSelectMap}
            />
          );
        })}
      </div>

      <div
        style={{
          marginTop: 20,
          fontFamily: "Cinzel, serif",
          fontSize: isXs ? 8 : 9,
          letterSpacing: isXs ? 1 : 3,
          color: "#2a2820",
          textAlign: "center",
          padding: "0 12px",
        }}
      >
        HAZ CLIC EN UN MAPA PARA ELEGIR TUS HABILIDADES
      </div>

      {/* Botón volver */}
      <button
        onClick={backToModeSelect}
        style={{
          position: "fixed",
          bottom: isXs ? 16 : 28,
          left: isXs ? 12 : 28,
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
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#c9a84c";
          e.currentTarget.style.color = "#c9a84c";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#2a2218";
          e.currentTarget.style.color = "#5a4a2a";
        }}
      >
        ← Modos
      </button>
      <Credits />
    </div>
  );
}
