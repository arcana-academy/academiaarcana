import type { SystemMotionPreference } from "@/core/accessibility-preferences/MotionEnvironment";

const MEDIA_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Retrieves the user's system motion preference based on the CSS media query.
 *
 * @returns {SystemMotionPreference} The user's motion preference: "reduced" if the user prefers reduced motion, otherwise "normal".
 */
export function getSystemMotionPreference(): SystemMotionPreference {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return "normal";
  }

  return window.matchMedia(MEDIA_QUERY).matches ? "reduced" : "normal";
}

/**
 * Subscribes to changes in the user's system motion preference.
 *
 * @param listener - Callback function invoked with the current preference ('reduced' or 'normal') when it changes.
 * @returns A function that can be called to unsubscribe the listener.
 */
export function subscribeToMotionPreference(
  listener: (preference: SystemMotionPreference) => void,
): () => void {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return () => {};
  }

  const mediaQuery = window.matchMedia(MEDIA_QUERY);

  const handleChange = (event: MediaQueryListEvent) => {
    listener(event.matches ? "reduced" : "normal");
  };

  mediaQuery.addEventListener("change", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
}
