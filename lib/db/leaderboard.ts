import { supabase } from "./client";

export type LeaderboardWindow = "weekly" | "monthly" | "alltime";

export interface LeaderboardRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  points_all_time: number;
  points_in_window: number;
  course_count: number;
  badge_count: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria_type: "points" | "streak" | "courses";
  criteria_value: number;
  sort_order: number;
}

export interface EarnedBadge extends Badge {
  earned_at: string;
}

export const leaderboardQueries = {
  // Global board — same "must have scored at least once" rule the old
  // getTopPlayers used.
  getGlobal: async (window: LeaderboardWindow, limit = 100): Promise<LeaderboardRow[]> => {
    const { data, error } = await supabase.rpc("get_leaderboard_window", {
      p_window: window,
      p_limit: limit,
    });
    if (error) throw error;
    return (data ?? []) as LeaderboardRow[];
  },

  // A teacher's own roster, deduped across all their courses. Includes
  // 0-point students — this is "who's in my class", not just "who's winning".
  getClass: async (teacherId: string, window: LeaderboardWindow): Promise<LeaderboardRow[]> => {
    const { data, error } = await supabase.rpc("get_class_leaderboard", {
      p_teacher_id: teacherId,
      p_window: window,
    });
    if (error) throw error;
    return (data ?? []) as LeaderboardRow[];
  },

  // Same realtime hook as before, now firing on either points or the
  // ledger changing so weekly/monthly numbers stay live too.
  subscribe: (onChange: () => void): (() => void) => {
    const uniqueSuffix = Math.random().toString(36).slice(2, 10);
    const channel = supabase
      .channel(`leaderboard-${uniqueSuffix}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "point_events" }, onChange)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, onChange)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};

export const badgeQueries = {
  getForUser: async (userId: string): Promise<EarnedBadge[]> => {
    const { data, error } = await supabase
      .from("user_badges")
      .select("earned_at, badges (*)")
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({ ...row.badges, earned_at: row.earned_at }));
  },

  // Call after something that could newly qualify the user (points award,
  // streak log, enrollment). Returns badges earned *this call* — empty if
  // nothing new — so the caller can show a toast/celebration.
  checkAndAward: async (userId: string): Promise<Badge[]> => {
    const { data, error } = await supabase.rpc("check_and_award_badges", { p_user_id: userId });
    if (error) throw error;
    return (data ?? []) as Badge[];
  },
};
