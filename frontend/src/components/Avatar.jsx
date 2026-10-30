function Avatar({ username, size = 40, online = false }) {
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : "??";

  const colors = [
    ["#7c6ff7", "#3d3580"],
    ["#f472b6", "#9d1060"],
    ["#34d399", "#065f3a"],
    ["#f97316", "#7c2d12"],
    ["#60a5fa", "#1e3a8a"],
    ["#a78bfa", "#4c1d95"],
  ];

  const colorIndex =
    username
      ? username.charCodeAt(0) % colors.length
      : 0;
  const [bg, text] = colors[colorIndex];

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: bg,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.35,
          fontWeight: 600,
          fontFamily: "var(--font-display)",
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
      {online && (
        <div
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: "50%",
            background: "var(--online)",
            border: "2px solid var(--bg)",
          }}
        />
      )}
    </div>
  );
}

export default Avatar;
