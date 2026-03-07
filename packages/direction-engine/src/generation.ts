import {
  createPageFromBlueprint,
  getBlueprintsForScreenType,
  type ScreenBlueprint,
  type SettingsBlueprint
} from "@bux/blueprint-library";
import { applyAction } from "@bux/core-engine";
import { evaluateScreen } from "@bux/critic-rules";
import {
  type CriticReport,
  type PlaygroundProject,
  type ScreenBrief,
  type SettingsScreenBrief
} from "@bux/core-model";
import { collectValidationIssues } from "@bux/exporter/browser";
import { applyDashboardArtDirection } from "./dashboard-art-direction";
import {
  evaluateExportReadiness,
  type ExportReadiness
} from "./export-readiness";

export interface GeneratedCandidate<
  TBrief extends ScreenBrief = ScreenBrief,
  TBlueprint extends ScreenBlueprint = ScreenBlueprint
> {
  blueprint: TBlueprint;
  brief: TBrief;
  exportReadiness: ExportReadiness;
  project: PlaygroundProject;
  report: CriticReport;
}

export type GeneratedSettingsCandidate = GeneratedCandidate<
  SettingsScreenBrief,
  SettingsBlueprint
>;

function blueprintMatchesArtDirection(
  blueprint: ScreenBlueprint,
  brief: ScreenBrief
): boolean {
  return (
    blueprint.screenType === "dashboard" &&
    brief.screenType === "dashboard" &&
    blueprint.artDirectionProfiles.includes(brief.artDirection)
  );
}

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

  const leftArtDirectionMatch = blueprintMatchesArtDirection(left.blueprint, left.brief);
  const rightArtDirectionMatch = blueprintMatchesArtDirection(right.blueprint, right.brief);

  if (leftArtDirectionMatch !== rightArtDirectionMatch) {
    return leftArtDirectionMatch ? -1 : 1;
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

  const leftArtDirectionMatch = blueprintMatchesArtDirection(left, brief);
  const rightArtDirectionMatch = blueprintMatchesArtDirection(right, brief);

  if (leftArtDirectionMatch !== rightArtDirectionMatch) {
    return leftArtDirectionMatch ? -1 : 1;
  }

  return left.id.localeCompare(right.id);
}

export function applyBlueprintToProject<TBrief extends ScreenBrief>(
  project: PlaygroundProject,
  brief: TBrief,
  blueprintId: string
): PlaygroundProject {
  let nextProject = structuredClone(project);
  const page = createPageFromBlueprint(blueprintId, brief);

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

  if (brief.screenType === "dashboard") {
    nextProject = applyDashboardArtDirection(nextProject, brief.artDirection);
  }

  return nextProject;
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
