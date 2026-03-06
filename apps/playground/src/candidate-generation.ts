import {
  settingsBlueprints,
  type SettingsBlueprint
} from "@bux/blueprint-library";
import { evaluateSettingsScreen } from "@bux/critic-rules";
import {
  type CriticReport,
  type PlaygroundProject,
  type SettingsScreenBrief
} from "@bux/core-model";
import { applySettingsBlueprintToProject } from "./settings-workbench";

export interface GeneratedSettingsCandidate {
  blueprint: SettingsBlueprint;
  project: PlaygroundProject;
  report: CriticReport;
}

function compareCandidates(
  left: GeneratedSettingsCandidate,
  right: GeneratedSettingsCandidate
): number {
  if (left.report.score !== right.report.score) {
    return right.report.score - left.report.score;
  }

  if (left.report.findings.length !== right.report.findings.length) {
    return left.report.findings.length - right.report.findings.length;
  }

  if (left.report.summary.severityCounts.high !== right.report.summary.severityCounts.high) {
    return left.report.summary.severityCounts.high - right.report.summary.severityCounts.high;
  }

  return left.blueprint.id.localeCompare(right.blueprint.id);
}

function prioritizeBlueprint(
  left: SettingsBlueprint,
  right: SettingsBlueprint,
  brief: SettingsScreenBrief
): number {
  const leftMatches = left.densityEnvelope.includes(brief.density);
  const rightMatches = right.densityEnvelope.includes(brief.density);

  if (leftMatches !== rightMatches) {
    return leftMatches ? -1 : 1;
  }

  return left.id.localeCompare(right.id);
}

export function generateSettingsCandidates(
  baseProject: PlaygroundProject,
  brief: SettingsScreenBrief,
  maxCandidates = 4
): GeneratedSettingsCandidate[] {
  return [...settingsBlueprints]
    .sort((left, right) => prioritizeBlueprint(left, right, brief))
    .slice(0, maxCandidates)
    .map((blueprint) => {
      const project = applySettingsBlueprintToProject(baseProject, brief, blueprint.id);

      return {
        blueprint,
        project,
        report: evaluateSettingsScreen(project, brief)
      };
    })
    .sort(compareCandidates);
}
