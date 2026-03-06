import {
  canonicalProjectFixture,
  type PlaygroundProject,
  type SettingsScreenBrief
} from "@bux/core-model";
import { evaluateSettingsScreen } from "@bux/critic-rules";
import { validateProjectSections } from "@bux/section-kit";
import { describe, expect, it } from "bun:test";
import {
  createSettingsPageFromBlueprint,
  defaultSettingsBlueprintId,
  getSettingsBlueprint,
  settingsBlueprints
} from "./settings-blueprints";

function makeProject(page: PlaygroundProject["page"]): PlaygroundProject {
  return {
    ...structuredClone(canonicalProjectFixture),
    page
  };
}

function makeBrief(density: SettingsScreenBrief["density"]): SettingsScreenBrief {
  return {
    schemaVersion: "1.0.0",
    screenType: "settings",
    title: "Workspace settings",
    density
  };
}

describe("settings blueprints", () => {
  it("ships five deterministic authored blueprints", () => {
    expect(settingsBlueprints).toHaveLength(5);
    expect(new Set(settingsBlueprints.map((blueprint) => blueprint.id)).size).toBe(5);
    expect(getSettingsBlueprint(defaultSettingsBlueprintId).id).toBe(defaultSettingsBlueprintId);
  });

  it("creates valid pages with materially different settings layouts", () => {
    const signatures = settingsBlueprints.map((blueprint) => {
      const page = createSettingsPageFromBlueprint(blueprint.id, makeBrief("comfortable"));
      const project = makeProject(page);

      expect(validateProjectSections(project)).toEqual([]);

      const section = page.sections[0];
      expect(section?.type).toBe("settings");

      return `${section?.variant}:${String(section?.props.layoutStyle)}:${String(
        section?.props.groupCount
      )}`;
    });

    expect(new Set(signatures).size).toBe(settingsBlueprints.length);
  });

  it("keeps each blueprint candidate out of fail territory for a matching density", () => {
    for (const blueprint of settingsBlueprints) {
      const brief = makeBrief(blueprint.densityEnvelope[0] ?? "comfortable");
      const report = evaluateSettingsScreen(
        makeProject(createSettingsPageFromBlueprint(blueprint.id, brief)),
        brief
      );

      expect(report.verdict).not.toBe("fail");
    }
  });
});
