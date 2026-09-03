import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import tailwindConfig from "@/tailwind.config";
import App from "@/App";
import { GOOGLE_FONTS_URL } from "@/fonts";
import { LanguageProvider } from "@/context/LanguageContext";
import "@/index.css";

// Auto-inject Google Fonts from fonts.googleapis.com
if (typeof window !== "undefined" && (window as any).document) {
  const link = document.createElement("link");
  link.href = GOOGLE_FONTS_URL;
  link.rel = "stylesheet";
  document.head.appendChild(link);
}

// Auto-configure global Tailwind https://cdn.tailwindcss.com
if (typeof window !== "undefined" && (window as any).tailwind) {
  (window as any).tailwind.config = tailwindConfig;
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
window.__remixerTeardown = () => { try { root.unmount() } catch (e) {} };

// Registering the service worker in dev mode causes exactly the symptom
// this was reported for: switch away from the tab for even a moment and
// come back to a full reload with a spinner. That's not the SW's normal
// job — it's Vite's dev server losing its hot-reload WebSocket connection
// while the tab is backgrounded (mobile browsers throttle/suspend
// background sockets aggressively) and forcing a full page reload to
// resync when the tab regains focus. A cached SW response layered on top
// of that only makes dev-mode behavior more confusing. The SW is only for
// the built/deployed app — skip it entirely in dev, and clean up any SW
// a previous dev session may have already registered on this origin.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.unregister());
    });
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal: app still works fully online without the service worker.
      });
    });
  }
}

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </HelmetProvider>
  </React.StrictMode>
);
