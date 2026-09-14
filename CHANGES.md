# Teacher Dashboard → DashUI-style restyle

## How to apply
Drop these 9 files into your project at the **same relative paths**,
overwriting the originals. Nothing else in your repo changes — the
public site (Home, Courses, Quran tools, the student Learn page, Quiz
Arena) is untouched.

- index.css
- pages/teacher/TeacherDashboard.tsx
- components/dashboard/DashboardShell.tsx
- components/dashboard/StatCard.tsx
- components/teacher/CourseFormModal.tsx        ← the create/edit course popup
- components/teacher/StudentsPanel.tsx
- components/teacher/TeacherProfileEditor.tsx
- components/teacher/QuizzesPanel.tsx
- components/teacher/QuizResultsPanel.tsx

## What changed

**New scoped theme.** Added a `.dash-theme` class in `index.css` that
overrides just three things — accent color, the brand gradient, and
corner radius — via the CSS variables your components already read.
It's applied once, on the root `<div>` of `TeacherDashboard`, so it
cascades to the popup and every panel automatically without editing
their internals line by line.

- `--color-accent` → `#624BFF` (DashUI's violet-blue) instead of the
  magenta `#C86FFF` used on the marketing site.
- `.gradient-brand` → a violet gradient instead of the blue/purple/
  orange rainbow, used on your primary buttons and progress bars.
- Corner radii tightened (`2.25rem → 1.125rem` on cards, etc.) so it
  reads as a dashboard, not a landing page.

**Dark → light chrome.** `DashboardShell` (sidebar + topbar) and
`StatCard` were using your dark "night/panel" tokens — a heavy black‑
glass admin look. Rewritten to use the same light tokens your public
pages already use (`background`, `ink`, `mist`, `line`, `slate`), so
the sidebar is white, the page background is a soft light gray, and
text is dark-on-light instead of white-on-black.

`TeacherProfileEditor`'s form pane had the same issue (dark fields on
a dark panel) — relit to match.

**Popup + list polish.** `CourseFormModal` (create/edit), `StudentsPanel`,
`QuizzesPanel`, and `QuizResultsPanel` already used your light tokens,
so they mostly just inherit the new violet accent automatically. I
added a proper drop shadow (`card-lift`) to each modal panel so they
sit above the page instead of looking flat, and softened the backdrop
scrim slightly (`/80` → `/70`).

## What I deliberately left alone
- `LessonManagerPanel.tsx` — its lesson editor has a "live preview"
  pane that intentionally reproduces the real dark public Learn page
  pixel-for-pixel (there's a comment in the source explaining why).
  Recoloring it would make the preview lie about what students see,
  so only its outer tab chrome would be safe to touch — happy to do
  a careful pass on just that if you want it next.
- `QuizBuilder.tsx` / `QuizPlayer.tsx` — not part of "view/create
  course," left for a follow-up if you want the whole surface area.
- Public marketing pages, the Learn page, Quiz Arena — untouched by
  design, since you scoped this to the popup + Teacher Dashboard.
