import type { ComponentType } from "react";

interface StatCardDelta {
  value: string;
  tone?: "up" | "down" | "flat";
}

interface StatCardProps {
  icon: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  value: number | string;
  label: string;
  /** Optional small line under the value, e.g. "+12% this week" or "3 drafts". */
  delta?: StatCardDelta;
}

/**
 * DashUI's `StatRightTopIcon` layout: label + icon chip on the top row,
 * big value underneath, optional delta line at the bottom. Card uses the
 * shared `card-lift` shadow and the tightened dash-theme radii.
 */
export default function StatCard({ icon: Icon, value, label, delta }: StatCardProps) {
  const deltaTone =
    delta?.tone === "up"
      ? "text-success"
      : delta?.tone === "down"
        ? "text-danger"
        : "text-slate";

  return (
    <div className="card-lift flex flex-col rounded-card border border-line bg-background p-5 transition-transform duration-base hover:-translate-y-0.5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-sm font-medium leading-snug text-slate">{label}</h3>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-accent/10 text-accent">
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
      <div className="mt-auto flex items-baseline gap-2">
        <span className="font-heading text-3xl leading-none text-ink">{value}</span>
        {delta ? <span className={`text-xs font-medium ${deltaTone}`}>{delta.value}</span> : null}
      </div>
    </div>
  );
}
