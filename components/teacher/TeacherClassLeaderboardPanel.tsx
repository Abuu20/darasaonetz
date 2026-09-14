import { useAuth } from "@/context/AuthContext";
import LeaderboardBoard from "@/components/leaderboard/LeaderboardBoard";
import type { Course } from "@/lib/db/types";

interface TeacherClassLeaderboardPanelProps {
  courses: Course[];
}

export default function TeacherClassLeaderboardPanel({ courses }: TeacherClassLeaderboardPanelProps) {
  const { user } = useAuth();

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-stack rounded-card bg-mist px-block py-block text-center">
        <p className="text-sm text-slate">Create a course first — your class leaderboard fills in once students enroll.</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <LeaderboardBoard
      scope="class"
      teacherId={user.id}
      title="Class leaderboard"
      emptyMessage="No students enrolled in your courses yet."
    />
  );
}
