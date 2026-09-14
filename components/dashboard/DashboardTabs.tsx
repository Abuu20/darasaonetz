import type { ComponentType } from "react";

export interface DashboardTab {
  id: string;
  label: string;
  icon?: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  badge?: string | number;
}

interface DashboardTabsProps {
  tabs: DashboardTab[];
  activeId: string;
  onChange: (id: string) => void;
}

/**
 * DashUI's `nav nav-lt-tab` pattern: horizontal tabs on a white strip with
 * a 2px accent underline on the active item. Replaces the modal/popup
 * navigation this dashboard used before.
 */
export default function DashboardTabs({ tabs, activeId, onChange }: DashboardTabsProps) {
  return (
    <div className="border-b border-line bg-background">
      <nav
        role="tablist"
        className="mx-auto flex max-w-shell gap-1 overflow-x-auto px-gutter md:px-gutter-lg"
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={`relative flex shrink-0 items-center gap-2 px-3 py-3.5 text-sm transition-colors duration-base md:px-4 ${
                active ? "font-medium text-accent" : "text-slate hover:text-ink"
              }`}
            >
              {Icon ? <Icon size={15} aria-hidden="true" /> : null}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== "" ? (
                <span className="rounded-pill bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  {tab.badge}
                </span>
              ) : null}
              {active ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-accent" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
