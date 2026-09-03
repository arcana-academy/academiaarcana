import type { MotionEnvironment as MotionEnvironmentContract } from "../../core/accessibility-preferences/MotionEnvironment";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function createMotionEnvironment(): MotionEnvironmentContract {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return {
      getSystemMotionPreference: () => "normal",
      subscribeToMotionPreference: () => () => {},
    };
  }

  const mediaQuery = window.matchMedia(MOTION_QUERY);

  return {
    getSystemMotionPreference: () =>
      mediaQuery.matches ? "reduced" : "normal",

    subscribeToMotionPreference: (listener) => {
      const handleChange = (event: MediaQueryListEvent) => {
        listener(event.matches ? "reduced" : "normal");
      };

      mediaQuery.addEventListener("change", handleChange);

      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    },
  };
}
