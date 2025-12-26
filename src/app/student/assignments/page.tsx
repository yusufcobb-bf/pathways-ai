"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Assignment, AssignmentSubmission } from "@/lib/supabase/types";
import { getLessonMetadata } from "@/data/lesson-metadata";

// Assignment with submission status and classroom name
interface StudentAssignment extends Assignment {
  classroom_name: string;
  submission: AssignmentSubmission | null;
}

/**
 * Assignment availability check (single source of truth)
 */
function isAssignmentAvailable(assignment: Assignment): boolean {
  const now = new Date();
  const startsOk = !assignment.starts_at || new Date(assignment.starts_at) <= now;
  const endsOk = !assignment.ends_at || new Date(assignment.ends_at) >= now;
  return startsOk && endsOk;
}

/**
 * Get availability status text
 */
function getAvailabilityText(assignment: Assignment): string {
  const now = new Date();
  if (assignment.starts_at && new Date(assignment.starts_at) > now) {
    return "Not yet available";
  }
  if (assignment.ends_at && new Date(assignment.ends_at) < now) {
    return "Closed";
  }
  return "Available";
}

function AssignmentCard({ assignment }: { assignment: StudentAssignment }) {
  const metadata = getLessonMetadata(assignment.archetype_id);
  const storyTitle = metadata?.lessonTitle ?? assignment.archetype_id;
  const isAvailable = isAssignmentAvailable(assignment);
  const isCompleted = assignment.submission?.status === "completed";
  const availabilityText = getAvailabilityText(assignment);

  // Build start URL with query params
  const buildStartUrl = () => {
    const params = new URLSearchParams();
    params.set("assignmentId", assignment.id);
    params.set("archetypeId", assignment.archetype_id);
    if (assignment.variant_id) {
      params.set("variantId", assignment.variant_id);
    }
    // Handle guided reflection override
    if (assignment.guided_reflection_override !== null) {
      params.set("guidedReflection", assignment.guided_reflection_override ? "1" : "0");
    }
    return `/student?${params.toString()}`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-zinc-900">{assignment.title}</h3>
          <p className="mt-1 text-sm text-zinc-600">{storyTitle}</p>
          <p className="mt-1 text-xs text-zinc-500">{assignment.classroom_name}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              isCompleted
                ? "bg-green-100 text-green-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {isCompleted ? "Completed" : "Assigned"}
          </span>
          {!isCompleted && (
            <span
              className={`text-xs ${
                isAvailable ? "text-green-600" : "text-zinc-500"
              }`}
            >
              {availabilityText}
            </span>
          )}
        </div>
      </div>

      {(assignment.starts_at || assignment.ends_at) && (
        <div className="mt-2 text-xs text-zinc-500">
          {assignment.starts_at && <span>Starts: {formatDate(assignment.starts_at)}</span>}
          {assignment.starts_at && assignment.ends_at && <span> • </span>}
          {assignment.ends_at && <span>Ends: {formatDate(assignment.ends_at)}</span>}
        </div>
      )}

      <div className="mt-4">
        {isCompleted ? (
          <span className="text-sm text-zinc-500">You have completed this assignment.</span>
        ) : isAvailable ? (
          <Link
            href={buildStartUrl()}
            className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Start
          </Link>
        ) : (
          <button
            disabled
            className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500 cursor-not-allowed"
          >
            {assignment.starts_at && new Date(assignment.starts_at) > new Date()
              ? "Not Available Yet"
              : "Closed"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudentAssignmentsPage() {
  const supabase = createClient();
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchAssignments(user.id);
      }
      setLoading(false);
    }
    init();
  }, [supabase]);

  async function fetchAssignments(studentId: string) {
    // First, get classrooms the student has joined
    const { data: memberships } = await supabase
      .from("classroom_members")
      .select("classroom_id")
      .eq("student_id", studentId);

    if (!memberships || memberships.length === 0) {
      setAssignments([]);
      return;
    }

    const classroomIds = memberships.map((m) => m.classroom_id);

    // Fetch classroom names
    const { data: classrooms } = await supabase
      .from("classrooms")
      .select("id, name")
      .in("id", classroomIds);

    const classroomMap = new Map((classrooms || []).map((c) => [c.id, c.name]));

    // Fetch assignments for those classrooms
    const { data: assignmentsData } = await supabase
      .from("assignments")
      .select("*")
      .in("classroom_id", classroomIds)
      .order("created_at", { ascending: false });

    if (!assignmentsData || assignmentsData.length === 0) {
      setAssignments([]);
      return;
    }

    // Fetch student's submissions for these assignments
    const assignmentIds = assignmentsData.map((a) => a.id);
    const { data: submissions } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("student_id", studentId)
      .in("assignment_id", assignmentIds);

    const submissionMap = new Map(
      (submissions || []).map((s) => [s.assignment_id, s])
    );

    // Merge data
    const studentAssignments: StudentAssignment[] = assignmentsData.map((a) => ({
      ...a,
      classroom_name: classroomMap.get(a.classroom_id) || "Unknown Classroom",
      submission: submissionMap.get(a.id) || null,
    }));

    setAssignments(studentAssignments);
  }

  if (loading) {
    return (
      <div className="py-8">
        <p className="text-zinc-500">Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">Assignments</h1>
          <p className="text-zinc-600">
            Stories assigned by your educators.
          </p>
        </div>
        <Link
          href="/student"
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          Back to Stories
        </Link>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-500">
            No assignments yet. Join a classroom to see assignments from your educators.
          </p>
          <Link
            href="/student/classrooms"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline"
          >
            Join a Classroom
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
          </p>
          {assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      )}
    </div>
  );
}
