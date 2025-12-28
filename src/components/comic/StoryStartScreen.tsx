/**
 * Stage 25b: Story Start Screen
 * Stage 42: Added onBack prop for safe navigation before story starts
 *
 * Dedicated entry screen displayed before story content.
 * Shows title, subtitle, and "Begin Story" button.
 * Back button (MC-3) allows returning to story selection without starting.
 */

export interface StoryStartScreenProps {
  title: string;
  subtitle?: string;
  gradientStyle?: string;
  storyType?: "diagnostic" | "training"; // Stage 30: Story type for badge
  focusedVirtue?: string; // Stage 30: Focused virtue for training badge
  onBegin: () => void;
  onBack?: () => void; // Stage 42: Back navigation before story starts
}

export default function StoryStartScreen({
  title,
  subtitle,
  gradientStyle,
  storyType,
  focusedVirtue,
  onBegin,
  onBack,
}: StoryStartScreenProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Gradient header */}
      <div
        className="h-40 w-full"
        style={{
          background:
            gradientStyle ||
            "linear-gradient(to bottom right, #f4f4f5, #e4e4e7)",
        }}
      />

      {/* Content */}
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold text-zinc-900">{title}</h1>

        {/* Stage 30: Story type badge */}
        {storyType && (
          <div className="mt-3">
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                storyType === "diagnostic"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {storyType === "diagnostic"
                ? "Diagnostic Assessment"
                : `Skill Practice: ${focusedVirtue}`}
            </span>
          </div>
        )}

        {subtitle && (
          <p className="mt-2 text-lg text-zinc-600">{subtitle}</p>
        )}

        {/* Stage 42.1: Button container with proper spacing */}
        <div className="mt-8 flex flex-col items-center space-y-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-700"
            >
              ← Back to Stories
            </button>
          )}

          <button
            onClick={onBegin}
            className="rounded-lg bg-zinc-900 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600 focus-visible:ring-offset-2"
          >
            Begin Story
          </button>
        </div>
      </div>
    </div>
  );
}
