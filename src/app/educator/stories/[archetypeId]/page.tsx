"use client";

import { useState, useMemo, use } from "react";
import Link from "next/link";
import { getStoryFromPool } from "@/data/story";
import {
  loadVariantsForArchetype,
  loadBaseStoryAsVariant,
  StoryVariant,
} from "@/data/variants";

/**
 * Educator Story Preview Page (Stage 9)
 *
 * Read-only view of a specific story archetype with variant switching.
 * Displays story content in a clean, printable format.
 */

function StoryText({ children }: { children: string }) {
  return (
    <div className="space-y-4 text-zinc-700">
      {children.split("\n\n").map((paragraph, i) => (
        <p key={i} className="leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 border-b border-zinc-200 pb-2 text-lg font-semibold text-zinc-800">
      {children}
    </h2>
  );
}

interface StoryPreviewProps {
  params: Promise<{ archetypeId: string }>;
}

export default function StoryPreviewPage({ params }: StoryPreviewProps) {
  const { archetypeId } = use(params);

  // Load story data
  const poolEntry = getStoryFromPool(archetypeId);
  const variants = loadVariantsForArchetype(archetypeId);
  const baseStory = loadBaseStoryAsVariant(archetypeId);

  // Build list of all available versions (base + variants)
  const allVersions = useMemo(() => {
    const versions: StoryVariant[] = [];

    // Add base story first (if exists)
    if (baseStory) {
      versions.push(baseStory);
    }

    // Add all variants
    versions.push(...variants);

    return versions;
  }, [baseStory, variants]);

  // State for selected variant
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedVersion = allVersions[selectedIndex] || baseStory;

  // Handle case where archetype doesn't exist
  if (!poolEntry || !selectedVersion) {
    return (
      <div className="py-8">
        <div className="mb-8">
          <Link
            href="/educator/stories"
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            &larr; Back to Story Library
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-800">
            Story Not Found
          </h1>
          <p className="mt-2 text-sm text-red-600">
            The story archetype &quot;{archetypeId}&quot; was not found in the
            story pool.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/educator/stories"
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            &larr; Back to Story Library
          </Link>
        </div>

        {/* Variant Selector */}
        {allVersions.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700">
              Select Version:
            </label>
            <select
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="mt-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 focus:border-zinc-500 focus:outline-none"
            >
              {allVersions.map((version, index) => (
                <option key={version.variantId ?? "base"} value={index}>
                  {version.variantId === null
                    ? `Base Story: ${version.title}`
                    : `Variant: ${version.title}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Story source badge */}
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              poolEntry.isGenerated
                ? "bg-blue-100 text-blue-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {poolEntry.isGenerated
              ? "AI-Generated Story"
              : "Fallback Story (Hardcoded)"}
          </span>
          <span className="text-xs text-zinc-400">
            Archetype: {archetypeId}
          </span>
          {selectedVersion.variantId && (
            <span className="text-xs text-zinc-400">
              Variant: {selectedVersion.variantId}
            </span>
          )}
        </div>
      </div>

      {/* Story Title */}
      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-xl font-bold text-zinc-900">
          {selectedVersion.title}
        </h2>
        {selectedVersion.variantId === null && variants.length > 0 && (
          <p className="mt-2 text-sm text-zinc-500">
            This is the base story. {variants.length}{" "}
            {variants.length === 1 ? "variant" : "variants"} available.
          </p>
        )}
      </div>

      {/* Intro Section */}
      <section className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <SectionHeading>Introduction</SectionHeading>
        <StoryText>{selectedVersion.intro}</StoryText>
      </section>

      {/* Checkpoints */}
      {selectedVersion.checkpoints.map((checkpoint, index) => (
        <section
          key={checkpoint.id}
          className="mb-8 rounded-lg border border-zinc-200 bg-white p-6"
        >
          <SectionHeading>Checkpoint {index + 1}</SectionHeading>

          {/* Prompt */}
          <div className="mb-6">
            <StoryText>{checkpoint.narrative}</StoryText>
          </div>

          {/* Choices */}
          <div className="rounded-lg bg-zinc-50 p-4">
            <p className="mb-3 text-sm font-medium text-zinc-600">
              Student Choices:
            </p>
            <ul className="space-y-2">
              {checkpoint.choices.map((choice, choiceIndex) => (
                <li key={choice.id} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
                    {String.fromCharCode(65 + choiceIndex)}
                  </span>
                  <div>
                    <span className="text-sm text-zinc-700">{choice.text}</span>
                    <span className="ml-2 text-xs text-zinc-400">
                      ({choice.id})
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {/* Ending Section */}
      <section className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <SectionHeading>Ending</SectionHeading>
        <StoryText>{selectedVersion.ending}</StoryText>
      </section>

      {/* Footer note */}
      <p className="text-center text-xs text-zinc-400">
        This is a read-only preview. Students will see this story when they
        play.
      </p>
    </div>
  );
}
