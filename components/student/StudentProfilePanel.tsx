import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { useAuth, displayNameFor } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { profileQueries } from "@/lib/db/profiles";
import AvatarUpload from "@/components/account/AvatarUpload";
import { StarRatingDisplay } from "@/components/ui/StarRating";

const MAX_BIO = 200;

export default function StudentProfilePanel() {
  const { t } = useLanguage();
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const previewName = fullName.trim() || displayNameFor(user, profile);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await profileQueries.updateProfile(user.id, {
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
      });
      await refreshProfile();
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "w-full rounded-control border border-line bg-mist px-stack py-tight text-sm text-ink outline-none transition-colors duration-base placeholder:text-slate focus:border-accent";

  return (
    <div className="card-lift grid grid-cols-1 overflow-hidden rounded-card border border-line bg-background lg:grid-cols-2">
      {/* Form */}
      <div className="flex flex-col gap-stack border-line px-block py-block lg:border-r">
        {error ? (
          <div className="rounded-control border border-danger/50 bg-danger/10 px-stack py-tight text-sm text-ink">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-tight self-center">
          <AvatarUpload size={96} />
          <span className="text-xs text-slate">{t("components.account.AvatarUpload.change")}</span>
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-slate" htmlFor="student-name">
            {t("components.auth.AuthModal.nameLabel")}
          </label>
          <input
            id="student-name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder={t("components.auth.AuthModal.namePlaceholder")}
            className={fieldClass}
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs uppercase tracking-widest text-slate" htmlFor="student-bio">
              Short bio
            </label>
            <span className="text-[10px] text-slate">{bio.length}/{MAX_BIO}</span>
          </div>
          <textarea
            id="student-bio"
            rows={4}
            maxLength={MAX_BIO}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="A sentence or two about what you're learning"
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-slate">
            Shown next to your reviews and on your leaderboard entry.
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
            Save profile
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="flex flex-col gap-stack bg-dash-tint px-block py-block">
        <span className="text-[10px] uppercase tracking-widest text-slate">
          Live preview — how you appear to others
        </span>

        {/* Review-card preview */}
        <div className="rounded-card border border-line bg-background p-block">
          <span className="mb-2 block text-xs uppercase tracking-widest text-slate">On a course review</span>
          <div className="flex items-center gap-tight">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-9 w-9 shrink-0 rounded-pill object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-accent/15 text-xs font-medium text-accent">
                {previewName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{previewName}</p>
              <StarRatingDisplay value={5} size="sm" />
            </div>
          </div>
          {bio.trim() ? (
            <p className="mt-3 text-xs text-slate">{bio.trim()}</p>
          ) : (
            <p className="mt-3 text-xs text-slate italic">Your bio will appear here.</p>
          )}
        </div>

        {/* Leaderboard preview */}
        <div className="rounded-card border border-line bg-background p-block">
          <span className="mb-2 block text-xs uppercase tracking-widest text-slate">
            On the leaderboard
          </span>
          <div className="flex items-center justify-between rounded-control border border-line px-3 py-2">
            <span className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-center text-lg">🥇</span>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-xs font-medium text-accent">
                  {previewName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="font-medium text-ink">{previewName}</span>
            </span>
            <span className="font-heading text-ink">{profile?.total_points ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
