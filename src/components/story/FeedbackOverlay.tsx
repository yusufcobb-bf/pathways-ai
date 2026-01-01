/**
 * Stage 29: FeedbackOverlay
 *
 * Displays encouraging feedback after a choice:
 * - XP gained (this choice only, not total)
 * - Virtues as skills being practiced
 * - Encouragement message
 *
 * Auto-dismisses after 1.6s max.
 */

"use client";

import { useEffect, useState } from "react";
import { Virtue } from "@/data/virtues";

interface FeedbackOverlayProps {
  xp: number;
  virtues: Virtue[];
  encouragement: string;
  onComplete: () => void;
}

// Virtue color mapping (soft, educational palette)
const VIRTUE_COLORS: Record<Virtue, string> = {
  Courage: "text-amber-500",
  Generosity: "text-purple-500",
  Kindness: "text-emerald-500",
  Knowledge: "text-blue-500",
  Resilience: "text-teal-500",
};

// Virtue icons (simple emoji representation)
const VIRTUE_ICONS: Record<Virtue, string> = {
  Courage: "💛",
  Generosity: "💜",
  Kindness: "💚",
  Knowledge: "💙",
  Resilience: "🩵",
};

export function FeedbackOverlay({
  xp,
  virtues,
  encouragement,
  onComplete,
}: FeedbackOverlayProps) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");

  useEffect(() => {
    // Animation timeline with 1.6s hard cap
    const enterTimer = setTimeout(() => setPhase("visible"), 50);
    const exitTimer = setTimeout(() => setPhase("exit"), 1400);
    const completeTimer = setTimeout(() => onComplete(), 1600);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const opacityClass =
    phase === "enter"
      ? "opacity-0"
      : phase === "visible"
        ? "opacity-100"
        : "opacity-0";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-150 ${opacityClass}`}
      style={{ backgroundColor: "rgba(255, 252, 245, 0.95)" }}
    >
      <div className="max-w-md mx-auto px-6 py-8 text-center">
        {/* XP Display */}
        <div className="text-3xl font-semibold text-amber-600 mb-4">
          +{xp} XP
        </div>

        {/* Virtues as skills being practiced */}
        {virtues.length > 0 && (
          <div className="flex justify-center gap-4 mb-6">
            {virtues.map((virtue) => (
              <div key={virtue} className="flex items-center gap-1.5">
                <span className="text-lg">{VIRTUE_ICONS[virtue]}</span>
                <span className={`font-medium ${VIRTUE_COLORS[virtue]}`}>
                  {virtue}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Encouragement text */}
        <p className="text-gray-700 text-lg italic">{encouragement}</p>
      </div>
    </div>
  );
}
