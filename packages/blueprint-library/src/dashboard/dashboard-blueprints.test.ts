import {
  canonicalProjectFixture,
  type DashboardScreenBrief,
  type PlaygroundProject
} from "@bux/core-model";
import { evaluateDashboardScreen } from "@bux/critic-rules";
import { validateProjectSections } from "@bux/section-kit";
import { describe, expect, it } from "bun:test";
import {
  createDashboardPageFromBlueprint,
  dashboardBlueprints,
  defaultDashboardBlueprintId,
  getDashboardBlueprint
} from "./dashboard-blueprints";

function makeProject(page: PlaygroundProject["page"]): PlaygroundProject {
  return {
    ...structuredClone(canonicalProjectFixture),
    page
  };
}

function makeBrief(
  density: DashboardScreenBrief["density"]
): DashboardScreenBrief {
  return {
    schemaVersion: "1.0.0",
    screenType: "dashboard",
    title: "Team operations pulse",
    density
  };
}

describe("dashboard blueprints", () => {
  it("ships four deterministic authored blueprints", () => {
    expect(dashboardBlueprints).toHaveLength(4);
    expect(new Set(dashboardBlueprints.map((blueprint) => blueprint.id)).size).toBe(4);
    expect(getDashboardBlueprint(defaultDashboardBlueprintId).id).toBe(
      defaultDashboardBlueprintId
    );
  });

  it("creates valid dashboard pages with a summary band and at least one operational surface", () => {
    for (const blueprint of dashboardBlueprints) {
      const page = createDashboardPageFromBlueprint(blueprint.id, makeBrief("operational"));
      const project = makeProject(page);

      expect(validateProjectSections(project)).toEqual([]);
      expect(page.sections[0]?.type).toBe("featureGrid");
      expect(
        page.sections.some(
          (section) => section.type === "list" || section.type === "table"
        )
      ).toBe(true);
    }
  });

  it("keeps each blueprint candidate out of fail territory for a matching density", () => {
    for (const blueprint of dashboardBlueprints) {
      const brief = makeBrief(blueprint.densityEnvelope[0] ?? "operational");
      const report = evaluateDashboardScreen(
        makeProject(createDashboardPageFromBlueprint(blueprint.id, brief)),
        brief
      );

      expect(report.verdict).not.toBe("fail");
    }
  });
});
