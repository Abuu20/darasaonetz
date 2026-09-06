interface QiblaCompassProps {
  // Degrees clockwise from true north to the Kaaba, from the Aladhan API.
  direction: number;
  // Device compass heading in degrees clockwise from true north, or null
  // when the sensor is unavailable/unauthorized — the dial then stays fixed
  // with north at the top instead of tracking the phone.
  heading: number | null;
  northLabel: string;
  eastLabel: string;
  southLabel: string;
  westLabel: string;
}

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 24;

export default function QiblaCompass({ direction, heading, northLabel, eastLabel, southLabel, westLabel }: QiblaCompassProps) {
  const roseRotation = heading != null ? -heading : 0;

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-xs text-ink" role="img" aria-hidden="true">
      {/* Outer dial — fixed */}
      <circle cx={CENTER} cy={CENTER} r={RADIUS + 16} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={2} />

      {/* Rotating rose: cardinal labels + tick marks track the device heading */}
      <g style={{ transform: `rotate(${roseRotation}deg)`, transformOrigin: `${CENTER}px ${CENTER}px`, transition: "transform 200ms linear" }}>
        {Array.from({ length: 36 }).map((_, index) => {
          const angle = index * 10;
          const isCardinal = angle % 90 === 0;
          const length = isCardinal ? 14 : 7;
          const x1 = CENTER + (RADIUS - length) * Math.sin((angle * Math.PI) / 180);
          const y1 = CENTER - (RADIUS - length) * Math.cos((angle * Math.PI) / 180);
          const x2 = CENTER + RADIUS * Math.sin((angle * Math.PI) / 180);
          const y2 = CENTER - RADIUS * Math.cos((angle * Math.PI) / 180);
          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeOpacity={isCardinal ? 0.5 : 0.2}
              strokeWidth={isCardinal ? 2 : 1}
            />
          );
        })}
        <text x={CENTER} y={CENTER - RADIUS + 22} textAnchor="middle" className="fill-current text-sm font-semibold">
          {northLabel}
        </text>
        <text x={CENTER + RADIUS - 16} y={CENTER + 5} textAnchor="middle" className="fill-current text-xs text-slate">
          {eastLabel}
        </text>
        <text x={CENTER} y={CENTER + RADIUS - 10} textAnchor="middle" className="fill-current text-xs text-slate">
          {southLabel}
        </text>
        <text x={CENTER - RADIUS + 16} y={CENTER + 5} textAnchor="middle" className="fill-current text-xs text-slate">
          {westLabel}
        </text>

        {/* Qibla arrow — fixed at `direction` within the rotating rose, so it
            points at the Kaaba on screen once the rose is heading-aligned. */}
        <g style={{ transform: `rotate(${direction}deg)`, transformOrigin: `${CENTER}px ${CENTER}px` }}>
          <line x1={CENTER} y1={CENTER} x2={CENTER} y2={CENTER - RADIUS + 30} stroke="url(#qibla-gradient)" strokeWidth={4} strokeLinecap="round" />
          <polygon points={`${CENTER - 8},${CENTER - RADIUS + 44} ${CENTER + 8},${CENTER - RADIUS + 44} ${CENTER},${CENTER - RADIUS + 26}`} fill="url(#qibla-gradient)" />
        </g>
      </g>

      <circle cx={CENTER} cy={CENTER} r={5} fill="currentColor" />

      <defs>
        <linearGradient id="qibla-gradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#1C4EFF" />
          <stop offset="50%" stopColor="#AC24FF" />
          <stop offset="100%" stopColor="#FE881B" />
        </linearGradient>
      </defs>
    </svg>
  );
}
