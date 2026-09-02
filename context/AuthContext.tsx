import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/db/client";
import { profileQueries } from "@/lib/db/profiles";
import type { Profile } from "@/lib/db/types";

type SignupMetadata = { fullName?: string; role?: "teacher" | "student" };

type EmailAuthResult = {
  needsConfirmation?: boolean;
  message?: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  signInWithGoogle: (intendedRole?: "teacher" | "student") => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<EmailAuthResult>;
  signUpWithEmail: (email: string, password: string, metadata?: SignupMetadata) => Promise<EmailAuthResult>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function displayNameFor(user: User | null, profile?: Profile | null): string {
  if (profile?.full_name) return profile.full_name;
  if (!user) return "";
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const full = (meta.full_name || meta.fullName || meta.name) as string | undefined;
  if (full && full.trim().length > 0) return full;
  return user.email ?? "";
}

// Google OAuth has no way to carry our own "sign up as a teacher" choice
// through the redirect (Supabase's signInWithOAuth doesn't accept custom
// profile metadata the way email signUp does), so it's stashed here right
// before leaving for Google and picked up once the user lands back on
// /account with a session. Cleared immediately after use either way, so it
// never lingers to affect an unrelated future sign-in.
const PENDING_ROLE_KEY = "darasaone_pending_signup_role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null);
      return;
    }
    try {
      const meta = (nextUser.user_metadata ?? {}) as Record<string, unknown>;
      let p = await profileQueries.ensureProfile(
        nextUser.id,
        nextUser.email ?? "",
        (meta.full_name as string) || (meta.fullName as string) || (meta.name as string) || undefined,
        (meta.role as "teacher" | "student") || "student"
      );

      const pendingRole = window.localStorage.getItem(PENDING_ROLE_KEY);
      if (pendingRole === "teacher") {
        window.localStorage.removeItem(PENDING_ROLE_KEY);
        if (p.role === "student") {
          p = await profileQueries.updateProfile(nextUser.id, { role: "teacher" });
        }
      }

      setProfile(p);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      await loadProfile(data.session?.user ?? null);
      if (isMounted) setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      await loadProfile(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (intendedRole?: "teacher" | "student") => {
    if (intendedRole === "teacher") {
      window.localStorage.setItem(PENDING_ROLE_KEY, "teacher");
    } else {
      window.localStorage.removeItem(PENDING_ROLE_KEY);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account` },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string): Promise<EmailAuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return {};
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    metadata?: SignupMetadata
  ): Promise<EmailAuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: metadata?.fullName, role: metadata?.role ?? "student" },
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });
    if (error) throw error;
    if (!data.session) {
      return { needsConfirmation: true, message: "Check your inbox to confirm your account, then sign in." };
    }
    return {};
  };

  const resetPassword = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    await loadProfile(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isTeacher: profile?.role === "teacher",
        isStudent: profile?.role === "student" || !profile,
        isAdmin: profile?.role === "admin",
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        updatePassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
