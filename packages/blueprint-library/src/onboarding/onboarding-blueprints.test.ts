import {
  canonicalProjectFixture,
  type OnboardingScreenBrief,
  type PlaygroundProject
} from "@bux/core-model";
import { evaluateOnboardingScreen } from "@bux/critic-rules";
import { validateProjectSections } from "@bux/section-kit";
import { describe, expect, it } from "bun:test";
import {
  createOnboardingPageFromBlueprint,
  defaultOnboardingBlueprintId,
  getOnboardingBlueprint,
  onboardingBlueprints
} from "./onboarding-blueprints";

function makeProject(page: PlaygroundProject["page"]): PlaygroundProject {
  return {
    ...structuredClone(canonicalProjectFixture),
    page
  };
}

function makeBrief(
  density: OnboardingScreenBrief["density"]
): OnboardingScreenBrief {
  return {
    schemaVersion: "1.0.0",
    screenType: "onboarding",
    title: "Get your workspace ready",
    density
  };
}

describe("onboarding blueprints", () => {
  it("ships four deterministic authored blueprints", () => {
    expect(onboardingBlueprints).toHaveLength(4);
    expect(new Set(onboardingBlueprints.map((blueprint) => blueprint.id)).size).toBe(4);
    expect(getOnboardingBlueprint(defaultOnboardingBlueprintId).id).toBe(
      defaultOnboardingBlueprintId
    );
  });

  it("creates valid pages with a hero-led onboarding flow", () => {
    for (const blueprint of onboardingBlueprints) {
      const page = createOnboardingPageFromBlueprint(blueprint.id, makeBrief("guided"));
      const project = makeProject(page);

      expect(validateProjectSections(project)).toEqual([]);
      expect(page.sections[0]?.type).toBe("hero");
      expect(page.sections.some((section) => section.type === "form")).toBe(true);
    }
  });

  it("keeps each blueprint candidate out of fail territory for a matching density", () => {
    for (const blueprint of onboardingBlueprints) {
      const brief = makeBrief(blueprint.densityEnvelope[0] ?? "guided");
      const report = evaluateOnboardingScreen(
        makeProject(createOnboardingPageFromBlueprint(blueprint.id, brief)),
        brief
      );

      expect(report.verdict).not.toBe("fail");
    }
  });
});
