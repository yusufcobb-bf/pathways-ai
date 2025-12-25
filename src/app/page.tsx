import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, get role and redirect to appropriate dashboard
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role === "educator") {
      redirect("/educator");
    } else if (profile?.role === "student") {
      redirect("/student");
    }
    // If no valid role, show landing page (will need to log out and back in)
  }

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
        Welcome to Pathways AI
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-600">
        An educational platform for students and educators.
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          href="/login?role=student"
          className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          I&apos;m a Student
        </Link>
        <Link
          href="/login?role=educator"
          className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
        >
          I&apos;m an Educator
        </Link>
      </div>
    </div>
  );
}
