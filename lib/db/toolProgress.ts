import { supabase } from "./client";
import type { ToolProgress } from "./types";

export const toolProgressQueries = {
  get: async (userId: string, tool: string): Promise<Record<string, unknown> | null> => {
    const { data, error } = await supabase
      .from("tool_progress")
      .select("data")
      .eq("user_id", userId)
      .eq("tool", tool)
      .maybeSingle();
    if (error) throw error;
    return (data as Pick<ToolProgress, "data"> | null)?.data ?? null;
  },

  // Single row per (user, tool) — a later save always replaces the whole
  // `data` blob rather than merging, so callers should pass the full
  // current shape for that tool, not a partial patch.
  upsert: async (userId: string, tool: string, data: Record<string, unknown>): Promise<true> => {
    const { error } = await supabase
      .from("tool_progress")
      .upsert(
        { user_id: userId, tool, data, updated_at: new Date().toISOString() },
        { onConflict: "user_id,tool" }
      );
    if (error) throw error;
    return true;
  },
};
