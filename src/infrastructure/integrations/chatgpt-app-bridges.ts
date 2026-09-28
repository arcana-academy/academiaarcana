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

export const A_Z_DAILY_WORD_APP_ID = "a-z-daily-word" as const;

export const A_Z_DAILY_WORD_CHATGPT_APP_URL =
  "https://chatgpt.com/plugins/plugin_asdk_app_69bd3c483c008191beb1e4cc0ce87b24" as const;


export const A_Z_DICTIONARY_APP_ID = "a-z-dictionary" as const;

export const A_Z_DICTIONARY_CHATGPT_APP_URL =
  "https://chatgpt.com/plugins/plugin_asdk_app_6960e92ebfa481918f4ccff0c8b219db" as const;

export const A_Z_HOLY_BIBLE_APP_ID = "a-z-holy-bible" as const;

export const A_Z_HOLY_BIBLE_CHATGPT_APP_URL =
  "https://chatgpt.com/plugins/plugin_asdk_app_69985bb469908191a8abda024bb692cb" as const;

export const ACADEMIC_WRITING_TOOLKIT_APP_ID =
  "academic-writing-toolkit" as const;

export const ACADEMIC_WRITING_TOOLKIT_CHATGPT_APP_URL =
  "https://chatgpt.com/plugins/academic-writing-toolkit" as const;

export const CHATGPT_APP_BRIDGES = {
  [ONE_BILLION_BRAIN_CELLS_APP_ID]: {
    providerId: ONE_BILLION_BRAIN_CELLS_APP_ID,
    displayName: "1 Billion Brain Cells",
    appUrl: ONE_BILLION_BRAIN_CELLS_CHATGPT_APP_URL,
  },
  [A_Z_DAILY_WORD_APP_ID]: {
    providerId: A_Z_DAILY_WORD_APP_ID,
    displayName: "A-Z Daily Word",
    appUrl: A_Z_DAILY_WORD_CHATGPT_APP_URL,
  },
  [A_Z_DICTIONARY_APP_ID]: {
    providerId: A_Z_DICTIONARY_APP_ID,
    displayName: "A-Z Dictionary",
    appUrl: A_Z_DICTIONARY_CHATGPT_APP_URL,
  },
  [A_Z_HOLY_BIBLE_APP_ID]: {
    providerId: A_Z_HOLY_BIBLE_APP_ID,
    displayName: "A-Z Holy Bible",
    appUrl: A_Z_HOLY_BIBLE_CHATGPT_APP_URL,
  },
  [ACADEMIC_WRITING_TOOLKIT_APP_ID]: {
    providerId: ACADEMIC_WRITING_TOOLKIT_APP_ID,
    displayName: "Academic Writing Toolkit",
    appUrl: ACADEMIC_WRITING_TOOLKIT_CHATGPT_APP_URL,
  },
} as const;

export type ChatGPTAppBridge =
  (typeof CHATGPT_APP_BRIDGES)[keyof typeof CHATGPT_APP_BRIDGES];
