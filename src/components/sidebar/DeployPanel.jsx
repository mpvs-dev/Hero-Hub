import Sprite from "../Sprite";
import Panel  from "./Panel";
import { HEROES } from "../../config/heroes";

export default function DeployPanel({ deployQueue, deployPending, units, onStart, compact }) {
  const allDeployed = deployQueue.length === 0;

  return (
    <Panel title="DESPLIEGUE">
      <div style={{ fontSize: 11, color: "#7a6a4a", marginBottom: 10, lineHeight: 1.5 }}>
        {allDeployed
          ? "¡Todos los héroes están listos!"
          : `Coloca a tu ${HEROES[deployPending]?.name ?? deployPending} en una casilla verde.`}
      </div>

      {units.filter(u => u.team === "player").map(u => {
        const isNext = u.type === deployPending && !u.deployed;
        const isDone = u.deployed;
        return (
          <div key={u.id} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 7px", marginBottom: 5, borderRadius: 3,
            background: isNext ? "rgba(74,223,138,0.08)" : "transparent",
            outline: isNext ? "1px solid #4adf8a" : "none",
            opacity: isDone ? 0.5 : 1,
            transition: "all 0.2s",
          }}>
            <Sprite type={u.type} size={compact ? 28 : 24} />
            <span style={{
              fontSize: compact ? 12 : 11,
              color: isNext ? "#4adf8a" : isDone ? "#5a4a2a" : "#c9b99a",
              flex: 1,
            }}>
              {u.name}
            </span>
            <span style={{ fontSize: 13 }}>
              {isDone ? "✓" : isNext ? "▶" : "○"}
            </span>
          </div>
        );
      })}

      {allDeployed && (
        <button
          onClick={onStart}
          style={{
            width: "100%", marginTop: 10,
            fontFamily: "Cinzel, serif", fontSize: 10, letterSpacing: 2,
            padding: "9px",
            background: "#0a180a", border: "1px solid #3B6D11",
            color: "#97C459", borderRadius: 3, cursor: "pointer",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#142a14";
            e.currentTarget.style.borderColor = "#5a9a2a";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "#0a180a";
            e.currentTarget.style.borderColor = "#3B6D11";
          }}
        >
          ⚔ COMENZAR BATALLA
        </button>
      )}
    </Panel>
  );
}
