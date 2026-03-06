import { describe, expect, it } from "bun:test";
import {
  canonicalProjectFixture,
  canonicalSettingsScreenBriefFixture
} from "@bux/core-model";
import {
  parseWorkbenchDocument,
  serializeProjectFingerprint,
  serializeWorkbenchDocument
} from "./project-io";

describe("workbench document persistence", () => {
  it("serializes and parses active blueprint provenance with the brief", () => {
    const document = serializeWorkbenchDocument(
      canonicalSettingsScreenBriefFixture,
      "guided-rail"
    );

    const parsed = parseWorkbenchDocument(JSON.parse(document) as unknown);

    expect(parsed.activeBlueprintId).toBe("guided-rail");
    expect(parsed.brief).toEqual(canonicalSettingsScreenBriefFixture);
  });

  it("keeps backward compatibility with older brief.json files that omit provenance", () => {
    const parsed = parseWorkbenchDocument({
      density: canonicalSettingsScreenBriefFixture.density,
      schemaVersion: canonicalSettingsScreenBriefFixture.schemaVersion,
      screenType: canonicalSettingsScreenBriefFixture.screenType,
      title: canonicalSettingsScreenBriefFixture.title
    });

    expect(parsed.activeBlueprintId).toBeNull();
    expect(parsed.brief).toEqual(canonicalSettingsScreenBriefFixture);
  });

  it("tracks active blueprint provenance in the saved fingerprint", () => {
    const withoutBlueprint = serializeProjectFingerprint(
      canonicalProjectFixture,
      canonicalSettingsScreenBriefFixture,
      null
    );
    const withBlueprint = serializeProjectFingerprint(
      canonicalProjectFixture,
      canonicalSettingsScreenBriefFixture,
      "guided-rail"
    );

    expect(withBlueprint).not.toBe(withoutBlueprint);
  });
});
