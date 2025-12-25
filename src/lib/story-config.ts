/**
 * Story Pool Configuration Helpers (Server-side)
 *
 * Provides functions to fetch educator configuration from Supabase
 * and apply it to the story pool for deterministic story selection.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { StoryPoolConfig, StoryMode, StudentStoryCycle } from "@/lib/supabase/types";
import { StoryPoolEntry } from "@/data/story";

/**
 * Shuffle array using Fisher-Yates algorithm.
 *
 * RANDOMNESS GUARDRAIL: This uses simple Math.random() intentionally.
 * This is NOT AI-driven randomness and is acceptable for controlled
 * classroom variety. Do not replace with seeded, cryptographic, or
 * AI-based randomness unless explicitly instructed.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Fetch the latest story pool configuration from Supabase.
 * Uses "latest row wins" strategy (ORDER BY updated_at DESC LIMIT 1).
 *
 * @returns The latest config, or null if none exists or on error.
 */
export async function getStoryPoolConfig(
  supabase: SupabaseClient
): Promise<StoryPoolConfig | null> {
  try {
    const { data, error } = await supabase
      .from("story_pool_config")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // No config exists or query failed - use defaults
      return null;
    }

    return data as StoryPoolConfig;
  } catch {
    // Any unexpected error - fall back to defaults
    console.warn("Failed to fetch story pool config, using defaults");
    return null;
  }
}

/**
 * Apply educator configuration to filter and order the story pool.
 *
 * Rules:
 * - If enabled_story_ids is empty → treat as "all enabled"
 * - If story_order is empty → keep pool's natural order
 * - Invalid story IDs are silently skipped
 * - If result is empty → fall back to original unfiltered pool
 *
 * @param pool The raw story pool from loadStoryPool()
 * @param config The educator configuration (or null for defaults)
 * @returns The filtered and ordered story pool
 */
export function applyConfigToPool(
  pool: StoryPoolEntry[],
  config: StoryPoolConfig | null
): StoryPoolEntry[] {
  if (!config || pool.length === 0) {
    return pool;
  }

  // Step 1: Filter by enabled stories
  let filteredPool: StoryPoolEntry[];

  if (config.enabled_story_ids.length === 0) {
    // Empty enabled list = all stories enabled
    filteredPool = [...pool];
  } else {
    // Only include stories that are in enabled_story_ids
    const enabledSet = new Set(config.enabled_story_ids);
    filteredPool = pool.filter((entry) => enabledSet.has(entry.storyId));
  }

  // Step 2: Apply custom order if provided
  if (config.story_order.length > 0) {
    // Create order map: storyId -> position
    const orderMap = new Map(
      config.story_order.map((id, index) => [id, index])
    );

    // Sort by order position (stories not in order go to end)
    filteredPool.sort((a, b) => {
      const orderA = orderMap.get(a.storyId) ?? Infinity;
      const orderB = orderMap.get(b.storyId) ?? Infinity;
      return orderA - orderB;
    });
  }

  // Step 3: Fallback if filtering removed all stories
  if (filteredPool.length === 0) {
    console.warn("Config filtered out all stories, using original pool");
    return pool;
  }

  return filteredPool;
}

/**
 * Select a story based on the configured mode and completed session count.
 *
 * Mode behavior (all operate on the ordered+enabled pool):
 * - fixed_sequence: Students progress through stories in educator-defined order
 * - single_story: All students play first enabled story only
 * - shuffled_sequence: Coming Soon - falls back to fixed_sequence
 *
 * @param pool The configured (filtered + ordered) story pool
 * @param mode The selection mode
 * @param completedSessions The number of completed sessions for this user
 * @returns The selected story entry
 */
export function selectStoryByMode(
  pool: StoryPoolEntry[],
  mode: StoryMode,
  completedSessions: number
): StoryPoolEntry {
  if (pool.length === 0) {
    throw new Error("Cannot select from empty pool");
  }

  switch (mode) {
    case "single_story":
      // All students play first enabled story only
      return pool[0];

    case "shuffled_sequence":
      // This mode requires async handling - should use selectStoryForShuffledMode instead
      console.warn("shuffled_sequence called via sync function, using fixed_sequence");
    // fallthrough intentional
    case "fixed_sequence":
    default:
      // Students progress through stories in educator-defined order
      const index = completedSessions % pool.length;
      return pool[index];
  }
}

/**
 * Select a story for shuffled_sequence mode (async, requires DB access).
 *
 * This mode gives each student a unique randomized order of stories.
 * When they complete all stories in their shuffled order, a new shuffle is generated.
 *
 * COMPLETED SESSIONS GUARDRAIL: completedSessions must only count sessions
 * where reflection IS NOT NULL. Do not count started, abandoned, or in-progress sessions.
 *
 * @param supabase The Supabase client
 * @param userId The current user's ID
 * @param pool The configured (filtered + ordered) story pool
 * @param completedSessions The number of COMPLETED sessions (reflection saved)
 * @returns The selected story entry
 */
export async function selectStoryForShuffledMode(
  supabase: SupabaseClient,
  userId: string,
  pool: StoryPoolEntry[],
  completedSessions: number
): Promise<StoryPoolEntry> {
  if (pool.length === 0) {
    throw new Error("Cannot select from empty pool");
  }

  // Get current pool story IDs for comparison
  const currentPoolIds = pool.map((entry) => entry.storyId);
  const positionInCycle = completedSessions % pool.length;
  const expectedCycleIndex = Math.floor(completedSessions / pool.length);

  // Fetch existing cycle state
  const { data: cycleData } = await supabase
    .from("student_story_cycles")
    .select("*")
    .eq("user_id", userId)
    .single();

  const existingCycle = cycleData as StudentStoryCycle | null;

  // Determine if we need a new shuffle
  const needsNewShuffle =
    !existingCycle ||
    existingCycle.shuffled_order.length === 0 ||
    !poolMatchesShuffledOrder(currentPoolIds, existingCycle.shuffled_order) ||
    existingCycle.cycle_index !== expectedCycleIndex;

  if (needsNewShuffle) {
    // Generate new shuffled order
    const newShuffledOrder = shuffleArray(currentPoolIds);

    // Upsert the cycle state
    const { error } = await supabase.from("student_story_cycles").upsert({
      user_id: userId,
      cycle_index: expectedCycleIndex,
      shuffled_order: newShuffledOrder,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to save shuffle state:", error);
      // Fallback to fixed_sequence behavior
      return pool[positionInCycle];
    }

    // Return story at current position in new shuffle
    const storyId = newShuffledOrder[positionInCycle];
    const entry = pool.find((e) => e.storyId === storyId);
    return entry ?? pool[0];
  }

  // Use existing shuffle
  const storyId = existingCycle.shuffled_order[positionInCycle];
  const entry = pool.find((e) => e.storyId === storyId);
  return entry ?? pool[0];
}

/**
 * Check if the current pool matches the shuffled order (same stories, possibly different order).
 */
function poolMatchesShuffledOrder(
  poolIds: string[],
  shuffledOrder: string[]
): boolean {
  if (poolIds.length !== shuffledOrder.length) {
    return false;
  }
  const poolSet = new Set(poolIds);
  return shuffledOrder.every((id) => poolSet.has(id));
}
