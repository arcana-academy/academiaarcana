/**
 * Agentic Course Redesign integration metadata.
 *
 * This provider is hosted inside ChatGPT. The Academia Arcana web runtime
 * does not have a public provider API/SDK to invoke it directly, so this
 * definition deliberately exposes discovery and execution-mode metadata
 * without claiming a server-to-server connection.
 */

export const AGENTIC_COURSE_REDESIGN_APP_ID =
  "agentic-course-redesign" as const;

export const AGENTIC_COURSE_REDESIGN_PLUGIN_NAME =
  "Agentic Course Redesign" as const;

export const AGENTIC_COURSE_REDESIGN_EXECUTION_MODE =
  "chatgpt-hosted" as const;

export const AGENTIC_COURSE_REDESIGN_CAPABILITIES = [
  "course-redesign",
  "learning-design",
  "assessment-design",
  "learning-materials",
  "instructional-research",
] as const;

export type AgenticCourseRedesignCapability =
  (typeof AGENTIC_COURSE_REDESIGN_CAPABILITIES)[number];

export type AgenticCourseRedesignIntegration = {
  readonly providerId: typeof AGENTIC_COURSE_REDESIGN_APP_ID;
  readonly displayName: typeof AGENTIC_COURSE_REDESIGN_PLUGIN_NAME;
  readonly executionMode: typeof AGENTIC_COURSE_REDESIGN_EXECUTION_MODE;
  readonly capabilities: readonly AgenticCourseRedesignCapability[];
  readonly runtimeApiAvailable: false;
  readonly websiteCanInvokeDirectly: false;
};

export const AGENTIC_COURSE_REDESIGN_INTEGRATION: AgenticCourseRedesignIntegration =
  {
    providerId: AGENTIC_COURSE_REDESIGN_APP_ID,
    displayName: AGENTIC_COURSE_REDESIGN_PLUGIN_NAME,
    executionMode: AGENTIC_COURSE_REDESIGN_EXECUTION_MODE,
    capabilities: AGENTIC_COURSE_REDESIGN_CAPABILITIES,
    runtimeApiAvailable: false,
    websiteCanInvokeDirectly: false,
  };
