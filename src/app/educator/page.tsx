/**
 * Stage 42: Educator Dashboard
 *
 * Simplified card-based navigation to educator features.
 * Sessions moved to /educator/sessions for cleaner UI.
 */

import Link from "next/link";

const dashboardCards = [
  {
    title: "Sessions",
    subtitle: "View student story completions",
    href: "/educator/sessions",
  },
  {
    title: "Story Library",
    subtitle: "Browse available stories",
    href: "/educator/stories",
  },
  {
    title: "Student Experience",
    subtitle: "Preview the student view",
    href: "/educator/student-preview",
  },
  {
    title: "How It Works",
    subtitle: "Learn about the platform",
    href: "/educator/info",
  },
];

export default function EducatorDashboard() {
  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-zinc-900">
          Educator Dashboard
        </h1>
        <p className="text-zinc-600">
          Review student sessions, explore stories, and learn how the platform works.
        </p>
      </div>

      {/* Card Grid - MC-4: Entire card is clickable */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {dashboardCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-lg border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-800">
                  {card.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {card.subtitle}
                </p>
              </div>
              <span className="text-zinc-400 group-hover:text-zinc-600">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
