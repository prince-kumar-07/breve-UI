import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * The browser restores scroll for real navigations; a client-side router has
 * to do it by hand. A new path starts at the top, a hash jumps to its section,
 * and the same path with new search params is left alone.
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
}
