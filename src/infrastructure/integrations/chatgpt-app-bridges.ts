/**
 * Explicit bridges from Academia Arcana's web integration hub to ChatGPT apps.
 *
 * A bridge is a safe navigation target, not a claim that the external app is
 * available as a website runtime dependency.
 */

export const ONE_BILLION_BRAIN_CELLS_APP_ID =
  "1-billion-brain-cells" as const;

export const ONE_BILLION_BRAIN_CELLS_CHATGPT_APP_URL =
  "https://chatgpt.com/plugins/plugin_asdk_app_69cd086370708191905606fa0641d238" as const;

export const CHATGPT_APP_BRIDGES = {
  [ONE_BILLION_BRAIN_CELLS_APP_ID]: {
    providerId: ONE_BILLION_BRAIN_CELLS_APP_ID,
    displayName: "1 Billion Brain Cells",
    appUrl: ONE_BILLION_BRAIN_CELLS_CHATGPT_APP_URL,
  },
} as const;

export type ChatGPTAppBridge =
  (typeof CHATGPT_APP_BRIDGES)[keyof typeof CHATGPT_APP_BRIDGES];
