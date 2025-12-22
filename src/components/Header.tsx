import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-semibold text-zinc-900">
          Pathways AI
        </Link>
        <nav className="flex gap-6">
          <Link
            href="/student"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            Student
          </Link>
          <Link
            href="/educator"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            Educator
          </Link>
        </nav>
      </div>
    </header>
  );
}
