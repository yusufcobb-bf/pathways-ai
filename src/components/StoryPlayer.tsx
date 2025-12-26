"use client";

import { useState, useEffect } from "react";
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
import StorySceneHeader from "./StorySceneHeader";
import { getStoryEnvironment, getStoryGradient } from "@/data/story-environments";
import { getSceneSubtitle } from "@/data/story-scenes";
import { getReflectionPrompts } from "@/data/reflection-prompts";

interface StoryPlayerProps {
  story: Story;
  storyId: string;
  archetypeId: string; // Stage 8: Story archetype ID
  variantId: string | null; // Stage 8: Variant ID (null = base/canonical story)
  isGenerated: boolean;
  previewMode?: boolean; // Stage 11: Educator preview mode (no DB writes)
  onPreviewExit?: () => void; // Stage 11b: Callback to exit preview and return to setup
  guidedReflectionEnabled?: boolean; // Stage 16: Show guided prompts after completion
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
  selectedChoice: { id: string; text: string } | null; // Stage 14: Choice feedback
  isTransitioning: boolean; // Stage 14: Fade transitions
  guidedResponses: Record<string, string>; // Stage 16: Maps prompt.id to response
}

function CheckpointProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="mb-6 flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i < current ? "bg-zinc-700" : "bg-zinc-200"
          }`}
        />
      ))}
    </div>
  );
}

function ChoiceList({
  choices,
  onSelect,
  selectedChoiceId,
}: {
  choices: Choice[];
  onSelect: (choiceId: string) => void;
  selectedChoiceId?: string;
}) {
  return (
    <div className="mt-8 space-y-3">
      {choices.map((choice) => {
        const isSelected = choice.id === selectedChoiceId;
        const isDisabled = selectedChoiceId !== undefined;

        return (
          <button
            key={choice.id}
            onClick={() => onSelect(choice.id)}
            disabled={isDisabled}
            className={`w-full rounded-lg border p-4 text-left transition-colors ${
              isSelected
                ? "border-zinc-700 bg-zinc-100 text-zinc-900"
                : isDisabled
                ? "border-zinc-100 bg-zinc-50 text-zinc-400"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
            }`}
          >
            {choice.text}
          </button>
        );
      })}
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
  previewMode = false,
  onPreviewExit,
  guidedReflectionEnabled = false,
}: StoryPlayerProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  // Stage 13: Get environment visuals for this story
  const environment = getStoryEnvironment(archetypeId);

  const [state, setState] = useState<StoryState>({
    stage: "intro",
    checkpointIndex: 0,
    choices: [],
    reflection: "",
    saving: false,
    error: null,
    virtueScores: null,
    selectedChoice: null,
    isTransitioning: false,
    guidedResponses: {},
  });

  const totalCheckpoints = story.checkpoints.length;

  const handleStartStory = () => {
    setState((prev) => ({ ...prev, stage: "checkpoint" }));
  };

  const handleChoice = (choiceId: string) => {
    // Stage 14: Find the selected choice text for feedback
    const currentCheckpoint = story.checkpoints[state.checkpointIndex];
    const selectedChoice = currentCheckpoint.choices.find(c => c.id === choiceId);
    const currentIndex = state.checkpointIndex;

    if (!selectedChoice) return;

    // Show selection feedback
    setState((prev) => ({
      ...prev,
      selectedChoice: { id: choiceId, text: selectedChoice.text },
    }));

    // After brief delay, transition to next scene
    setTimeout(() => {
      setState((prev) => ({ ...prev, isTransitioning: true }));

      // After fade out, advance and fade back in
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        const isLastCheckpoint = nextIndex >= totalCheckpoints;

        setState((prev) => ({
          ...prev,
          choices: [...prev.choices, choiceId],
          stage: isLastCheckpoint ? "ending" : "checkpoint",
          checkpointIndex: isLastCheckpoint ? currentIndex : nextIndex,
          selectedChoice: null,
          isTransitioning: false,
        }));
      }, 200);
    }, 800);
  };

  const handleContinueToReflection = () => {
    setState((prev) => ({ ...prev, stage: "reflection" }));
  };

  const handleReflectionChange = (value: string) => {
    setState((prev) => ({ ...prev, reflection: value }));
  };

  const handleFinish = async () => {
    // Stage 11: In preview mode, skip all DB operations and virtue computation
    if (previewMode) {
      setState((prev) => ({
        ...prev,
        stage: "completed",
        virtueScores: null, // No virtue scores in preview
      }));
      return;
    }

    if (!user) return;

    setState((prev) => ({ ...prev, saving: true, error: null }));

    // Compute virtue scores from choices
    // Use position-based scoring for generated stories, standard scoring for fallback
    const virtueScores = isGenerated
      ? computePositionBasedVirtueScores(state.choices)
      : computeVirtueScores(state.choices);

    // Stage 16: Build guided_responses only if enabled and at least one response exists
    let guidedResponsesPayload = null;
    if (guidedReflectionEnabled) {
      const prompts = getReflectionPrompts(archetypeId);
      const answeredPrompts = prompts
        .filter((p) => state.guidedResponses[p.id]?.trim())
        .map((p) => ({
          prompt: p.text, // Store full prompt text for session integrity
          response: state.guidedResponses[p.id],
        }));

      if (answeredPrompts.length > 0) {
        guidedResponsesPayload = {
          prompts: answeredPrompts,
          archetypeId,
          completedAt: new Date().toISOString(),
        };
      }
    }

    const { error } = await supabase.from("story_sessions").insert({
      user_id: user.id,
      story_id: storyId,
      variant_id: variantId, // Stage 8: Save which variant was played (null = base story)
      choices: state.choices,
      reflection: state.reflection || null,
      virtue_scores: virtueScores,
      guided_responses: guidedResponsesPayload, // Stage 16: Include in same insert
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

  // Stage 16: Guided reflection handler
  const handleGuidedResponseChange = (promptId: string, value: string) => {
    setState((prev) => ({
      ...prev,
      guidedResponses: {
        ...prev.guidedResponses,
        [promptId]: value,
      },
    }));
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Stage 11: Preview Mode Banner */}
      {previewMode && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Educator Preview</strong> — This simulates the student
            experience. No data is saved.
          </p>
        </div>
      )}

      {/* Stage 13: Visual Story Header */}
      {/* Stage 14: Add scene-specific subtitle based on current stage */}
      {/* Stage 15: Add mood-based gradient based on current stage */}
      <StorySceneHeader
        title={story.title}
        subtitle={environment?.subtitle}
        sceneSubtitle={getSceneSubtitle(
          archetypeId,
          state.stage === "intro" ? "intro" : state.checkpointIndex
        )}
        gradientStyle={getStoryGradient(
          archetypeId,
          state.stage === "intro" ? "intro" : state.checkpointIndex
        )}
        imageSrc={environment?.imageSrc}
      />

      {/* Navigation Link */}
      <div className="mb-6 text-right">
        {previewMode ? (
          <Link
            href="/educator"
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            Back to Dashboard
          </Link>
        ) : (
          <Link
            href="/student/sessions"
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            View Past Sessions
          </Link>
        )}
      </div>

      {state.stage === "intro" && (
        <div>
          <StoryText>{story.intro}</StoryText>
          <ContinueButton onClick={handleStartStory} label="Begin" />
        </div>
      )}

      {state.stage === "checkpoint" && (
        <div
          className={`transition-opacity duration-200 ${
            state.isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          <CheckpointProgress
            current={state.checkpointIndex + 1}
            total={totalCheckpoints}
          />
          <StoryText>
            {story.checkpoints[state.checkpointIndex].narrative}
          </StoryText>
          <ChoiceList
            choices={story.checkpoints[state.checkpointIndex].choices}
            onSelect={handleChoice}
            selectedChoiceId={state.selectedChoice?.id}
          />
          {/* Stage 14: Neutral choice acknowledgment */}
          {state.selectedChoice && (
            <p className="mt-4 text-sm text-zinc-500">
              You chose to {state.selectedChoice.text.toLowerCase().replace(/\.$/, "")}
            </p>
          )}
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
          {previewMode ? (
            <>
              <p className="mb-6 italic text-zinc-400">
                (Preview mode — reflection step skipped)
              </p>
              <ContinueButton onClick={handleFinish} label="Finish Preview" />
            </>
          ) : (
            <>
              <p className="mb-6 text-zinc-600">
                Take a moment to think about the story and the choices you made.
                What stood out to you? Is there anything you would do
                differently?
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

              {/* Stage 16: Optional Guided Prompts Section */}
              {guidedReflectionEnabled && (
                <div className="mt-8 border-t border-zinc-200 pt-6">
                  <h3 className="mb-2 text-lg font-medium text-zinc-800">
                    Optional Reflection Questions
                  </h3>
                  <p className="mb-4 text-sm text-zinc-500">
                    If you&apos;d like to think a bit more deeply, you can
                    answer any of the questions below.
                  </p>
                  <div className="space-y-4">
                    {getReflectionPrompts(archetypeId).map((prompt) => (
                      <div key={prompt.id}>
                        <label className="mb-1 block text-sm font-medium text-zinc-700">
                          {prompt.text}
                        </label>
                        <textarea
                          value={state.guidedResponses[prompt.id] || ""}
                          onChange={(e) =>
                            handleGuidedResponseChange(prompt.id, e.target.value)
                          }
                          placeholder={prompt.placeholder}
                          className="h-20 w-full rounded-lg border border-zinc-200 p-3 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {state.error && (
                <p className="mt-4 text-sm text-red-600">{state.error}</p>
              )}
              <ContinueButton
                onClick={handleFinish}
                label={state.saving ? "Saving..." : "Finish"}
                disabled={state.saving || state.reflection.trim().length === 0}
              />
            </>
          )}
        </div>
      )}

      {state.stage === "completed" && (
        <div>
          <div className="text-center">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900">
              {previewMode ? "Preview Complete" : "Session Complete"}
            </h2>
            <p className="text-zinc-600">
              {previewMode
                ? "This is a preview. No session was saved."
                : "Your story session has been saved."}
            </p>
          </div>

          {/* Stage 11: Hide virtue summary in preview mode */}
          {!previewMode && state.virtueScores && (
            <VirtueSummary scores={state.virtueScores} />
          )}

          <div className="mt-8 flex justify-center gap-4">
            {previewMode ? (
              <>
                {onPreviewExit && (
                  <button
                    onClick={onPreviewExit}
                    className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                  >
                    Preview Again
                  </button>
                )}
                <Link
                  href="/educator"
                  className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
                >
                  Back to Dashboard
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
