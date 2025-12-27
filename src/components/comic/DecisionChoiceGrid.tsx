"use client";

/**
 * Stage 25b: Decision Choice Grid
 *
 * Illustrated choice panels replacing text buttons.
 * Each choice is a clickable card with 16:9 illustration and caption.
 */

import { useMemo } from "react";
import { Choice } from "@/data/story";
import { generateIllustrationPrompt } from "@/lib/comic/illustration-prompts";
import { getStoryGradient } from "@/data/story-environments";

export interface DecisionChoiceGridProps {
  choices: Choice[];
  archetypeId: string;
  checkpointIndex: number;
  onSelect: (choiceId: string) => void;
  selectedChoiceId?: string;
}

export default function DecisionChoiceGrid({
  choices,
  archetypeId,
  checkpointIndex,
  onSelect,
  selectedChoiceId,
}: DecisionChoiceGridProps) {
  // Generate gradients for each choice (vary by index for visual distinction)
  const choiceGradients = useMemo(() => {
    return choices.map((choice, index) => {
      // Use checkpoint + choice index to get varied gradients
      const gradientIndex = (checkpointIndex + index) % 4;
      const gradient = getStoryGradient(archetypeId, gradientIndex);

      // Log prompt for development/debugging
      if (process.env.NODE_ENV === "development") {
        const prompt = generateIllustrationPrompt(choice.text, archetypeId);
        console.debug(
          `[Choice] ${archetypeId}/cp${checkpointIndex}/choice${index}:`,
          prompt
        );
      }

      return gradient;
    });
  }, [choices, archetypeId, checkpointIndex]);

  const isDisabled = selectedChoiceId !== undefined;

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {choices.map((choice, index) => {
        const isSelected = choice.id === selectedChoiceId;
        const gradient = choiceGradients[index];

        return (
          <button
            key={choice.id}
            onClick={() => onSelect(choice.id)}
            disabled={isDisabled}
            className={`overflow-hidden rounded-xl border-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600 focus-visible:ring-offset-2 ${
              isSelected
                ? "border-zinc-700 bg-zinc-50 ring-2 ring-zinc-700"
                : isDisabled
                ? "border-zinc-100 opacity-50"
                : "border-zinc-200 hover:border-zinc-400 hover:ring-2 hover:ring-zinc-300"
            }`}
          >
            {/* Illustration area - 16:9 aspect ratio */}
            <div
              className="aspect-[16/9] w-full"
              style={{
                background:
                  gradient ||
                  "linear-gradient(to bottom right, #f4f4f5, #e4e4e7)",
              }}
            >
              {/* Placeholder icon */}
              <div className="flex h-full w-full items-center justify-center">
                <svg
                  className="h-10 w-10 text-white/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            {/* Caption */}
            <div className="bg-white p-3">
              <p
                className={`text-sm leading-relaxed ${
                  isSelected
                    ? "text-zinc-900"
                    : isDisabled
                    ? "text-zinc-400"
                    : "text-zinc-700"
                }`}
              >
                {choice.text}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
