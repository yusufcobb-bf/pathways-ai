import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Stage 12: Student Layout Guard
 *
 * Authoritative role enforcement for /student/* routes.
 * Only users with role='student' can access these pages.
 */
export default async function StudentLayout({
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
  if (!profile || profile.role !== "student") {
    // If educator, redirect to educator dashboard
    if (profile?.role === "educator") {
      redirect("/educator");
    }
    // Otherwise (missing/invalid) = unauthorized
    redirect("/login");
  }

  return <>{children}</>;
}
