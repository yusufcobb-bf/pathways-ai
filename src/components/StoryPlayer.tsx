"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Story, Choice } from "@/data/story";
import {
  computeVirtueScores,
  computePositionBasedVirtueScores,
  getVirtueSummary,
  VIRTUES,
  VIRTUE_DESCRIPTIONS,
  VirtueScores,
} from "@/data/virtues";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";

interface StoryPlayerProps {
  story: Story;
  storyId: string;
  archetypeId: string; // Stage 8: Story archetype ID
  variantId: string | null; // Stage 8: Variant ID (null = base/canonical story)
  isGenerated: boolean;
}

type Stage = "intro" | "checkpoint" | "ending" | "reflection" | "completed";

interface StoryState {
  stage: Stage;
  checkpointIndex: number;
  choices: string[];
  reflection: string;
  saving: boolean;
  error: string | null;
  virtueScores: VirtueScores | null;
}

function ProgressIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="mb-6 text-sm text-zinc-500">
      Step {current} of {total}
    </div>
  );
}

function ChoiceList({
  choices,
  onSelect,
}: {
  choices: Choice[];
  onSelect: (choiceId: string) => void;
}) {
  return (
    <div className="mt-8 space-y-3">
      {choices.map((choice) => (
        <button
          key={choice.id}
          onClick={() => onSelect(choice.id)}
          className="w-full rounded-lg border border-zinc-200 bg-white p-4 text-left text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}

function StoryText({ children }: { children: string }) {
  return (
    <div className="space-y-4 text-lg leading-relaxed text-zinc-700">
      {children.split("\n\n").map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}

function ContinueButton({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-8 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function VirtueSummary({ scores }: { scores: VirtueScores }) {
  return (
    <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-zinc-900">
        Your Virtue Summary
      </h3>
      <div className="space-y-4">
        {VIRTUES.map((virtue) => {
          const score = scores[virtue];
          return (
            <div key={virtue} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-800">{virtue}</span>
                <span className="text-sm font-medium text-zinc-600">
                  {score > 0 ? `+${score}` : score}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {getVirtueSummary(virtue, score)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {VIRTUE_DESCRIPTIONS[virtue]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StoryPlayer({
  story,
  storyId,
  archetypeId,
  variantId,
  isGenerated,
}: StoryPlayerProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [state, setState] = useState<StoryState>({
    stage: "intro",
    checkpointIndex: 0,
    choices: [],
    reflection: "",
    saving: false,
    error: null,
    virtueScores: null,
  });

  const totalCheckpoints = story.checkpoints.length;

  const handleStartStory = () => {
    setState((prev) => ({ ...prev, stage: "checkpoint" }));
  };

  const handleChoice = (choiceId: string) => {
    const nextIndex = state.checkpointIndex + 1;
    const isLastCheckpoint = nextIndex >= totalCheckpoints;

    setState((prev) => ({
      ...prev,
      choices: [...prev.choices, choiceId],
      stage: isLastCheckpoint ? "ending" : "checkpoint",
      checkpointIndex: isLastCheckpoint ? prev.checkpointIndex : nextIndex,
    }));
  };

  const handleContinueToReflection = () => {
    setState((prev) => ({ ...prev, stage: "reflection" }));
  };

  const handleReflectionChange = (value: string) => {
    setState((prev) => ({ ...prev, reflection: value }));
  };

  const handleFinish = async () => {
    if (!user) return;

    setState((prev) => ({ ...prev, saving: true, error: null }));

    // Compute virtue scores from choices
    // Use position-based scoring for generated stories, standard scoring for fallback
    const virtueScores = isGenerated
      ? computePositionBasedVirtueScores(state.choices)
      : computeVirtueScores(state.choices);

    const { error } = await supabase.from("story_sessions").insert({
      user_id: user.id,
      story_id: storyId,
      variant_id: variantId, // Stage 8: Save which variant was played (null = base story)
      choices: state.choices,
      reflection: state.reflection || null,
      virtue_scores: virtueScores,
    });

    if (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: "Failed to save session. Please try again.",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      saving: false,
      stage: "completed",
      virtueScores,
    }));
  };

  const handlePlayAgain = () => {
    // Force a hard navigation to /student to trigger fresh server-side story selection
    // Using window.location ensures the server component fully re-renders
    // with the updated completed session count
    window.location.href = "/student";
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">{story.title}</h1>
        <Link
          href="/student/sessions"
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          View Past Sessions
        </Link>
      </div>

      {state.stage === "intro" && (
        <div>
          <StoryText>{story.intro}</StoryText>
          <ContinueButton onClick={handleStartStory} label="Begin" />
        </div>
      )}

      {state.stage === "checkpoint" && (
        <div>
          <ProgressIndicator
            current={state.checkpointIndex + 1}
            total={totalCheckpoints}
          />
          <StoryText>
            {story.checkpoints[state.checkpointIndex].narrative}
          </StoryText>
          <ChoiceList
            choices={story.checkpoints[state.checkpointIndex].choices}
            onSelect={handleChoice}
          />
        </div>
      )}

      {state.stage === "ending" && (
        <div>
          <StoryText>{story.ending}</StoryText>
          <ContinueButton
            onClick={handleContinueToReflection}
            label="Continue to Reflection"
          />
        </div>
      )}

      {state.stage === "reflection" && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900">
            Reflection
          </h2>
          <p className="mb-6 text-zinc-600">
            Take a moment to think about the story and the choices you made.
            What stood out to you? Is there anything you would do differently?
          </p>
          <textarea
            value={state.reflection}
            onChange={(e) => handleReflectionChange(e.target.value)}
            placeholder="Write your thoughts here... (required)"
            className={`h-40 w-full rounded-lg border p-4 text-zinc-700 placeholder:text-zinc-400 focus:outline-none ${
              state.reflection.trim().length === 0
                ? "border-zinc-200 focus:border-zinc-400"
                : "border-green-300 focus:border-green-400"
            }`}
          />
          <p className="mt-2 text-sm text-zinc-500">
            {state.reflection.trim().length === 0
              ? "Please write a reflection to continue."
              : `${state.reflection.trim().length} characters`}
          </p>
          {state.error && (
            <p className="mt-2 text-sm text-red-600">{state.error}</p>
          )}
          <ContinueButton
            onClick={handleFinish}
            label={state.saving ? "Saving..." : "Finish"}
            disabled={state.saving || state.reflection.trim().length === 0}
          />
        </div>
      )}

      {state.stage === "completed" && (
        <div>
          <div className="text-center">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900">
              Session Complete
            </h2>
            <p className="text-zinc-600">
              Your story session has been saved.
            </p>
          </div>

          {state.virtueScores && <VirtueSummary scores={state.virtueScores} />}

          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={handlePlayAgain}
              className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Play Again
            </button>
            <Link
              href="/student/sessions"
              className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              View Past Sessions
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
