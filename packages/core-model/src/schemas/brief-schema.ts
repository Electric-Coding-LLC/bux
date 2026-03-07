import {
  dashboardArtDirectionProfiles,
  dashboardScreenDensities,
  marketingLandingScreenDensities,
  onboardingScreenDensities,
  settingsScreenDensities
} from "./shared";

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
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["schemaVersion", "screenType", "title", "density"],
      properties: {
        schemaVersion: { type: "string", minLength: 1 },
        screenType: { const: "onboarding" },
        title: { type: "string", minLength: 1 },
        density: { type: "string", enum: [...onboardingScreenDensities] }
      }
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["schemaVersion", "screenType", "title", "density"],
      properties: {
        schemaVersion: { type: "string", minLength: 1 },
        screenType: { const: "marketingLanding" },
        title: { type: "string", minLength: 1 },
        density: { type: "string", enum: [...marketingLandingScreenDensities] }
      }
    },
    {
      type: "object",
      additionalProperties: false,
      required: [
        "schemaVersion",
        "screenType",
        "title",
        "density",
        "artDirection"
      ],
      properties: {
        schemaVersion: { type: "string", minLength: 1 },
        screenType: { const: "dashboard" },
        title: { type: "string", minLength: 1 },
        density: { type: "string", enum: [...dashboardScreenDensities] },
        artDirection: { type: "string", enum: [...dashboardArtDirectionProfiles] }
      }
    }
  ]
} as const;
