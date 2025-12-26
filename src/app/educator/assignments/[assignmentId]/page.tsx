import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLessonMetadata } from "@/data/lesson-metadata";

interface StudentSubmission {
  studentId: string;
  username: string | null;
  status: "completed" | "not_completed";
  completedAt: string | null;
}

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Fetch assignment and verify ownership
  const { data: assignment } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", assignmentId)
    .single();

  if (!assignment || assignment.educator_id !== user.id) {
    notFound();
  }

  // Fetch classroom members
  const { data: members } = await supabase
    .from("classroom_members")
    .select("student_id, joined_at")
    .eq("classroom_id", assignment.classroom_id);

  if (!members || members.length === 0) {
    // No students in classroom
    const metadata = getLessonMetadata(assignment.archetype_id);
    const storyTitle = metadata?.lessonTitle ?? assignment.archetype_id;

    return (
      <div className="py-8">
        <Link
          href="/educator/assignments"
          className="mb-6 inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700"
        >
          <span className="mr-1">&larr;</span> Back to Assignments
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">{assignment.title}</h1>
          <p className="mt-1 text-zinc-600">{storyTitle}</p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
          <p className="text-zinc-500">No students in this classroom yet.</p>
        </div>
      </div>
    );
  }

  // Fetch profiles for usernames
  const studentIds = members.map((m) => m.student_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username")
    .in("user_id", studentIds);

  // Fetch submissions for this assignment
  const { data: submissions } = await supabase
    .from("assignment_submissions")
    .select("student_id, status, completed_at")
    .eq("assignment_id", assignmentId);

  // Build profile map
  const profileMap = new Map<string, string | null>(
    (profiles || []).map((p) => [p.user_id, p.username])
  );

  // Build submission map
  const submissionMap = new Map<
    string,
    { status: string; completedAt: string | null }
  >(
    (submissions || []).map((s) => [
      s.student_id,
      { status: s.status, completedAt: s.completed_at },
    ])
  );

  // Merge into student submissions list
  const studentSubmissions: StudentSubmission[] = members.map((m) => {
    const submission = submissionMap.get(m.student_id);
    return {
      studentId: m.student_id,
      username: profileMap.get(m.student_id) ?? null,
      status: submission?.status === "completed" ? "completed" : "not_completed",
      completedAt: submission?.completedAt ?? null,
    };
  });

  // Sort: completed first, then by username
  studentSubmissions.sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return -1;
    if (a.status !== "completed" && b.status === "completed") return 1;
    const nameA = a.username ?? "Student";
    const nameB = b.username ?? "Student";
    return nameA.localeCompare(nameB);
  });

  const metadata = getLessonMetadata(assignment.archetype_id);
  const storyTitle = metadata?.lessonTitle ?? assignment.archetype_id;

  const completedCount = studentSubmissions.filter(
    (s) => s.status === "completed"
  ).length;
  const totalCount = studentSubmissions.length;

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="py-8">
      <Link
        href="/educator/assignments"
        className="mb-6 inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700"
      >
        <span className="mr-1">&larr;</span> Back to Assignments
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{assignment.title}</h1>
        <p className="mt-1 text-zinc-600">{storyTitle}</p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="font-medium text-zinc-900">
            Submissions ({completedCount}/{totalCount} completed)
          </h2>
        </div>

        <ul className="divide-y divide-zinc-100">
          {studentSubmissions.map((student) => (
            <li
              key={student.studentId}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-lg ${
                    student.status === "completed"
                      ? "text-green-600"
                      : "text-zinc-300"
                  }`}
                >
                  {student.status === "completed" ? "✓" : "○"}
                </span>
                <span className="text-sm text-zinc-900">
                  {student.username ?? "Student"}
                </span>
              </div>
              <span className="text-sm text-zinc-500">
                {student.status === "completed" && student.completedAt
                  ? formatDate(student.completedAt)
                  : "Not completed"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
