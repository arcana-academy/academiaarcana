export type SystemMotionPreference = "normal" | "reduced";

export type MotionEnvironment = {
  getSystemMotionPreference: () => SystemMotionPreference;
  subscribeToMotionPreference: (
    listener: (preference: SystemMotionPreference) => void,
  ) => () => void;
};
