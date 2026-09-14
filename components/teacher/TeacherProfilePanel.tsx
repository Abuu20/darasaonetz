import { useState } from "react";
import { Loader2, Check, BookOpen, Users, ChevronLeft } from "lucide-react";
import { useAuth, displayNameFor } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { profileQueries } from "@/lib/db/profiles";
import AvatarUpload from "@/components/account/AvatarUpload";
import images from "@/assets/images.json";

const MAX_BIO = 240;

/**
 * Inline version of the teacher profile editor — same fields, same live
 * preview, same save semantics, but rendered as tab content instead of a
 * fixed-position overlay. No ResizablePanel: the tab pane already gives it
 * a full-width canvas.
 */
export default function TeacherProfilePanel({ onClose }: { onClose: () => void }) {
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
    "w-full rounded-control border border-line bg-mist px-stack py-tight text-sm text-ink outline-none transition-colors duration-base placeholder:text-slate focus:border-accent";

  return (
    <div className="card-lift flex flex-col overflow-hidden rounded-card border border-line bg-background">
      <div className="flex items-center justify-between gap-stack border-b border-line px-block py-3">
        <div className="flex items-center gap-stack">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-xs text-slate transition-colors duration-base hover:border-accent hover:text-ink"
          >
            <ChevronLeft size={14} aria-hidden="true" />
            {t("components.teacher.TeacherProfileEditor.done")}
          </button>
          <div>
            <h2 className="font-heading text-base text-ink">
              {t("components.teacher.TeacherProfileEditor.title")}
            </h2>
            <p className="text-xs text-slate">
              {t("components.teacher.TeacherProfileEditor.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Form */}
        <div className="flex flex-col gap-stack border-line px-block py-block lg:border-r">
          {error ? (
            <div className="rounded-control border border-danger/50 bg-danger/10 px-stack py-tight text-sm text-ink">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col items-center gap-tight self-center">
            <AvatarUpload size={96} />
            <span className="text-xs text-slate">
              {t("components.teacher.TeacherProfileEditor.avatarHint")}
            </span>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-slate" htmlFor="teacher-name">
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
            <label className="mb-1 block text-xs uppercase tracking-widest text-slate" htmlFor="teacher-expertise">
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
            <label className="mb-1 block text-xs uppercase tracking-widest text-slate" htmlFor="teacher-qualifications">
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

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs uppercase tracking-widest text-slate" htmlFor="teacher-bio">
                {t("components.teacher.TeacherProfileEditor.bioLabel")}
              </label>
              <span className="text-[10px] text-slate">{bio.length}/{MAX_BIO}</span>
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
            <p className="mt-1 text-xs text-slate">
              {t("components.teacher.TeacherProfileEditor.bioHint")}
            </p>
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
          </div>
        </div>

        {/* Live preview — the real "About the teacher" card students see */}
        <div className="flex flex-col gap-stack bg-dash-tint px-block py-block">
          <span className="text-[10px] uppercase tracking-widest text-slate">
            {t("components.teacher.TeacherProfileEditor.previewLabel")}
          </span>

          <div className="flex flex-col gap-stack rounded-card border border-line bg-background p-block">
            <h3 className="font-heading text-base text-ink">
              {t("components.teacher.TeacherProfileEditor.aboutTeacher")}
            </h3>
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

          <div className="flex flex-col gap-tight rounded-card border border-line bg-background px-stack py-stack">
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
      </div>
    </div>
  );
}
