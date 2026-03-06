import {
  canonicalProjectFixture,
  type MarketingLandingScreenBrief,
  type PlaygroundProject
} from "@bux/core-model";
import { evaluateMarketingLanding } from "@bux/critic-rules";
import { validateProjectSections } from "@bux/section-kit";
import { describe, expect, it } from "bun:test";
import {
  createMarketingLandingPageFromBlueprint,
  defaultMarketingLandingBlueprintId,
  getMarketingLandingBlueprint,
  marketingLandingBlueprints
} from "./marketing-blueprints";

function makeProject(page: PlaygroundProject["page"]): PlaygroundProject {
  return {
    ...structuredClone(canonicalProjectFixture),
    page
  };
}

function makeBrief(
  density: MarketingLandingScreenBrief["density"]
): MarketingLandingScreenBrief {
  return {
    schemaVersion: "1.0.0",
    screenType: "marketingLanding",
    title: "Launch with a clearer product story",
    density
  };
}

describe("marketing landing blueprints", () => {
  it("ships four deterministic authored blueprints", () => {
    expect(marketingLandingBlueprints).toHaveLength(4);
    expect(new Set(marketingLandingBlueprints.map((blueprint) => blueprint.id)).size).toBe(4);
    expect(getMarketingLandingBlueprint(defaultMarketingLandingBlueprintId).id).toBe(
      defaultMarketingLandingBlueprintId
    );
  });

  it("creates valid pages with a clear landing-page story spine", () => {
    for (const blueprint of marketingLandingBlueprints) {
      const page = createMarketingLandingPageFromBlueprint(blueprint.id, makeBrief("focused"));
      const project = makeProject(page);

      expect(validateProjectSections(project)).toEqual([]);
      expect(page.sections[0]?.type).toBe("hero");
      expect(page.sections.some((section) => section.type === "featureGrid")).toBe(true);
    }
  });

  it("keeps each blueprint candidate out of fail territory for a matching density", () => {
    for (const blueprint of marketingLandingBlueprints) {
      const brief = makeBrief(blueprint.densityEnvelope[0] ?? "focused");
      const report = evaluateMarketingLanding(
        makeProject(createMarketingLandingPageFromBlueprint(blueprint.id, brief)),
        brief
      );

      expect(report.verdict).not.toBe("fail");
    }
  });
});
