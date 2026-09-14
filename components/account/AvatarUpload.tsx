import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { avatarStorage } from "@/lib/db/storage";
import { profileQueries } from "@/lib/db/profiles";

const MAX_SIZE_MB = 5;

export default function AvatarUpload({ size = 88 }: { size?: number }) {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [imgFailed, setImgFailed] = useState(false);

  if (!user) return null;

  const handleFile = async (file: File) => {
    setError("");
    setImgFailed(false);
    if (!file.type.startsWith("image/")) {
      setError(t("components.account.AvatarUpload.invalidType"));
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(t("components.account.AvatarUpload.tooLarge"));
      return;
    }
    setIsUploading(true);
    try {
      const url = await avatarStorage.upload(user.id, file);
      await profileQueries.updateProfile(user.id, { avatar_url: url });
      await refreshProfile();
    } catch (err: any) {
      setError(err?.message || t("components.account.AvatarUpload.failed"));
    } finally {
      setIsUploading(false);
    }
  };

  const initial = (profile?.full_name || user.email || "?").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="group relative overflow-hidden rounded-pill border-2 border-hairline transition-colors duration-base hover:border-accent"
        style={{ width: size, height: size }}
        aria-label={t("components.account.AvatarUpload.change")}
      >
        {profile?.avatar_url && !imgFailed ? (
          <img src={profile.avatar_url} alt="" onError={() => setImgFailed(true)} className="h-full w-full object-cover" />
        ) : (
          <span className="gradient-brand flex h-full w-full items-center justify-center text-2xl text-primary-foreground">{initial}</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-night/60 opacity-0 transition-opacity duration-base group-hover:opacity-100">
          {isUploading ? <Loader2 size={20} className="animate-spin text-white" /> : <Camera size={20} className="text-white" />}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = "";
        }}
      />
      {error ? <span className="max-w-[200px] text-center text-xs text-danger">{error}</span> : null}
    </div>
  );
}
