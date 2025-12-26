"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { StorySession } from "@/lib/supabase/types";
import { VIRTUES, VirtueScores } from "@/data/virtues";
import { getStoryTitleById, getStoryPoolPosition } from "@/data/story";
import { getVariantCountForArchetype, getVariantTitle, getVariantDisplayInfo } from "@/data/variants";
import SessionDetail from "@/components/SessionDetail";

function VirtueScoreBadges({ scores }: { scores: VirtueScores }) {
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

function SessionCard({ session }: { session: StorySession }) {
  const [expanded, setExpanded] = useState(false);

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
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      {/* Summary Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="font-medium text-zinc-900">
            {/* Stage 8: Show variant title if available, otherwise archetype title */}
            {getVariantTitle(session.story_id, session.variant_id) ?? getStoryTitleById(session.story_id)}
          </span>
          <p className="text-xs text-zinc-500">
            {(() => {
              const pos = getStoryPoolPosition(session.story_id);
              const poolInfo = pos ? `Story ${pos.position} of ${pos.total}` : "Custom Story";

              // Stage 8: Show which variant was played
              const variantDisplay = getVariantDisplayInfo(session.story_id, session.variant_id);

              return `${poolInfo} • Variant: ${variantDisplay}`;
            })()}
          </p>
        </div>
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
        <VirtueScoreBadges scores={session.virtue_scores} />
      )}

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 text-sm font-medium text-zinc-600 hover:text-zinc-900"
      >
        {expanded ? "Hide Details ▲" : "View Details ▼"}
      </button>

      {/* Expandable Detail Section */}
      {expanded && <SessionDetail session={session} />}
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

  return (
    <div className="py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">
            Educator Dashboard
          </h1>
          <p className="text-zinc-600">
            Review student sessions, virtue outcomes, and discussion prompts.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/educator/classrooms"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Classrooms
          </Link>
          <Link
            href="/educator/story-settings"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Story Settings
          </Link>
          <Link
            href="/educator/stories"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Story Library
          </Link>
          <Link
            href="/educator/student-preview"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Preview Student Experience
          </Link>
          <Link
            href="/educator/info"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            How It Works
          </Link>
        </div>
      </div>

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
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
