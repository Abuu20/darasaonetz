#!/usr/bin/env node
// fix-role-flip.mjs — run once with: node fix-role-flip.mjs
//
// Patches two files so the signed-in user's role is read from a
// SECURITY DEFINER RPC (guaranteed to work) instead of a direct select
// (which depends on RLS and on the JWT being current).
//
// Safe to re-run — it detects an already-patched file and skips it.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const MARKER = "// [fix-role-flip]";

function patch(path, transform, description) {
  const full = resolve(ROOT, path);
  if (!existsSync(full)) {
    console.log(`  · skip (not found): ${path}`);
    return;
  }
  const original = readFileSync(full, "utf8");
  if (original.includes(MARKER)) {
    console.log(`  · skip (already patched): ${path}`);
    return;
  }
  const next = transform(original);
  if (next === original) {
    console.log(`  ! ${description} — pattern not found in ${path}`);
    return;
  }
  writeFileSync(full, next, "utf8");
  console.log(`  ✓ ${description}: ${path}`);
}

console.log("Patching client files…\n");

// ---- 1. lib/db/profiles.ts — getProfile prefers the RPC --------------------
patch(
  "lib/db/profiles.ts",
  src => src.replace(
    /getProfile:\s*async\s*\(userId:\s*string\)[^{]*\{[\s\S]*?\n\s*\},/,
    `${MARKER}
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
  },`
  ),
  "getProfile now tries get_my_profile() RPC first"
);

// ---- 2. context/AuthContext.tsx — don't treat null profile as student ------
patch(
  "context/AuthContext.tsx",
  src => src.replace(
    /isStudent:\s*profile\?\.role\s*===\s*"student"\s*\|\|\s*!profile,/,
    `${MARKER}
        // A null profile is NOT "student" — it means the read failed.
        // Treating it as student is what caused the role to flip.
        isStudent: profile?.role === "student",`
  ),
  "isStudent no longer inferred from a null profile"
);

console.log("\nDone. Now reload the app in your browser and sign in again.");
console.log("If the role still shows incorrectly, hard-refresh (Ctrl/Cmd+Shift+R).");