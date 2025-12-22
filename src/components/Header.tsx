"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
          <Link
            href="/student"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            Student
          </Link>
          <Link
            href="/educator"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            Educator
          </Link>
          {!loading && (
            <>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
                >
                  Log Out
                </button>
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
