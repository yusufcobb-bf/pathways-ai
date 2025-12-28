"use client";

/**
 * Stage 26: Story Page Component
 *
 * Single full-page story unit with large image and caption.
 * One sentence per page for immersive reading experience.
 */

import { useState, useEffect } from "react";

export interface StoryPageProps {
  sentence: string;
  imageUrl?: string;
  fallbackGradient: string;
  pageNumber: number;
  totalPages: number;
  onNext?: () => void;
  onPrev?: () => void;
  isLast?: boolean;
}

export default function StoryPage({
  sentence,
  imageUrl,
  fallbackGradient,
  pageNumber,
  totalPages,
  onNext,
  onPrev,
  isLast,
}: StoryPageProps) {
  // Track if image failed to load - fall back to gradient
  const [imageError, setImageError] = useState(false);

  // Reset error state when imageUrl changes
  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const showImage = imageUrl && !imageError;

  return (
    <div className="space-y-4">
      {/* Large image - 16:10 aspect ratio for immersive visuals */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="" // Decorative - caption provides context
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="relative h-full w-full overflow-hidden rounded-lg">
            {/* Stage 39: Gradient placeholder background */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  fallbackGradient ||
                  "linear-gradient(135deg, #f1f5f9 0%, #e5e7eb 50%, #d1d5db 100%)",
              }}
            />

            {/* Soft overlay for depth */}
            <div className="absolute inset-0 bg-white/40" />

            {/* Center icon */}
            <div className="relative z-10 flex h-full w-full items-center justify-center opacity-40">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 5h18M3 19h18M5 7v10M19 7v10M8 11h8M8 15h8"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Caption - always fully visible, no truncation */}
      <p className="text-lg leading-relaxed text-zinc-700">{sentence}</p>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onPrev}
          disabled={!onPrev}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:invisible"
        >
          Previous
        </button>

        <span className="text-sm text-zinc-500">
          {pageNumber} of {totalPages}
        </span>

        <button
          onClick={onNext}
          disabled={!onNext}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:invisible"
        >
          {isLast ? "Continue" : "Next"}
        </button>
      </div>
    </div>
  );
}
