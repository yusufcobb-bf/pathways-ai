"use client";

import { useState, useMemo, use } from "react";
import Link from "next/link";
import { getStoryFromPool, isVisualBeatStory, VisualBeatStory } from "@/data/story";
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

  // Handle case where archetype doesn't exist
  if (!poolEntry) {
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

  // Check if this is a visual beat story
  if (isVisualBeatStory(poolEntry.story)) {
    return <VisualBeatStoryPreview story={poolEntry.story} archetypeId={archetypeId} />;
  }

  // Prose story - use variant system
  return <ProseStoryPreview archetypeId={archetypeId} poolEntry={poolEntry} />;
}

/**
 * Visual Beat Story Preview
 * Displays visual beat stories with curriculum alignment, CASEL coverage, and beats
 */
function VisualBeatStoryPreview({
  story,
  archetypeId,
}: {
  story: VisualBeatStory;
  archetypeId: string;
}) {
  return (
    <div className="mx-auto max-w-3xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <Link
            href="/educator/stories"
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            &larr; Back to Story Library
          </Link>
        </div>

        {/* Story source badge */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Visual Beat Story
          </span>
          <span className="text-xs text-zinc-400">
            Archetype: {archetypeId}
          </span>
          <span className="text-xs text-zinc-400">
            Grade Level: {story.gradeLevel}
          </span>
        </div>
      </div>

      {/* Story Title */}
      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-xl font-bold text-zinc-900">{story.title}</h2>
        <p className="mt-2 text-sm text-zinc-500">
          {story._meta.totalBeats} beats &middot; ~{story._meta.estimatedMinutes} minutes
        </p>
      </div>

      {/* Curriculum Alignment */}
      <section className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
        <SectionHeading>Curriculum Alignment</SectionHeading>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-zinc-700">Subject:</span>{" "}
            <span className="text-zinc-600">{story.curriculum.subject}</span>
          </div>
          <div>
            <span className="font-medium text-zinc-700">Unit:</span>{" "}
            <span className="text-zinc-600">{story.curriculum.unit}</span>
          </div>
          <div>
            <span className="font-medium text-zinc-700">Lesson:</span>{" "}
            <span className="text-zinc-600">{story.curriculum.lesson}</span>
          </div>
          {story.curriculum.standardRefs && story.curriculum.standardRefs.length > 0 && (
            <div>
              <span className="font-medium text-zinc-700">Standards:</span>{" "}
              <span className="font-mono text-xs text-zinc-600">
                {story.curriculum.standardRefs.join(", ")}
              </span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="mb-2 font-medium text-zinc-700">Learning Objectives:</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600">
            {story.curriculum.learningObjectives.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* SEL Objectives */}
      <section className="mb-8 rounded-lg border border-purple-200 bg-purple-50 p-6">
        <SectionHeading>SEL Objectives</SectionHeading>
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600">
          {story.selObjectives.map((obj, i) => (
            <li key={i}>{obj}</li>
          ))}
        </ul>
      </section>

      {/* CASEL Coverage */}
      <section className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-6">
        <SectionHeading>CASEL Competency Coverage</SectionHeading>
        <div className="space-y-3 text-sm">
          {Object.entries(story.caselCoverage).map(([competency, description]) => (
            <div key={competency}>
              <span className="font-medium capitalize text-zinc-700">
                {competency.replace(/-/g, " ")}:
              </span>{" "}
              <span className="text-zinc-600">{description}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Intro Beats */}
      <section className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <SectionHeading>Introduction ({story.intro.length} beats)</SectionHeading>
        <div className="space-y-2">
          {story.intro.map((beat) => (
            <BeatDisplay key={beat.id} beat={beat} />
          ))}
        </div>
      </section>

      {/* Checkpoints */}
      {story.checkpoints.map((checkpoint, index) => (
        <section
          key={checkpoint.id}
          className="mb-8 rounded-lg border border-zinc-200 bg-white p-6"
        >
          <SectionHeading>
            Checkpoint {index + 1} ({checkpoint.beats.length} beats)
          </SectionHeading>

          {/* Beats */}
          <div className="mb-6 space-y-2">
            {checkpoint.beats.map((beat) => (
              <BeatDisplay key={beat.id} beat={beat} />
            ))}
          </div>

          {/* Choices */}
          <div className="rounded-lg bg-zinc-50 p-4">
            <p className="mb-3 text-sm font-medium text-zinc-600">
              Student Choices:
            </p>
            <ul className="space-y-3">
              {checkpoint.choices.map((choice, choiceIndex) => (
                <li key={choice.id} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
                    {String.fromCharCode(65 + choiceIndex)}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm text-zinc-700">{choice.text}</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {choice.casel.map((c) => (
                        <span
                          key={c}
                          className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700"
                        >
                          {c}
                        </span>
                      ))}
                      {choice.virtues.map((v) => (
                        <span
                          key={v}
                          className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {/* Ending Beats */}
      <section className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <SectionHeading>Ending ({story.ending.length} beats)</SectionHeading>
        <div className="space-y-2">
          {story.ending.map((beat) => (
            <BeatDisplay key={beat.id} beat={beat} />
          ))}
        </div>
      </section>

      {/* Footer note */}
      <p className="text-center text-xs text-zinc-400">
        This is a read-only preview. Students will see this story when they
        play.
      </p>
    </div>
  );
}

/**
 * Beat Display Component
 * Shows a single visual beat with its metadata
 */
function BeatDisplay({ beat }: { beat: VisualBeatStory["intro"][0] }) {
  return (
    <div className="flex items-start gap-3 rounded border border-zinc-100 bg-zinc-50 p-3">
      <span className="shrink-0 rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-xs text-zinc-600">
        {beat.id}
      </span>
      <div className="flex-1">
        <p className="text-sm text-zinc-700">{beat.text}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {beat.actor && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
              {beat.actor}
            </span>
          )}
          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600">
            {beat.focus}
          </span>
          {beat.casel.map((c) => (
            <span
              key={c}
              className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Prose Story Preview (Legacy)
 * Displays prose stories with variant switching
 */
function ProseStoryPreview({
  archetypeId,
  poolEntry,
}: {
  archetypeId: string;
  poolEntry: ReturnType<typeof getStoryFromPool>;
}) {
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

  if (!selectedVersion) {
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
            Could not load story content for &quot;{archetypeId}&quot;.
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
              poolEntry?.isGenerated
                ? "bg-blue-100 text-blue-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {poolEntry?.isGenerated
              ? "AI-Generated Story"
              : "Prose Story"}
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
