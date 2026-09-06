import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Compass, LocateFixed, RotateCw } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import { useGeolocation } from "@/lib/quran/useGeolocation";
import { prayerApi } from "@/lib/quran/prayerApi";
import QiblaCompass from "@/components/tools/QiblaCompass";

// Some browsers (notably iOS Safari) expose device orientation only after an
// explicit, gesture-triggered permission prompt; most others (Android
// Chrome, desktop) need no permission call at all and would reject one.
type OrientationEventCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export default function Qibla() {
  const { t } = useLanguage();
  const geolocation = useGeolocation();

  const [direction, setDirection] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [heading, setHeading] = useState<number | null>(null);
  const [compassStatus, setCompassStatus] = useState<"idle" | "active" | "unsupported" | "denied">("idle");

  useEffect(() => {
    if (!geolocation.coords) return;
    setLoading(true);
    setLoadError(false);
    prayerApi
      .getQibla(geolocation.coords.latitude, geolocation.coords.longitude)
      .then(result => setDirection(result.direction))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [geolocation.coords]);

  // A stable function identity so addEventListener (in enableCompass) and
  // removeEventListener (in the cleanup effect below) refer to the exact
  // same listener — mismatched references would silently fail to unsubscribe.
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const webkitHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
    if (typeof webkitHeading === "number") {
      setHeading(webkitHeading);
    } else if (event.alpha != null) {
      setHeading(360 - event.alpha);
    }
  }, []);

  useEffect(() => {
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation as EventListener);
      window.removeEventListener("deviceorientation", handleOrientation as EventListener);
    };
  }, [handleOrientation]);

  const enableCompass = async () => {
    const ctor = (typeof window !== "undefined" ? window.DeviceOrientationEvent : undefined) as OrientationEventCtor | undefined;
    if (!ctor) {
      setCompassStatus("unsupported");
      return;
    }
    if (typeof ctor.requestPermission === "function") {
      try {
        const result = await ctor.requestPermission();
        if (result !== "granted") {
          setCompassStatus("denied");
          return;
        }
      } catch {
        setCompassStatus("denied");
        return;
      }
    }
    window.addEventListener("deviceorientationabsolute", handleOrientation as EventListener);
    window.addEventListener("deviceorientation", handleOrientation as EventListener);
    setCompassStatus("active");
  };

  const retry = () => {
    if (!geolocation.coords) return;
    setLoading(true);
    setLoadError(false);
    prayerApi
      .getQibla(geolocation.coords.latitude, geolocation.coords.longitude)
      .then(result => setDirection(result.direction))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  return (
    <>
      <SEOHead titleKey={t("pages.tools.Qibla.seo.title")} descriptionKey={t("pages.tools.Qibla.seo.description")} />
      <main className="pt-block">
        <section className="mx-auto max-w-shell px-gutter pb-block pt-section-spacing-mobile text-center md:px-gutter-lg md:pt-section-spacing">
          <span data-text-id="pages.tools.Qibla.eyebrow" className="text-gradient-head text-sm uppercase tracking-widest">
            {t("pages.tools.Qibla.eyebrow")}
          </span>
          <h1 data-text-id="pages.tools.Qibla.title" className="mt-2 font-heading text-3xl text-ink md:text-4xl">
            {t("pages.tools.Qibla.title")}
          </h1>
          <p data-text-id="pages.tools.Qibla.paragraph" className="mx-auto mt-2 max-w-prose text-ink/70">
            {t("pages.tools.Qibla.paragraph")}
          </p>
        </section>

        <section className="bg-background px-gutter pb-section-spacing-mobile md:px-gutter-lg md:pb-section-spacing">
          <div className="mx-auto flex max-w-md flex-col items-center gap-block text-center">
            {!geolocation.coords ? (
              <div className="flex flex-col items-center gap-stack">
                <Compass size={40} className="text-slate" aria-hidden="true" />
                <p className="text-sm text-slate">{t("pages.tools.Qibla.needLocation")}</p>
                <button
                  type="button"
                  onClick={geolocation.request}
                  disabled={geolocation.status === "locating"}
                  className="gradient-brand inline-flex items-center gap-tight rounded-pill px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active disabled:opacity-70"
                >
                  <LocateFixed size={16} aria-hidden="true" />
                  {geolocation.status === "locating" ? t("pages.tools.Qibla.locating") : t("pages.tools.Qibla.useMyLocation")}
                </button>
                {geolocation.status === "denied" || geolocation.status === "unsupported" ? (
                  <p className="text-xs text-slate">{t("pages.tools.Qibla.locationDenied")}</p>
                ) : null}
              </div>
            ) : loading ? (
              <div className="h-64 w-64 animate-pulse rounded-pill bg-mist" />
            ) : loadError || direction === null ? (
              <div className="flex flex-col items-center gap-stack rounded-card bg-mist px-block py-block">
                <AlertTriangle size={32} className="text-slate" aria-hidden="true" />
                <p className="text-sm text-slate">{t("pages.tools.Qibla.loadError")}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex items-center gap-tight rounded-control bg-ink px-stack py-tight text-sm text-ink-foreground transition-all duration-base hover:scale-hover active:scale-active"
                >
                  <RotateCw size={14} aria-hidden="true" />
                  {t("pages.tools.Qibla.retry")}
                </button>
              </div>
            ) : (
              <>
                <QiblaCompass
                  direction={direction}
                  heading={compassStatus === "active" ? heading : null}
                  northLabel={t("pages.tools.Qibla.north")}
                  eastLabel={t("pages.tools.Qibla.east")}
                  southLabel={t("pages.tools.Qibla.south")}
                  westLabel={t("pages.tools.Qibla.west")}
                />
                <p className="text-sm text-ink">
                  {Math.round(direction)}° {t("pages.tools.Qibla.fromNorth")}
                </p>
                {compassStatus !== "active" ? (
                  <button
                    type="button"
                    onClick={enableCompass}
                    className="inline-flex items-center gap-tight rounded-pill border border-line px-stack py-tight text-sm text-ink transition-colors duration-base hover:border-accent hover:text-accent"
                  >
                    <Compass size={16} aria-hidden="true" />
                    {t("pages.tools.Qibla.enableCompass")}
                  </button>
                ) : (
                  <p className="text-xs text-slate">{t("pages.tools.Qibla.compassActive")}</p>
                )}
                {compassStatus === "denied" ? <p className="text-xs text-slate">{t("pages.tools.Qibla.compassDenied")}</p> : null}
                {compassStatus === "unsupported" || compassStatus === "idle" ? (
                  <p className="text-xs text-slate">{t("pages.tools.Qibla.staticHint")}</p>
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
