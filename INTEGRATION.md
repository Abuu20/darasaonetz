# Integration guide

## 1. Run the SQL migration
In the Supabase SQL editor, run `supabase-leaderboard-v2.sql`. It's additive —
new tables + two new RPCs — and doesn't touch your existing `game_scores`
trigger. Re-read the caveat at the top of the file: **Weekly/Monthly will
show 0 for everyone until new points are earned after this runs.** All-Time
is unaffected (still reads `profiles.total_points`).

## 2. Drop in the new/changed files
Copy these into your project at the same paths:

- `lib/leaderboard/levels.ts` — new
- `lib/db/leaderboard.ts` — new
- `lib/db/teacherActivity.ts` — new
- `components/leaderboard/LeaderboardBoard.tsx` — new
- `components/student/StudentLeaderboardPanel.tsx` — **replaces** your current one (same props/usage, no caller changes needed)
- `components/teacher/TeacherClassLeaderboardPanel.tsx` — new
- `components/teacher/TeacherCalendarPanel.tsx` — new

## 3. Check the embed hints in `teacherActivity.ts`
I guessed the Postgres FK constraint names for three of the four joins
(`lesson_completions_student_id_fkey`, `quiz_attempts_student_id_fkey`,
`course_reviews_student_id_fkey`) by convention — only the `enrollments`
one is confirmed from your existing code. If Supabase complains about an
ambiguous or unknown relationship on any of them, drop the `!xxx_fkey`
part and use the bare `profiles (full_name)` — it'll resolve on its own
as long as there's only one FK from that table to `profiles`.

## 4. Wire the two new tabs into `pages/teacher/TeacherDashboard.tsx`

**Imports** — add to the existing lucide-react import and add two component imports:
```tsx
import { /* ...existing icons... */ Trophy, CalendarDays } from "lucide-react";
import TeacherClassLeaderboardPanel from "@/components/teacher/TeacherClassLeaderboardPanel";
import TeacherCalendarPanel from "@/components/teacher/TeacherCalendarPanel";
```

**TabId union** — add the two new ids:
```tsx
type TabId = "overview" | "courses" | "quizzes" | "students" | "leaderboard" | "calendar" | "comments" | "reviews" | "profile";
const VALID_TABS: readonly TabId[] = [
  "overview", "courses", "quizzes", "students", "leaderboard", "calendar", "comments", "reviews", "profile",
];
```

**`navItems`** — insert after the `students` entry:
```tsx
{
  id: "leaderboard",
  label: "Leaderboard",
  icon: Trophy,
  onClick: () => setActiveTab("leaderboard"),
  active: activeTab === "leaderboard",
},
{
  id: "calendar",
  label: "Calendar",
  icon: CalendarDays,
  onClick: () => setActiveTab("calendar"),
  active: activeTab === "calendar",
},
```

**`tabs`** (the `DashboardTab[]` array) — insert after the `students` entry:
```tsx
{ id: "leaderboard", label: "Leaderboard", icon: Trophy },
{ id: "calendar", label: "Calendar", icon: CalendarDays },
```

**Render switch** — insert after the `activeTab === "students"` line:
```tsx
{activeTab === "leaderboard" ? <TeacherClassLeaderboardPanel courses={courses} /> : null}
{activeTab === "calendar" ? <TeacherCalendarPanel courses={courses} /> : null}
```

That's it — both new panels reuse the `courses` state `TeacherDashboard`
already loads, same pattern as `CommentsPanel`/`ReviewsPanel`.

## 5. Optional: award badges as things happen
Nothing currently calls `check_and_award_badges` — it only runs when you
call it. The natural hook points are wherever points/streaks/enrollment
already change client-side, e.g.:

- After `gameScoreQueries.awardPoints(...)` succeeds → `badgeQueries.checkAndAward(userId)`
- After `useStreak().logActivity()` → same call
- After `enrollmentQueries.enroll(...)` → same call

Each call is a no-op for badges already earned, so it's safe to call
liberally. If you want a celebratory toast, use the returned array (newly
earned badges only).

## What this does *not* do
- Doesn't make quizzes or lessons award points — only games do that today
  (that's your existing `game_scores` trigger, unchanged). If you want
  quiz/lesson completions to count toward XP too, call the new
  `log_points(user_id, points, 'quiz' | 'lesson', source_id)` RPC from
  wherever those complete.
- No i18n keys added — all new UI strings are plain English. Your existing
  panels use `t("...")` via `useLanguage()`; these don't yet.
