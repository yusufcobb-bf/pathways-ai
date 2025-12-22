"use client";

import { useState } from "react";
import { story, Choice } from "@/data/story";

type Stage = "intro" | "checkpoint" | "ending" | "reflection";

interface StoryState {
  stage: Stage;
  checkpointIndex: number;
  choices: string[];
  reflection: string;
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

function ContinueButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="mt-8 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
    >
      {label}
    </button>
  );
}

export default function StoryPlayer() {
  const [state, setState] = useState<StoryState>({
    stage: "intro",
    checkpointIndex: 0,
    choices: [],
    reflection: "",
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

  const handleFinish = () => {
    setState({
      stage: "intro",
      checkpointIndex: 0,
      choices: [],
      reflection: "",
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
          <ContinueButton onClick={handleFinish} label="Finish" />
        </div>
      )}
    </div>
  );
}
