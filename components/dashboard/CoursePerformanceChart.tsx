import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

export interface CoursePerformancePoint {
  courseId: string;
  title: string; // full course title, truncated for the axis label
  avgProgress: number; // 0-100
  students: number;
}

interface CoursePerformanceChartProps {
  data: CoursePerformancePoint[];
  title?: string;
  subtitle?: string;
}

const BAR_COLOR = "#624BFF";
const BAR_COLOR_LOW = "#C9C2E9"; // courses with no students yet — same hue, muted

function truncate(label: string, max = 14): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/**
 * Horizontal bar comparison of average student progress per course — real
 * data already computed in TeacherDashboard's courseStats (students +
 * avgProgress per course), so this needs no new Supabase query. Courses
 * with zero enrolled students render in a muted tone so an empty course
 * doesn't visually read as "failing".
 */
export default function CoursePerformanceChart({
  data,
  title = "Course performance",
  subtitle = "Average student progress",
}: CoursePerformanceChartProps) {
  const chartData = data
    .map(d => ({ ...d, label: truncate(d.title) }))
    .sort((a, b) => b.avgProgress - a.avgProgress)
    .slice(0, 8); // keep it readable — a teacher with many courses sees their top 8

  const hasData = chartData.some(d => d.students > 0);

  return (
    <div className="card-lift flex h-full flex-col rounded-card border border-line bg-background p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base text-ink">{title}</h3>
          <p className="text-xs text-slate">{subtitle}</p>
        </div>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 34)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#EDEAF7" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} unit="%" />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              width={100}
              tick={{ fontSize: 12, fill: "#4B4470" }}
            />
            <Tooltip
              cursor={{ fill: "rgba(98, 75, 255, 0.06)" }}
              formatter={(value, _name, item) => [
                `${Number(value)}% avg · ${item.payload.students} student${item.payload.students === 1 ? "" : "s"}`,
                item.payload.title,
              ]}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #E4E0F0",
                boxShadow: "0 8px 24px rgba(29, 21, 79, 0.08)",
                fontSize: 12,
                color: "#1A0B54",
              }}
              labelFormatter={() => ""}
            />
            <Bar dataKey="avgProgress" radius={[0, 6, 6, 0]} maxBarSize={18}>
              {chartData.map(d => (
                <Cell key={d.courseId} fill={d.students > 0 ? BAR_COLOR : BAR_COLOR_LOW} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {!hasData ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-pill bg-background/90 px-3 py-1 text-xs text-slate">
              No student progress yet
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
