import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import images from "@/assets/images.json";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "darasaone-install-dismissed-at";
const DISMISS_DAYS = 7;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export default function InstallPrompt() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const daysSinceDismiss = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    if (dismissedAt && daysSinceDismiss < DISMISS_DAYS) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setPlatform("android");
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS/Safari never fires beforeinstallprompt — detect manually and show
    // "Add to Home Screen" instructions instead.
    if (isIos()) {
      const timer = setTimeout(() => {
        setPlatform("ios");
        setVisible(true);
      }, 2500);
      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        clearTimeout(timer);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setDeferredPrompt(null);
      dismiss();
    }
  };

  if (!visible || !platform) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-gutter pb-4">
      <div className="flex w-full max-w-md items-center gap-stack rounded-panel border border-hairline bg-panel/95 px-stack py-tight text-night-foreground shadow-lg backdrop-blur">
        <img src={images["logo"]} alt="" className="h-10 w-10 shrink-0 rounded-control" />
        <div className="flex-1 text-sm">
          <p className="font-medium">{t("components.pwa.InstallPrompt.title")}</p>
          {platform === "ios" ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-lilac">
              {t("components.pwa.InstallPrompt.iosInstructions")}
              <Share size={13} className="inline" aria-hidden="true" />
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-lilac">{t("components.pwa.InstallPrompt.androidInstructions")}</p>
          )}
        </div>
        {platform === "android" ? (
          <button
            type="button"
            onClick={handleInstall}
            className="gradient-brand flex shrink-0 items-center gap-1 rounded-control px-stack py-tight text-xs text-primary-foreground"
          >
            <Download size={14} />
            {t("components.pwa.InstallPrompt.install")}
          </button>
        ) : null}
        <button type="button" onClick={dismiss} aria-label={t("components.pwa.InstallPrompt.dismiss")} className="shrink-0 text-lavender hover:text-night-foreground">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
