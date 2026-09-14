import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

/* --------------------------------------------------------------------------
   Chart palette — same values used across the teacher dashboard so the
   two surfaces feel like the same product.
-------------------------------------------------------------------------- */
const ACCENT = "#624BFF";
const PALETTE = [
  "#624BFF", // violet
  "#1C4EFF", // primary blue
  "#AC24FF", // purple
  "#FE881B", // ember
  "#2A9D8F", // teal
  "#F4A261", // sand
  "#C86FFF", // pink-violet
  "#E85D75", // rose
];

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #E4E0F0",
  boxShadow: "0 8px 24px rgba(29, 21, 79, 0.08)",
  fontSize: 12,
} as const;

/* --------------------------------------------------------------------------
   Weekly activity — one bar per week, count of lesson completions.
-------------------------------------------------------------------------- */
export interface WeekPoint { label: string; lessons: number }

export function WeeklyActivityChart({ data }: { data: WeekPoint[] }) {
  const total = data.reduce((sum, d) => sum + d.lessons, 0);
  return (
    <div className="card-lift rounded-card border border-line bg-background p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base text-ink">Weekly activity</h3>
          <p className="text-xs text-slate">Lessons completed · last 12 weeks</p>
        </div>
        <span className="rounded-pill bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
          {total} total
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
          <Tooltip cursor={{ fill: "rgba(98,75,255,0.06)" }} contentStyle={tooltipStyle} />
          <Bar dataKey="lessons" name="Lessons" fill={ACCENT} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {total === 0 ? (
        <p className="mt-2 text-center text-xs text-slate">
          Complete a lesson and it shows up here.
        </p>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Course-progress donut — one slice per enrolled course, sized by progress.
   Only counts courses with progress > 0. Falls back to a "not started yet"
   list under the chart for anything at 0%, so the donut isn't a giant
   single "0%" slice for a new student.
-------------------------------------------------------------------------- */
export interface CourseSlice { name: string; value: number }

export function CourseProgressDonut({ slices }: { slices: CourseSlice[] }) {
  const totalProgress = slices.length > 0
    ? Math.round(slices.reduce((sum, s) => sum + s.value, 0) / slices.length)
    : 0;

  return (
    <div className="card-lift rounded-card border border-line bg-background p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base text-ink">Course progress</h3>
          <p className="text-xs text-slate">Per course · {slices.length} enrolled</p>
        </div>
        <span className="rounded-pill bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
          {totalProgress}% avg
        </span>
      </div>
      {slices.length === 0 ? (
        <p className="py-16 text-center text-xs text-slate">Enroll in a course to start tracking.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="82%"
                paddingAngle={2}
              >
                {slices.map((entry, i) => (
                  <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-3 flex flex-col gap-1.5">
            {slices.map((s, i) => (
              <li key={s.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-slate">{s.name}</span>
                <span className="shrink-0 font-medium text-ink">{s.value}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Quiz score history — line chart, one point per attempt, newest right.
-------------------------------------------------------------------------- */
export interface ScorePoint { label: string; score: number; passed: boolean }

export function QuizScoreHistory({ data }: { data: ScorePoint[] }) {
  const recent = data.slice(-20);
  return (
    <div className="card-lift rounded-card border border-line bg-background p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base text-ink">Score history</h3>
          <p className="text-xs text-slate">Last {recent.length} attempts</p>
        </div>
      </div>
      {recent.length === 0 ? (
        <p className="py-16 text-center text-xs text-slate">No quiz attempts yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={recent} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={28} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="score"
              name="Score"
              stroke={ACCENT}
              strokeWidth={2}
              dot={{ r: 3, fill: ACCENT }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Leaderboard rank card — bold, tiny, at-a-glance.
-------------------------------------------------------------------------- */
export function LeaderboardRankCard({
  rank,
  total,
}: {
  rank: number | null;
  total: number | null;
}) {
  return (
    <div className="card-lift flex h-full flex-col items-center justify-center gap-1 rounded-card border border-line bg-background p-5 text-center">
      <span className="text-xs uppercase tracking-widest text-slate">Global rank</span>
      <span className="font-heading text-4xl leading-none text-ink">
        {rank ? `#${rank}` : "—"}
      </span>
      <span className="text-xs text-slate">
        {rank && total ? `of ${total} players` : "Score points to appear"}
      </span>
    </div>
  );
}
