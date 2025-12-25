import Link from "next/link";
import { loadStoryPool } from "@/data/story";
import { loadVariantsForArchetype } from "@/data/variants";

/**
 * Educator Story Library Page (Stage 9)
 *
 * Read-only listing of all available story archetypes.
 * Displays each archetype with its variant count.
 */

export default function StoryLibraryPage() {
  const pool = loadStoryPool();

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">
            Story Library
          </h1>
          <p className="text-zinc-600">
            Browse all available stories and their variants.
          </p>
        </div>
        <Link
          href="/educator"
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Story Pool Info */}
      <p className="mb-6 text-sm text-zinc-500">
        {pool.length} {pool.length === 1 ? "story" : "stories"} in the pool
      </p>

      {/* Story List */}
      <div className="space-y-4">
        {pool.map((entry) => {
          const variants = loadVariantsForArchetype(entry.archetypeId);
          const variantCount = variants.length;

          return (
            <div
              key={entry.storyId}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-6"
            >
              <div>
                {/* Story Title */}
                <h2 className="text-lg font-semibold text-zinc-900">
                  {entry.story.title}
                </h2>

                {/* Archetype ID */}
                <p className="mt-1 text-sm text-zinc-500">
                  Archetype:{" "}
                  <span className="font-mono text-xs">{entry.archetypeId}</span>
                </p>

                {/* Variant Count & Source Badge */}
                <div className="mt-2 flex items-center gap-3">
                  {variantCount > 0 ? (
                    <span className="text-sm text-zinc-600">
                      {variantCount} {variantCount === 1 ? "variant" : "variants"}{" "}
                      available
                    </span>
                  ) : (
                    <span className="text-sm text-zinc-400">
                      No variants (base story only)
                    </span>
                  )}

                  {entry.isGenerated ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      AI-Generated
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                      Fallback
                    </span>
                  )}
                </div>
              </div>

              {/* View Button */}
              <Link
                href={`/educator/stories/${entry.archetypeId}`}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                View
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
