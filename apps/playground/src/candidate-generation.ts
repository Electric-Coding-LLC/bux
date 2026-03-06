import {
  getBlueprintsForScreenType,
  type ScreenBlueprint,
  type SettingsBlueprint
} from "@bux/blueprint-library";
import { evaluateScreen } from "@bux/critic-rules";
import { collectValidationIssues } from "@bux/exporter/browser";
import {
  type CriticReport,
  type PlaygroundProject,
  type ScreenBrief,
  type SettingsScreenBrief
} from "@bux/core-model";
import {
  evaluateExportReadiness,
  type ExportReadiness
} from "./export-readiness";
import { applyBlueprintToProject } from "./screen-workbench";

export interface GeneratedCandidate<
  TBrief extends ScreenBrief = ScreenBrief,
  TBlueprint extends ScreenBlueprint = ScreenBlueprint
> {
  blueprint: TBlueprint;
  exportReadiness: ExportReadiness;
  project: PlaygroundProject;
  report: CriticReport;
  brief: TBrief;
}

export type GeneratedSettingsCandidate = GeneratedCandidate<
  SettingsScreenBrief,
  SettingsBlueprint
>;

function compareCandidates(
  left: GeneratedCandidate,
  right: GeneratedCandidate
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
  left: ScreenBlueprint,
  right: ScreenBlueprint,
  brief: ScreenBrief
): number {
  const leftMatches = left.densityEnvelope.some((density) => density === brief.density);
  const rightMatches = right.densityEnvelope.some((density) => density === brief.density);

  if (leftMatches !== rightMatches) {
    return leftMatches ? -1 : 1;
  }

  return left.id.localeCompare(right.id);
}

export function generateCandidates<TBrief extends ScreenBrief>(
  baseProject: PlaygroundProject,
  brief: TBrief,
  maxCandidates = 4
): Array<GeneratedCandidate<TBrief>> {
  return [...getBlueprintsForScreenType(brief.screenType)]
    .sort((left, right) => prioritizeBlueprint(left, right, brief))
    .slice(0, maxCandidates)
    .map((blueprint) => {
      const project = applyBlueprintToProject(baseProject, brief, blueprint.id);
      const report = evaluateScreen(project, brief);

      return {
        blueprint,
        brief,
        exportReadiness: evaluateExportReadiness(
          report,
          collectValidationIssues(project)
        ),
        project,
        report
      };
    })
    .sort(compareCandidates);
}

export function generateSettingsCandidates(
  baseProject: PlaygroundProject,
  brief: SettingsScreenBrief,
  maxCandidates = 4
): GeneratedSettingsCandidate[] {
  return generateCandidates(baseProject, brief, maxCandidates) as GeneratedSettingsCandidate[];
}
