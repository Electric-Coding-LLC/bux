import { breakpoints, densityModes, sectionTypes } from "./shared";

export const constraintsSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "ConstraintsDocument",
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "layout", "sectionRules"],
  properties: {
    schemaVersion: { type: "string", minLength: 1 },
    layout: {
      type: "object",
      additionalProperties: false,
      required: ["breakpoints", "defaultDensity"],
      properties: {
        breakpoints: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["breakpoint", "columns", "gutterToken", "containerToken"],
            properties: {
              breakpoint: { type: "string", enum: [...breakpoints] },
              columns: { type: "number", minimum: 1 },
              gutterToken: { type: "number", minimum: 0 },
              containerToken: { type: "string", enum: [...breakpoints] }
            }
          }
        },
        defaultDensity: { type: "string", enum: [...densityModes] }
      }
    },
    sectionRules: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sectionType", "allowedVariants"],
        properties: {
          sectionType: { type: "string", enum: [...sectionTypes] },
          allowedVariants: {
            type: "array",
            minItems: 1,
            items: { type: "string", minLength: 1 }
          },
          maxItems: { type: "number", minimum: 1 }
        }
      }
    }
  }
} as const;
