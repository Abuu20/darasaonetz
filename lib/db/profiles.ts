import { supabase } from "./client";
import type { Profile, UserRole } from "./types";

export const profileQueries = {
  getProfile: async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data as Profile | null;
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
