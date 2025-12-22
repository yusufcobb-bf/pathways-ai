"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StorySession } from "@/lib/supabase/types";
import { VIRTUES, VirtueScores } from "@/data/virtues";

function VirtueScoreDisplay({ scores }: { scores: VirtueScores }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
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
  );
}

export default function EducatorDashboard() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<StorySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllSessions() {
      const { data } = await supabase
        .from("story_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      setSessions(data || []);
      setLoading(false);
    }

    fetchAllSessions();
  }, [supabase]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="py-8">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">
        Educator Dashboard
      </h1>
      <p className="mb-8 text-zinc-600">
        View student story sessions and virtue outcomes.
      </p>

      {loading ? (
        <p className="text-zinc-500">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-500">No student sessions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded
          </p>
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-lg border border-zinc-200 bg-white p-6"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-zinc-900">
                  The New Student
                </span>
                <span className="text-sm text-zinc-500">
                  {formatDate(session.created_at)}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Student ID: {session.user_id.slice(0, 8)}...
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Choices: {session.choices.length} decisions made
              </p>

              {session.virtue_scores && (
                <VirtueScoreDisplay scores={session.virtue_scores} />
              )}

              {session.reflection && (
                <div className="mt-4 border-t border-zinc-100 pt-4">
                  <p className="text-sm font-medium text-zinc-700">
                    Student Reflection:
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
