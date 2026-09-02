import { useState } from "react";
import { X, Loader2, Check, BookOpen, Users } from "lucide-react";
import { useAuth, displayNameFor } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { profileQueries } from "@/lib/db/profiles";
import AvatarUpload from "@/components/account/AvatarUpload";
import ResizablePanel from "@/components/ui/ResizablePanel";
import ResizableSplit from "@/components/ui/ResizableSplit";
import images from "@/assets/images.json";

const MAX_BIO = 240;

export default function TeacherProfileEditor({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [expertise, setExpertise] = useState(profile?.expertise ?? "");
  const [qualifications, setQualifications] = useState(profile?.qualifications ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const previewName = fullName.trim() || displayNameFor(user, profile);
  const previewBio = bio.trim();

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await profileQueries.updateProfile(user.id, {
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        expertise: expertise.trim() || null,
        qualifications: qualifications.trim() || null,
      });
      await refreshProfile();
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || t("components.teacher.TeacherProfileEditor.failed"));
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "w-full rounded-control border border-hairline bg-night/60 px-stack py-tight text-sm text-night-foreground outline-none transition-colors duration-base placeholder:text-lavender focus:border-accent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 px-gutter py-block" role="dialog" aria-modal="true">
      <ResizablePanel
        defaultWidth={880}
        defaultHeight={620}
        minWidth={400}
        minHeight={420}
        className="overflow-hidden rounded-panel border border-hairline bg-panel"
        resizeLabel={t("components.teacher.TeacherProfileEditor.resizeWindow")}
      >
        <div className="flex items-center justify-between gap-stack border-b border-hairline px-block py-tight">
          <div>
            <h2 className="font-heading text-lg text-night-foreground">{t("components.teacher.TeacherProfileEditor.title")}</h2>
            <p className="mt-1 text-xs text-lavender">{t("components.teacher.TeacherProfileEditor.subtitle")}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("components.teacher.TeacherProfileEditor.close")} className="text-lavender hover:text-night-foreground">
            <X size={20} />
          </button>
        </div>

        <ResizableSplit
          className="min-h-0 flex-1 overflow-hidden"
          dividerLabel={t("components.teacher.TeacherProfileEditor.resizeSplit")}
          left={
            <div className="flex h-full flex-col gap-stack px-block py-block">
              {error ? <div className="rounded-control border border-danger/50 bg-danger/10 px-stack py-tight text-sm text-night-foreground">{error}</div> : null}

              <div className="flex flex-col items-center gap-tight self-center">
                <AvatarUpload size={96} />
                <span className="text-xs text-lavender">{t("components.teacher.TeacherProfileEditor.avatarHint")}</span>
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-lavender" htmlFor="teacher-name">
                  {t("components.teacher.TeacherProfileEditor.nameLabel")}
                </label>
                <input
                  id="teacher-name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={t("components.teacher.TeacherProfileEditor.namePlaceholder")}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-lavender" htmlFor="teacher-expertise">
                  {t("components.teacher.TeacherProfileEditor.expertiseLabel")}
                </label>
                <input
                  id="teacher-expertise"
                  value={expertise}
                  onChange={e => setExpertise(e.target.value)}
                  placeholder={t("components.teacher.TeacherProfileEditor.expertisePlaceholder")}
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-lavender" htmlFor="teacher-qualifications">
                  {t("components.teacher.TeacherProfileEditor.qualificationsLabel")}
                </label>
                <input
                  id="teacher-qualifications"
                  value={qualifications}
                  onChange={e => setQualifications(e.target.value)}
                  placeholder={t("components.teacher.TeacherProfileEditor.qualificationsPlaceholder")}
                  className={fieldClass}
                />
              </div>

              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs uppercase tracking-widest text-lavender" htmlFor="teacher-bio">
                    {t("components.teacher.TeacherProfileEditor.bioLabel")}
                  </label>
                  <span className="text-[10px] text-lavender">
                    {bio.length}/{MAX_BIO}
                  </span>
                </div>
                <textarea
                  id="teacher-bio"
                  rows={5}
                  maxLength={MAX_BIO}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder={t("components.teacher.TeacherProfileEditor.bioPlaceholder")}
                  className={fieldClass}
                />
                <p className="mt-1 text-xs text-lavender">{t("components.teacher.TeacherProfileEditor.bioHint")}</p>
              </div>

              <div className="flex items-center gap-tight pt-tight">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="gradient-brand flex items-center gap-1 rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
                  {t("components.teacher.TeacherProfileEditor.save")}
                </button>
                <button type="button" onClick={onClose} className="rounded-control border border-hairline px-block py-tight text-sm text-lavender">
                  {t("components.teacher.TeacherProfileEditor.done")}
                </button>
              </div>
            </div>
          }
          right={
            <div className="flex h-full flex-col gap-stack bg-background px-block py-block">
              <span className="text-[10px] uppercase tracking-widest text-slate">
                {t("components.teacher.TeacherProfileEditor.previewLabel")}
              </span>

              {/* Mirrors the "About the teacher" card on the real course page
                  (pages/CourseDetail.tsx) exactly — same classes, same
                  layout — so this is the real thing students will see, not
                  an approximation of it. */}
              <div className="flex flex-col gap-stack rounded-card border border-line bg-mist p-block">
                <h3 className="font-heading text-base text-ink">{t("components.teacher.TeacherProfileEditor.aboutTeacher")}</h3>
                <div className="flex items-start gap-tight">
                  <img
                    src={profile?.avatar_url || images["logo"]}
                    alt=""
                    onError={event => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = images["logo"];
                    }}
                    className="h-12 w-12 shrink-0 rounded-pill object-cover"
                  />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-ink">{previewName}</p>
                    {expertise.trim() ? <p className="text-xs font-medium text-accent">{expertise.trim()}</p> : null}
                    {qualifications.trim() ? <p className="text-xs text-slate">{qualifications.trim()}</p> : null}
                    {previewBio ? <p className="mt-1 text-xs text-slate">{previewBio}</p> : null}
                  </div>
                </div>
              </div>

              {/* Mirrors the teacher line on a course card
                  (components/teacher/CourseCardPreview.tsx /
                  components/Courses/CourseGrid.tsx) — how the name reads
                  next to a course thumbnail in the catalog. */}
              <div className="flex flex-col gap-tight rounded-card bg-background px-stack py-stack">
                <span className="text-[10px] uppercase tracking-widest text-slate">
                  {t("components.teacher.TeacherProfileEditor.onCourseCard")}
                </span>
                <div className="flex flex-wrap items-center gap-stack text-xs text-slate">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen size={14} aria-hidden="true" />
                    <span>3</span>
                    <span>{t("components.Courses.CourseGrid.lessons")}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={14} aria-hidden="true" />
                    <span>{previewName}</span>
                  </span>
                </div>
              </div>
            </div>
          }
        />
      </ResizablePanel>
    </div>
  );
}
