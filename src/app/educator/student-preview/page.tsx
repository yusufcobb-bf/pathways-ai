"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import StoryPlayer from "@/components/StoryPlayer";
import { loadStoryPool, StoryPoolEntry, isVisualBeatStory } from "@/data/story";
import {
  loadVariantsForArchetype,
  loadBaseStoryAsVariant,
  variantToStory,
  StoryVariant,
} from "@/data/variants";

/**
 * Educator Student Preview Page (Stage 11b)
 *
 * Two-phase UX:
 * 1. Setup: Educator selects story/variant, then clicks "Start Preview"
 * 2. Playing: Settings locked, StoryPlayer runs in preview mode
 *
 * STRICT RULES:
 * - NO database writes
 * - NO virtue score computation
 * - NO session counting
 */

type PreviewPhase = "setup" | "playing";

export default function StudentPreviewPage() {
  // Load all stories from pool
  const pool = useMemo(() => loadStoryPool(), []);

  // Phase state
  const [phase, setPhase] = useState<PreviewPhase>("setup");

  // State for selected story and variant
  const [selectedStoryId, setSelectedStoryId] = useState<string>(
    pool[0]?.storyId ?? ""
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );

  // Get variants for selected story
  const variants = useMemo(() => {
    if (!selectedStoryId) return [];
    return loadVariantsForArchetype(selectedStoryId);
  }, [selectedStoryId]);

  // Get base story as variant option
  const baseStory = useMemo(() => {
    if (!selectedStoryId) return null;
    return loadBaseStoryAsVariant(selectedStoryId);
  }, [selectedStoryId]);

  // Build all version options (base + variants)
  const allVersions = useMemo(() => {
    const versions: StoryVariant[] = [];
    if (baseStory) versions.push(baseStory);
    versions.push(...variants);
    return versions;
  }, [baseStory, variants]);

  // Get selected entry from pool
  const selectedEntry = useMemo(() => {
    return pool.find((e) => e.storyId === selectedStoryId) ?? pool[0];
  }, [pool, selectedStoryId]);

  // Stage 27: Check if selected story is a visual beat story
  const isVisualBeat = useMemo(() => {
    return selectedEntry ? isVisualBeatStory(selectedEntry.story) : false;
  }, [selectedEntry]);

  // Get selected variant (or base story) - only for prose stories
  const selectedVariant = useMemo(() => {
    // Visual beat stories don't use variants
    if (isVisualBeat) return null;

    if (selectedVariantId === null) {
      return baseStory;
    }
    return variants.find((v) => v.variantId === selectedVariantId) ?? baseStory;
  }, [selectedVariantId, variants, baseStory, isVisualBeat]);

  // Handle story change - reset variant selection
  const handleStoryChange = (storyId: string) => {
    setSelectedStoryId(storyId);
    setSelectedVariantId(null); // Reset to base story
  };

  // Handle variant change
  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId === "" ? null : variantId);
  };

  // Start preview - transition to playing phase
  const handleStartPreview = () => {
    setPhase("playing");
  };

  // Exit preview - return to setup phase
  const handlePreviewExit = () => {
    setPhase("setup");
  };

  // If no story selected, show loading
  // Stage 27: Visual beat stories don't need variants
  if (!selectedEntry || (!isVisualBeat && !selectedVariant)) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <p className="text-zinc-500">Loading preview...</p>
      </div>
    );
  }

  // Stage 27: Use story directly for visual beats, or convert variant for prose
  const story = isVisualBeat
    ? selectedEntry.story
    : variantToStory(selectedVariant!);

  // Setup Phase: Show dropdowns and "Start Preview" button
  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-zinc-900">
              Preview Student Experience
            </h1>
            <p className="text-zinc-600">
              Select a story and variant to preview as a student would see it.
            </p>
          </div>
          <Link
            href="/educator"
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Settings Card */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Preview Settings
          </h2>

          <div className="space-y-4">
            {/* Story Selector */}
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Story
              </label>
              <select
                value={selectedStoryId}
                onChange={(e) => handleStoryChange(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-700 focus:border-zinc-500 focus:outline-none"
              >
                {pool.map((entry) => (
                  <option key={entry.storyId} value={entry.storyId}>
                    {entry.story.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Variant Selector - only for prose stories */}
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Variant
              </label>
              {/* Stage 42: Removed "Visual Beat" terminology per MC-5 */}
              {isVisualBeat ? (
                <>
                  <select
                    disabled
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-zinc-400"
                  >
                    <option>Interactive Story (no variants)</option>
                  </select>
                  <p className="mt-1 text-xs text-zinc-500">
                    Interactive stories are explicitly authored and don&apos;t support variants
                  </p>
                </>
              ) : (
                <>
                  <select
                    value={selectedVariantId ?? ""}
                    onChange={(e) => handleVariantChange(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-700 focus:border-zinc-500 focus:outline-none"
                  >
                    {allVersions.map((version) => (
                      <option
                        key={version.variantId ?? "base"}
                        value={version.variantId ?? ""}
                      >
                        {version.variantId === null
                          ? "Base Story"
                          : version.title}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-zinc-500">
                    {allVersions.length === 1
                      ? "No variants available for this story"
                      : `${allVersions.length - 1} variant${allVersions.length - 1 !== 1 ? "s" : ""} available`}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Start Preview Button */}
          <button
            onClick={handleStartPreview}
            className="mt-6 w-full rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Start Preview
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Preview Mode:</strong> No data will be saved. You will
            experience the story exactly as a student would, but virtue scores
            and reflections are disabled.
          </p>
        </div>
      </div>
    );
  }

  // Playing Phase: Show StoryPlayer with locked settings
  return (
    <StoryPlayer
      key={`preview-${selectedStoryId}-${selectedVariantId}`}
      story={story}
      storyId={selectedStoryId}
      archetypeId={selectedEntry.archetypeId}
      variantId={isVisualBeat ? null : selectedVariant?.variantId ?? null}
      isGenerated={selectedEntry.isGenerated}
      previewMode={true}
      onPreviewExit={handlePreviewExit}
      guidedReflectionEnabled={true} // Stage 16: Always show prompts in preview
    />
  );
}
