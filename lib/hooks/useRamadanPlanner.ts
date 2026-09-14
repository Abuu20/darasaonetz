import { useToolProgress } from "@/lib/hooks/useToolProgress";
import { EMPTY_RAMADAN_STATE, resetForNewYear, type RamadanState } from "@/lib/ramadan/ramadanEngine";

const LOCAL_KEY = "darasaone.ramadan.progress";

export function useRamadanPlanner() {
  const [state, setState] = useToolProgress<RamadanState>("ramadan", LOCAL_KEY, EMPTY_RAMADAN_STATE);

  // Called once the current Hijri year is known — clears last year's
  // check-ins the first time a new Ramadan is detected, otherwise a no-op.
  const syncYear = (hijriYear: number) => {
    const next = resetForNewYear(state, hijriYear);
    if (next !== state) setState(next);
  };

  return { state, setState, syncYear };
}
