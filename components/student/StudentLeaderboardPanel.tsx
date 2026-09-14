import LeaderboardBoard from "@/components/leaderboard/LeaderboardBoard";

/**
 * All the actual data fetching (points, streak, badges, rank, Weekly/
 * Monthly/All-Time) lives in LeaderboardBoard + lib/db/leaderboard.ts now,
 * shared with the teacher-side class leaderboard.
 */
export default function StudentLeaderboardPanel() {
  return <LeaderboardBoard scope="global" title="Global leaderboard" />;
}
