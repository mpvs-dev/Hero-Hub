import Sprite from "./Sprite";

const SPRITE_SIZE = 38; // px dentro del tile de 52px
const HP_BAR_COLOR = { player: "#97C459", enemy: "#E24B4A" };

export default function UnitToken({ unit, tileSize }) {
  const hpPct = Math.round((unit.hp / unit.maxHp) * 100);

  return (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {/* Sprite del personaje */}
      <Sprite type={unit.type} size={SPRITE_SIZE} />

      {/* Barra de HP */}
      <div
        style={{
          width: tileSize - 10,
          height: 3,
          background: "rgba(0,0,0,0.6)",
          borderRadius: 2,
          marginTop: 2,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${hpPct}%`,
            background: HP_BAR_COLOR[unit.team] ?? "#888",
            borderRadius: 2,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
