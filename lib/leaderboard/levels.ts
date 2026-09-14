// Level is presentation only, derived from points — there is no `level`
// column anywhere. Keeping it as a pure function means the curve can be
// retuned any time without touching the database.
//
// Thresholds are cumulative points needed to *reach* that level.
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000,
] as const;

const LEVEL_NAMES = [
  "Newcomer",
  "Learner",
  "Rising Star",
  "Dedicated",
  "Scholar",
  "Achiever",
  "Expert",
  "Mentor",
  "Luminary",
  "Master",
  "Legend",
] as const;

export interface LevelInfo {
  level: number; // 1-based
  name: string;
  pointsIntoLevel: number;
  pointsForNextLevel: number | null; // null once past the last defined threshold
  progress: number; // 0–1, for a progress bar
}

export function getLevel(points: number): LevelInfo {
  const safePoints = Math.max(0, points ?? 0);
  let levelIndex = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (safePoints >= LEVEL_THRESHOLDS[i]) {
      levelIndex = i;
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[levelIndex];
  const nextThreshold = LEVEL_THRESHOLDS[levelIndex + 1] ?? null;
  const pointsIntoLevel = safePoints - currentThreshold;
  const pointsForNextLevel = nextThreshold !== null ? nextThreshold - currentThreshold : null;

  return {
    level: levelIndex + 1,
    name: LEVEL_NAMES[levelIndex] ?? LEVEL_NAMES[LEVEL_NAMES.length - 1],
    pointsIntoLevel,
    pointsForNextLevel,
    progress: pointsForNextLevel ? Math.min(1, pointsIntoLevel / pointsForNextLevel) : 1,
  };
}
