import { settingsScreenDensities } from "./shared";

export const briefSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "ScreenBrief",
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      required: ["schemaVersion", "screenType", "title", "density"],
      properties: {
        schemaVersion: { type: "string", minLength: 1 },
        screenType: { const: "settings" },
        title: { type: "string", minLength: 1 },
        density: { type: "string", enum: [...settingsScreenDensities] }
      }
    }
  ]
} as const;
