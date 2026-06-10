export default function Credits() {
  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      textAlign: "center",
      padding: "6px 0 8px",
      fontFamily: "Cinzel, serif",
      fontSize: 10,
      letterSpacing: 2,
      color: "#5b5b5b",
      background: "#0d0e0f",
      borderTop: "1px solid #1a1810",
      zIndex: 5,
    }}>
      <a
        href="https://mpvs.online"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#5b5b5b",
          textDecoration: "none",
          letterSpacing: 2,
          transition: "color 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "#c9a84c"}
        onMouseLeave={e => e.currentTarget.style.color = "#5b5b5b"}
      >
        MPVs
      </a>
      {" "}© 2026 · TODOS LOS DERECHOS RESERVADOS
    </div>
  );
}