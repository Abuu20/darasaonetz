import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface EnrollmentPoint {
  label: string;   // e.g. "3/12"
  students: number;
}

interface EnrollmentChartProps {
  data: EnrollmentPoint[];
  title?: string;
  subtitle?: string;
}

/**
 * Weekly new-enrollment area chart in DashUI's card style: violet stroke,
 * soft gradient fill, light grid, one line of context under the title.
 */
export default function EnrollmentChart({
  data,
  title = "New enrollments",
  subtitle,
}: EnrollmentChartProps) {
  const allZero = data.every(d => d.students === 0);

  return (
    <div className="card-lift flex h-full flex-col rounded-card border border-line bg-background p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base text-ink">{title}</h3>
          {subtitle ? <p className="text-xs text-slate">{subtitle}</p> : null}
        </div>
        <span className="rounded-pill bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
          {data.reduce((sum, d) => sum + d.students, 0)} new
        </span>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="dashEnrollGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#624BFF" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#624BFF" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#EDEAF7" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} dy={6} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
            <Tooltip
              cursor={{ stroke: "#C9C2E9", strokeWidth: 1 }}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #E4E0F0",
                boxShadow: "0 8px 24px rgba(29, 21, 79, 0.08)",
                fontSize: 12,
                color: "#1A0B54",
              }}
              labelStyle={{ color: "#83799E" }}
            />
            <Area
              type="monotone"
              dataKey="students"
              name="New students"
              stroke="#624BFF"
              strokeWidth={2}
              fill="url(#dashEnrollGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {allZero ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-pill bg-background/90 px-3 py-1 text-xs text-slate">
              No enrollments in the last 12 weeks
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
