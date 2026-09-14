import { useCallback, useState } from "react";

export interface Coords {
  latitude: number;
  longitude: number;
}

interface GeolocationState {
  coords: Coords | null;
  status: "idle" | "locating" | "done" | "denied" | "unsupported";
  request: () => void;
}

// Shared by the Prayer Times and Qibla pages — both need the visitor's
// coordinates and both offer the exact same manual-entry fallback when
// permission is denied or the browser has no geolocation support at all.
export function useGeolocation(): GeolocationState {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<GeolocationState["status"]>("idle");

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      position => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setStatus("done");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  }, []);

  return { coords, status, request };
}
