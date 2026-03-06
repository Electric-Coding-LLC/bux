import { evaluateSettingsScreen } from "@bux/critic-rules";
import { applyActions, type EngineAction } from "@bux/core-engine";
import type {
  CriticFinding,
  CriticReport,
  CriticRepairAction,
  CriticSuggestedFix,
  CriticVerdict,
  PlaygroundProject,
  SettingsScreenBrief
} from "@bux/core-model";
import {
  canonicalJSONStringify,
  collectValidationIssues
} from "@bux/exporter/browser";
import {
  evaluateExportReadiness,
  type ExportReadiness
} from "./export-readiness";
import type { BlockedCandidateGapProgress } from "./candidate-triage";

export interface AppliedRepairOutcome {
  afterFindingCount: number;
  afterScore: number;
  afterVerdict: CriticVerdict;
  beforeFindingCount: number;
  beforeScore: number;
  beforeVerdict: CriticVerdict;
  delta: number;
  gapProgress: BlockedCandidateGapProgress | null;
  label: string;
  resolvedFindings: number;
}

export interface RepairHistoryEntry extends AppliedRepairOutcome {
  findingCode: string;
  findingPath: string;
  fixId: string;
}

interface BaseFindingRepairState {
  finding: CriticFinding;
  helperText: string;
  label: string;
}

export interface ActionableFindingRepairState extends BaseFindingRepairState {
  beforeFindingCount: number;
  beforeScore: number;
  beforeVerdict: CriticVerdict;
  fix: CriticSuggestedFix;
  nextExportReadiness: ExportReadiness;
  nextProject: PlaygroundProject;
  nextReport: CriticReport;
  projectedDelta: number;
  resolvedFindings: number;
  status: "actionable";
}

export interface DisabledFindingRepairState extends BaseFindingRepairState {
  fix: CriticSuggestedFix | null;
  status: "disabled";
}

export type FindingRepairState =
  | ActionableFindingRepairState
  | DisabledFindingRepairState;

function toEngineAction(action: CriticRepairAction): EngineAction {
  switch (action.type) {
    case "removeSection":
      return action;
    case "reorderSection":
      return action;
    case "updateSection":
      return action;
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

export function applyCriticSuggestedFix(
  project: PlaygroundProject,
  fix: CriticSuggestedFix
): PlaygroundProject {
  return applyActions(project, fix.actions.map(toEngineAction));
}

function serializeRepairFingerprint(project: PlaygroundProject): string {
  return canonicalJSONStringify({
    constraints: project.constraints,
    page: project.page,
    stress: project.stress,
    tokens: project.tokens
  });
}

function findingKey(finding: CriticFinding): string {
  return `${finding.code}:${finding.path}:${finding.message}`;
}

function countResolvedFindings(
  beforeReport: CriticReport,
  afterReport: CriticReport
): number {
  const remainingKeys = new Set(afterReport.findings.map(findingKey));

  return beforeReport.findings.reduce((count, finding) => {
    return remainingKeys.has(findingKey(finding)) ? count : count + 1;
  }, 0);
}

export function prepareFindingRepairState(
  project: PlaygroundProject,
  brief: SettingsScreenBrief,
  report: CriticReport,
  finding: CriticFinding
): FindingRepairState {
  const suggestedFix = finding.suggestedFix;

  if (!suggestedFix) {
    return {
      finding,
      fix: null,
      helperText: "No deterministic repair is attached to this finding yet.",
      label: "No repair yet",
      status: "disabled"
    };
  }

  if (suggestedFix.actions.length === 0) {
    return {
      finding,
      fix: suggestedFix,
      helperText: "This repair is defined, but it does not include any deterministic actions.",
      label: suggestedFix.label,
      status: "disabled"
    };
  }

  try {
    const nextProject = applyCriticSuggestedFix(project, suggestedFix);

    if (
      serializeRepairFingerprint(nextProject) ===
      serializeRepairFingerprint(project)
    ) {
      return {
        finding,
        fix: suggestedFix,
        helperText: "This repair no longer changes the current candidate.",
        label: suggestedFix.label,
        status: "disabled"
      };
    }

    const nextReport = evaluateSettingsScreen(nextProject, brief);
    const nextExportReadiness = evaluateExportReadiness(
      nextReport,
      collectValidationIssues(nextProject)
    );
    const projectedDelta = nextReport.score - report.score;
    const projectedSign = projectedDelta >= 0 ? "+" : "";
    const resolvedFindings = countResolvedFindings(report, nextReport);

    return {
      beforeFindingCount: report.findings.length,
      beforeScore: report.score,
      beforeVerdict: report.verdict,
      finding,
      fix: suggestedFix,
      helperText: `${suggestedFix.description} Projected score ${report.score} to ${
        nextReport.score
      } (${projectedSign}${projectedDelta}).`,
      label: suggestedFix.label,
      nextExportReadiness,
      nextProject,
      nextReport,
      projectedDelta,
      resolvedFindings,
      status: "actionable"
    };
  } catch (error) {
    return {
      finding,
      fix: suggestedFix,
      helperText:
        error instanceof Error
          ? `This repair is no longer safe to apply: ${error.message}`
          : "This repair is no longer safe to apply.",
      label: suggestedFix.label,
      status: "disabled"
    };
  }
}

export function prepareFindingRepairStates(
  project: PlaygroundProject,
  brief: SettingsScreenBrief,
  report: CriticReport
): FindingRepairState[] {
  return report.findings.map((finding) =>
    prepareFindingRepairState(project, brief, report, finding)
  );
}

export function createRepairHistoryEntry(
  repairState: ActionableFindingRepairState,
  gapProgress: BlockedCandidateGapProgress | null
): RepairHistoryEntry {
  return {
    afterFindingCount: repairState.nextReport.findings.length,
    afterScore: repairState.nextReport.score,
    afterVerdict: repairState.nextReport.verdict,
    beforeFindingCount: repairState.beforeFindingCount,
    beforeScore: repairState.beforeScore,
    beforeVerdict: repairState.beforeVerdict,
    delta: repairState.projectedDelta,
    findingCode: repairState.finding.code,
    findingPath: repairState.finding.path,
    fixId: repairState.fix.id,
    gapProgress,
    label: repairState.label,
    resolvedFindings: repairState.resolvedFindings
  };
}
