// ── Progreso ──────────────────────────────────────────────────────────────────
export const TOTAL_LEVELS = 5;     // niveles por mapa
export const FIRST_MAP = "forest"; // mapa inicial siempre desbloqueado
export const STORAGE_KEY = "hero_hub_progress";

// ── Balance de combate ────────────────────────────────────────────────────────
export const DAMAGE_VARIANCE_MIN = -1;   // varianza mínima sobre el daño base
export const DAMAGE_VARIANCE_MAX = 3;   // varianza máxima sobre el daño base
export const DAMAGE_MINIMUM = 1;   // daño mínimo garantizado

// ── Stats de jefe (multiplicadores sobre el enemigo base) ─────────────────────
export const BOSS_HP_MULTIPLIER = 2.0;
export const BOSS_ATK_MULTIPLIER = 1.5;
export const BOSS_DEF_MULTIPLIER = 1.3;

// ── IA del enemigo ────────────────────────────────────────────────────────────
export const ENEMY_THINK_MS = 650;   // pausa antes de que cada enemigo actúe
export const ENEMY_MOVE_MS = 200;   // pausa tras el movimiento del enemigo

// ── Animación de movimiento ───────────────────────────────────────────────────
export const MOVEMENT_STEP_MS = 130; // ms por casilla en la animación

// ── Battle log ────────────────────────────────────────────────────────────────
export const LOG_MAX = 10; // máximo de entradas visibles en el log

// ── Pantalla de reveal de enemigos ───────────────────────────────────────────
export const ENEMY_REVEAL_MS = 2500; // duración total del reveal
export const ENEMY_REVEAL_TICK = 100;  // intervalo del contador

// ── Grid / mapa ──────────────────────────────────────────────────────────────
export const GRID_GAP = 2;   // px entre tiles
export const GRID_PADDING = 2;   // px de padding del grid
export const TILE_SIZE_MIN = 28; // px mínimo de tile en desktop
export const TILE_SIZE_MAX = 56; // px máximo de tile en desktop

// ── Layout de la partida ──────────────────────────────────────────────────────
export const SIDEBAR_WIDTH = 220;  // px
export const LAYOUT_H_PAD = 32;   // px de padding horizontal total
export const LAYOUT_GAP = 12;   // px entre grid y sidebar
export const LAYOUT_MAX_W = 900;  // px máximo del layout de partida

// ── Héroes ────────────────────────────────────────────────────────────────────
export const SQUAD_SIZE = 3; // número de héroes en el equipo del jugador

// ── Goblin IA ─────────────────────────────────────────────────────────────────
export const GOBLIN_FLEE_HP_RATIO = 0.3;  // huye cuando HP < 30% del máximo
export const GOBLIN_FLANK_BONUS = 1.5;  // bonus de puntuación por flanquear
export const GOBLIN_EXPOSURE_PENALTY = 2; // penalización por quedar expuesto

// ── Darkmage IA ───────────────────────────────────────────────────────────────
export const DARKMAGE_DANGER_DISTANCE = 1; // distancia a la que un CaC le amenaza
export const DARKMAGE_MELEE_PENALTY = 8; // penalización por adyacencia CaC
export const DARKMAGE_EXPOSURE_PENALTY = 2; // penalización por estar en rango
export const DARKMAGE_LAVA_PENALTY = 4; // penalización por tile de lava

// ── Lava ─────────────────────────────────────────────────────────────────────
export const LAVA_TILE_DAMAGE = 3; // daño por estar/cruzar lava (tile V)

// ── Breakpoints de viewport ───────────────────────────────────────────────────
export const BREAKPOINT_XS     = 480;   // usado en HeroLobby, MapSelector, etc.
export const BREAKPOINT_SM     = 768;   // usado en HeroLobby, MapSelector, etc.
export const BREAKPOINT_MOBILE = 640;   // usado en App.jsx para isMobile

// ── UI de combate ─────────────────────────────────────────────────────────────
export const UNIT_TOKEN_SPRITE_SIZE = 38;  // px del sprite dentro de UnitToken

// ── Labels de efectos de estado (duplicados en combatSlice y enemySlice) ─────
export const STATUS_ICON_LABELS = {
  poison: "☠ Envenenado",
  burn:   "🔥 Quemado",
  bleed:  "🩸 Sangrando",
};

// ── Barras de stat en el lobby (máximos visuales) ────────────────────────────
export const STAT_BAR_MAX = {
  hp:          50,
  atk:         20,
  def:         10,
  mov:         6,
  range:       4,
  movesPerTurn: 3,
};