/**
 * Stage 41: StoryCard Component
 *
 * Displays a story card for the Student Home grid.
 * Shows title, Visual Beat badge, story type badge, and focused virtue (if training).
 *
 * CHECK E compliance:
 * - storyType read directly from story metadata
 * - focusedVirtue read directly from story metadata (if present)
 * - No hardcoded virtue labels
 * - No virtue inference from storyId
 * - Diagnostic stories do NOT display virtue label
 */

import Link from "next/link";
import { getStoryGradient, getStoryEnvironment } from "@/data/story-environments";

interface StoryCardProps {
  storyId: string;
  archetypeId: string;
  title: string;
  storyType: "diagnostic" | "training" | undefined;
  focusedVirtue?: string;
}

// Default gradient for stories without environment config
const DEFAULT_GRADIENT = "linear-gradient(to bottom right, #e2e8f0, #cbd5e1)";

export default function StoryCard({
  storyId,
  archetypeId,
  title,
  storyType,
  focusedVirtue,
}: StoryCardProps) {
  // Get gradient from story environment (fallback to default)
  const gradient = getStoryGradient(archetypeId, "intro") ?? DEFAULT_GRADIENT;

  // Get subtitle from environment if available
  const environment = getStoryEnvironment(archetypeId);
  const subtitle = environment?.subtitle;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Gradient Header */}
      <div
        className="h-24"
        style={{ background: gradient }}
      />

      {/* Content */}
      <div className="p-4">
        {/* Visual Beat Badge (always present) */}
        <div className="mb-2 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            Visual Beat
          </span>

          {/* Story Type Badge - CHECK E: Read directly from metadata */}
          {storyType === "diagnostic" ? (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              Diagnostic Assessment
            </span>
          ) : storyType === "training" && focusedVirtue ? (
            <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
              Skill Training: {focusedVirtue}
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h3 className="mb-1 text-lg font-semibold text-zinc-900">{title}</h3>

        {/* Subtitle */}
        {subtitle && (
          <p className="mb-4 text-sm text-zinc-500">{subtitle}</p>
        )}

        {/* Play Button */}
        <Link
          href={`/student/play/${storyId}`}
          className="mt-2 block w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Play Story
        </Link>
      </div>
    </div>
  );
}
