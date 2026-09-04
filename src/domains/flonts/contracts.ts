export type FlontsMode = "idle";

export type FlontsVisibility = "visible" | "hidden";

export type FlontsMotionPreference = "normal" | "reduced";

export type FlontsState = {
  mode: FlontsMode;
  visibility: FlontsVisibility;
  motionPreference: FlontsMotionPreference;
  message: string | null;
};

export type FlontsActions = {
  show: () => void;
  hide: () => void;
  setMode: (mode: FlontsMode) => void;
  setMessage: (message: string | null) => void;
};
