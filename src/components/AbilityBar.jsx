/**
 * AbilityBar — barra de habilidades activas debajo del mapa.
 *
 * Flujo para habilidades activas:
 *  1. Héroe seleccionado con habilidad activa → se muestra el botón
 *  2. Jugador hace clic en el botón → entra en "abilityMode"
 *  3. Hace clic en un enemigo en el mapa → se ejecuta useAbility
 *  4. Sale de abilityMode
 */
import { useState } from "react";
import { ABILITIES } from "../config/abilities";
import useGameStore  from "../store/useGameStore";

export default function AbilityBar({ isMobile = false }) {
  const {
    units,
    selectedUnitId,
    phase,
    turn,
    gameOver,
    useAbility,
    attackableUnitIds,
  } = useGameStore();

  const [abilityMode, setAbilityMode] = useState(false);

  const selUnit = units.find(u => u.id === selectedUnitId);

  // Solo mostrar si hay héroe seleccionado con habilidad activa
  if (!selUnit || turn !== "player" || gameOver) return null;

  const ab = selUnit.abilityKey ? ABILITIES[selUnit.abilityKey] : null;
  if (!ab || ab.type !== "active") return null;

  const onCooldown  = (selUnit.abilityCooldown ?? 0) > 0;
  const alreadyUsed = selUnit.abilityUsed;
  const disabled    = onCooldown || alreadyUsed || phase === "attack";

  // En modo habilidad, el clic en enemigo en el mapa llama a useAbility
  // Exponemos el modo al store para que Grid pueda leerlo
  // (lo gestionamos con un setState local y un efecto de sincronización)
  // Más simple: el AbilityBar gestiona el targeteo directamente desde el sidebar

  const handleActivate = () => {
    if (disabled) return;
    setAbilityMode(m => !m);
  };

  const handleCancel = () => setAbilityMode(false);

  // Escuchar clics en enemigos cuando está en modo habilidad
  // Lo hacemos sobreescribiendo attackableUnitIds en el sidebar cuando procede
  // Para simplificar: mostramos los enemigos en rango de la habilidad
  const enemiesInRange = units.filter(u =>
    u.team === "enemy" && u.alive && selUnit &&
    Math.abs(u.row - selUnit.row) + Math.abs(u.col - selUnit.col) <= ab.range
  );

  const handleTargetEnemy = (enemyId) => {
    useAbility(selectedUnitId, enemyId);
    setAbilityMode(false);
  };

  return (
    <div style={{
      marginTop: 8,
      padding: isMobile ? "8px 10px" : "10px 14px",
      background: "#0f1008",
      border: `1px solid ${abilityMode ? ab.color + "88" : "#1e1c14"}`,
      borderRadius: 4,
      transition: "border-color 0.2s",
      boxShadow: abilityMode ? `0 0 20px ${ab.color}18` : "none",
    }}>
      {/* Cabecera */}
      <div style={{
        fontSize: 8, fontFamily: "Cinzel, serif",
        letterSpacing: 2, color: "#3a3028", marginBottom: 8,
      }}>
        HABILIDAD ACTIVA
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Ícono */}
        <div style={{
          width: 38, height: 38, borderRadius: 3, flexShrink: 0,
          background: "#13120c",
          border: `1.5px solid ${abilityMode ? ab.color : ab.color + "44"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, transition: "border-color 0.2s",
          boxShadow: abilityMode ? `0 0 12px ${ab.color}44` : "none",
        }}>
          {ab.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "Cinzel, serif", fontSize: 10,
            letterSpacing: 1, color: "#c9b99a", marginBottom: 2,
          }}>
            {ab.name}
          </div>
          <div style={{ fontSize: 9, color: "#4a3f2f", lineHeight: 1.4 }}>
            {onCooldown
              ? `En recarga: ${selUnit.abilityCooldown} ronda${selUnit.abilityCooldown > 1 ? "s" : ""}`
              : alreadyUsed
              ? "Ya usada este turno"
              : ab.description}
          </div>
        </div>

        {/* Cooldown badge o botón */}
        {onCooldown || alreadyUsed ? (
          <div style={{
            fontSize: 9, fontFamily: "Cinzel, serif", letterSpacing: 1,
            padding: "4px 10px", borderRadius: 3,
            background: "#0d0e0f", border: "1px solid #1a1a18",
            color: "#2a2a22", flexShrink: 0,
          }}>
            {onCooldown ? `⏳ ${selUnit.abilityCooldown}` : "✓ USADA"}
          </div>
        ) : (
          <button
            onClick={handleActivate}
            style={{
              fontFamily: "Cinzel, serif", fontSize: 9, letterSpacing: 1,
              padding: "6px 12px", flexShrink: 0,
              background: abilityMode ? ab.color + "22" : "#0d0e0f",
              border: `1.5px solid ${abilityMode ? ab.color : ab.color + "55"}`,
              color: abilityMode ? ab.color : ab.color + "aa",
              borderRadius: 3, cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = ab.color + "22";
              e.currentTarget.style.borderColor = ab.color;
              e.currentTarget.style.color = ab.color;
            }}
            onMouseLeave={e => {
              if (abilityMode) return;
              e.currentTarget.style.background = "#0d0e0f";
              e.currentTarget.style.borderColor = ab.color + "55";
              e.currentTarget.style.color = ab.color + "aa";
            }}
          >
            {abilityMode ? "CANCELAR ✕" : "ACTIVAR →"}
          </button>
        )}
      </div>

      {/* Panel de selección de objetivo */}
      {abilityMode && (
        <div style={{ marginTop: 10 }}>
          <div style={{
            fontSize: 9, color: ab.color, fontStyle: "italic",
            marginBottom: 6, fontFamily: "Cinzel, serif", letterSpacing: 1,
          }}>
            {ab.targetMode === "all_enemies"
              ? `Afectará a ${enemiesInRange.length} enemigo${enemiesInRange.length !== 1 ? "s" : ""} en rango — clic en LANZAR`
              : "Selecciona un objetivo en la lista"}
          </div>

          {ab.targetMode === "all_enemies" ? (
            /* Sin selección de objetivo — afecta a todos */
            <button
              onClick={() => { useAbility(selectedUnitId, null); setAbilityMode(false); }}
              style={{
                width: "100%",
                fontFamily: "Cinzel, serif", fontSize: 10, letterSpacing: 2,
                padding: "8px",
                background: ab.color + "18",
                border: `1.5px solid ${ab.color}`,
                color: ab.color,
                borderRadius: 3, cursor: "pointer",
              }}
            >
              {ab.icon} LANZAR {ab.name.toUpperCase()}
            </button>
          ) : (
            /* Lista de enemigos en rango */
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {enemiesInRange.length === 0 ? (
                <div style={{ fontSize: 9, color: "#3a3028", fontStyle: "italic" }}>
                  No hay enemigos en rango ({ab.range} casillas)
                </div>
              ) : enemiesInRange.map(e => (
                <button
                  key={e.id}
                  onClick={() => handleTargetEnemy(e.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 10px",
                    background: "#13120c",
                    border: `1px solid ${ab.color}44`,
                    borderRadius: 3, cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={ev => {
                    ev.currentTarget.style.background = ab.color + "18";
                    ev.currentTarget.style.borderColor = ab.color;
                  }}
                  onMouseLeave={ev => {
                    ev.currentTarget.style.background = "#13120c";
                    ev.currentTarget.style.borderColor = ab.color + "44";
                  }}
                >
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#E24B4A", flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 10, color: "#c9b99a", fontFamily: "Cinzel, serif", flex: 1, textAlign: "left" }}>
                    {e.name}
                  </span>
                  <span style={{ fontSize: 9, color: "#5a4a2a" }}>
                    {e.hp}/{e.maxHp} HP
                  </span>
                  <span style={{ fontSize: 9, color: ab.color }}>
                    → OBJETIVO
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
