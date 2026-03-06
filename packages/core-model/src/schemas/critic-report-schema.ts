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
          path: { type: "string", minLength: 1 },
          suggestedFix: {
            type: "object",
            additionalProperties: false,
            required: ["id", "label", "description", "actions"],
            properties: {
              id: { type: "string", minLength: 1 },
              label: { type: "string", minLength: 1 },
              description: { type: "string", minLength: 1 },
              actions: {
                type: "array",
                items: {
                  oneOf: [
                    {
                      type: "object",
                      additionalProperties: false,
                      required: ["type", "sectionId", "changes"],
                      properties: {
                        type: { const: "updateSection" },
                        sectionId: { type: "string", minLength: 1 },
                        changes: {
                          type: "object",
                          additionalProperties: false,
                          properties: {
                            variant: { type: "string", minLength: 1 },
                            props: { type: "object" },
                            slots: { type: "object" }
                          }
                        }
                      }
                    },
                    {
                      type: "object",
                      additionalProperties: false,
                      required: ["type", "sectionId", "toIndex"],
                      properties: {
                        type: { const: "reorderSection" },
                        sectionId: { type: "string", minLength: 1 },
                        toIndex: { type: "number", minimum: 0 }
                      }
                    },
                    {
                      type: "object",
                      additionalProperties: false,
                      required: ["type", "sectionId"],
                      properties: {
                        type: { const: "removeSection" },
                        sectionId: { type: "string", minLength: 1 }
                      }
                    }
                  ]
                }
              }
            }
          }
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
