import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
        Welcome to Pathways AI
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-600">
        An educational platform for students and educators.
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          href="/student"
          className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          I&apos;m a Student
        </Link>
        <Link
          href="/educator"
          className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
        >
          I&apos;m an Educator
        </Link>
      </div>
    </div>
  );
}
