import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Clock, Compass, LocateFixed, MapPin, RotateCw } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import { useGeolocation } from "@/lib/quran/useGeolocation";
import { useToolProgress } from "@/lib/hooks/useToolProgress";
import { CALCULATION_METHODS, DEFAULT_CALCULATION_METHOD, prayerApi, type PrayerTimesResponse } from "@/lib/quran/prayerApi";

// Dar es Salaam — used only as the starting point before the visitor shares
// their location (or types a city), so the page never opens on a blank
// state. Matches the fallback city already used elsewhere on the site (see
// pages/Contact.tsx).
const DEFAULT_CITY = "Dar es Salaam";
const DEFAULT_COUNTRY = "Tanzania";

const PRAYER_ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

export default function PrayerTimes() {
  const { t } = useLanguage();
  const geolocation = useGeolocation();

  const [savedLocation, setSavedLocation] = useToolProgress(
    "prayer-times",
    "darasaone.prayerTimes.progress",
    { city: DEFAULT_CITY, country: DEFAULT_COUNTRY, method: DEFAULT_CALCULATION_METHOD }
  );

  const [method, setMethod] = useState(savedLocation.method);
  const [city, setCity] = useState(savedLocation.city);
  const [country, setCountry] = useState(savedLocation.country);
  const [cityInput, setCityInput] = useState(savedLocation.city);
  const [countryInput, setCountryInput] = useState(savedLocation.country);

  const [timings, setTimings] = useState<PrayerTimesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [source, setSource] = useState<"city" | "coords">("city");

  const loadByCity = (targetCity: string, targetCountry: string) => {
    setLoading(true);
    setLoadError(false);
    setSource("city");
    prayerApi
      .getTimingsByCity(targetCity, targetCountry, method)
      .then(setTimings)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  // Initial load and any time the calculation method changes while a city is active.
  useEffect(() => {
    if (source === "city") loadByCity(city, country);
    setSavedLocation({ city, country, method });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  // Once geolocation resolves, coordinates take over as the more accurate source.
  useEffect(() => {
    if (!geolocation.coords) return;
    setLoading(true);
    setLoadError(false);
    setSource("coords");
    prayerApi
      .getTimingsByCoords(geolocation.coords.latitude, geolocation.coords.longitude, method)
      .then(setTimings)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geolocation.coords]);

  const submitCity = (event: FormEvent) => {
    event.preventDefault();
    const trimmedCity = cityInput.trim();
    const trimmedCountry = countryInput.trim();
    if (trimmedCity.length === 0 || trimmedCountry.length === 0) return;
    setCity(trimmedCity);
    setCountry(trimmedCountry);
    setSavedLocation({ city: trimmedCity, country: trimmedCountry, method });
    loadByCity(trimmedCity, trimmedCountry);
  };

  const retry = () => {
    if (source === "coords" && geolocation.coords) {
      setLoading(true);
      setLoadError(false);
      prayerApi
        .getTimingsByCoords(geolocation.coords.latitude, geolocation.coords.longitude, method)
        .then(setTimings)
        .catch(() => setLoadError(true))
        .finally(() => setLoading(false));
    } else {
      loadByCity(city, country);
    }
  };

  return (
    <>
      <SEOHead titleKey={t("pages.tools.PrayerTimes.seo.title")} descriptionKey={t("pages.tools.PrayerTimes.seo.description")} />
      <main className="pt-block">
        <section className="mx-auto max-w-shell px-gutter pb-block pt-section-spacing-mobile text-center md:px-gutter-lg md:pt-section-spacing">
          <span data-text-id="pages.tools.PrayerTimes.eyebrow" className="text-gradient-head text-sm uppercase tracking-widest">
            {t("pages.tools.PrayerTimes.eyebrow")}
          </span>
          <h1 data-text-id="pages.tools.PrayerTimes.title" className="mt-2 font-heading text-3xl text-ink md:text-4xl">
            {t("pages.tools.PrayerTimes.title")}
          </h1>
          <p data-text-id="pages.tools.PrayerTimes.paragraph" className="mx-auto mt-2 max-w-prose text-ink/70">
            {t("pages.tools.PrayerTimes.paragraph")}
          </p>
        </section>

        <section className="bg-background px-gutter pb-section-spacing-mobile md:px-gutter-lg md:pb-section-spacing">
          <div className="mx-auto flex max-w-2xl flex-col gap-block">
            <div className="flex flex-col items-center gap-stack">
              <button
                type="button"
                onClick={geolocation.request}
                disabled={geolocation.status === "locating"}
                className="gradient-brand inline-flex items-center gap-tight rounded-pill px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active disabled:opacity-70"
              >
                <LocateFixed size={16} aria-hidden="true" />
                {geolocation.status === "locating" ? t("pages.tools.PrayerTimes.locating") : t("pages.tools.PrayerTimes.useMyLocation")}
              </button>
              {geolocation.status === "denied" || geolocation.status === "unsupported" ? (
                <p className="text-xs text-slate">{t("pages.tools.PrayerTimes.locationDenied")}</p>
              ) : null}

              <form onSubmit={submitCity} className="flex w-full flex-col gap-tight sm:flex-row">
                <div className="flex flex-1 items-center gap-tight rounded-pill border border-line px-stack py-tight">
                  <MapPin size={16} className="text-slate" aria-hidden="true" />
                  <label className="sr-only" htmlFor="prayer-city">
                    {t("pages.tools.PrayerTimes.cityLabel")}
                  </label>
                  <input
                    id="prayer-city"
                    type="text"
                    value={cityInput}
                    onChange={event => setCityInput(event.target.value)}
                    placeholder={t("pages.tools.PrayerTimes.cityPlaceholder")}
                    className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate"
                  />
                </div>
                <div className="flex flex-1 items-center gap-tight rounded-pill border border-line px-stack py-tight">
                  <label className="sr-only" htmlFor="prayer-country">
                    {t("pages.tools.PrayerTimes.countryLabel")}
                  </label>
                  <input
                    id="prayer-country"
                    type="text"
                    value={countryInput}
                    onChange={event => setCountryInput(event.target.value)}
                    placeholder={t("pages.tools.PrayerTimes.countryPlaceholder")}
                    className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate"
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 rounded-pill border border-line px-stack py-tight text-sm text-ink transition-colors duration-base hover:border-accent hover:text-accent"
                >
                  {t("pages.tools.PrayerTimes.searchButton")}
                </button>
              </form>

              <div className="flex items-center gap-tight text-xs text-slate">
                <label htmlFor="calculation-method">{t("pages.tools.PrayerTimes.methodLabel")}</label>
                <select
                  id="calculation-method"
                  value={method}
                  onChange={event => setMethod(Number(event.target.value))}
                  className="rounded-control border border-line bg-background px-tight py-1 text-xs text-ink outline-none"
                >
                  {CALCULATION_METHODS.map(item => (
                    <option key={item.id} value={item.id}>
                      {t(`pages.tools.PrayerTimes.methods.${item.labelKey}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-tight sm:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map(index => (
                  <div key={index} className="h-20 animate-pulse rounded-panel bg-mist" />
                ))}
              </div>
            ) : loadError || !timings ? (
              <div className="flex flex-col items-center gap-stack rounded-card bg-mist px-block py-block text-center">
                <AlertTriangle size={32} className="text-slate" aria-hidden="true" />
                <p className="text-sm text-slate">{t("pages.tools.PrayerTimes.loadError")}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex items-center gap-tight rounded-control bg-ink px-stack py-tight text-sm text-ink-foreground transition-all duration-base hover:scale-hover active:scale-active"
                >
                  <RotateCw size={14} aria-hidden="true" />
                  {t("pages.tools.PrayerTimes.retry")}
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="text-xs uppercase tracking-widest text-slate">
                    {source === "coords" ? t("pages.tools.PrayerTimes.sourceCoords") : `${city}, ${country}`}
                  </span>
                  <span className="text-sm text-ink">
                    {timings.date.readable} · {timings.date.hijri.day} {timings.date.hijri.month.en} {timings.date.hijri.year}
                    {t("pages.tools.PrayerTimes.hijriSuffix")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-tight sm:grid-cols-3">
                  {PRAYER_ORDER.map(prayer => (
                    <div key={prayer} className="card-lift flex flex-col items-center gap-1 rounded-panel bg-background px-stack py-stack text-center">
                      <Clock size={18} className="text-accent" aria-hidden="true" />
                      <span className="text-xs uppercase tracking-widest text-slate">{t(`pages.tools.PrayerTimes.names.${prayer}`)}</span>
                      <span className="font-heading text-lg text-ink">{timings.timings[prayer]}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/tools/qibla"
                  className="mx-auto inline-flex items-center gap-tight text-sm text-accent hover:underline"
                >
                  <Compass size={14} aria-hidden="true" />
                  {t("pages.tools.PrayerTimes.qiblaLink")}
                </Link>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
