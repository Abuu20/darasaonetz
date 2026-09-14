import { supabase } from "./client";
import type { Profile, UserRole } from "./types";

export const profileQueries = {
  // [fix-role-flip]
  getProfile: async (userId: string): Promise<Profile | null> => {
    // Try the SECURITY DEFINER RPC first — it bypasses RLS and works even
    // if the JWT is stale. Falls back to a direct select if the RPC isn't
    // deployed (e.g. you haven't run supabase-role-fix.sql yet).
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_my_profile");
      if (!rpcError && rpcData) return rpcData as Profile;
    } catch { /* ignore, fall through */ }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data as Profile | null;
  },

  // Global "top players" across every game — reads straight from
  // profiles.total_points, which the game_scores trigger keeps current, so
  // this never has to sum across every game's scores at read time.
  getTopPlayers: async (limit = 50): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .gt("total_points", 0)
      .order("total_points", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Profile[];
  },

  // Realtime: fires whenever any profile's total_points changes. One
  // shared channel for the whole leaderboard page, not per-row.
  // Unique channel name per call — same React 19 StrictMode reasoning as
  // notifications.ts: removeChannel is async, so a fixed name collides on
  // the dev-mode double-mount.
  subscribeToTopPlayers: (onChange: () => void): (() => void) => {
    const uniqueSuffix = Math.random().toString(36).slice(2, 10);
    const channel = supabase
      .channel(`global-leaderboard-${uniqueSuffix}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, onChange)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },

// Rank on the global points leaderboard — 1 for the highest scorer.
// Returns null if the user has 0 points (i.e. not on the board).
getRank: async (userId: string): Promise<{ rank: number; total: number } | null> => {
  const { data: me } = await supabase
    .from("profiles")
    .select("total_points")
    .eq("id", userId)
    .maybeSingle();
  const myPoints = (me as { total_points?: number } | null)?.total_points ?? 0;
  if (myPoints <= 0) return null;

  const { count: ahead } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("total_points", myPoints);

  const { count: total } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("total_points", 0);

  return { rank: (ahead ?? 0) + 1, total: total ?? 0 };
},

  updateProfile: async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  },

  // Used right after signup, in case the DB trigger that creates a profile
  // row hasn't run yet or the project doesn't have one configured.
  ensureProfile: async (userId: string, email: string, fullName?: string, role: UserRole = "student"): Promise<Profile> => {
    const existing = await profileQueries.getProfile(userId);
    if (existing) return existing;
    const { data, error } = await supabase
      .from("profiles")
      .insert([{ id: userId, email, full_name: fullName ?? null, role }])
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  },
};
