import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  theme: "light" | "dark";
  onChange: (theme: "light" | "dark") => void;
  label?: string;
}

/**
 * Two-state pill: sun on the left, moon on the right, sliding thumb.
 * Same visual weight as DashUI's own toggle — pill-shaped, muted track,
 * accent thumb. Rendered in the sidebar footer so it works even in the
 * collapsed rail.
 */
export default function ThemeToggle({ theme, onChange, label }: ThemeToggleProps) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={label ?? (isDark ? "Switch to light mode" : "Switch to dark mode")}
      onClick={() => onChange(isDark ? "light" : "dark")}
      className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-pill border border-white/10 bg-white/5 transition-colors duration-200 hover:bg-white/10"
    >
      <span
        className={`absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#624BFF] shadow-sm transition-transform duration-200 ${
          isDark ? "translate-x-[1.65rem]" : "translate-x-0.5"
        }`}
      >
        {isDark ? <Moon size={13} aria-hidden="true" /> : <Sun size={13} aria-hidden="true" />}
      </span>
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 text-white/40">
        <Sun size={11} aria-hidden="true" />
        <Moon size={11} aria-hidden="true" />
      </span>
    </button>
  );
}
