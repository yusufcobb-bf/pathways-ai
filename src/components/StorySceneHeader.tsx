/**
 * Stage 13: Story Scene Header
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
  subtitle?: string;
  gradientStyle?: string; // CSS gradient value (e.g., "linear-gradient(...)")
  imageSrc?: string;
}

export default function StorySceneHeader({
  title,
  subtitle,
  gradientStyle,
  imageSrc,
}: StorySceneHeaderProps) {
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
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
