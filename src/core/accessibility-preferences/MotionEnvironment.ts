export type MotionEnvironment = {
  getSystemMotionPreference: () => "normal" | "reduced";
  subscribeToMotionPreference: (
    listener: (preference: "normal" | "reduced") => void,
  ) => () => void;
};
