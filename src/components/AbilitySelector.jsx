import { useState } from "react";
import Sprite from "./Sprite";
import useGameStore from "../store/useGameStore";
import { ABILITIES, HERO_ABILITY_POOL } from "../config/abilities";
import { HEROES } from "../config/heroes";
import { MAPS } from "../config/maps";
import Credits from "./Credits";

// ─── Badge de tipo ─────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const cfg =
    type === "passive"
      ? { label: "PASIVA", color: "#7acc5a", bg: "#0e1a08", border: "#2a4a10" }
      : { label: "ACTIVA", color: "#c084ff", bg: "#140820", border: "#3a1060" };
  return (
    <span
      style={{
        fontSize: 8,
        fontFamily: "Cinzel, serif",
        letterSpacing: 2,
        padding: "2px 6px",
        borderRadius: 2,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Detalle de efecto ────────────────────────────────────────────────────────
function EffectDetail({ ability }) {
  if (ability.type === "passive") {
    const e = ability.effect;
    if (e.type === "heal") {
      return <span style={{ color: "#7acc5a" }}>+{e.amount} HP por turno</span>;
    }
    if (e.type === "status") {
      const icons = { poison: "☠", burn: "🔥", bleed: "🩸" };
      return (
        <span style={{ color: ability.color }}>
          {icons[e.statusType]} {Math.round(e.chance * 100)}% · {e.damage}{" "}
          dmg/turno · {e.duration} rondas
        </span>
      );
    }
  }
  if (ability.type === "active") {
    const modeLabel =
      {
        single_enemy: "1 objetivo",
        aoe: `área radio ${ability.aoeRadius}`,
        all_enemies: "todos en rango",
        self: "sobre ti mismo",
      }[ability.targetMode] ?? "";
    return (
      <span style={{ color: ability.color }}>
        {ability.effect.damage ? `${ability.effect.damage} daño` : ""}
        {ability.effect.heal ? `+${ability.effect.heal} HP` : ""}
        {" · "}
        {modeLabel}
        {" · rango "}
        {ability.range}
        {" · "}⏳ {ability.cooldown} rondas de recarga
      </span>
    );
  }
  return null;
}

// ─── Card de habilidad ────────────────────────────────────────────────────────
function AbilityCard({ ability, isSelected, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "14px 16px",
        borderRadius: 4,
        border: isSelected
          ? `1.5px solid ${ability.color}`
          : hov
            ? "1px solid #3a3220"
            : "1px solid #1e1c14",
        background: isSelected ? "#131008" : hov ? "#161410" : "#0f0e0a",
        cursor: "pointer",
        transition: "all 0.15s",
        position: "relative",
        boxShadow: isSelected ? `0 0 16px ${ability.color}22` : "none",
      }}
    >
      {isSelected && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            fontSize: 9,
            fontFamily: "Cinzel, serif",
            letterSpacing: 1,
            color: ability.color,
          }}
        >
          ✓ ELEGIDA
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 3,
            flexShrink: 0,
            background: "#13120c",
            border: `1px solid ${ability.color}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          {ability.icon}
        </div>
        <div>
          <div
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: 12,
              letterSpacing: 1,
              color: "#c9b99a",
              marginBottom: 4,
            }}
          >
            {ability.name}
          </div>
          <TypeBadge type={ability.type} />
        </div>
      </div>

      {/* Descripción */}
      <div
        style={{
          fontSize: 10,
          color: "#4a3f2f",
          lineHeight: 1.55,
          marginBottom: 8,
        }}
      >
        {ability.description}
      </div>

      {/* Detalle numérico */}
      <div style={{ fontSize: 10, lineHeight: 1.4 }}>
        <EffectDetail ability={ability} />
      </div>
    </div>
  );
}

// ─── Sección por héroe ────────────────────────────────────────────────────────
function HeroAbilityPicker({ heroKey, slotIndex, chosenAbilityKey, onPick }) {
  const hero = HEROES[heroKey];
  const pool = HERO_ABILITY_POOL[heroKey] ?? [];

  return (
    <div
      style={{
        background: "#111209",
        border: "1px solid #2a2218",
        borderRadius: 5,
        overflow: "hidden",
      }}
    >
      {/* Header héroe */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          background: "#0d0e0a",
          borderBottom: "1px solid #1a1810",
        }}
      >
        <Sprite type={heroKey} size={36} />
        <div>
          <div
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: 12,
              letterSpacing: 2,
              color: "#c9a84c",
            }}
          >
            {hero?.name ?? heroKey}
          </div>
          <div style={{ fontSize: 9, color: "#3a3028", fontStyle: "italic" }}>
            {chosenAbilityKey
              ? `Habilidad: ${ABILITIES[chosenAbilityKey]?.name}`
              : "Sin habilidad elegida"}
          </div>
        </div>
        {!chosenAbilityKey && (
          <div
            style={{
              marginLeft: "auto",
              fontSize: 9,
              fontFamily: "Cinzel, serif",
              letterSpacing: 1,
              color: "#4a3020",
            }}
          >
            ← ELIGE UNA
          </div>
        )}
      </div>

      {/* Cards de habilidades */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          padding: "12px 14px",
        }}
      >
        {pool.map((abilityKey) => (
          <AbilityCard
            key={abilityKey}
            ability={ABILITIES[abilityKey]}
            isSelected={chosenAbilityKey === abilityKey}
            onClick={() => onPick(slotIndex, abilityKey)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function AbilitySelector() {
  const {
    roster,
    chosenAbilities,
    setHeroAbility,
    confirmAbilities,
    backToMapSelect,
    pendingMapKey,
  } = useGameStore();

  const allChosen = roster.every((_, i) => chosenAbilities[i] !== null);
  const mapName = pendingMapKey
    ? (MAPS[pendingMapKey]?.name ?? pendingMapKey)
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0e0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "36px 24px 100px",
      }}
    >
      {/* Fondo decorativo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `
          radial-gradient(ellipse 60% 40% at 50% 0%, rgba(192,132,255,0.04) 0%, transparent 70%),
          radial-gradient(ellipse 40% 50% at 80% 100%, rgba(100,50,180,0.04) 0%, transparent 60%)
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
        style={{ textAlign: "center", marginBottom: 36, position: "relative" }}
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
            fontSize: 30,
            letterSpacing: 6,
            color: "#c9a84c",
            lineHeight: 1,
            marginBottom: 10,
            textShadow: "0 0 60px rgba(201,168,76,0.2)",
          }}
        >
          HABILIDADES
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
          Elige una habilidad para cada héroe antes de la batalla
        </div>
        {/* Mapa seleccionado */}
        {mapName && (
          <div
            style={{
              marginTop: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              background: "#0f1008",
              border: "1px solid #2a2218",
              borderRadius: 3,
              fontSize: 9,
              fontFamily: "Cinzel, serif",
              letterSpacing: 2,
              color: "#c9a84c",
            }}
          >
            ⚔ {mapName}
          </div>
        )}
      </div>

      {/* Una sección por héroe */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: "100%",
          maxWidth: 780,
        }}
      >
        {roster.map(
          (heroKey, i) =>
            heroKey && (
              <HeroAbilityPicker
                key={i}
                heroKey={heroKey}
                slotIndex={i}
                chosenAbilityKey={chosenAbilities[i]}
                onPick={setHeroAbility}
              />
            ),
        )}
      </div>

      {/* Botón flotante inferior derecha */}
      <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 10 }}>
        <button
          onClick={confirmAbilities}
          disabled={!allChosen}
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: 11,
            letterSpacing: 3,
            padding: "14px 28px",
            background: allChosen ? "#0c1a0a" : "#0d0e0f",
            border: `1.5px solid ${allChosen ? "#3B6D11" : "#1a1a18"}`,
            color: allChosen ? "#97C459" : "#252522",
            borderRadius: 4,
            cursor: allChosen ? "pointer" : "default",
            transition: "all 0.2s",
            boxShadow: allChosen ? "0 8px 32px rgba(60,109,17,0.25)" : "none",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            if (!allChosen) return;
            e.currentTarget.style.background = "#142a14";
            e.currentTarget.style.borderColor = "#5aaa22";
            e.currentTarget.style.color = "#b8e870";
          }}
          onMouseLeave={(e) => {
            if (!allChosen) return;
            e.currentTarget.style.background = "#0c1a0a";
            e.currentTarget.style.borderColor = "#3B6D11";
            e.currentTarget.style.color = "#97C459";
          }}
        >
          {allChosen
            ? "¡A BATALLA! →"
            : `FALTAN ${roster.filter((_, i) => !chosenAbilities[i]).length} HABILIDAD(ES)`}
        </button>
      </div>

      {/* Botón volver — ahora va a mapSelect */}
      <button
        onClick={backToMapSelect}
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
        ← Cambiar mapa
      </button>
      <Credits />
    </div>
  );
}
