/**
 * Story Variants System (Stage 8)
 *
 * Story variants are surface-level narrative variations of the same story structure.
 * They share identical checkpoints, choice IDs, and virtue scoring but have
 * different settings, names, and wording.
 *
 * Key concepts:
 * - Archetype: The canonical story structure (defines checkpoints, choice IDs, scoring)
 * - Variant: Cosmetic variation of an archetype (different narrative text only)
 */

import { Checkpoint, Story, getStoryFromPool, isVisualBeatStory } from "./story";
import { safeValidateGeneratedStory } from "@/lib/ai/story-schema";

/**
 * A story variant - cosmetic variation of a story archetype.
 *
 * Rules:
 * - Must match archetype checkpoint structure exactly
 * - Choice IDs must be identical (c1-a, c1-b, c1-c, c2-a, c2-b, c3-a, c3-b, c3-c)
 * - Only narrative text (title, intro, prompts, choice text, ending) may differ
 */
export interface StoryVariant {
  archetypeId: string; // e.g., "new-student"
  variantId: string | null; // e.g., "cafeteria-setting", null = base/canonical story
  title: string;
  intro: string;
  checkpoints: Checkpoint[];
  ending: string;
}

/**
 * Variant file structure (JSON format)
 */
interface VariantFileData {
  archetypeId: string;
  variantId: string;
  title: string;
  intro: string;
  checkpoints: Array<{
    id: string;
    prompt: string; // Uses "prompt" in JSON, normalized to "narrative"
    choices: Array<{ id: string; text: string }>;
  }>;
  ending: string;
}

// ============================================================
// VARIANT LOADING
// ============================================================

// Static variant imports organized by archetype
// Using require() for Next.js build compatibility

// Variants for "community-garden-discovery" archetype
let communityGardenVariant1: unknown = null;
let communityGardenVariant2: unknown = null;

try {
  communityGardenVariant1 = require("./variants/community-garden-discovery/variant-a.json");
} catch {
  // Variant doesn't exist
}

try {
  communityGardenVariant2 = require("./variants/community-garden-discovery/variant-b.json");
} catch {
  // Variant doesn't exist
}

// Map of archetype IDs to their variant data arrays
const VARIANT_DATA_MAP: Record<string, unknown[]> = {
  "community-garden-discovery": [communityGardenVariant1, communityGardenVariant2],
};

/**
 * Normalize variant file data to StoryVariant.
 * Converts "prompt" field to "narrative" for internal use.
 */
function normalizeVariantData(data: VariantFileData): StoryVariant {
  return {
    archetypeId: data.archetypeId,
    variantId: data.variantId,
    title: data.title,
    intro: data.intro,
    checkpoints: data.checkpoints.map((cp) => ({
      id: cp.id,
      narrative: cp.prompt, // Map "prompt" to "narrative"
      choices: cp.choices,
    })),
    ending: data.ending,
  };
}

/**
 * Validate variant data structure.
 * Uses existing Zod schema for story validation.
 */
function validateVariantData(data: unknown): VariantFileData | null {
  if (!data || typeof data !== "object") return null;

  const obj = data as Record<string, unknown>;

  // Check required variant-specific fields
  if (typeof obj.archetypeId !== "string" || typeof obj.variantId !== "string") {
    return null;
  }

  // Check required story fields exist
  if (
    typeof obj.title !== "string" ||
    typeof obj.intro !== "string" ||
    typeof obj.ending !== "string" ||
    !Array.isArray(obj.checkpoints)
  ) {
    return null;
  }

  // Validate story structure using existing schema
  const validation = safeValidateGeneratedStory({
    ...obj,
    id: obj.variantId, // Use variantId as id for validation
  });

  if (!validation.success) {
    console.warn(`Variant validation failed for ${obj.variantId}:`, validation.error?.message);
    return null;
  }

  // Return as VariantFileData (safe after all checks)
  return {
    archetypeId: obj.archetypeId,
    variantId: obj.variantId,
    title: obj.title,
    intro: obj.intro,
    ending: obj.ending,
    checkpoints: obj.checkpoints as VariantFileData["checkpoints"],
  };
}

/**
 * Load all variants for a given archetype.
 *
 * REFINEMENT 1: Explicit Variant Ordering
 * Variants are sorted alphabetically by variantId to ensure deterministic
 * ordering regardless of filesystem order. NO randomness.
 */
export function loadVariantsForArchetype(archetypeId: string): StoryVariant[] {
  const variantDataList = VARIANT_DATA_MAP[archetypeId] || [];
  const variants: StoryVariant[] = [];

  for (const data of variantDataList) {
    const validated = validateVariantData(data);
    if (validated && validated.archetypeId === archetypeId) {
      variants.push(normalizeVariantData(validated));
    }
  }

  // Sort alphabetically by variantId for deterministic ordering
  // This ensures consistent order regardless of filesystem or import order.
  variants.sort((a, b) => {
    if (a.variantId === null) return -1;
    if (b.variantId === null) return 1;
    return a.variantId.localeCompare(b.variantId);
  });

  return variants;
}

/**
 * Convert a base story (from pool) to a StoryVariant with variantId: null.
 *
 * REFINEMENT 2: Base-Story Fallback Semantics
 * When no variants exist, the canonical archetype story is used with
 * variantId explicitly set to null.
 */
export function loadBaseStoryAsVariant(archetypeId: string): StoryVariant | null {
  const poolEntry = getStoryFromPool(archetypeId);
  if (!poolEntry) return null;

  // Stage 27: Visual beat stories don't support variants (explicitly authored)
  if (isVisualBeatStory(poolEntry.story)) {
    return null;
  }

  // Prose story - return as variant
  const proseStory = poolEntry.story as Story;
  return {
    archetypeId: archetypeId,
    variantId: null, // Explicitly null for base/canonical story
    title: proseStory.title,
    intro: proseStory.intro,
    checkpoints: proseStory.checkpoints,
    ending: proseStory.ending,
  };
}

/**
 * Get the count of variants for an archetype (including base story).
 * Returns { variantCount, hasVariants }
 */
export function getVariantCountForArchetype(archetypeId: string): {
  variantCount: number;
  hasVariants: boolean;
} {
  const variants = loadVariantsForArchetype(archetypeId);
  return {
    variantCount: variants.length,
    hasVariants: variants.length > 0,
  };
}

// ============================================================
// VARIANT SELECTION
// ============================================================

/**
 * Select a variant for a story based on completed sessions.
 *
 * Selection is DETERMINISTIC - no randomness:
 * - Session 0 → variant[0]
 * - Session 1 → variant[1]
 * - Session 2 → variant[2]
 * - Session 3 → variant[0] (cycle)
 *
 * If no variants exist, returns the base story with variantId: null.
 *
 * @param archetypeId The archetype (story) ID
 * @param completedSessions Number of completed sessions for this user
 * @returns The selected StoryVariant
 */
export function selectVariantForStory(
  archetypeId: string,
  completedSessions: number
): StoryVariant {
  const variants = loadVariantsForArchetype(archetypeId);

  if (variants.length === 0) {
    // No variants exist - return base story with variantId: null
    const baseStory = loadBaseStoryAsVariant(archetypeId);
    if (baseStory) {
      return baseStory;
    }

    // Should never happen if story exists in pool
    throw new Error(`No base story found for archetype: ${archetypeId}`);
  }

  // Deterministic selection - NO randomness
  const variantIndex = completedSessions % variants.length;
  return variants[variantIndex];
}

/**
 * Convert a StoryVariant back to a Story object for StoryPlayer compatibility.
 */
export function variantToStory(variant: StoryVariant): Story {
  return {
    title: variant.title,
    intro: variant.intro,
    checkpoints: variant.checkpoints,
    ending: variant.ending,
  };
}

/**
 * Get variant display info for educator views.
 *
 * Returns human-readable variant description:
 * - variantId: null → "Base Story"
 * - variantId: "playground" with 3 variants → "playground (1 of 3)"
 */
export function getVariantDisplayInfo(
  archetypeId: string,
  variantId: string | null
): string {
  if (variantId === null) {
    return "Base Story";
  }

  const variants = loadVariantsForArchetype(archetypeId);
  const index = variants.findIndex((v) => v.variantId === variantId);

  if (index === -1) {
    return variantId; // Fallback to raw ID if not found
  }

  return `${variantId} (${index + 1} of ${variants.length})`;
}

/**
 * Get the title of a specific variant.
 *
 * @param archetypeId The archetype ID
 * @param variantId The variant ID (null = base story)
 * @returns The variant title, or null if not found
 */
export function getVariantTitle(
  archetypeId: string,
  variantId: string | null
): string | null {
  if (variantId === null) {
    // Return base story title
    const baseStory = loadBaseStoryAsVariant(archetypeId);
    return baseStory?.title ?? null;
  }

  const variants = loadVariantsForArchetype(archetypeId);
  const variant = variants.find((v) => v.variantId === variantId);
  return variant?.title ?? null;
}
