/**
 * useMovementAnimation.js
 *
 * Detecta cambios de posición en las unidades y produce una animación
 * paso a paso por el camino real del pathfinding.
 *
 * Retorna:
 *   animatingUnit  — id de la unidad en movimiento (ocultar su tile real)
 *   animUnitData   — objeto unidad completo para el sprite del overlay
 *   animPos        — { x, y } px relativos al contenedor del grid
 *   animPath       — [{row,col}] camino completo para PathTrail
 *   currentStep    — índice del frame actual (para opacidad del rastro)
 *   isAnimating    — boolean para bloquear clicks
 */

import { useEffect, useRef, useState } from "react";
import { getMovableTilesWithPaths, getPathTo } from "../engine/gameEngine";
import { MAPS } from "../config/maps";

const STEP_MS = 130; // ms por casilla

function tileToPixel(row, col, tileSize, gap, padding = 2) {
  return {
    x: padding + col * (tileSize + gap),
    y: padding + row * (tileSize + gap),
  };
}

export default function useMovementAnimation(units, currentMapKey, tileSize, gap = 2) {
  const [animState, setAnimState] = useState({
    animatingUnit: null,
    animUnitData:  null,
    animPos:       { x: 0, y: 0 },
    animPath:      [],
    currentStep:   0,
    isAnimating:   false,
  });

  // Posiciones anteriores de cada unidad
  const prevPositions = useRef({});
  // Para cancelar si el componente desmonta o cambia el mapa
  const cancelled = useRef(false);
  // Evitar re-entradas mientras anima
  const animating = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    animating.current = false;
    prevPositions.current = {};
    setAnimState(s => ({ ...s, isAnimating: false, animatingUnit: null }));
    return () => { cancelled.current = true; };
  }, [currentMapKey]);

  useEffect(() => {
    if (animating.current || !currentMapKey) return;

    const map = MAPS[currentMapKey];
    if (!map) return;

    for (const unit of units) {
      const prev = prevPositions.current[unit.id];

      if (!prev) {
        // Primera vez — registrar sin animar
        prevPositions.current[unit.id] = { row: unit.row, col: unit.col };
        continue;
      }

      // Limpiar unidades muertas
      if (!unit.alive) {
        prevPositions.current[unit.id] = { row: unit.row, col: unit.col };
        continue;
      }

      const moved = prev.row !== unit.row || prev.col !== unit.col;
      if (!moved) continue;

      // Reconstruir el camino desde la posición anterior hasta la nueva
      const ghostUnit  = { ...unit, row: prev.row, col: prev.col };
      const otherUnits = units.filter(u => u.id !== unit.id);

      let path = [];
      try {
        const { parentMap, startKey } = getMovableTilesWithPaths(
          ghostUnit, otherUnits, map.grid, map.w, map.h
        );
        path = getPathTo(unit.row, unit.col, parentMap, startKey);
      } catch {
        prevPositions.current[unit.id] = { row: unit.row, col: unit.col };
        continue;
      }

      // Sin camino o camino de 1 paso — actualizar sin animar
      if (path.length <= 1) {
        prevPositions.current[unit.id] = { row: unit.row, col: unit.col };
        continue;
      }

      // Registrar la posición destino ya para no re-animar
      prevPositions.current[unit.id] = { row: unit.row, col: unit.col };

      // Frames: posición anterior + cada paso del camino
      const frames = [
        { row: prev.row, col: prev.col },
        ...path,
      ];

      animating.current = true;
      const unitSnapshot = { ...unit }; // capturar estado actual

      setAnimState({
        animatingUnit: unit.id,
        animUnitData:  unitSnapshot,
        animPos:       tileToPixel(prev.row, prev.col, tileSize, gap),
        animPath:      path, // el camino completo para PathTrail
        currentStep:   0,
        isAnimating:   true,
      });

      let frameIdx = 0;

      const step = () => {
        if (cancelled.current) {
          animating.current = false;
          setAnimState(s => ({ ...s, isAnimating: false, animatingUnit: null }));
          return;
        }

        frameIdx++;

        if (frameIdx >= frames.length) {
          // Animación completada
          animating.current = false;
          setAnimState(s => ({
            ...s,
            isAnimating:   false,
            animatingUnit: null,
            animUnitData:  null,
            animPath:      [],
          }));
          return;
        }

        const { row: fr, col: fc } = frames[frameIdx];
        setAnimState(s => ({
          ...s,
          animPos:     tileToPixel(fr, fc, tileSize, gap),
          currentStep: frameIdx,
        }));

        setTimeout(step, STEP_MS);
      };

      setTimeout(step, STEP_MS);
      break; // una unidad a la vez
    }
  }, [units, currentMapKey, tileSize, gap]);

  // Limpiar unidades eliminadas del mapa
  useEffect(() => {
    const ids = new Set(units.map(u => u.id));
    Object.keys(prevPositions.current).forEach(id => {
      if (!ids.has(id)) delete prevPositions.current[id];
    });
  }, [units]);

  return animState;
}
