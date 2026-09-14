import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollTopRouting component
 * Automatically scrolls to top of page when route changes
 * Must be placed inside Router component (BrowserRouter/HashRouter)
 * before the Routes component
 */
function ScrollTopRouting() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 80);
      }
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname, hash]);

  return null;
}

export default ScrollTopRouting;

