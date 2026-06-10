/**
 * logColors.js
 * ─────────────────────────────────────────────────────────────────────────────
 * ÚNICA fuente de verdad para los colores del battle log.
 *
 * Para cambiar cualquier color del log, editar solo este archivo.
 *
 * Tipos de token disponibles:
 *   hero      → nombre de héroe jugador
 *   enemy     → nombre de enemigo
 *   damage    → cantidad de daño recibido
 *   heal      → cantidad de HP curado
 *   status    → nombre de efecto de estado (veneno, quemadura, hemorragia)
 *   ability   → nombre de habilidad usada
 *   tile      → daño de tile (lava)
 *   move      → acción de movimiento
 *   turn      → cambio de turno / ronda
 *   deploy    → despliegue de unidades
 *   system    → texto neutro / separadores
 *   dead      → unidad caída
 */

export const LOG_COLORS = {
  hero:    "#97C459",   // verde héroe
  enemy:   "#E24B4A",   // rojo enemigo
  damage:  "#ff6b6b",   // rojo claro daño
  heal:    "#7acc5a",   // verde curación
  status:  "#c9784a",   // naranja efecto estado
  ability: "#c084ff",   // morado habilidad
  tile:    "#ff9944",   // naranja lava / tile
  move:    "#80b8cc",   // azul claro movimiento
  turn:    "#c9a84c",   // dorado turno / ronda
  deploy:  "#4adfc0",   // cyan despliegue
  system:  "#4a3f2f",   // gris neutro
  dead:    "#7a3a3a",   // rojo oscuro muerto
};

// ─── Dot colors (indicador lateral del mensaje completo) ──────────────────────

export const DOT_COLORS = {
  hero:    "#4a8a2a",
  enemy:   "#8a1a1a",
  damage:  "#8a1a1a",
  heal:    "#2a6a10",
  status:  "#8a4020",
  ability: "#7040c0",
  tile:    "#8a5010",
  move:    "#2a5a6a",
  turn:    "#7a6020",
  deploy:  "#1a8a70",
  system:  "#2a2218",
  dead:    "#5a1a1a",
};

// ─── Tipo de token ────────────────────────────────────────────────────────────

/**
 * Crea un token con texto y tipo.
 * t("Guerrero", "hero")  →  { text: "Guerrero", type: "hero" }
 */
export function t(text, type = "system") {
  return { text: String(text), type };
}

/** Token de texto plano neutro (sin color especial) */
export function plain(text) {
  return t(text, "system");
}

// ─── Helpers de mensaje — construyen arrays de tokens ────────────────────────
// Estos helpers son los que usan los slices del store.
// Cambiando los helpers aquí se cambia la semántica de todos los mensajes.

/**
 * "[Hero] ataca a [Enemy]: -[X] HP"
 * + opcional: " ¡Vencido!" o " · [Efecto]"
 */
export function msgAttack({ attackerName, attackerTeam, targetName, targetTeam, damage, died, statusName }) {
  const attType = attackerTeam === "player" ? "hero"  : "enemy";
  const tgtType = targetTeam  === "player" ? "hero"  : "enemy";

  const tokens = [
    t(attackerName, attType),
    plain(" ataca a "),
    t(targetName, tgtType),
    plain(": "),
    t(`-${damage} HP`, "damage"),
  ];

  if (died)       tokens.push(plain(" · "), t("¡Vencido!", "dead"));
  if (statusName) tokens.push(plain(" · "), t(statusName, "status"));

  return tokens;
}

/**
 * "[Hero/Enemy] se mueve" / "avanza"
 */
export function msgMove({ unitName, unitTeam, movesLeft = 0 }) {
  const type = unitTeam === "player" ? "hero" : "enemy";
  const tokens = [t(unitName, type), plain(" se mueve")];
  if (movesLeft > 0) {
    tokens.push(plain(` (${movesLeft} movimiento${movesLeft > 1 ? "s" : ""} restante${movesLeft > 1 ? "s" : ""})`));
  }
  tokens.push(plain("."));
  return tokens;
}

export function msgAdvance({ unitName, unitTeam }) {
  const type = unitTeam === "player" ? "hero" : "enemy";
  return [t(unitName, type), plain(" avanza.")];
}

export function msgCanMove({ unitName, unitTeam, movesLeft }) {
  const type = unitTeam === "player" ? "hero" : "enemy";
  return [
    t(unitName, type),
    plain(` aún puede moverse (${movesLeft} movimiento${movesLeft > 1 ? "s" : ""}).`),
  ];
}

export function msgAlreadyActed({ unitName }) {
  return [t(unitName, "hero"), plain(" ya actuó este turno.")];
}

/**
 * "[Hero] usa [Habilidad]: X objetivos afectados."
 */
export function msgAbility({ unitName, unitTeam, abilityIcon, abilityName, count }) {
  const type = unitTeam === "player" ? "hero" : "enemy";
  return [
    t(unitName, type),
    plain(" usa "),
    t(`${abilityIcon} ${abilityName}`, "ability"),
    plain(`: ${count} objetivo${count > 1 ? "s" : ""} afectado${count > 1 ? "s" : ""}.`),
  ];
}

export function msgAbilityNoTargets({ unitName, unitTeam, abilityName }) {
  const type = unitTeam === "player" ? "hero" : "enemy";
  return [
    t(unitName, type),
    plain(" usa "),
    t(abilityName, "ability"),
    plain(": sin objetivos en rango."),
  ];
}

/**
 * "[Unidad] sufre X de daño por [efecto] ☠"
 */
export function msgStatusTick({ unitName, unitTeam, damage, effectLabel }) {
  const type = unitTeam === "player" ? "hero" : "enemy";
  return [
    t(unitName, type),
    plain(" sufre "),
    t(`${damage}`, "damage"),
    plain(" de daño por "),
    t(effectLabel, "status"),
    plain(" ☠"),
  ];
}

/**
 * "[Unidad] ha sucumbido a sus heridas. ¡Caído!"
 */
export function msgDiedFromStatus({ unitName, unitTeam }) {
  const type = unitTeam === "player" ? "hero" : "enemy";
  return [t(unitName, type), plain(" ha sucumbido a sus heridas. "), t("¡Caído!", "dead")];
}

/**
 * "[Unidad] recibe X de daño por la lava 🔥"
 */
export function msgLavaDamage({ unitName, unitTeam, damage }) {
  const type = unitTeam === "player" ? "hero" : "enemy";
  return [
    t(unitName, type),
    plain(" recibe "),
    t(`${damage}`, "tile"),
    plain(" de daño por la "),
    t("lava", "tile"),
    plain(" 🔥"),
  ];
}

export function msgLavaTransit({ unitName, unitTeam, damage }) {
  const type = unitTeam === "player" ? "hero" : "enemy";
  return [
    t(unitName, type),
    plain(" cruza la "),
    t("lava", "tile"),
    plain(" y recibe "),
    t(`${damage}`, "tile"),
    plain(" de daño 🔥"),
  ];
}

export function msgLavaDeath({ unitName, unitTeam }) {
  const type = unitTeam === "player" ? "hero" : "enemy";
  return [t(unitName, type), plain(" ha sido consumido por la lava. "), t("¡Caído!", "dead")];
}

/**
 * "[Hero] regenera X HP ❤"
 */
export function msgHeal({ unitName, amount }) {
  return [
    t(unitName, "hero"),
    plain(" regenera "),
    t(`${amount} HP`, "heal"),
    plain(" ❤"),
  ];
}

/**
 * Mensajes de turno y sistema
 */
export function msgTurn(roundNumber) {
  return [t(`— Ronda ${roundNumber} —`, "turn"), plain(" Tu turno.")];
}

export function msgEnemyTurn() {
  return [t("El enemigo actúa...", "turn")];
}

export function msgBattleStart() {
  return [t("¡La batalla comienza!", "turn"), plain(" — Tu turno.")];
}

export function msgDeploy({ unitName, nextName }) {
  if (nextName) {
    return [
      t(unitName, "hero"),
      plain(" desplegado. Ahora coloca: "),
      t(nextName, "hero"),
      plain("."),
    ];
  }
  return [t(unitName, "hero"), plain(" desplegado. "), t("¡Todo listo!", "deploy")];
}

export function msgMapStart(mapName) {
  return [t(`⚔ ${mapName}`, "deploy"), plain(" — Coloca a tus héroes.")];
}

/**
 * Determina el tipo dominante del mensaje para el dot lateral.
 * Usa el tipo del primer token no-system.
 */
export function dominantType(tokens) {
  const first = tokens.find(tok => tok.type !== "system");
  return first?.type ?? "system";
}
