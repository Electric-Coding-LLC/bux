import { densityModes, sectionTypes, stressCopyModes, stressStateModes } from "./shared";

export const summarySchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "SummaryDocument",
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "generatedAt",
    "targetProfile",
    "stress",
    "system",
    "layout",
    "notes"
  ],
  properties: {
    schemaVersion: { type: "string", minLength: 1 },
    generatedAt: { type: "string", minLength: 1 },
    targetProfile: { const: "portable-core" },
    stress: {
      type: "object",
      additionalProperties: false,
      required: ["copyMode", "stateMode", "densityMode"],
      properties: {
        copyMode: { type: "string", enum: [...stressCopyModes] },
        stateMode: { type: "string", enum: [...stressStateModes] },
        densityMode: { type: "string", enum: [...densityModes] }
      }
    },
    system: {
      type: "object",
      additionalProperties: false,
      required: [
        "typographyScaleSteps",
        "spacingScaleSteps",
        "defaultDensity",
        "colorRoleCount"
      ],
      properties: {
        typographyScaleSteps: { type: "number", minimum: 1 },
        spacingScaleSteps: { type: "number", minimum: 1 },
        defaultDensity: { type: "string", enum: [...densityModes] },
        colorRoleCount: { type: "number", minimum: 1 }
      }
    },
    layout: {
      type: "object",
      additionalProperties: false,
      required: ["sectionCount", "sectionOrder"],
      properties: {
        sectionCount: { type: "number", minimum: 0 },
        sectionOrder: {
          type: "array",
          items: { type: "string", enum: [...sectionTypes] }
        }
      }
    },
    notes: {
      type: "array",
      items: { type: "string" }
    }
  }
} as const;
