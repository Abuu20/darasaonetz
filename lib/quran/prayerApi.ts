// Aladhan (https://aladhan.com/prayer-times-api) — from the same open,
// keyless Islamic-data ecosystem as Al Quran Cloud (both under
// islamic.network). Powers prayer times, the Hijri date, and Qibla direction.

const BASE_URL = "https://api.aladhan.com/v1";

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak?: string;
  Midnight?: string;
}

export interface PrayerTimesResponse {
  timings: PrayerTimings;
  date: {
    readable: string;
    gregorian: { date: string; weekday: { en: string }; month: { en: string }; year: string };
    hijri: {
      date: string;
      day: string;
      weekday: { en: string; ar: string };
      month: { number: number; en: string; ar: string };
      year: string;
    };
  };
  meta: { timezone: string };
}

export interface QiblaResult {
  latitude: number;
  longitude: number;
  direction: number; // degrees clockwise from true north
}

export interface HijriDate {
  day: string;
  month: { number: number; en: string; ar: string };
  year: string;
  weekday: { en: string; ar: string };
}

// Common calculation methods (id used by the API); Muslim World League is
// the widely-used default across East Africa, so it's listed first.
export const CALCULATION_METHODS = [
  { id: 3, labelKey: "mwl" },
  { id: 5, labelKey: "egyptian" },
  { id: 4, labelKey: "makkah" },
  { id: 2, labelKey: "isna" },
  { id: 1, labelKey: "karachi" },
] as const;

export const DEFAULT_CALCULATION_METHOD = 3;

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`Prayer times request failed (${res.status})`);
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.status || "Prayer times error");
  return json.data as T;
}

export const prayerApi = {
  getTimingsByCoords: (
    latitude: number,
    longitude: number,
    method: number = DEFAULT_CALCULATION_METHOD
  ): Promise<PrayerTimesResponse> => getJson(`/timings?latitude=${latitude}&longitude=${longitude}&method=${method}`),

  getTimingsByCity: (
    city: string,
    country: string,
    method: number = DEFAULT_CALCULATION_METHOD
  ): Promise<PrayerTimesResponse> =>
    getJson(`/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`),

  getQibla: (latitude: number, longitude: number): Promise<QiblaResult> => getJson(`/qibla/${latitude}/${longitude}`),

  // Gregorian → Hijri conversion, keyed only to today's date — unlike
  // getTimingsBy*, this needs no location, so the Ramadan planner can show
  // "which Hijri day is it" before it has (or without ever needing)
  // geolocation permission.
  getHijriDate: (date: Date = new Date()): Promise<HijriDate> => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return getJson<{ hijri: HijriDate }>(`/gToH?date=${dd}-${mm}-${yyyy}`).then(data => data.hijri);
  },
};
