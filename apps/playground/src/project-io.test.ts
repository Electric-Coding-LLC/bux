import { describe, expect, it } from "bun:test";
import {
  canonicalProjectFixture,
  canonicalDashboardScreenBriefFixture,
  canonicalMarketingLandingScreenBriefFixture,
  canonicalSettingsScreenBriefFixture
} from "@bux/core-model";
import {
  createProjectExportFiles,
  parseWorkbenchDocument,
  serializeProjectFingerprint,
  serializeWorkbenchDocument
} from "./project-io";

describe("workbench document persistence", () => {
  it("serializes and parses active blueprint provenance with the brief", () => {
    const document = serializeWorkbenchDocument(
      canonicalSettingsScreenBriefFixture,
      "guided-rail",
      "webstir"
    );

    const parsed = parseWorkbenchDocument(JSON.parse(document) as unknown);

    expect(parsed.activeBlueprintId).toBe("guided-rail");
    expect(parsed.adapterTarget).toBe("webstir");
    expect(parsed.brief).toEqual(canonicalSettingsScreenBriefFixture);
  });

  it("keeps backward compatibility with older brief.json files that omit provenance and adapter target", () => {
    const parsed = parseWorkbenchDocument({
      density: canonicalSettingsScreenBriefFixture.density,
      schemaVersion: canonicalSettingsScreenBriefFixture.schemaVersion,
      screenType: canonicalSettingsScreenBriefFixture.screenType,
      title: canonicalSettingsScreenBriefFixture.title
    });

    expect(parsed.activeBlueprintId).toBeNull();
    expect(parsed.adapterTarget).toBe("nextjs");
    expect(parsed.brief).toEqual(canonicalSettingsScreenBriefFixture);
  });

  it("tracks active blueprint provenance and adapter target in the saved fingerprint", () => {
    const withoutBlueprint = serializeProjectFingerprint(
      canonicalProjectFixture,
      canonicalSettingsScreenBriefFixture,
      null,
      "nextjs"
    );
    const withBlueprint = serializeProjectFingerprint(
      canonicalProjectFixture,
      canonicalSettingsScreenBriefFixture,
      "guided-rail",
      "webstir"
    );

    expect(withBlueprint).not.toBe(withoutBlueprint);
  });

  it("round-trips marketing landing briefs", () => {
    const document = serializeWorkbenchDocument(
      canonicalMarketingLandingScreenBriefFixture,
      "signal-stack",
      "nextjs"
    );

    const parsed = parseWorkbenchDocument(JSON.parse(document) as unknown);

    expect(parsed.activeBlueprintId).toBe("signal-stack");
    expect(parsed.adapterTarget).toBe("nextjs");
    expect(parsed.brief).toEqual(canonicalMarketingLandingScreenBriefFixture);
  });

  it("round-trips dashboard briefs", () => {
    const document = serializeWorkbenchDocument(
      canonicalDashboardScreenBriefFixture,
      "ops-radar",
      "webstir"
    );

    const parsed = parseWorkbenchDocument(JSON.parse(document) as unknown);

    expect(parsed.activeBlueprintId).toBe("ops-radar");
    expect(parsed.adapterTarget).toBe("webstir");
    expect(parsed.brief).toEqual(canonicalDashboardScreenBriefFixture);
  });

  it("defaults legacy dashboard briefs to the canonical art direction", () => {
    const parsed = parseWorkbenchDocument({
      density: canonicalDashboardScreenBriefFixture.density,
      schemaVersion: canonicalDashboardScreenBriefFixture.schemaVersion,
      screenType: canonicalDashboardScreenBriefFixture.screenType,
      title: canonicalDashboardScreenBriefFixture.title
    });

    expect(parsed.brief).toEqual(canonicalDashboardScreenBriefFixture);
  });

  it("creates deterministic export artifacts for the selected adapter target", () => {
    const files = createProjectExportFiles(canonicalProjectFixture, "webstir");

    expect(Object.keys(files).sort()).toEqual([
      "constraints.json",
      "layout-spec.webstir.json",
      "page.json",
      "summary.json",
      "tokens.json"
    ]);

    const layoutSpec = JSON.parse(files["layout-spec.webstir.json"] ?? "null") as Record<
      string,
      unknown
    >;

    expect(layoutSpec.target).toBe("webstir");
    expect(layoutSpec.generatedAt).toBe(canonicalProjectFixture.summary.generatedAt);
  });
});
