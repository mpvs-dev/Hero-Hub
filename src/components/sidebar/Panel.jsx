export default function Panel({ title, children, style = {} }) {
  return (
    <div style={{
      background: "#13140f",
      border: "1px solid #2a2218",
      borderRadius: 4,
      padding: "10px 14px",
      ...style,
    }}>
      {title && (
        <div style={{
          fontFamily: "Cinzel, serif",
          fontSize: 9,
          letterSpacing: 2,
          color: "#5a4a2a",
          marginBottom: 8,
          paddingBottom: 5,
          borderBottom: "1px solid #1a1810",
        }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
