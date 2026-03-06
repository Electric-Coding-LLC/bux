import { type PlaygroundProject, type SettingsScreenBrief } from "@bux/core-model";
import {
  applyBlueprintToProject,
  createInitialBrief,
  createStarterProject,
  deriveBriefFromProject as deriveScreenBriefFromProject,
  syncProjectTitle as syncScreenProjectTitle
} from "./screen-workbench";

export function createInitialSettingsBrief(): SettingsScreenBrief {
  return createInitialBrief("settings");
}

export function createSettingsStarterProject(): PlaygroundProject {
  return createStarterProject("settings");
}

export function applySettingsBlueprintToProject(
  project: PlaygroundProject,
  brief: SettingsScreenBrief,
  blueprintId: string
): PlaygroundProject {
  return applyBlueprintToProject(project, brief, blueprintId);
}

export function deriveBriefFromProject(
  project: PlaygroundProject,
  sourceBrief: SettingsScreenBrief
): SettingsScreenBrief {
  return deriveScreenBriefFromProject(project, sourceBrief);
}

export function syncProjectTitle(
  project: PlaygroundProject,
  title: string
): PlaygroundProject {
  return syncScreenProjectTitle(project, title);
}
