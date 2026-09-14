import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

export interface ActivityPoint {
  name: string;
  value: number; // 0–100
  fill: string;
}

interface TeacherActivityChartProps {
  data: ActivityPoint[];
  title?: string;
  subtitle?: string;
}

/**
 * DashUI's "Tasks Performance" card, rebuilt with Recharts (already a
 * dependency) instead of ApexCharts. Three concentric rings: enrolled
 * (always 100% — the reference track), active, completed.
 */
export default function TeacherActivityChart({
  data,
  title = "Class activity",
  subtitle,
}: TeacherActivityChartProps) {
  const allZero = data.every(d => d.value === 0);

  return (
    <div className="card-lift flex h-full flex-col rounded-card border border-line bg-background p-5">
      <div className="mb-1">
        <h3 className="font-heading text-base text-ink">{title}</h3>
        {subtitle ? <p className="text-xs text-slate">{subtitle}</p> : null}
      </div>

      <div className="relative mx-auto w-full max-w-[240px]">
        <ResponsiveContainer width="100%" height={220}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="35%"
            outerRadius="100%"
            barSize={12}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              dataKey="value"
              angleAxisId={0}
              cornerRadius={8}
              background={{ fill: "#F1F0F7" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {allZero ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-slate">No students yet</span>
          </div>
        ) : null}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {data.map(d => (
          <li key={d.name} className="flex items-center gap-2 text-xs text-slate">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.fill }}
              aria-hidden="true"
            />
            <span>{d.name}</span>
            <span className="font-medium text-ink">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
