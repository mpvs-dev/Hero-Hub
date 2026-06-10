/**
 * EnemyReveal.jsx
 * Overlay que aparece al inicio de la partida durante ~2.5s.
 * Muestra las posiciones enemigas con un pulso rojo y un contador regresivo.
 * Cuando termina llama a onDone() para que App.jsx cambie la fase a "select".
 */

import { useEffect, useState } from "react";

const REVEAL_MS   = 2500;
const TICK_MS     = 100;

export default function EnemyReveal({ enemies, onDone }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => {
        if (prev + TICK_MS >= REVEAL_MS) {
          clearInterval(interval);
          onDone();
          return REVEAL_MS;
        }
        return prev + TICK_MS;
      });
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [onDone]);

  const progress = elapsed / REVEAL_MS; // 0 → 1
  const remaining = Math.ceil((REVEAL_MS - elapsed) / 1000);

  return (
    <>
      <style>{`
        @keyframes enemyPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(226,75,74,0); border-color: #E24B4A; }
          50%       { box-shadow: 0 0 0 6px rgba(226,75,74,0.35); border-color: #ff7070; }
        }
        @keyframes revealFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Overlay semitransparente */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        pointerEvents: "none",
        background: "rgba(10,5,5,0.55)",
        animation: "revealFadeIn 0.3s ease-out",
      }}>

        {/* Banner superior */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          padding: "10px 0 8px",
          textAlign: "center",
          background: "rgba(26,8,8,0.92)",
          borderBottom: "1px solid #5a1a1a",
          animation: "revealFadeIn 0.3s ease-out",
        }}>
          <div style={{
            fontFamily: "Cinzel, serif",
            fontSize: 11,
            letterSpacing: 4,
            color: "#E24B4A",
            marginBottom: 6,
          }}>
            ⚔ POSICIONES ENEMIGAS
          </div>

          {/* Barra de progreso */}
          <div style={{
            width: 160,
            height: 3,
            background: "#2a1010",
            borderRadius: 2,
            margin: "0 auto",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${(1 - progress) * 100}%`,
              background: "#E24B4A",
              borderRadius: 2,
              transition: `width ${TICK_MS}ms linear`,
            }} />
          </div>

          <div style={{
            fontFamily: "Cinzel, serif",
            fontSize: 9,
            color: "#5a2020",
            marginTop: 5,
            letterSpacing: 2,
          }}>
            LA BATALLA COMIENZA EN {remaining}…
          </div>
        </div>

        {/* Marcadores de posición enemiga */}
        {enemies.map(e => (
          <EnemyMarker key={e.id} enemy={e} />
        ))}
      </div>
    </>
  );
}

// ─── Marcador individual ──────────────────────────────────────────────────────
// Posiciona el marcador encima de la casilla del enemigo usando
// variables CSS que Grid ya expone, o calculando manualmente.
// Como no tenemos acceso directo a los píxeles del grid, usamos
// un portal de coordenadas basadas en data-attributes del DOM.

function EnemyMarker({ enemy }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    // Buscar el tile correspondiente en el DOM por data-coords
    const el = document.querySelector(
      `[data-tile="${enemy.row}-${enemy.col}"]`
    );
    if (el) {
      const r = el.getBoundingClientRect();
      setRect(r);
    }
  }, [enemy.row, enemy.col]);

  if (!rect) return null;

  return (
    <div style={{
      position: "fixed",
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      pointerEvents: "none",
      zIndex: 51,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    }}>
      {/* Borde pulsante */}
      <div style={{
        position: "absolute",
        inset: 0,
        border: "2px solid #E24B4A",
        borderRadius: 2,
        animation: "enemyPulse 0.8s ease-in-out infinite",
      }} />

      {/* Nombre */}
      <div style={{
        position: "absolute",
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginBottom: 3,
        fontFamily: "Cinzel, serif",
        fontSize: 8,
        letterSpacing: 1,
        color: "#E24B4A",
        background: "rgba(26,8,8,0.9)",
        padding: "2px 5px",
        borderRadius: 2,
        whiteSpace: "nowrap",
        border: "1px solid #4a1010",
      }}>
        {enemy.name}
      </div>
    </div>
  );
}
