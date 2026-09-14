import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toolProgressQueries } from "@/lib/db/toolProgress";

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private-browsing mode or storage full — the in-memory value still works for this session.
  }
}

// Keeps `value` in localStorage (so every tool works instantly, signed-out
// visitors included — same as before) and, once signed in, also mirrors it
// to the `tool_progress` table so the same progress shows up on another
// device. On sign-in the server copy (if any) wins once, since it reflects
// whatever the user was doing elsewhere; every change after that writes to
// both places.
export function useToolProgress<T>(tool: string, localKey: string, defaultValue: T) {
  const { user } = useAuth();
  const [value, setValueState] = useState<T>(() => readLocal(localKey, defaultValue));
  const pulledForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!user || pulledForUser.current === user.id) return;
    pulledForUser.current = user.id;
    toolProgressQueries
      .get(user.id, tool)
      .then(remote => {
        if (remote) {
          setValueState(remote as T);
          writeLocal(localKey, remote);
        }
      })
      .catch(() => {
        // Offline or RLS not migrated yet — local value keeps working.
      });
  }, [user, tool, localKey]);

  const setValue = (next: T) => {
    setValueState(next);
    writeLocal(localKey, next);
    if (user) {
      toolProgressQueries.upsert(user.id, tool, next as Record<string, unknown>).catch(() => {
        // Non-fatal — the local copy is already saved either way.
      });
    }
  };

  return [value, setValue] as const;
}
