import { describe, expect, it } from "bun:test";
import {
  applySettingsBlueprintToProject,
  createInitialSettingsBrief,
  createSettingsStarterProject,
  deriveBriefFromProject,
  syncProjectTitle
} from "./settings-workbench";

describe("settings workbench helpers", () => {
  it("creates a settings-focused starter candidate", () => {
    const project = createSettingsStarterProject();

    expect(project.page.title).toBe("Workspace settings");
    expect(project.page.sections).toHaveLength(1);
    expect(project.page.sections[0]?.type).toBe("settings");
    expect(project.summary.layout.sectionCount).toBe(1);
    expect(project.summary.layout.sectionOrder).toEqual(["settings"]);
  });

  it("derives the brief title from the current candidate", () => {
    const project = createSettingsStarterProject();
    project.page.title = "Account settings";

    const brief = deriveBriefFromProject(project, createInitialSettingsBrief());

    expect(brief.title).toBe("Account settings");
    expect(brief.density).toBe("comfortable");
  });

  it("syncs the project title without mutating the existing project", () => {
    const project = createSettingsStarterProject();

    const nextProject = syncProjectTitle(project, "Team settings");

    expect(project.page.title).toBe("Workspace settings");
    expect(nextProject.page.title).toBe("Team settings");
    expect(nextProject.page.sections).toEqual(project.page.sections);
  });

  it("replaces the current candidate with the selected blueprint page", () => {
    const brief = {
      ...createInitialSettingsBrief(),
      density: "compact" as const,
      title: "Team settings"
    };
    const project = applySettingsBlueprintToProject(
      createSettingsStarterProject(),
      brief,
      "dense-ops"
    );

    expect(project.page.title).toBe("Team settings");
    expect(project.page.sections).toHaveLength(1);
    expect(project.page.sections[0]?.variant).toBe("flat");
    expect(project.page.sections[0]?.props.layoutStyle).toBe("dense");
  });
});
