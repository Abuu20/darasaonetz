/**
 * Dashboard-scoped theme + sidebar state. Kept out of React so any
 * component can read the current values synchronously on first render
 * (avoiding a flash of light mode when dark is the saved preference).
 *
 * The dashboard always uses a dark sidebar rail — this "theme" only
 * toggles the *content area* between light and dark, matching DashUI
 * Pro's behaviour.
 */

const THEME_KEY = "darasaone.dashboard.theme";
const SIDEBAR_KEY = "darasaone.dashboard.sidebarCollapsed";

export type DashboardTheme = "light" | "dark";

export function getStoredTheme(): DashboardTheme {
  if (typeof window === "undefined") return "light";
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    if (raw === "dark" || raw === "light") return raw;
    // Fall back to the OS preference the first time.
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function setStoredTheme(theme: DashboardTheme): void {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage blocked — the in-memory state still works */
  }
}

export function getStoredSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) === "true";
  } catch {
    return false;
  }
}

export function setStoredSidebarCollapsed(collapsed: boolean): void {
  try {
    window.localStorage.setItem(SIDEBAR_KEY, collapsed ? "true" : "false");
  } catch {
    /* ignore */
  }
}
