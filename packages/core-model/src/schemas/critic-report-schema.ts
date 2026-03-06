import { criticFindingSeverities, criticVerdicts, screenTypes } from "./shared";

export const criticReportSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "CriticReport",
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "screenType", "score", "verdict", "findings", "summary"],
  properties: {
    schemaVersion: { type: "string", minLength: 1 },
    screenType: { type: "string", enum: [...screenTypes] },
    score: { type: "number", minimum: 0, maximum: 100 },
    verdict: { type: "string", enum: [...criticVerdicts] },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["code", "severity", "message", "path"],
        properties: {
          code: { type: "string", minLength: 1 },
          severity: { type: "string", enum: [...criticFindingSeverities] },
          message: { type: "string", minLength: 1 },
          path: { type: "string", minLength: 1 }
        }
      }
    },
    summary: {
      type: "object",
      additionalProperties: false,
      required: ["totalRules", "triggeredRules", "severityCounts"],
      properties: {
        totalRules: { type: "number", minimum: 0 },
        triggeredRules: { type: "number", minimum: 0 },
        severityCounts: {
          type: "object",
          additionalProperties: false,
          required: ["low", "medium", "high"],
          properties: {
            low: { type: "number", minimum: 0 },
            medium: { type: "number", minimum: 0 },
            high: { type: "number", minimum: 0 }
          }
        }
      }
    }
  }
} as const;
