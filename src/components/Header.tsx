"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/lib/supabase/types";

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<UserRole | null>(null);

  // Fetch user role when authenticated
  useEffect(() => {
    async function fetchRole() {
      if (!user) {
        setRole(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      setRole((profile?.role as UserRole) ?? null);
    }

    fetchRole();
  }, [user, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setRole(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-semibold text-zinc-900">
          Pathways AI
        </Link>
        <nav className="flex items-center gap-6">
          {/* Show Student link for students */}
          {role === "student" && (
            <Link
              href="/student"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Student
            </Link>
          )}
          {/* Show Educator link only for educators */}
          {role === "educator" && (
            <Link
              href="/educator"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Educator
            </Link>
          )}
          {!loading && (
            <>
              {user ? (
                <>
                  <span className="text-sm text-zinc-500">
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
                >
                  Log In
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
