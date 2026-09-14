import { useEffect, useState } from "react";
import { prayerApi, type HijriDate } from "@/lib/quran/prayerApi";

const RAMADAN_MONTH_NUMBER = 9;

interface HijriToday {
  loading: boolean;
  hijri: HijriDate | null;
  isRamadan: boolean;
  ramadanDayNumber: number | null; // 1-based day of Ramadan, only set when isRamadan
}

export function useHijriToday(): HijriToday {
  const [hijri, setHijri] = useState<HijriDate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    prayerApi
      .getHijriDate()
      .then(result => !cancelled && setHijri(result))
      .catch(() => {
        // Offline or the API is briefly down — the planner still works in
        // manual mode, it just won't auto-select today's day.
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const isRamadan = hijri?.month.number === RAMADAN_MONTH_NUMBER;

  return {
    loading,
    hijri,
    isRamadan,
    ramadanDayNumber: isRamadan && hijri ? Number(hijri.day) : null,
  };
}
