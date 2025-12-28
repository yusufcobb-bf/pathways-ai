"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loadStoryPool, StoryPoolEntry, isVisualBeatStory } from "@/data/story";
import { StoryPoolConfig, StoryMode } from "@/lib/supabase/types";
import { loadVariantsForArchetype } from "@/data/variants";
import { StoryTypeBadge } from "@/components/educator/StoryTypeBadge";

interface SettingsState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: boolean;
  allStories: StoryPoolEntry[];
  enabledIds: Set<string>;
  storyOrder: string[];
  mode: StoryMode;
  singleStoryId: string | null; // Stage 10: Explicit story for single_story mode
  guidedReflectionEnabled: boolean; // Stage 16: Opt-in for guided prompts
}

export default function StorySettingsPage() {
  const supabase = createClient();
  const [state, setState] = useState<SettingsState>({
    loading: true,
    saving: false,
    error: null,
    success: false,
    allStories: [],
    enabledIds: new Set(),
    storyOrder: [],
    mode: "fixed_sequence",
    singleStoryId: null,
    guidedReflectionEnabled: false, // Stage 16: default off (opt-in)
  });

  // Load initial data on mount
  useEffect(() => {
    async function loadData() {
      // Load all stories from pool
      const pool = loadStoryPool();
      const defaultOrder = pool.map((s) => s.storyId);
      const defaultEnabled = new Set(defaultOrder);

      // Fetch existing config (latest row)
      const { data: config } = await supabase
        .from("story_pool_config")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (config) {
        // Use existing config
        const enabledSet =
          config.enabled_story_ids.length > 0
            ? new Set(config.enabled_story_ids as string[])
            : defaultEnabled;

        // Start with stored order, but append any new stories not in the stored order
        let order =
          config.story_order.length > 0
            ? (config.story_order as string[])
            : defaultOrder;

        // Find stories in pool that aren't in the stored order and append them
        const storedOrderSet = new Set(order);
        const newStories = defaultOrder.filter((id) => !storedOrderSet.has(id));
        if (newStories.length > 0) {
          order = [...order, ...newStories];
          // Also enable new stories by default
          newStories.forEach((id) => enabledSet.add(id));
        }

        setState({
          loading: false,
          saving: false,
          error: null,
          success: false,
          allStories: pool,
          enabledIds: enabledSet,
          storyOrder: order,
          mode: config.mode as StoryMode,
          singleStoryId: (config.single_story_id as string | null) ?? null,
          guidedReflectionEnabled: config.guided_reflection_enabled ?? false, // Stage 16
        });
      } else {
        // No config exists - use defaults
        setState({
          loading: false,
          saving: false,
          error: null,
          success: false,
          allStories: pool,
          enabledIds: defaultEnabled,
          storyOrder: defaultOrder,
          mode: "fixed_sequence",
          singleStoryId: null,
          guidedReflectionEnabled: false, // Stage 16: default off
        });
      }
    }

    loadData();
  }, [supabase]);

  // Toggle story enabled/disabled
  const toggleStory = (storyId: string) => {
    setState((prev) => {
      const newEnabled = new Set(prev.enabledIds);
      if (newEnabled.has(storyId)) {
        newEnabled.delete(storyId);
      } else {
        newEnabled.add(storyId);
      }
      return { ...prev, enabledIds: newEnabled, success: false };
    });
  };

  // Move story up or down in order
  const moveStory = (storyId: string, direction: "up" | "down") => {
    setState((prev) => {
      const order = [...prev.storyOrder];
      const currentIndex = order.indexOf(storyId);
      if (currentIndex === -1) return prev;

      const newIndex =
        direction === "up"
          ? Math.max(0, currentIndex - 1)
          : Math.min(order.length - 1, currentIndex + 1);

      if (currentIndex === newIndex) return prev;

      // Swap positions
      order.splice(currentIndex, 1);
      order.splice(newIndex, 0, storyId);

      return { ...prev, storyOrder: order, success: false };
    });
  };

  // Change selection mode
  const setMode = (mode: StoryMode) => {
    setState((prev) => ({ ...prev, mode, success: false }));
  };

  // Stage 10: Set single story for single_story mode
  const setSingleStoryId = (storyId: string | null) => {
    setState((prev) => ({ ...prev, singleStoryId: storyId, success: false }));
  };

  // Stage 16: Toggle guided reflection prompts
  const toggleGuidedReflection = () => {
    setState((prev) => ({
      ...prev,
      guidedReflectionEnabled: !prev.guidedReflectionEnabled,
      success: false,
    }));
  };

  // Save configuration (inserts new row for version history)
  const handleSave = async () => {
    setState((prev) => ({ ...prev, saving: true, error: null, success: false }));

    const payload = {
      enabled_story_ids: Array.from(state.enabledIds),
      story_order: state.storyOrder,
      mode: state.mode,
      single_story_id: state.singleStoryId, // Stage 10
      guided_reflection_enabled: state.guidedReflectionEnabled, // Stage 16
      updated_at: new Date().toISOString(),
    };

    // Insert new config row (version history approach)
    const { error } = await supabase.from("story_pool_config").insert(payload);

    if (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: "Failed to save configuration. Please try again.",
      }));
    } else {
      setState((prev) => ({ ...prev, saving: false, success: true }));
    }
  };

  // Get stories in configured order
  const orderedStories = state.storyOrder
    .map((id) => state.allStories.find((s) => s.storyId === id))
    .filter((s): s is StoryPoolEntry => s !== undefined);

  // Count enabled stories
  const enabledCount = state.enabledIds.size;

  if (state.loading) {
    return (
      <div className="py-8">
        <p className="text-zinc-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">
            Story Settings
          </h1>
          <p className="text-zinc-600">
            Configure which stories are active and their order.
          </p>
        </div>
        <Link
          href="/educator"
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Warning Banner */}
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Changes apply to new sessions only. Students
          currently in a session will not be affected.
        </p>
      </div>

      {/* Mode Selection */}
      <section className="mb-6 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Selection Mode
        </h2>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="mode"
              value="fixed_sequence"
              checked={state.mode === "fixed_sequence"}
              onChange={() => setMode("fixed_sequence")}
              className="mt-1"
            />
            <div>
              <span className="font-medium text-zinc-900">Fixed Sequence</span>
              <p className="text-sm text-zinc-500">
                Students progress through stories in the order you set below
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="mode"
              value="single_story"
              checked={state.mode === "single_story"}
              onChange={() => setMode("single_story")}
              className="mt-1"
            />
            <div>
              <span className="font-medium text-zinc-900">Single Story</span>
              <p className="text-sm text-zinc-500">
                All students play only the first enabled story
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="mode"
              value="shuffled_sequence"
              checked={state.mode === "shuffled_sequence"}
              onChange={() => setMode("shuffled_sequence")}
              className="mt-1"
            />
            <div>
              <span className="font-medium text-zinc-900">
                Shuffled Sequence
              </span>
              <p className="text-sm text-zinc-500">
                Each student receives a randomized order of all enabled stories
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* Single Story Selection (Stage 10) - Only shown for single_story mode */}
      {state.mode === "single_story" && (
        <section className="mb-6 rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Single Story Selection
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            Choose which story all students will play.
          </p>
          <select
            value={state.singleStoryId ?? ""}
            onChange={(e) =>
              setSingleStoryId(e.target.value === "" ? null : e.target.value)
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 focus:border-zinc-500 focus:outline-none"
          >
            <option value="">First enabled story (default)</option>
            {orderedStories
              .filter((entry) => state.enabledIds.has(entry.storyId))
              .map((entry) => (
                <option key={entry.storyId} value={entry.storyId}>
                  {entry.story.title}
                </option>
              ))}
          </select>
          {state.singleStoryId &&
            !state.enabledIds.has(state.singleStoryId) && (
              <p className="mt-2 text-sm text-amber-600">
                Selected story is not enabled. Will fall back to first enabled
                story.
              </p>
            )}
        </section>
      )}

      {/* Guided Reflection Settings - Stage 16 */}
      <section className="mb-6 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Reflection Settings
        </h2>
        <label className="flex cursor-pointer items-start gap-3">
          <button
            onClick={toggleGuidedReflection}
            className={`relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
              state.guidedReflectionEnabled ? "bg-green-500" : "bg-zinc-300"
            }`}
            aria-label={
              state.guidedReflectionEnabled
                ? "Disable guided reflection"
                : "Enable guided reflection"
            }
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                state.guidedReflectionEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <div>
            <span className="font-medium text-zinc-900">
              Enable Guided Reflection Prompts
            </span>
            <p className="text-sm text-zinc-500">
              After story completion, show students 2-3 optional reflection
              questions. Responses are visible in session details.
            </p>
          </div>
        </label>
      </section>

      {/* Story Pool */}
      <section className="mb-6 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Story Pool</h2>
        <p className="mb-4 text-sm text-zinc-500">
          {enabledCount} of {orderedStories.length} stories enabled
        </p>

        <div className="space-y-3">
          {orderedStories.map((entry, index) => {
            const isEnabled = state.enabledIds.has(entry.storyId);
            return (
              <div
                key={entry.storyId}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  isEnabled
                    ? "border-zinc-200 bg-white"
                    : "border-zinc-100 bg-zinc-50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Toggle Switch */}
                  <button
                    onClick={() => toggleStory(entry.storyId)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      isEnabled ? "bg-green-500" : "bg-zinc-300"
                    }`}
                    aria-label={isEnabled ? "Disable story" : "Enable story"}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        isEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>

                  {/* Story Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900">
                        {entry.story.title}
                      </span>
                      {isVisualBeatStory(entry.story) ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Visual Beat
                        </span>
                      ) : entry.isGenerated ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          AI-Generated
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                          Prose
                        </span>
                      )}

                      {/* Stage 38: Story type badge */}
                      {isVisualBeatStory(entry.story) && (
                        <StoryTypeBadge story={entry.story} />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">ID: {entry.storyId}</p>
                    {/* Stage 8: Show variants */}
                    {(() => {
                      const variants = loadVariantsForArchetype(entry.storyId);
                      if (variants.length === 0) {
                        return (
                          <p className="mt-1 text-xs text-zinc-400">
                            No variants (base story only)
                          </p>
                        );
                      }
                      return (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-zinc-600">
                            {variants.length} variant{variants.length !== 1 ? "s" : ""}:
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {variants.map((v) => (
                              <li
                                key={v.variantId}
                                className="text-xs text-zinc-500"
                              >
                                • {v.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Reorder Buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => moveStory(entry.storyId, "up")}
                    disabled={index === 0}
                    className="rounded px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    Up
                  </button>
                  <button
                    onClick={() => moveStory(entry.storyId, "down")}
                    disabled={index === orderedStories.length - 1}
                    className="rounded px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    Down
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={state.saving || enabledCount === 0}
          className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-zinc-900"
        >
          {state.saving ? "Saving..." : "Save Configuration"}
        </button>

        {enabledCount === 0 && (
          <p className="text-sm text-red-600">
            At least one story must be enabled.
          </p>
        )}

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        {state.success && (
          <p className="text-sm text-green-600">Configuration saved!</p>
        )}
      </div>
    </div>
  );
}
