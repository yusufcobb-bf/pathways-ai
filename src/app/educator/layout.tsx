import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Stage 12: Educator Layout Guard
 *
 * Authoritative role enforcement for /educator/* routes.
 * Only users with role='educator' can access these pages.
 */
export default async function EducatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  // STRICT: Missing profile or invalid role = unauthorized
  if (!profile || profile.role !== "educator") {
    // If student, redirect to student dashboard
    if (profile?.role === "student") {
      redirect("/student");
    }
    // Otherwise (missing/invalid) = unauthorized
    redirect("/login");
  }

  return <>{children}</>;
}
