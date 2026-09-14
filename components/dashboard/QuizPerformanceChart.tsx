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

export interface QuizPerformancePoint {
  quizId: string;
  title: string;
  avgScore: number; // 0-100
  attempts: number;
}

interface QuizPerformanceChartProps {
  data: QuizPerformancePoint[];
  title?: string;
  subtitle?: string;
}

const GOOD = "#2A9D8F"; // avg at/above passing-ish threshold
const NEEDS_ATTENTION = "#E07A5F"; // avg below 60 — worth a teacher's eye

function truncate(label: string, max = 16): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/**
 * Average score per quiz for one course — flags quizzes averaging below
 * 60% in a warmer color so a teacher scanning the chart immediately sees
 * which quiz might be too hard, ambiguous, or poorly explained in the
 * lesson, without reading every number.
 */
export default function QuizPerformanceChart({
  data,
  title = "Quiz performance",
  subtitle = "Average score per quiz",
}: QuizPerformanceChartProps) {
  const chartData = data.map(d => ({ ...d, label: truncate(d.title) })).slice(0, 8);

  if (chartData.length === 0) {
    return (
      <div className="card-lift flex h-full flex-col justify-center rounded-card border border-line bg-background p-5 text-center">
        <h3 className="font-heading text-base text-ink">{title}</h3>
        <p className="mt-2 text-xs text-slate">No graded quiz attempts yet for this course.</p>
      </div>
    );
  }

  return (
    <div className="card-lift flex h-full flex-col rounded-card border border-line bg-background p-5">
      <div className="mb-3">
        <h3 className="font-heading text-base text-ink">{title}</h3>
        <p className="text-xs text-slate">{subtitle}</p>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 34)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#EDEAF7" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} unit="%" />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            width={110}
            tick={{ fontSize: 12, fill: "#4B4470" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(98, 75, 255, 0.06)" }}
            formatter={(value, _name, item) => [
              `${Number(value)}% avg · ${item.payload.attempts} attempt${item.payload.attempts === 1 ? "" : "s"}`,
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
          <Bar dataKey="avgScore" radius={[0, 6, 6, 0]} maxBarSize={18}>
            {chartData.map(d => (
              <Cell key={d.quizId} fill={d.avgScore < 60 ? NEEDS_ATTENTION : GOOD} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
