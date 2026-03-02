import { breakpointNumberMapSchema, densityModes } from "./shared";

export const tokensSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "TokensDocument",
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "typography",
    "spacing",
    "radii",
    "containers",
    "breakpoints",
    "colors"
  ],
  properties: {
    schemaVersion: { type: "string", minLength: 1 },
    typography: {
      type: "object",
      additionalProperties: false,
      required: ["families", "scale", "lineHeights", "weights"],
      properties: {
        families: {
          type: "object",
          additionalProperties: false,
          required: ["sans", "serif", "mono"],
          properties: {
            sans: { type: "string", minLength: 1 },
            serif: { type: "string", minLength: 1 },
            mono: { type: "string", minLength: 1 }
          }
        },
        scale: {
          type: "array",
          minItems: 1,
          items: { type: "number", minimum: 1 }
        },
        lineHeights: {
          type: "array",
          minItems: 1,
          items: { type: "number", minimum: 0.5 }
        },
        weights: {
          type: "array",
          minItems: 1,
          items: { type: "number", minimum: 100 }
        }
      }
    },
    spacing: {
      type: "object",
      additionalProperties: false,
      required: ["scale", "density"],
      properties: {
        scale: {
          type: "array",
          minItems: 1,
          items: { type: "number", minimum: 0 }
        },
        density: {
          type: "object",
          additionalProperties: false,
          required: [...densityModes],
          properties: {
            comfortable: { type: "number", minimum: 0.5 },
            compact: { type: "number", minimum: 0.5 }
          }
        }
      }
    },
    radii: {
      type: "object",
      additionalProperties: false,
      required: ["none", "sm", "md", "lg", "pill"],
      properties: {
        none: { type: "number", minimum: 0 },
        sm: { type: "number", minimum: 0 },
        md: { type: "number", minimum: 0 },
        lg: { type: "number", minimum: 0 },
        pill: { type: "number", minimum: 0 }
      }
    },
    containers: breakpointNumberMapSchema,
    breakpoints: breakpointNumberMapSchema,
    colors: {
      type: "object",
      additionalProperties: false,
      required: ["roles"],
      properties: {
        roles: {
          type: "object",
          minProperties: 1,
          additionalProperties: { type: "string", minLength: 1 }
        }
      }
    }
  }
} as const;
