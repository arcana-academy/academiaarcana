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

export const SPOTIFY_APP_ID = "spotify" as const;

export const SPOTIFY_CHATGPT_APP_URL =
  "https://chatgpt.com/plugins/plugin_asdk_app_68de829bf7648191acd70a907364c67c" as const;

export const ACADEMIC_WRITING_TOOLKIT_APP_ID =
  "academic-writing-toolkit" as const;

export const ACADEMIC_WRITING_TOOLKIT_CHATGPT_APP_URL =
  "https://chatgpt.com/plugins/plugin_asdk_app_6a04f88a5fbc8191b8679c1ae31f2779" as const;

export const QUIZLET_APP_ID = "quizlet" as const;

export const QUIZLET_CHATGPT_APP_URL =
  "https://chatgpt.com/plugins/plugin_asdk_app_694336f3c5088191bcdfe35bb532ad83" as const;

export const TAROT_APP_ID = "tarot" as const;

export const TAROT_CHATGPT_APP_URL =
  "https://chatgpt.com/plugins/plugin_asdk_app_6943a2c078b0819188de39e4fe168d9b" as const;

/**
 * Tarteel is intentionally catalogued without a guessed ChatGPT app URL.
 * The assistant-side Tarteel capability is not proof of a public
 * ChatGPT launch URL or a web-runtime API for Academia Arcana.
 */
export const TARTEEL_APP_ID = "tarteel" as const;
export const TARTEEL_CHATGPT_APP_URL = undefined;

export const ASTROLOGIC_APP_ID = "astrologic" as const;

/**
 * True Sky is available as an astrology capability in the ChatGPT host.
 * No public web-runtime URL or vendor API endpoint has been verified for
 * Academia Arcana, so this remains metadata-only until a supported server
 * contract is available.
 */
export const TRUE_SKY_APP_ID = "true-sky" as const;
export const TRUE_SKY_CHATGPT_APP_URL: string | undefined = undefined;

/**
 * Astrologic is available as a ChatGPT-side connector in this environment.
 * No public web-runtime URL or vendor API endpoint has been verified for
 * Academia Arcana, so it remains metadata-only until a supported server
 * contract is available.
 */
export const ASTROLOGIC_CHATGPT_APP_URL: string | undefined = undefined;

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
  [SPOTIFY_APP_ID]: {
    providerId: SPOTIFY_APP_ID,
    displayName: "Spotify",
    appUrl: SPOTIFY_CHATGPT_APP_URL,
  },
  [QUIZLET_APP_ID]: {
    providerId: QUIZLET_APP_ID,
    displayName: "Quizlet",
    appUrl: QUIZLET_CHATGPT_APP_URL,
  },
  [TAROT_APP_ID]: {
    providerId: TAROT_APP_ID,
    displayName: "Tarot",
    appUrl: TAROT_CHATGPT_APP_URL,
  },
  [ASTROLOGIC_APP_ID]: {
    providerId: ASTROLOGIC_APP_ID,
    displayName: "Astrologic",
    ...(ASTROLOGIC_CHATGPT_APP_URL
      ? { appUrl: ASTROLOGIC_CHATGPT_APP_URL }
      : {}),
  },
  [TARTEEL_APP_ID]: {
    providerId: TARTEEL_APP_ID,
    displayName: "Tarteel",
    ...(TARTEEL_CHATGPT_APP_URL
      ? { appUrl: TARTEEL_CHATGPT_APP_URL }
      : {}),
  },
  [TRUE_SKY_APP_ID]: {
    providerId: TRUE_SKY_APP_ID,
    displayName: "True Sky",
    ...(TRUE_SKY_CHATGPT_APP_URL
      ? { appUrl: TRUE_SKY_CHATGPT_APP_URL }
      : {}),
  },
} as const;

export type ChatGPTAppBridge =
  (typeof CHATGPT_APP_BRIDGES)[keyof typeof CHATGPT_APP_BRIDGES];
