import useGameStore   from "../store/useGameStore";
import Panel          from "./sidebar/Panel";
import UnitRow        from "./sidebar/UnitRow";
import DeployPanel    from "./sidebar/DeployPanel";
import EnemyInspector from "./sidebar/EnemyInspector";
import HeroDetail     from "./sidebar/HeroDetail";
import BattleLog      from "./sidebar/BattleLog";

export default function Sidebar({ isMobile = false }) {
  const {
    units, selectedUnitId, inspectedEnemyId, attackableUnitIds,
    phase, turn, gameOver, enemyBusy, battleLog,
    deployQueue, deployPending,
    selectUnit, attackUnit, endPlayerTurn, startBattle,
  } = useGameStore();

  const selUnit   = units.find(u => u.id === selectedUnitId);
  const inspEnemy = units.find(u => u.id === inspectedEnemyId);
  const players   = units.filter(u => u.team === "player");
  const enemies   = units.filter(u => u.team === "enemy");
  const compact   = isMobile;

  // ── Fase despliegue ──────────────────────────────────────────────────────
  if (phase === "deploy") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <DeployPanel
          deployQueue={deployQueue}
          deployPending={deployPending}
          units={units}
          onStart={startBattle}
          compact={compact}
        />
        <BattleLog log={battleLog} maxHeight={isMobile ? 80 : 140} />
      </div>
    );
  }

  // ── Fase combate ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

      {/* Enemigo inspeccionado */}
      {inspEnemy && !selUnit && (
        <EnemyInspector
          unit={inspEnemy}
          compact={compact}
          isAttackable={attackableUnitIds.includes(inspEnemy.id)}
          attacker={selUnit ?? null}
        />
      )}

      {/* Héroe seleccionado — y si hay enemigo atacable bajo hover, mostrar preview */}
      {selUnit && (
        <HeroDetail
          unit={selUnit}
          phase={phase}
          attackableCount={attackableUnitIds.length}
          compact={compact}
        />
      )}

      {/* Listas de unidades */}
      <UnitLists
        players={players}
        enemies={enemies}
        selectedUnitId={selectedUnitId}
        attackableUnitIds={attackableUnitIds}
        inspectedEnemyId={inspectedEnemyId}
        selUnit={selUnit}
        turn={turn}
        compact={compact}
        onSelectPlayer={id => selectUnit(id)}
        onAttackEnemy={id => attackUnit(selectedUnitId, id)}
      />

      {/* Log con colores */}
      <BattleLog log={battleLog} maxHeight={isMobile ? 72 : 130} />

      {/* Botón fin de turno */}
      {!gameOver && (
        <EndTurnButton
          turn={turn}
          enemyBusy={enemyBusy}
          compact={compact}
          onClick={endPlayerTurn}
        />
      )}
    </div>
  );
}

// ─── UnitLists ────────────────────────────────────────────────────────────────

function UnitLists({
  players, enemies,
  selectedUnitId, attackableUnitIds, inspectedEnemyId, selUnit,
  turn, compact,
  onSelectPlayer, onAttackEnemy,
}) {
  const playerPanel = (
    <Panel title="HÉROES">
      {players.map(p => (
        <UnitRow
          key={p.id} unit={p}
          isSelected={p.id === selectedUnitId}
          isAttackable={false}
          compact={compact}
          onClick={p.alive && turn === "player" ? () => onSelectPlayer(p.id) : null}
        />
      ))}
    </Panel>
  );

  const enemyPanel = (
    <Panel title="ENEMIGOS">
      {enemies.map(e => (
        <EnemyRow
          key={e.id}
          unit={e}
          isAttackable={attackableUnitIds.includes(e.id)}
          isInspected={e.id === inspectedEnemyId}
          compact={compact}
          selUnit={selUnit}
          onAttack={() => onAttackEnemy(e.id)}
        />
      ))}
    </Panel>
  );

  if (compact) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {playerPanel}
        {enemyPanel}
      </div>
    );
  }
  return <>{playerPanel}{enemyPanel}</>;
}

// ─── EnemyRow con preview de daño al hover ───────────────────────────────────

function EnemyRow({ unit, isAttackable, isInspected, compact, selUnit, onAttack }) {
  const hpPct   = Math.round((unit.hp / unit.maxHp) * 100);
  const isClickable = isAttackable && unit.alive;

  // Preview de daño
  const minDmg = selUnit ? Math.max(1, selUnit.atk - unit.def - 1) : null;
  const maxDmg = selUnit ? Math.max(1, selUnit.atk - unit.def + 3) : null;

  return (
    <div
      onClick={isClickable ? onAttack : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "5px 6px",
        borderRadius: 3,
        marginBottom: 5,
        opacity: unit.alive ? 1 : 0.28,
        cursor: isClickable ? "pointer" : "default",
        outline: isAttackable ? "1px solid #E24B4A"
               : isInspected  ? "1px solid #e07040"
               : "none",
        transition: "background 0.1s",
        position: "relative",
      }}
      onMouseEnter={e => {
        if (isClickable) e.currentTarget.style.background = "#1e1008";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Barra HP */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: compact ? 12 : 11,
          fontWeight: 600,
          color: "#c9b99a",
          marginBottom: 3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 4,
        }}>
          <span>{unit.name}</span>
          {/* Preview de daño — solo si es atacable y hay héroe seleccionado */}
          {isAttackable && selUnit && (
            <span style={{
              fontSize: 9,
              fontFamily: "Cinzel, serif",
              color: unit.hp <= minDmg ? "#E24B4A" : "#c9784a",
              flexShrink: 0,
            }}>
              -{minDmg === maxDmg ? minDmg : `${minDmg}~${maxDmg}`}
            </span>
          )}
        </div>
        <div style={{
          width: "100%", height: compact ? 5 : 4,
          background: "#1e1e18", borderRadius: 2, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: `${hpPct}%`,
            background: "#A32D2D", borderRadius: 2,
            transition: "width 0.3s",
          }} />
        </div>
      </div>

      <span style={{
        fontSize: compact ? 11 : 10,
        color: "#5a4a2a",
        minWidth: 40,
        textAlign: "right",
        flexShrink: 0,
      }}>
        {unit.alive ? `${unit.hp}/${unit.maxHp}` : "✝"}
      </span>
    </div>
  );
}

// ─── EndTurnButton ────────────────────────────────────────────────────────────

function EndTurnButton({ turn, enemyBusy, compact, onClick }) {
  const isPlayerTurn = turn === "player";
  return (
    <button
      onClick={onClick}
      disabled={!isPlayerTurn || enemyBusy}
      style={{
        width: "100%",
        padding: compact ? "11px" : "10px",
        fontFamily: "Cinzel, serif",
        fontSize: compact ? 11 : 10,
        letterSpacing: 2,
        background: isPlayerTurn ? "#0c180a" : "#0d0e0f",
        border: `1px solid ${isPlayerTurn ? "#3B6D11" : "#1a2218"}`,
        color: isPlayerTurn ? "#97C459" : "#3a4a2a",
        borderRadius: 4,
        cursor: isPlayerTurn ? "pointer" : "default",
        opacity: enemyBusy ? 0.3 : 1,
        transition: "all 0.2s",
      }}
    >
      {isPlayerTurn ? "TERMINAR TURNO →" : "⋯ Enemigo actuando"}
    </button>
  );
}
