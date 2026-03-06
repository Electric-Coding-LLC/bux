export const breakpoints = ["xs", "sm", "md", "lg", "xl"] as const;
export const densityModes = ["comfortable", "compact"] as const;
export const stressCopyModes = ["short", "long"] as const;
export const stressStateModes = ["default", "empty", "loading", "error"] as const;
export const screenTypes = ["settings"] as const;
export const settingsScreenDensities = ["comfortable", "compact", "calm"] as const;
export const criticFindingSeverities = ["low", "medium", "high"] as const;
export const criticVerdicts = ["pass", "warn", "fail"] as const;
export const sectionTypes = [
  "hero",
  "featureGrid",
  "form",
  "list",
  "table",
  "settings"
] as const;

export const breakpointNumberMapSchema = {
  type: "object",
  additionalProperties: false,
  required: [...breakpoints],
  properties: {
    xs: { type: "number", minimum: 0 },
    sm: { type: "number", minimum: 0 },
    md: { type: "number", minimum: 0 },
    lg: { type: "number", minimum: 0 },
    xl: { type: "number", minimum: 0 }
  }
} as const;
