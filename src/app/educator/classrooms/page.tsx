"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { generateJoinCode } from "@/lib/utils/joinCode";
import { Classroom } from "@/lib/supabase/types";

// Member type with optional profile data (fetched separately due to no direct FK)
interface ClassroomMemberData {
  id: string;
  classroom_id: string;
  student_id: string;
  joined_at: string;
  profile?: {
    username?: string | null;
  } | null;
}

/**
 * Educator Classrooms Page (Stage 21)
 *
 * Manage classrooms: create, view roster, remove students, delete.
 * Protected by educator layout RBAC.
 */

interface ClassroomWithMembers extends Classroom {
  members: ClassroomMemberData[];
  memberCount: number;
}

function ClassroomCard({
  classroom,
  onRemoveStudent,
  onDeleteClassroom,
}: {
  classroom: ClassroomWithMembers;
  onRemoveStudent: (memberId: string, studentName: string) => void;
  onDeleteClassroom: (classroomId: string, classroomName: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyJoinCode() {
    await navigator.clipboard.writeText(classroom.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getStudentDisplayName(member: ClassroomMemberData): string {
    return (
      member.profile?.username ??
      `${member.student_id.slice(0, 8)}...`
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">
            {classroom.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-sm text-zinc-600">
              Join Code: {classroom.join_code}
            </span>
            <button
              onClick={copyJoinCode}
              className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {classroom.memberCount} student{classroom.memberCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => onDeleteClassroom(classroom.id, classroom.name)}
          className="rounded px-3 py-1 text-sm text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      <div className="mt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          {expanded ? "Hide Roster ▲" : "View Roster ▼"}
        </button>

        {expanded && (
          <div className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
            {classroom.members.length === 0 ? (
              <p className="text-sm text-zinc-500">No students yet.</p>
            ) : (
              <ul className="space-y-2">
                {classroom.members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-zinc-700">
                      {getStudentDisplayName(member)}
                    </span>
                    <button
                      onClick={() =>
                        onRemoveStudent(member.id, getStudentDisplayName(member))
                      }
                      className="rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EducatorClassroomsPage() {
  const supabase = createClient();
  const [classrooms, setClassrooms] = useState<ClassroomWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newClassroomName, setNewClassroomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchClassrooms(user.id);
      }
      setLoading(false);
    }
    init();
  }, [supabase]);

  async function fetchClassrooms(educatorId: string) {
    // Fetch classrooms
    const { data: classroomsData } = await supabase
      .from("classrooms")
      .select("*")
      .eq("educator_id", educatorId)
      .order("created_at", { ascending: false });

    if (!classroomsData) {
      setClassrooms([]);
      return;
    }

    // Fetch members for each classroom, then fetch profiles separately
    const classroomsWithMembers: ClassroomWithMembers[] = await Promise.all(
      classroomsData.map(async (classroom) => {
        // Fetch members (no profiles join - no direct FK exists)
        const { data: members } = await supabase
          .from("classroom_members")
          .select("id, classroom_id, student_id, joined_at")
          .eq("classroom_id", classroom.id)
          .order("joined_at", { ascending: true });

        if (!members || members.length === 0) {
          return {
            ...classroom,
            members: [],
            memberCount: 0,
          };
        }

        // Fetch profiles for all student IDs
        const studentIds = members.map((m) => m.student_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username")
          .in("user_id", studentIds);

        // Create a map of user_id -> profile
        const profileMap = new Map(
          (profiles || []).map((p) => [p.user_id, p])
        );

        // Merge members with their profiles
        const membersWithProfiles: ClassroomMemberData[] = members.map((m) => ({
          ...m,
          profile: profileMap.get(m.student_id) || null,
        }));

        return {
          ...classroom,
          members: membersWithProfiles,
          memberCount: members.length,
        };
      })
    );

    setClassrooms(classroomsWithMembers);
  }

  async function handleCreateClassroom(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !newClassroomName.trim()) return;

    setCreating(true);
    setError(null);

    const MAX_RETRIES = 5;
    let created = false;

    for (let attempt = 0; attempt < MAX_RETRIES && !created; attempt++) {
      const joinCode = generateJoinCode();
      const { data, error: insertError } = await supabase
        .from("classrooms")
        .insert({
          name: newClassroomName.trim(),
          educator_id: userId,
          join_code: joinCode,
        })
        .select()
        .single();

      if (!insertError && data) {
        created = true;
        setNewClassroomName("");
        await fetchClassrooms(userId);
      } else if (
        insertError?.code === "23505" &&
        insertError.message?.includes("join_code")
      ) {
        // Unique violation on join_code, retry
        continue;
      } else {
        setError(insertError?.message || "Failed to create classroom");
        break;
      }
    }

    if (!created && !error) {
      setError("Failed to generate unique join code. Please try again.");
    }

    setCreating(false);
  }

  async function handleRemoveStudent(memberId: string, studentName: string) {
    if (!confirm(`Remove ${studentName} from this classroom?`)) return;

    const { error: deleteError } = await supabase
      .from("classroom_members")
      .delete()
      .eq("id", memberId);

    if (deleteError) {
      setError(deleteError.message);
    } else if (userId) {
      await fetchClassrooms(userId);
    }
  }

  async function handleDeleteClassroom(
    classroomId: string,
    classroomName: string
  ) {
    if (!confirm(`Delete "${classroomName}"? This will remove all students.`))
      return;

    const { error: deleteError } = await supabase
      .from("classrooms")
      .delete()
      .eq("id", classroomId);

    if (deleteError) {
      setError(deleteError.message);
    } else if (userId) {
      await fetchClassrooms(userId);
    }
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
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">Classrooms</h1>
          <p className="text-zinc-600">
            Create classrooms and manage student rosters.
          </p>
        </div>
        <Link
          href="/educator"
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Create Classroom Form */}
      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Create Classroom
        </h2>
        <form onSubmit={handleCreateClassroom} className="flex gap-3">
          <input
            type="text"
            value={newClassroomName}
            onChange={(e) => setNewClassroomName(e.target.value)}
            placeholder="Classroom name (e.g., Math Period 3)"
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={creating || !newClassroomName.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Classrooms List */}
      {classrooms.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="text-zinc-500">No classrooms yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            {classrooms.length} classroom{classrooms.length !== 1 ? "s" : ""}
          </p>
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              classroom={classroom}
              onRemoveStudent={handleRemoveStudent}
              onDeleteClassroom={handleDeleteClassroom}
            />
          ))}
        </div>
      )}
    </div>
  );
}
