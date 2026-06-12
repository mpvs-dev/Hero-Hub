// src/components/GameOver.jsx — versión completa

import { useEffect, useState } from "react";
import useGameStore from "../store/useGameStore";
import { MAPS } from "../config/maps";

const CONFIG = {
  win: {
    bg: "#0a180a",
    border: "#3B6D11",
    color: "#97C459",
    label: "⚔ VICTORIA",
  },
  lose: {
    bg: "#180a0a",
    border: "#7a1818",
    color: "#E24B4A",
    label: "☠ DERROTA",
  },
};

export default function GameOver() {
  const {
    gameOver,
    currentMapKey,
    currentLevel,
    resetMap,
    exitToMenu,
    advanceLevel,
    setCurrentLevel,
    startMap,
  } = useGameStore();

  const [result, setResult] = useState(null); // { isLastLevel, unlockedNewMap, isVeryLastLevel }

  useEffect(() => {
    if (gameOver !== "win") {
      setResult(null);
      return;
    }
    const r = advanceLevel();
    setResult(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  if (!gameOver) return null;

  const cfg = CONFIG[gameOver];

  const map = MAPS[currentMapKey];
  const totalLevels = map?.levels?.length ?? 5;
  const levelDef = map?.levels?.[currentLevel];
  const isLastLevel = result?.isLastLevel ?? false;

  const handleNextLevel = () => {
    const next = (currentLevel + 1) % totalLevels;
    setCurrentLevel(next);
    startMap(currentMapKey);
  };

  return (
    <div
      style={{
        textAlign: "center",
        padding: "14px 16px",
        borderRadius: 5,
        marginBottom: 10,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {/* Nivel actual */}
      {levelDef && (
        <div
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 8,
            letterSpacing: 3,
            color: levelDef.isBoss ? "#E24B4A" : "#5a4a2a",
            marginBottom: 6,
          }}
        >
          {levelDef.isBoss ? "⚠ JEFE — " : ""}
          {levelDef.name.toUpperCase()}
          {" · "}NIVEL {currentLevel + 1}/{totalLevels}
        </div>
      )}

      <div
        style={{
          fontFamily: "Cinzel, serif",
          fontSize: 18,
          letterSpacing: 4,
          color: cfg.color,
          marginBottom: 10,
        }}
      >
        {cfg.label}
      </div>

      {/* Notificaciones de victoria */}
      {gameOver === "win" && result?.unlockedNewMap && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 12px",
            background: "#0c1a1a",
            border: "1px solid #1a4a4a",
            borderRadius: 4,
          }}
        >
          <span
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: 9,
              letterSpacing: 2,
              color: "#4adfc0",
            }}
          >
            🗺 NUEVO MAPA DESBLOQUEADO:{" "}
            {result.unlockedNewMap.name.toUpperCase()}
          </span>
        </div>
      )}

      {gameOver === "win" &&
        result?.isVeryLastLevel &&
        !result?.unlockedNewMap && (
          <div
            style={{
              marginBottom: 12,
              padding: "8px 12px",
              background: "#0a180a",
              border: "1px solid #3B6D11",
              borderRadius: 4,
            }}
          >
            <span
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: 9,
                letterSpacing: 2,
                color: "#97C459",
              }}
            >
              ¡HAS COMPLETADO TODOS LOS MAPAS!
            </span>
          </div>
        )}

      {/* Progreso de niveles */}
      {map?.levels && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 5,
            marginBottom: 12,
          }}
        >
          {map.levels.map((lv, i) => (
            <div
              key={i}
              style={{
                width: i <= currentLevel ? 14 : 10,
                height: i <= currentLevel ? 14 : 10,
                borderRadius: "50%",
                background:
                  i < currentLevel
                    ? "#3B6D11"
                    : i === currentLevel
                      ? cfg.color
                      : "#1a1810",
                border: `1px solid ${i <= currentLevel ? cfg.color : "#2a2218"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
                transition: "all 0.3s",
              }}
            >
              {lv.isBoss && i <= currentLevel && (
                <span style={{ fontSize: 7 }}>★</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botones */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        {gameOver === "win" && !isLastLevel && (
          <GameOverButton onClick={handleNextLevel} highlight>
            Nivel {currentLevel + 2} →
          </GameOverButton>
        )}
        <GameOverButton onClick={resetMap}>Repetir nivel</GameOverButton>
        <GameOverButton onClick={exitToMenu}>Cambiar mapa</GameOverButton>
      </div>
    </div>
  );
}

function GameOverButton({ onClick, children, style = {}, highlight = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "Cinzel, serif",
        fontSize: 10,
        letterSpacing: 1,
        padding: "6px 16px",
        background: highlight ? "#0c1a0a" : "#13140f",
        border: `1px solid ${highlight ? "#3B6D11" : "#2a2218"}`,
        color: highlight ? "#97C459" : "#c9a84c",
        borderRadius: 3,
        cursor: "pointer",
        margin: 2,
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = highlight ? "#97C459" : "#c9a84c";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = highlight ? "#3B6D11" : "#2a2218";
      }}
    >
      {children}
    </button>
  );
}
