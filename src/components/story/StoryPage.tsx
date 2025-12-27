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
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: fallbackGradient }}
          >
            {/* Placeholder icon */}
            <svg
              className="h-16 w-16 text-white/30"
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
