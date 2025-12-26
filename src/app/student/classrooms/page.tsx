"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { normalizeJoinCode } from "@/lib/utils/joinCode";
// Membership with classroom data (fetched separately to avoid RLS join issues)
interface StudentMembershipData {
  id: string;
  classroom_id: string;
  joined_at: string;
  classroom_name: string | null;
}

/**
 * Student Classrooms Page (Stage 21)
 *
 * Join classrooms via code and view joined classrooms.
 * Protected by student layout RBAC.
 * Students CANNOT see roster (only classroom name + joined date).
 */

export default function StudentClassroomsPage() {
  const supabase = createClient();
  const [memberships, setMemberships] = useState<StudentMembershipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchMemberships(user.id);
      }
      setLoading(false);
    }
    init();
  }, [supabase]);

  async function fetchMemberships(studentId: string) {
    // Fetch memberships (no join to avoid RLS issues)
    const { data: membersData } = await supabase
      .from("classroom_members")
      .select("id, classroom_id, joined_at")
      .eq("student_id", studentId)
      .order("joined_at", { ascending: false });

    if (!membersData || membersData.length === 0) {
      setMemberships([]);
      return;
    }

    // Fetch classroom names separately
    const classroomIds = membersData.map((m) => m.classroom_id);
    const { data: classroomsData } = await supabase
      .from("classrooms")
      .select("id, name")
      .in("id", classroomIds);

    // Create a map of classroom_id -> name
    const classroomMap = new Map(
      (classroomsData || []).map((c) => [c.id, c.name])
    );

    // Merge memberships with classroom names
    const membershipsWithNames: StudentMembershipData[] = membersData.map((m) => ({
      id: m.id,
      classroom_id: m.classroom_id,
      joined_at: m.joined_at,
      classroom_name: classroomMap.get(m.classroom_id) || null,
    }));

    setMemberships(membershipsWithNames);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setJoining(true);
    setError(null);
    setSuccess(null);

    // Normalize input
    const normalized = normalizeJoinCode(joinCode);

    if (normalized.length !== 6) {
      setError("Please enter a valid 6-character code.");
      setJoining(false);
      return;
    }

    // Look up classroom by join code
    const { data: classroom, error: lookupError } = await supabase
      .from("classrooms")
      .select("id, name")
      .eq("join_code", normalized)
      .single();

    if (lookupError || !classroom) {
      setError("Classroom not found. Check your code and try again.");
      setJoining(false);
      return;
    }

    // Join the classroom
    const { error: joinError } = await supabase
      .from("classroom_members")
      .insert({
        classroom_id: classroom.id,
        student_id: userId,
      });

    if (joinError) {
      if (joinError.code === "23505") {
        setError("You've already joined this classroom.");
      } else {
        setError(joinError.message || "Failed to join classroom.");
      }
      setJoining(false);
      return;
    }

    setSuccess(`Joined "${classroom.name}" successfully!`);
    setJoinCode("");
    await fetchMemberships(userId);
    setJoining(false);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="py-8">
        <p className="text-zinc-500">Loading classrooms...</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">
            My Classrooms
          </h1>
          <p className="text-zinc-600">
            Join a classroom using a code from your educator.
          </p>
        </div>
        <Link
          href="/student"
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          Back to Stories
        </Link>
      </div>

      {/* Join Classroom Form */}
      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Join a Classroom
        </h2>
        <form onSubmit={handleJoin} className="flex gap-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter join code"
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm uppercase focus:border-zinc-500 focus:outline-none"
            maxLength={10}
            required
          />
          <button
            type="submit"
            disabled={joining || !joinCode.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {joining ? "Joining..." : "Join"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
      </div>

      {/* Joined Classrooms List */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Joined Classrooms
        </h2>
        {memberships.length === 0 ? (
          <p className="text-zinc-500">
            You haven&apos;t joined any classrooms yet. Enter a join code above
            to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {memberships.map((membership) => (
              <li
                key={membership.id}
                className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3"
              >
                <span className="font-medium text-zinc-800">
                  {membership.classroom_name || "Unknown Classroom"}
                </span>
                <span className="text-sm text-zinc-500">
                  Joined {formatDate(membership.joined_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
