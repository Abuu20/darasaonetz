interface LessonProgressRingProps {
  /** 0–100 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * Small circular progress indicator used in the lesson sidebar header and
 * the top bar. Uses the DashUI violet gradient as the fill stroke so it
 * matches the rest of the dashboard accent.
 */
export default function LessonProgressRing({
  progress,
  size = 44,
  strokeWidth = 3,
  className = "",
}: LessonProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label={`${Math.round(clamped)}% complete`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-line"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#learnProgressGradient)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-slow"
      />
      <defs>
        <linearGradient id="learnProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#624BFF" />
          <stop offset="100%" stopColor="#7C6AFF" />
        </linearGradient>
      </defs>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-current text-[10px] font-semibold text-ink"
      >
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}
