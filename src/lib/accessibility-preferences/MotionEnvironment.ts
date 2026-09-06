import type {
  MotionEnvironment as MotionEnvironmentContract,
  SystemMotionPreference,
} from "@/core/accessibility-preferences/MotionEnvironment";

const MEDIA_QUERY = "(prefers-reduced-motion: reduce)";

function getSystemMotionPreference(): SystemMotionPreference {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return "normal";
  }

  return window.matchMedia(MEDIA_QUERY).matches ? "reduced" : "normal";
}

function subscribeToMotionPreference(
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

export const motionEnvironment: MotionEnvironmentContract = {
  getSystemMotionPreference,
  subscribeToMotionPreference,
};
