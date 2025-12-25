import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/supabase/types";

/**
 * Stage 12: Get user role from profiles table
 *
 * Returns null if:
 * - User is not authenticated
 * - Profile does not exist
 * - Role is null or invalid
 *
 * Caller MUST handle null as unauthorized.
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  // Returns null if profile missing or role invalid — caller must handle
  if (!profile?.role) return null;
  if (profile.role !== "student" && profile.role !== "educator") return null;

  return profile.role as UserRole;
}
