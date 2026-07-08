/**
 * Monograma de Eagle Club: el "3" dentro del óvalo de doble trazo,
 * recreado en SVG a partir de la tarjeta de marca.
 */
export function LogoMark({
  height = 40,
  color = "#fff",
}: {
  height?: number;
  color?: string;
}) {
  const width = (height * 100) / 68;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 68"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="50" cy="34" rx="46" ry="30" fill="none" stroke={color} strokeWidth="5" />
      <ellipse cx="50" cy="34" rx="34.5" ry="21" fill="none" stroke={color} strokeWidth="1.8" />
      <text
        x="50"
        y="46.5"
        textAnchor="middle"
        fontFamily="var(--font-display), Georgia, serif"
        fontSize="36"
        fill={color}
      >
        3
      </text>
    </svg>
  );
}

/** Lockup completo (monograma + wordmark), como la tarjeta de marca. */
export function LogoLockup({ color = "#fff" }: { color?: string }) {
  return (
    <div className="flex items-center gap-6">
      <LogoMark height={72} color={color} />
      <div className="flex items-end gap-3">
        <div
          className="display"
          style={{ color, fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "0.24em", lineHeight: 1.15 }}
        >
          Eagle
          <br />
          Club
        </div>
        <div
          style={{
            color,
            opacity: 0.75,
            fontSize: 10,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontWeight: 600,
            paddingBottom: 10,
            whiteSpace: "nowrap",
          }}
        >
          Indoor
          <br />
          Golf
        </div>
      </div>
    </div>
  );
}
