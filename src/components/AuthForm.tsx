"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
  role?: "student" | "educator";
}

export default function AuthForm({ mode, role = "student" }: AuthFormProps) {
  const roleLabel = role === "educator" ? "Educator" : "Student";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const effectiveRole = role ?? "student";
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: effectiveRole }
          }
        });
        if (error) throw error;

        const user = data.user;
        if (!user) {
          throw new Error("Signup succeeded but no user returned");
        }

        // Wait for trigger, then fetch profile with retry (scoped by user_id)
        await new Promise((r) => setTimeout(r, 200));
        let { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        if (!profile) {
          await new Promise((r) => setTimeout(r, 200));
          const retry = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single();
          profile = retry.data;
        }
        const finalRole = profile?.role ?? effectiveRole ?? "student";
        router.push(finalRole === "educator" ? "/educator" : "/student");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const user = data.user;
        if (!user) {
          throw new Error("Login succeeded but no user returned");
        }

        // Fetch profile role (no delays, no retries, scoped by user_id)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        const finalRole = profile?.role ?? "student";
        router.push(finalRole === "educator" ? "/educator" : "/student");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="mb-8 text-2xl font-bold text-zinc-900">
        {roleLabel} {mode === "login" ? "Log In" : "Sign Up"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading
            ? "Loading..."
            : mode === "login"
            ? "Log In"
            : "Sign Up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link href={`/signup?role=${role}`} className="font-medium text-zinc-900 hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/login?role=${role}`} className="font-medium text-zinc-900 hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
