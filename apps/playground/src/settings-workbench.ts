import {
  createSettingsPageFromBlueprint,
  defaultSettingsBlueprintId
} from "@bux/blueprint-library";
import { applyAction } from "@bux/core-engine";
import {
  canonicalProjectFixture,
  canonicalSettingsScreenBriefFixture,
  type PlaygroundProject,
  type SettingsScreenBrief
} from "@bux/core-model";

export function createInitialSettingsBrief(): SettingsScreenBrief {
  return structuredClone(canonicalSettingsScreenBriefFixture);
}

export function createSettingsStarterProject(): PlaygroundProject {
  return applySettingsBlueprintToProject(
    structuredClone(canonicalProjectFixture),
    createInitialSettingsBrief(),
    defaultSettingsBlueprintId
  );
}

export function applySettingsBlueprintToProject(
  project: PlaygroundProject,
  brief: SettingsScreenBrief,
  blueprintId: string
): PlaygroundProject {
  let nextProject = structuredClone(project);
  const page = createSettingsPageFromBlueprint(blueprintId, brief);

  for (const sectionId of nextProject.page.sections.map((section) => section.id)) {
    nextProject = applyAction(nextProject, {
      type: "removeSection",
      sectionId
    });
  }

  for (const section of page.sections) {
    nextProject = applyAction(nextProject, {
      type: "addSection",
      section
    });
  }

  nextProject.page.title = page.title;

  return nextProject;
}

export function deriveBriefFromProject(
  project: PlaygroundProject,
  sourceBrief: SettingsScreenBrief
): SettingsScreenBrief {
  const nextTitle = project.page.title.trim();

  return {
    ...sourceBrief,
    title: nextTitle.length > 0 ? nextTitle : sourceBrief.title
  };
}

export function syncProjectTitle(
  project: PlaygroundProject,
  title: string
): PlaygroundProject {
  if (project.page.title === title) {
    return project;
  }

  return {
    ...project,
    page: {
      ...project.page,
      title
    }
  };
}
