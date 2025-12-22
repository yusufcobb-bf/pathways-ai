"use client";

import { useState } from "react";
import Link from "next/link";
import { story, Choice } from "@/data/story";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";

type Stage = "intro" | "checkpoint" | "ending" | "reflection" | "completed";

interface StoryState {
  stage: Stage;
  checkpointIndex: number;
  choices: string[];
  reflection: string;
  saving: boolean;
  error: string | null;
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

export default function StoryPlayer() {
  const { user } = useAuth();
  const supabase = createClient();

  const [state, setState] = useState<StoryState>({
    stage: "intro",
    checkpointIndex: 0,
    choices: [],
    reflection: "",
    saving: false,
    error: null,
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

    const { error } = await supabase.from("story_sessions").insert({
      user_id: user.id,
      story_id: "the-new-student",
      choices: state.choices,
      reflection: state.reflection || null,
    });

    if (error) {
      setState((prev) => ({
        ...prev,
        saving: false,
        error: "Failed to save session. Please try again.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, saving: false, stage: "completed" }));
  };

  const handlePlayAgain = () => {
    setState({
      stage: "intro",
      checkpointIndex: 0,
      choices: [],
      reflection: "",
      saving: false,
      error: null,
    });
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-8 text-2xl font-bold text-zinc-900">{story.title}</h1>

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
            placeholder="Write your thoughts here..."
            className="h-40 w-full rounded-lg border border-zinc-200 p-4 text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
          />
          {state.error && (
            <p className="mt-2 text-sm text-red-600">{state.error}</p>
          )}
          <ContinueButton
            onClick={handleFinish}
            label={state.saving ? "Saving..." : "Finish"}
            disabled={state.saving}
          />
        </div>
      )}

      {state.stage === "completed" && (
        <div className="text-center">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900">
            Session Complete
          </h2>
          <p className="mb-8 text-zinc-600">
            Your story session has been saved.
          </p>
          <div className="flex justify-center gap-4">
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
