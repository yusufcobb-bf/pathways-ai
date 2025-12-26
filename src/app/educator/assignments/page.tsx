"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Assignment, Classroom } from "@/lib/supabase/types";
import { getAllLessonMetadata, getLessonMetadata } from "@/data/lesson-metadata";
import { loadVariantsForArchetype } from "@/data/variants";

// Submission count per assignment
interface SubmissionCount {
  total: number;
  completed: number;
}

// Assignment with submission counts
interface AssignmentWithCounts extends Assignment {
  submissionCounts: SubmissionCount;
}

// Get all available archetypes from lesson metadata
const ARCHETYPES = getAllLessonMetadata();

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

function AssignmentCard({
  assignment,
  onDelete,
}: {
  assignment: AssignmentWithCounts;
  onDelete: (id: string, title: string) => void;
}) {
  const metadata = getLessonMetadata(assignment.archetype_id);
  const storyTitle = metadata?.lessonTitle ?? assignment.archetype_id;
  const availabilityText = getAvailabilityText(assignment);
  const isAvailable = isAssignmentAvailable(assignment);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const guidedReflectionLabel = assignment.guided_reflection_override === null
    ? "Default"
    : assignment.guided_reflection_override
    ? "On"
    : "Off";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-zinc-900">{assignment.title}</h3>
          <p className="mt-1 text-sm text-zinc-600">{storyTitle}</p>
          {assignment.variant_id && (
            <p className="text-xs text-zinc-500">Variant: {assignment.variant_id}</p>
          )}
        </div>
        <button
          onClick={() => onDelete(assignment.id, assignment.title)}
          className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span
          className={`rounded-full px-2 py-1 ${
            isAvailable
              ? "bg-green-100 text-green-700"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {availabilityText}
        </span>
        <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-600">
          Guided Reflection: {guidedReflectionLabel}
        </span>
        <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
          {assignment.submissionCounts.completed}/{assignment.submissionCounts.total} completed
        </span>
      </div>

      {(assignment.starts_at || assignment.ends_at) && (
        <div className="mt-2 text-xs text-zinc-500">
          {assignment.starts_at && <span>Starts: {formatDate(assignment.starts_at)}</span>}
          {assignment.starts_at && assignment.ends_at && <span> • </span>}
          {assignment.ends_at && <span>Ends: {formatDate(assignment.ends_at)}</span>}
        </div>
      )}
    </div>
  );
}

export default function EducatorAssignmentsPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [archetypeId, setArchetypeId] = useState("");
  const [variantId, setVariantId] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [guidedReflectionOverride, setGuidedReflectionOverride] = useState<string>("default");

  // Available variants for selected archetype
  const [availableVariants, setAvailableVariants] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchClassrooms(user.id);
      }
      setLoading(false);
    }
    init();
  }, [supabase]);

  // Update available variants when archetype changes
  useEffect(() => {
    if (archetypeId) {
      const variants = loadVariantsForArchetype(archetypeId);
      setAvailableVariants(
        variants
          .filter((v) => v.variantId !== null)
          .map((v) => ({ id: v.variantId!, title: v.title }))
      );
      setVariantId(null); // Reset variant selection
    } else {
      setAvailableVariants([]);
      setVariantId(null);
    }
  }, [archetypeId]);

  // Fetch assignments when classroom selection changes
  useEffect(() => {
    if (selectedClassroomId) {
      fetchAssignments(selectedClassroomId);
    } else {
      setAssignments([]);
    }
  }, [selectedClassroomId]);

  async function fetchClassrooms(educatorId: string) {
    const { data } = await supabase
      .from("classrooms")
      .select("id, name, educator_id, join_code, created_at")
      .eq("educator_id", educatorId)
      .order("created_at", { ascending: false });

    setClassrooms(data || []);
    if (data && data.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(data[0].id);
    }
  }

  async function fetchAssignments(classroomId: string) {
    // Fetch assignments
    const { data: assignmentsData } = await supabase
      .from("assignments")
      .select("*")
      .eq("classroom_id", classroomId)
      .order("created_at", { ascending: false });

    if (!assignmentsData || assignmentsData.length === 0) {
      setAssignments([]);
      return;
    }

    // Fetch submission counts
    const assignmentIds = assignmentsData.map((a) => a.id);
    const { data: submissions } = await supabase
      .from("assignment_submissions")
      .select("assignment_id, status")
      .in("assignment_id", assignmentIds);

    // Count submissions per assignment
    const countMap = new Map<string, SubmissionCount>();
    for (const assignment of assignmentsData) {
      countMap.set(assignment.id, { total: 0, completed: 0 });
    }
    for (const sub of submissions || []) {
      const counts = countMap.get(sub.assignment_id);
      if (counts) {
        counts.total++;
        if (sub.status === "completed") {
          counts.completed++;
        }
      }
    }

    // Merge data
    const assignmentsWithCounts: AssignmentWithCounts[] = assignmentsData.map((a) => ({
      ...a,
      submissionCounts: countMap.get(a.id) || { total: 0, completed: 0 },
    }));

    setAssignments(assignmentsWithCounts);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !selectedClassroomId || !title.trim() || !archetypeId) return;

    setCreating(true);
    setError(null);

    // Validate dates
    if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
      setError("End date must be after start date.");
      setCreating(false);
      return;
    }

    // Determine guided reflection override value
    let guidedOverride: boolean | null = null;
    if (guidedReflectionOverride === "on") guidedOverride = true;
    else if (guidedReflectionOverride === "off") guidedOverride = false;

    const { error: insertError } = await supabase.from("assignments").insert({
      classroom_id: selectedClassroomId,
      educator_id: userId,
      title: title.trim(),
      archetype_id: archetypeId,
      variant_id: variantId || null,
      starts_at: startsAt || null,
      ends_at: endsAt || null,
      guided_reflection_override: guidedOverride,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      // Reset form
      setTitle("");
      setArchetypeId("");
      setVariantId(null);
      setStartsAt("");
      setEndsAt("");
      setGuidedReflectionOverride("default");
      // Refresh assignments
      await fetchAssignments(selectedClassroomId);
    }

    setCreating(false);
  }

  async function handleDelete(assignmentId: string, assignmentTitle: string) {
    if (!confirm(`Delete assignment "${assignmentTitle}"?`)) return;

    const { error: deleteError } = await supabase
      .from("assignments")
      .delete()
      .eq("id", assignmentId);

    if (deleteError) {
      setError(deleteError.message);
    } else if (selectedClassroomId) {
      await fetchAssignments(selectedClassroomId);
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <p className="text-zinc-500">Loading...</p>
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
            Assign specific stories to your classrooms.
          </p>
        </div>
        <Link
          href="/educator"
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          Back to Dashboard
        </Link>
      </div>

      {classrooms.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-500">
            No classrooms yet.{" "}
            <Link href="/educator/classrooms" className="text-zinc-900 hover:underline">
              Create one first
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          {/* Classroom Selector */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Select Classroom
            </label>
            <select
              value={selectedClassroomId || ""}
              onChange={(e) => setSelectedClassroomId(e.target.value || null)}
              className="w-full max-w-xs rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            >
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>

          {/* Create Assignment Form */}
          <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Create Assignment
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Unit 1 Lesson 2"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Story
                </label>
                <select
                  value={archetypeId}
                  onChange={(e) => setArchetypeId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                  required
                >
                  <option value="">Select a story...</option>
                  {ARCHETYPES.map((archetype) => (
                    <option key={archetype.archetypeId} value={archetype.archetypeId}>
                      {archetype.lessonTitle}
                    </option>
                  ))}
                </select>
              </div>

              {availableVariants.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
                    Variant (optional)
                  </label>
                  <select
                    value={variantId || ""}
                    onChange={(e) => setVariantId(e.target.value || null)}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                  >
                    <option value="">Default (auto-select)</option>
                    {availableVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
                    Starts at (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
                    Ends at (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    min={startsAt || new Date().toISOString().slice(0, 16)}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Guided Reflection
                </label>
                <select
                  value={guidedReflectionOverride}
                  onChange={(e) => setGuidedReflectionOverride(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                >
                  <option value="default">Default (use global setting)</option>
                  <option value="on">On</option>
                  <option value="off">Off</option>
                </select>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={creating || !title.trim() || !archetypeId}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Assignment"}
              </button>
            </form>
          </div>

          {/* Assignments List */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Assignments
            </h2>
            {assignments.length === 0 ? (
              <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
                <p className="text-zinc-500">
                  No assignments yet for this classroom.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
