import { supabase } from "./client";
import type { Game, GameScore } from "./types";

export interface GameFilters {
  category?: string;
  search?: string;
}

export const gameQueries = {
  getPublished: async (filters: GameFilters = {}): Promise<Game[]> => {
    let query = supabase
      .from("games")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (filters.category && filters.category !== "all") query = query.eq("category", filters.category);
    if (filters.search) query = query.ilike("title", `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Game[];
  },

  // maybeSingle: a slug that doesn't exist (bad link, unpublished game) is a
  // normal "not found" case for the player page to handle, not a thrown error.
  getBySlug: async (slug: string): Promise<Game | null> => {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return (data as Game) ?? null;
  },
};

// Leaderboard reads are ready for when a game starts writing scores; no UI
// calls these yet (see supabase-games-setup.sql scope note).
export const gameScoreQueries = {
  getLeaderboard: async (gameId: string, limit = 20): Promise<GameScore[]> => {
    const { data, error } = await supabase
      .from("game_scores")
      .select("*, profiles (id, full_name, avatar_url)")
      .eq("game_id", gameId)
      .order("score", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as GameScore[];
  },

  // Called by GamePlayer when a game reports points earned in a play
  // session. Adds to both `score` (ranks this game's leaderboard) and
  // `points` (rolls up into profiles.total_points via the DB trigger).
  // Reads the existing row first rather than a blind upsert, since Supabase
  // upsert can't express "add to the current value" on its own.
  awardPoints: async (gameId: string, userId: string, pointsEarned: number): Promise<void> => {
    const { data: existing, error: readError } = await supabase
      .from("game_scores")
      .select("score, points")
      .eq("game_id", gameId)
      .eq("user_id", userId)
      .maybeSingle();
    if (readError) throw readError;

    const { error: writeError } = await supabase.from("game_scores").upsert(
      {
        game_id: gameId,
        user_id: userId,
        score: (existing?.score ?? 0) + pointsEarned,
        points: (existing?.points ?? 0) + pointsEarned,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "game_id,user_id" }
    );
    if (writeError) throw writeError;
  },

  // Realtime: fires `onChange` whenever any score in this game's
  // leaderboard is inserted or updated. Scoped to one game (filter on
  // game_id) so a viewer only subscribes to the leaderboard they're
  // actually looking at, not every game's scores at once.
  subscribeToLeaderboard: (gameId: string, onChange: () => void): (() => void) => {
    const channel = supabase
      .channel(`game-leaderboard-${gameId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_scores", filter: `game_id=eq.${gameId}` },
        onChange
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_scores", filter: `game_id=eq.${gameId}` },
        onChange
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
