import { useState, useEffect, type FormEvent } from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import images from "@/assets/images.json";

// Flip this back to true once email sending is ready (i.e. once the domain
// is live and Supabase's SMTP/redirect URLs point at it). Existing accounts
// can always sign in with email regardless of this flag — it only hides the
// "create a new account with email" path.
const EMAIL_SIGNUP_ENABLED = false;

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "signin",
  initialRole = "student",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
  initialRole?: "student" | "teacher";
}) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  // Reopening the shared modal (e.g. from the "Apply to teach" CTA after
  // it was previously used for a plain sign-in) should reflect whatever it
  // was just asked to open as, not whatever was left over from last time.
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setRole(initialRole);
      clearFeedback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMode, initialRole]);

  const handleModeChange = (next: "signin" | "signup") => {
    setMode(next);
    clearFeedback();
  };

  const handleForgotPassword = async () => {
    clearFeedback();
    if (!email) {
      setError(t("components.auth.AuthModal.forgotNeedsEmail"));
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(email);
    } catch {
      /* neutral response either way */
    } finally {
      setIsSubmitting(false);
      setMessage(t("components.auth.AuthModal.resetSent"));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setIsSubmitting(true);
    try {
      const result =
        mode === "signin"
          ? await signInWithEmail(email, password)
          : await signUpWithEmail(email, password, { fullName, role });
      if (result.needsConfirmation || result.message) {
        setMessage(result.message || t("components.auth.AuthModal.confirmEmail"));
        return;
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || t("components.auth.AuthModal.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    "w-full rounded-control border border-hairline bg-night/60 px-stack py-tight text-sm text-night-foreground outline-none transition-colors duration-base placeholder:text-lavender focus:border-accent";

  // Existing accounts can always sign in with email. New accounts can only
  // be created with email once EMAIL_SIGNUP_ENABLED is flipped back on.
  const showEmailForm = mode === "signin" || EMAIL_SIGNUP_ENABLED;

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
      isDismissable
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-night/80 p-gutter py-block backdrop-blur-sm"
    >
      <Modal className="glass-panel relative max-h-[calc(100vh-6rem)] w-full max-w-md overflow-y-auto rounded-card border border-hairline">
        <Dialog className="p-block outline-none">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-stack top-stack flex h-9 w-9 items-center justify-center rounded-pill border border-hairline text-lavender transition-colors duration-base hover:border-accent hover:text-night-foreground"
            aria-label={t("components.auth.AuthModal.close")}
          >
            <X size={16} />
          </button>

          <img
            src={images["logo"]}
            data-image-id="logo"
            alt={t("components.auth.AuthModal.logoAlt")}
            className="mb-stack h-9 w-9"
          />

          <Heading slot="title" className="mb-tight text-xl text-night-foreground">
            <span data-text-id={mode === "signin" ? "components.auth.AuthModal.titleSignIn" : "components.auth.AuthModal.titleSignUp"}>
              {mode === "signin"
                ? t("components.auth.AuthModal.titleSignIn")
                : t("components.auth.AuthModal.titleSignUp")}
            </span>
          </Heading>
          <p className="mb-block text-sm text-lilac">
            <span data-text-id={mode === "signin" ? "components.auth.AuthModal.subSignIn" : "components.auth.AuthModal.subSignUp"}>
              {mode === "signin"
                ? t("components.auth.AuthModal.subSignIn")
                : t("components.auth.AuthModal.subSignUp")}
            </span>
          </p>

          {error ? (
            <div className="mb-stack rounded-control border border-danger/40 bg-danger/10 px-stack py-tight text-sm text-night-foreground">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="mb-stack rounded-control border border-success/40 bg-success/10 px-stack py-tight text-sm text-night-foreground">
              {message}
            </div>
          ) : null}

          <div className="mb-stack grid grid-cols-2 gap-1 rounded-pill border border-hairline p-1 text-sm">
            <button
              type="button"
              onClick={() => handleModeChange("signin")}
              className={`rounded-pill px-stack py-tight transition-colors duration-base ${
                mode === "signin" ? "bg-primary text-primary-foreground" : "text-lilac hover:text-night-foreground"
              }`}
            >
              <span data-text-id="components.auth.AuthModal.tabSignIn">{t("components.auth.AuthModal.tabSignIn")}</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("signup")}
              className={`rounded-pill px-stack py-tight transition-colors duration-base ${
                mode === "signup" ? "bg-primary text-primary-foreground" : "text-lilac hover:text-night-foreground"
              }`}
            >
              <span data-text-id="components.auth.AuthModal.tabSignUp">{t("components.auth.AuthModal.tabSignUp")}</span>
            </button>
          </div>

          {mode === "signup" && initialRole === "teacher" ? (
            <div className="mb-stack rounded-control border border-accent/40 bg-accent/10 px-stack py-tight text-xs text-night-foreground">
              <span data-text-id="components.auth.AuthModal.teacherSignupNotice">
                {t("components.auth.AuthModal.teacherSignupNotice")}
              </span>
            </div>
          ) : null}

          {showEmailForm ? (
            <form className="flex flex-col gap-stack" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest text-lavender" htmlFor="auth-name">
                    <span data-text-id="components.auth.AuthModal.nameLabel">{t("components.auth.AuthModal.nameLabel")}</span>
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={event => setFullName(event.target.value)}
                    placeholder={t("components.auth.AuthModal.namePlaceholder")}
                    className={fieldClass}
                  />
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-lavender" htmlFor="auth-email">
                  <span data-text-id="components.auth.AuthModal.emailLabel">{t("components.auth.AuthModal.emailLabel")}</span>
                </label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder={t("components.auth.AuthModal.emailPlaceholder")}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest text-lavender" htmlFor="auth-password">
                  <span data-text-id="components.auth.AuthModal.passwordLabel">{t("components.auth.AuthModal.passwordLabel")}</span>
                </label>
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder={t("components.auth.AuthModal.passwordPlaceholder")}
                  className={fieldClass}
                />
              </div>

              {mode === "signin" ? (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isSubmitting}
                  className="self-end text-xs text-accent transition-opacity duration-base hover:opacity-80 disabled:opacity-50"
                >
                  <span data-text-id="components.auth.AuthModal.forgot">{t("components.auth.AuthModal.forgot")}</span>
                </button>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="gradient-brand w-full rounded-control px-stack py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active disabled:opacity-60"
              >
                <span
                  data-text-id={
                    isSubmitting
                      ? "components.auth.AuthModal.submitting"
                      : mode === "signin"
                        ? "components.auth.AuthModal.submitSignIn"
                        : "components.auth.AuthModal.submitSignUp"
                  }
                >
                  {isSubmitting
                    ? t("components.auth.AuthModal.submitting")
                    : mode === "signin"
                      ? t("components.auth.AuthModal.submitSignIn")
                      : t("components.auth.AuthModal.submitSignUp")}
                </span>
              </button>
            </form>
          ) : (
            <div className="rounded-control border border-hairline bg-night/40 px-stack py-stack text-sm text-lilac">
              <span data-text-id="components.auth.AuthModal.emailSignupUnavailable">
                {t("components.auth.AuthModal.emailSignupUnavailable")}
              </span>
            </div>
          )}

          {showEmailForm ? (
            <div className="my-stack flex items-center gap-tight text-xs uppercase tracking-widest text-lavender">
              <span className="h-px flex-1 bg-hairline" />
              <span data-text-id="components.auth.AuthModal.or">{t("components.auth.AuthModal.or")}</span>
              <span className="h-px flex-1 bg-hairline" />
            </div>
          ) : (
            <div className="my-stack" />
          )}

          <button
            onClick={() => signInWithGoogle(mode === "signup" ? role : undefined)}
            className="flex w-full items-center justify-center gap-tight rounded-control border border-hairline px-stack py-tight text-sm text-night-foreground transition-colors duration-base hover:border-accent"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <g fill="none" fillRule="evenodd">
                <path
                  d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5836-5.036-3.7109H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2822-1.71V4.9582H.9574C.3477 6.173 0 7.5477 0 9s.3477 2.827.9574 4.0418L3.964 10.71z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z"
                  fill="#EA4335"
                />
              </g>
            </svg>
            <span data-text-id="components.auth.AuthModal.google">{t("components.auth.AuthModal.google")}</span>
          </button>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
