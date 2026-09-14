# Darasaone — rebuild handoff notes

## This pass — domain independence, image ownership

Two issues flagged before deploy: `robots.txt`/`sitemap.xml` hardcoded the
Vercel URL while old code elsewhere referenced `darasaone.com`, and all 23
site images (logo, hero backgrounds, course icons) were hotlinked from
`images.remixer.ai`, the AI site-builder's own asset host.

- **SEO files now generate from `VITE_APP_URL`** instead of being hand-edited.
  `scripts/generate-seo-files.mjs` writes `public/robots.txt` and
  `public/sitemap.xml` from that one env var, and runs automatically before
  both `npm run dev` and `npm run build` (see `package.json`). No domain
  purchased yet, so it currently falls back to the Vercel URL with a console
  warning — set `VITE_APP_URL` (locally in `.env` and in Vercel's project env
  vars) once you have a real domain, and every reference (these two files,
  plus canonical/`og:url` in `components/seo/SEOHead.tsx`, which already read
  this same var) updates on the next build. Nothing left to hand-edit or keep
  in sync manually.
- **Images moved off the AI builder's host, onto your own R2 bucket.**
  `scripts/migrate-images-to-r2.mjs` downloads all 23 images from
  `assets/images.json` and re-uploads them to the same Cloudflare R2 bucket
  the video-upload Worker already writes to, using the same credentials —
  no new service needed. It then rewrites `assets/images.json` to point at
  your R2 URLs and saves the original remixer.ai URLs to
  `assets/images.remixer-backup.json` first, just in case. This has to run
  on your machine (`npm install && npm run migrate:images` with the R2 env
  vars set — see the comment block at the top of the script for the exact
  command), since it needs real internet access to `images.remixer.ai` and
  your live R2 credentials, neither of which is available in a sandboxed
  build environment. Every component already reads image URLs from
  `assets/images.json` (nothing hardcoded elsewhere), so this one script run
  is the whole migration.

## This pass — video, resources, storage architecture

1. **Root cause of "video not loading" confirmed and fixed at the player
   level.** A plain `<video>` tag silently fails on a YouTube/Vimeo page
   URL — it needs a direct media file. `components/lesson/LessonVideo.tsx`
   now detects the link type and renders the right player: a custom
   YouTube player with its own controls (`YouTubePlayer.tsx`), a Vimeo
   embed using Vimeo's native player (`VimeoPlayer.tsx` — the old app
   explicitly recommended Vimeo too, so this was a real gap), or the native
   `<video>` tag for direct uploads. All three support fullscreen.
2. **Video storage moved to Cloudflare R2**, per your call — see
   `cloudflare-worker/`. A small Worker (`cloudflare-worker/src/index.ts`)
   checks the caller is a signed-in teacher (via Supabase, using the
   caller's own JWT — no service-role key needed in the Worker at all),
   then hands back a short-lived presigned URL for a direct browser→R2
   upload. Implemented with the Web Crypto API directly (no `aws4fetch` or
   AWS SDK dependency) — see `cloudflare-worker/README.md` for the full
   deploy walkthrough. **Falls back to Supabase Storage automatically** if
   `VITE_UPLOAD_WORKER_URL` isn't set, so video upload keeps working before
   you deploy the Worker.
3. **Resources (PDFs/images) now have a real in-app fullscreen viewer**
   (`components/lesson/ResourceViewerModal.tsx`) instead of just opening in
   a new tab — includes a genuine browser-Fullscreen-API toggle, not just a
   large modal. Word docs and plain links still open in a new tab, since
   those can't be rendered inline by the browser anyway.
4. **Fixed a real build blocker**: the lesson-content sanitizer depended on
   `dompurify`, which wasn't actually in `package.json`'s installed state —
   this would have failed your build. Replaced with a dependency-free
   sanitizer (`lib/sanitizeLessonContent.ts`) using the same allow-list,
   built on the browser's native `DOMParser` — consistent with this
   codebase's existing no-unnecessary-dependency approach (see `uuid.ts`,
   `RichTextEditor.tsx`).
5. **Course creation defensive fix**: added explicit `type`, `enrolled_students`,
   `rating` defaults on create, and a matching `alter table ... set default`
   safety net in `supabase-setup.sql`, in case your live `courses` table
   doesn't already default them the way `slug` didn't.

### Deploying the R2 worker

See `cloudflare-worker/README.md` for the full walkthrough. Short version:
`wrangler login` → `wrangler secret put <NAME>` for each of
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`,
`R2_PUBLIC_BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ALLOWED_ORIGIN`
→ `wrangler deploy` → paste the printed URL into `VITE_UPLOAD_WORKER_URL`
in the main app's `.env`. Also add a CORS policy on the R2 bucket itself
(browser uploads straight to R2, only the presigning goes through the
Worker) — details in that README.

## Earlier pass

1. **Fixed: "Add lesson" button doing nothing.** `crypto.randomUUID()` only
   exists in secure contexts (https, or `http://localhost`). Testing over a
   LAN address like `http://192.168.x.x:5173` — e.g. opening the app on a
   phone to see what a student would see — is *not* a secure context, so
   the click handler threw before it could open the form. Added
   `lib/uuid.ts` with a safe fallback and swapped every `crypto.randomUUID()`
   call for it (`LessonManagerPanel.tsx`, `LessonAttachmentsEditor.tsx`).
2. **Resizable teacher windows.** New `components/ui/ResizablePanel.tsx` —
   drag the bottom-right corner of the "New/Edit course" modal and the new
   teacher profile modal to make them bigger or smaller. Mouse, touch and
   keyboard (arrow keys on the handle) all work.
3. **Live split editor + preview for lessons.** New
   `components/ui/ResizableSplit.tsx` — a draggable left/right divider.
   Both the "Add lesson" form and the inline "Edit lesson" form now show
   the rich-text editor on one side and a live preview on the other, using
   the exact same `LessonContentCard` component the real student Learn page
   renders — not an approximation. Stacks vertically on small screens.
4. **Teacher profile editor with live preview**
   (`components/teacher/TeacherProfileEditor.tsx`, opened via "Edit profile"
   on the Teacher Dashboard). Change your photo, display name and bio on
   the left; the right side mirrors, live, the exact "About the teacher"
   card students see on a course page, plus how your name reads on a
   course card. Also resizable.

None of this needed new dependencies — everything uses what was already in
`package.json` (React state + Pointer Events for the resize/drag logic).

## What changed from the "beautiful but empty" version

1. **Auth** — was routed through a third-party builder service
   (`auth.remixer.ai`). Now goes straight to your Supabase project:
   email/password + Google OAuth (`context/AuthContext.tsx`).
2. **Data** — was reading/writing a generic placeholder store
   (`remixer.data`, entity_type/data JSONB table). Now reads/writes your
   real `courses`, `lessons`, `enrollments`, `profiles`,
   `lesson_completions`, `email_notifications` tables — same schema, same
   logic (progress %, completed_lessons) as the live app, so the two can
   run side by side safely. See `lib/db/*.ts`.
3. **New pages/features**:
   - Teacher Dashboard (`pages/teacher/TeacherDashboard.tsx`) — stats,
     create/edit courses, per-course collapsible lesson manager with video
     upload and "notify enrolled students" on publish.
   - Collapsible lesson list on the course page and in the teacher's lesson
     manager (`pages/CourseDetail.tsx`,
     `components/teacher/LessonManagerPanel.tsx`).
   - Realtime notification bell (`components/ui/NotificationBell.tsx`).
   - Avatar upload (`components/account/AvatarUpload.tsx`), wired into the
     header, Account page, and Teacher Dashboard.
   - PWA: installable on Android/desktop (native prompt) and iOS (manual
     instructions banner), offline app-shell via service worker
     (`public/manifest.json`, `public/sw.js`, `components/pwa/InstallPrompt.tsx`).
   - Swahili translations — every English string now has a matching Swahili
     one; the header switcher toggles the whole site.
   - Real contact form + newsletter emails via EmailJS's REST API
     (`lib/db/email.ts`) — no SDK install needed, always backed up to
     Supabase so nothing is lost if EmailJS isn't configured yet.
   - SEO: canonical URLs + Open Graph on every page, `robots.txt`,
     `sitemap.xml` for the fixed routes.
4. **Removed**: ~18 files that were internals of the AI website-builder tool
   this project was exported from (its in-browser visual editor, iframe
   message bridge, and the generic data/auth layer) — none of it belongs in
   a deployed production app.

## Before you deploy

1. Run `supabase-quiz-system-live.sql` once in your Supabase SQL editor —
   this wires the quiz builder/player to the quiz tables *already in your
   live project* (they predate this export and use different column names
   than what was originally shipped here — this migration is additive
   only, nothing is dropped or renamed, existing quiz data is untouched).
   A quiz is invisible to students until published — open any existing
   quiz in the builder once and hit **Publish**.
2. Run `supabase-setup.sql` once in your Supabase SQL editor (adds
   `contact_messages` and `newsletter_subscribers` — everything else already
   exists from the live app).
3. Copy `.env.example` to `.env` and fill in your real Supabase keys
   (same project as the live app) and, optionally, EmailJS credentials.
4. In Supabase → Authentication → Providers, enable Google and set the
   redirect URL to `<your-app-url>/account`.
5. `npm install` then `npm run build` to confirm everything compiles in
   your own environment (verified clean here, but do this once for
   yourself too).

## Known gaps / next phase

Given the size of the original app, these weren't rebuilt in this pass —
flagged clearly rather than silently skipped:

- **Admin panel** — not ported.
- **Forums / course discussion and live quiz** — the old versions used the
  placeholder data store and were removed rather than left half-working;
  worth rebuilding against the real schema next.
- **Certificates** — not ported.
- **Teacher application review** — clicking "Apply to teach" currently
  grants the teacher role immediately on signup, with no approval step.
  Fine for getting started; worth adding a `pending_teacher` status +
  simple admin approval before this is public-facing at scale, so anyone
  can't self-grant course-creation and student-notification permissions.
- Course category thumbnail fallback images (`courses.quran`,
  `courses.fiqh`, etc. in `assets/images.json`) are defined but not wired to
  anything yet — currently every course without its own thumbnail falls
  back to one generic hero image.

## This pass — bug-fix round

Reported: unreadable lesson text, video not playing, course creation
erroring on `slug`, missing PDF materials, teacher dashboard feeling
unfinished, plus two direct questions about R2 upload hosting and
fullscreen playback.

- **Fixed `courses.slug` NOT NULL crash** — course creation now generates
  a unique slug from the title before insert (`lib/db/courses.ts`).
- **Fixed unreadable lesson text** — content is now authored with a real
  rich-text editor (`components/lesson/RichTextEditor.tsx`) and rendered on
  a proper reading surface (`components/lesson/LessonContentCard.tsx`)
  instead of one dense unformatted block.
- **Fixed video not playing** — root cause was a plain `<video>` tag
  silently failing on YouTube/Vimeo links, which is what most lessons will
  use. `components/lesson/LessonVideo.tsx` now dispatches to a custom
  YouTube player, a Vimeo iframe, or native `<video>` depending on the URL,
  each with working fullscreen.
- **Added PDF/materials support** — teachers attach PDFs, docs, images or
  links per lesson (`components/lesson/LessonAttachmentsEditor.tsx`);
  students get an in-app fullscreen viewer for PDFs/images
  (`components/lesson/ResourceViewerModal.tsx`), not just a new-tab link.
- **Teacher Dashboard rebuilt** as a proper multi-step course wizard
  (Basics → Media → Curriculum → Publish) with autosave and a live
  course-card preview, instead of one long form.
- **R2 video storage** — a Cloudflare Worker (`cloudflare-worker/`) issues
  short-lived presigned upload URLs so large video files go straight
  browser→R2, never through your server or Supabase. `lib/db/storage.ts`
  automatically uses R2 once `VITE_UPLOAD_WORKER_URL` is set, and falls
  back to Supabase Storage until then — nothing breaks if you deploy the
  app before deploying the Worker. **This is the one piece you still need
  to deploy yourself** — see `cloudflare-worker/README.md`, it's a ~10
  minute setup once you have R2 API credentials.
- **Removed a broken dependency** — the lesson-content sanitizer was
  written against `dompurify`, which wasn't actually installed and would
  have failed `npm install`/build. Replaced with a small dependency-free
  sanitizer (`lib/sanitizeLessonContent.ts`) using the browser's native
  `DOMParser`, matching this codebase's existing no-unnecessary-dependency
  approach elsewhere (see `lib/uuid.ts`, `RichTextEditor.tsx`).
- Verified clean `tsc --noEmit` and a clean `vite build` end to end after
  all of the above.
