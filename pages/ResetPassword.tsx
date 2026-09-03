import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "@/components/seo/SEOHead";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/db/client";

export default function ResetPassword() {
  const { t } = useLanguage();
  const { user, isLoading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Supabase parses the recovery link (#access_token=...&type=recovery) itself
  // via detectSessionInUrl and fires this event once the session is set.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecoverySession(true);
    });
    // Give the client a moment to process the URL fragment on first load.
    const timer = setTimeout(() => setCheckingLink(false), 600);
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(t("pages.ResetPassword.mismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("pages.ResetPassword.tooShort"));
      return;
    }
    setIsSubmitting(true);
    try {
      await updatePassword(password);
      navigate("/account", { replace: true });
    } catch (err: any) {
      setError(err?.message || t("pages.ResetPassword.failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    "w-full rounded-control border border-hairline bg-night/60 px-stack py-tight text-sm text-night-foreground outline-none transition-colors duration-base placeholder:text-lavender focus:border-accent";

  if (isLoading || checkingLink) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-night">
        <div className="h-10 w-10 animate-spin rounded-pill border-4 border-hairline border-t-accent" />
      </main>
    );
  }

  if (!user || !isRecoverySession) {
    return (
      <>
        <SEOHead titleKey={t("pages.ResetPassword.seo.title")} descriptionKey={t("pages.ResetPassword.seo.description")} />
        <main className="flex min-h-screen flex-col items-center justify-center gap-stack bg-night px-gutter text-center text-night-foreground">
          <h1 data-text-id="pages.ResetPassword.expiredTitle" className="font-heading text-2xl">
            {t("pages.ResetPassword.expiredTitle")}
          </h1>
          <p className="max-w-prose text-sm text-lilac">{error || t("pages.ResetPassword.expired")}</p>
          <Link
            to="/account"
            className="gradient-brand rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover"
          >
            <span data-text-id="pages.ResetPassword.back">{t("pages.ResetPassword.back")}</span>
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <SEOHead titleKey={t("pages.ResetPassword.seo.title")} descriptionKey={t("pages.ResetPassword.seo.description")} />
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-stack bg-night px-gutter py-section-spacing-mobile text-night-foreground">
        <h1 data-text-id="pages.ResetPassword.title" className="font-heading text-2xl">
          {t("pages.ResetPassword.title")}
        </h1>
        <p data-text-id="pages.ResetPassword.body" className="text-sm text-lilac">
          {t("pages.ResetPassword.body")}
        </p>

        {error ? (
          <div className="rounded-control border border-danger/50 bg-danger/10 px-stack py-tight text-sm text-night-foreground">{error}</div>
        ) : null}

        <form className="flex flex-col gap-stack" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-lavender" htmlFor="reset-password">
              <span data-text-id="pages.ResetPassword.newLabel">{t("pages.ResetPassword.newLabel")}</span>
            </label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-lavender" htmlFor="reset-confirm">
              <span data-text-id="pages.ResetPassword.confirmLabel">{t("pages.ResetPassword.confirmLabel")}</span>
            </label>
            <input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={event => setConfirm(event.target.value)}
              className={fieldClass}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="gradient-brand rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover disabled:opacity-60"
          >
            <span data-text-id="pages.ResetPassword.submit">{t("pages.ResetPassword.submit")}</span>
          </button>
        </form>
      </main>
    </>
  );
}
