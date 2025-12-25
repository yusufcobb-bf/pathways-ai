/**
 * Stage 13: Story Scene Header
 * Stage 14: Added sceneSubtitle for per-checkpoint updates
 *
 * Visual header component for stories.
 * Displays environment visual (gradient or image), title, and optional subtitle.
 *
 * Visual constraints:
 * - No facial features on characters
 * - Environment-focused imagery
 * - Calm, educational tone
 */

interface StorySceneHeaderProps {
  title: string;
  subtitle?: string; // Archetype-level fallback
  sceneSubtitle?: string; // Stage 14: Checkpoint-level (takes priority)
  gradientStyle?: string; // CSS gradient value (e.g., "linear-gradient(...)")
  imageSrc?: string;
}

export default function StorySceneHeader({
  title,
  subtitle,
  sceneSubtitle,
  gradientStyle,
  imageSrc,
}: StorySceneHeaderProps) {
  // Scene subtitle takes priority over archetype subtitle
  const displaySubtitle = sceneSubtitle ?? subtitle;

  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
      {/* Image takes priority, fallback to gradient */}
      {imageSrc ? (
        <div className="relative h-32 w-full">
          <img
            src={imageSrc}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : gradientStyle ? (
        <div
          className="h-32 w-full"
          style={{ background: gradientStyle }}
        />
      ) : null}
      <div className="p-4">
        <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
        {displaySubtitle && (
          <p className="mt-1 text-sm text-zinc-500">{displaySubtitle}</p>
        )}
      </div>
    </div>
  );
}
