"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { StorySession } from "@/lib/supabase/types";
import { VIRTUES, VirtueScores } from "@/data/virtues";
import { getStoryTitleById } from "@/data/story";
import { getVariantTitle } from "@/data/variants";

function VirtueScoreDisplay({ scores }: { scores: VirtueScores }) {
  return (
    <div className="mt-4 border-t border-zinc-100 pt-4">
      <p className="text-sm font-medium text-zinc-700">Virtue Scores:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {VIRTUES.map((virtue) => {
          const score = scores[virtue];
          if (score === 0) return null;
          return (
            <span
              key={virtue}
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                score > 0
                  ? "bg-green-100 text-green-700"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {virtue}: {score > 0 ? `+${score}` : score}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function PastSessionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [sessions, setSessions] = useState<StorySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    async function fetchSessions() {
      const { data } = await supabase
        .from("story_sessions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      setSessions(data || []);
      setLoading(false);
    }

    fetchSessions();
  }, [user, supabase, authLoading, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading || !user) {
    return <p className="py-8 text-zinc-500">Loading...</p>;
  }

  return (
    <div className="py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Past Sessions</h1>
        <div className="flex gap-4">
          {/* Stage 41: My Classrooms link removed for MVP */}
          <Link
            href="/student"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Choose a Story
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-500">No sessions yet.</p>
          <Link
            href="/student"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline"
          >
            Play your first story
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-lg border border-zinc-200 bg-white p-6"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-zinc-900">
                  {/* Stage 8: Show variant title if available */}
                  {getVariantTitle(session.story_id, session.variant_id) ?? getStoryTitleById(session.story_id)}
                </span>
                <span className="text-sm text-zinc-500">
                  {formatDate(session.created_at)}
                </span>
              </div>
              <p className="text-sm text-zinc-600">
                Choices: {session.choices.length} decisions made
              </p>
              {session.virtue_scores && (
                <VirtueScoreDisplay scores={session.virtue_scores} />
              )}
              {session.reflection && (
                <div className="mt-4 border-t border-zinc-100 pt-4">
                  <p className="text-sm font-medium text-zinc-700">
                    Reflection:
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {session.reflection}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
