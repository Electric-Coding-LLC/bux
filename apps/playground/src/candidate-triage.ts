import {
  type CriticReport,
  type PlaygroundProject,
  type ScreenBrief
} from "@bux/core-model";
import { canonicalJSONStringify } from "@bux/exporter/browser";
import type { GeneratedCandidate } from "./candidate-generation";
import type { ExportReadiness } from "./export-readiness";

export interface CandidateLeadSummary {
  bestExportReady: GeneratedCandidate | null;
  bestOverall: GeneratedCandidate | null;
}

export interface WorkbenchStandingSummary {
  label: string;
  status: "approved" | "blocked" | "neutral";
  summary: string;
}

export interface CandidateRecommendation {
  actionLabel: string;
  candidate: GeneratedCandidate;
  label: string;
  status: "approved" | "blocked";
  summary: string;
}

export interface ActiveBlueprintStatusSummary {
  comparison: {
    exportStatus: {
      baseline: string;
      current: string;
    };
    findingDelta: number;
    findings: {
      baseline: number;
      current: number;
    };
    scoreDelta: number;
    scores: {
      baseline: number;
      current: number;
    };
  };
  canRestoreBaseline: boolean;
  candidate: GeneratedCandidate;
  label: string;
  status: "approved" | "blocked";
  summary: string;
}

export interface BlockedCandidateGapSummary {
  bestExportReady: GeneratedCandidate;
  blockedReasons: string[];
  findingGap: number;
  scoreGap: number;
  summary: string;
}

export interface BlockedCandidateGapProgress {
  exportReadyNow: boolean;
  findingGapDelta: number;
  improved: boolean;
  resolved: boolean;
  scoreGapDelta: number;
  summary: string;
}

export function summarizeCandidateLeads(
  candidates: ReadonlyArray<GeneratedCandidate>
): CandidateLeadSummary {
  return {
    bestExportReady:
      candidates.find((candidate) => candidate.exportReadiness.canExport) ?? null,
    bestOverall: candidates[0] ?? null
  };
}

function compareReports(left: CriticReport, right: CriticReport): number {
  if (left.score !== right.score) {
    return right.score - left.score;
  }

  if (left.findings.length !== right.findings.length) {
    return left.findings.length - right.findings.length;
  }

  if (left.summary.severityCounts.high !== right.summary.severityCounts.high) {
    return left.summary.severityCounts.high - right.summary.severityCounts.high;
  }

  return 0;
}

function strongerOrEqual(left: CriticReport, right: CriticReport): boolean {
  return compareReports(left, right) <= 0;
}

export function summarizeWorkbenchStanding(
  report: CriticReport,
  exportReadiness: ExportReadiness,
  candidates: ReadonlyArray<GeneratedCandidate>
): WorkbenchStandingSummary {
  const candidateLeads = summarizeCandidateLeads(candidates);
  const { bestExportReady, bestOverall } = candidateLeads;

  if (!bestOverall) {
    return {
      label: "Keep editing this version",
      status: exportReadiness.canExport ? "approved" : "neutral",
      summary: "There are no other ranked versions yet, so keep working in the current editor state."
    };
  }

  if (exportReadiness.canExport && !bestExportReady) {
    return {
      label: "Export the current version",
      status: "approved",
      summary:
        "The current version is ready to export, and every generated version still needs repair."
    };
  }

  if (exportReadiness.canExport && strongerOrEqual(report, bestOverall.report)) {
    return {
      label: "Export the current version",
      status: "approved",
      summary: `The current version is ready to export and is at least as strong as ${bestOverall.blueprint.name}, the top-ranked generated option.`
    };
  }

  if (!exportReadiness.canExport && strongerOrEqual(report, bestOverall.report)) {
    const exportReferenceSummary = bestExportReady
      ? ` ${bestExportReady.blueprint.name} is still the best approved fallback if you need to export now.`
      : "";

    return {
      label: "Fix blockers or switch to an approved version",
      status: "blocked",
      summary: `The current version scores at least as well as ${bestOverall.blueprint.name}, but it still cannot export.${exportReferenceSummary}`
    };
  }

  if (exportReadiness.canExport && bestExportReady && strongerOrEqual(report, bestExportReady.report)) {
    return {
      label: "Export the current version",
      status: "approved",
      summary: `The current version is ready to export and is at least as strong as ${bestExportReady.blueprint.name}, the strongest approved generated option.`
    };
  }

  if (!bestExportReady) {
    return {
      label: "Keep repairing the current version",
      status: "blocked",
      summary:
        "The current version is still blocked, and none of the generated versions are ready to export yet."
    };
  }

  if (exportReadiness.canExport) {
    return {
      label: "Export now or switch to a stronger approved version",
      status: "approved",
      summary: `The current version is ready to export, but ${bestExportReady.blueprint.name} is still the strongest approved option in the ranked list.`
    };
  }

  return {
    label: "Use an approved version or keep repairing",
    status: "blocked",
    summary: `The current version is still blocked. ${bestExportReady.blueprint.name} is the best approved version if you need an exportable baseline now.`
  };
}

function summarizeRecommendationContext(
  bestOverall: GeneratedCandidate | null,
  bestExportReady: GeneratedCandidate
): string {
  if (!bestOverall || bestOverall.blueprint.id === bestExportReady.blueprint.id) {
    return " It also has the strongest score in the ranked list.";
  }

  return ` ${bestOverall.blueprint.name} still has the top score, but it is not ready to export.`;
}

export function summarizeCandidateRecommendation(
  report: CriticReport,
  exportReadiness: ExportReadiness,
  candidates: ReadonlyArray<GeneratedCandidate>
): CandidateRecommendation | null {
  const { bestExportReady, bestOverall } = summarizeCandidateLeads(candidates);

  if (!bestExportReady) {
    return null;
  }

  if (exportReadiness.canExport && strongerOrEqual(report, bestExportReady.report)) {
    return null;
  }

  if (!exportReadiness.canExport && strongerOrEqual(report, bestExportReady.report)) {
    return {
      actionLabel: "Use this version",
      candidate: bestExportReady,
      label: "Fastest approved path",
      status: "blocked",
      summary: `${bestExportReady.blueprint.name} is already approved for export. Use it if you need a clean baseline now while the current version stays blocked.${summarizeRecommendationContext(
        bestOverall,
        bestExportReady
      )}`
    };
  }

  if (!exportReadiness.canExport) {
    return {
      actionLabel: "Use this version",
      candidate: bestExportReady,
      label: "Recommended approved version",
      status: "blocked",
      summary: `${bestExportReady.blueprint.name} is the strongest version that already clears export. Use it to continue from an approved baseline while the current version remains blocked.${summarizeRecommendationContext(
        bestOverall,
        bestExportReady
      )}`
    };
  }

  return {
    actionLabel: "Use this version",
    candidate: bestExportReady,
    label: "Stronger approved version",
    status: "approved",
    summary: `${bestExportReady.blueprint.name} is currently the strongest approved version. Use it if you want the best ready-to-export option before exporting.${summarizeRecommendationContext(
      bestOverall,
      bestExportReady
    )}`
  };
}

function serializeCandidateSurface(
  project: PlaygroundProject,
  brief: ScreenBrief
): string {
  return [
    canonicalJSONStringify(project.tokens),
    canonicalJSONStringify(project.page),
    canonicalJSONStringify(project.constraints),
    canonicalJSONStringify(brief)
  ].join("\n");
}

function summarizeRelativeScore(scoreDelta: number): string {
  if (scoreDelta > 0) {
    return `${scoreDelta} points ahead`;
  }

  if (scoreDelta < 0) {
    return `${Math.abs(scoreDelta)} points behind`;
  }

  return "matching the score";
}

function summarizeRelativeFindings(findingDelta: number): string {
  if (findingDelta > 0) {
    return `${findingDelta} more finding${findingDelta === 1 ? "" : "s"}`;
  }

  if (findingDelta < 0) {
    const count = Math.abs(findingDelta);
    return `${count} fewer finding${count === 1 ? "" : "s"}`;
  }

  return "the same finding count";
}

function summarizeRelativeExportStatus(
  exportReadiness: ExportReadiness,
  baseline: GeneratedCandidate
): string {
  if (exportReadiness.canExport && !baseline.exportReadiness.canExport) {
    return "now clears export even though the baseline still does not.";
  }

  if (!exportReadiness.canExport && baseline.exportReadiness.canExport) {
    return "no longer clears export while the baseline still does.";
  }

  if (exportReadiness.canExport) {
    return "still clears export.";
  }

  return "still needs repair before export.";
}

function createActiveBlueprintComparison(
  report: CriticReport,
  exportReadiness: ExportReadiness,
  baseline: GeneratedCandidate
): ActiveBlueprintStatusSummary["comparison"] {
  return {
    exportStatus: {
      baseline: baseline.exportReadiness.status,
      current: exportReadiness.status
    },
    findingDelta: report.findings.length - baseline.report.findings.length,
    findings: {
      baseline: baseline.report.findings.length,
      current: report.findings.length
    },
    scoreDelta: report.score - baseline.report.score,
    scores: {
      baseline: baseline.report.score,
      current: report.score
    }
  };
}

export function summarizeActiveBlueprintStatus(
  activeBlueprintId: string | null,
  project: PlaygroundProject,
  brief: ScreenBrief,
  report: CriticReport,
  exportReadiness: ExportReadiness,
  candidates: ReadonlyArray<GeneratedCandidate>
): ActiveBlueprintStatusSummary | null {
  if (!activeBlueprintId) {
    return null;
  }

  const candidate = candidates.find(
    (entry) => entry.blueprint.id === activeBlueprintId
  );

  if (!candidate) {
    return null;
  }

  const matchesBaseline =
    serializeCandidateSurface(project, brief) ===
    serializeCandidateSurface(candidate.project, brief);
  const comparison = createActiveBlueprintComparison(
    report,
    exportReadiness,
    candidate
  );

  if (matchesBaseline) {
    if (candidate.exportReadiness.canExport) {
      return {
        comparison,
        canRestoreBaseline: false,
        candidate,
        label: "Current version still matches its blueprint",
        status: "approved",
        summary: `${candidate.blueprint.name} is the loaded blueprint, and the current version still matches it exactly.`
      };
    }

    return {
      comparison,
      canRestoreBaseline: false,
      candidate,
      label: "Current version still matches the blocked blueprint",
      status: "blocked",
      summary: `${candidate.blueprint.name} is the loaded blueprint, and the current version still matches it, but that baseline is still blocked for export.`
    };
  }

  const scoreDelta = report.score - candidate.report.score;
  const findingDelta = report.findings.length - candidate.report.findings.length;

  return {
    comparison,
    canRestoreBaseline: true,
    candidate,
    label: "Current version changed from its blueprint",
    status: exportReadiness.canExport ? "approved" : "blocked",
    summary: `The current editor state no longer matches ${candidate.blueprint.name}. Compared with that blueprint, it is ${summarizeRelativeScore(
      scoreDelta
    )}, has ${summarizeRelativeFindings(findingDelta)}, and ${summarizeRelativeExportStatus(
      exportReadiness,
      candidate
    )}`
  };
}

function summarizeScoreGap(scoreGap: number): string {
  if (scoreGap > 0) {
    return `${scoreGap} points behind`;
  }

  if (scoreGap < 0) {
    return `${Math.abs(scoreGap)} points ahead but still blocked`;
  }

  return "matching the score but still blocked";
}

function summarizeFindingGap(findingGap: number): string {
  if (findingGap > 0) {
    return `${findingGap} more finding${findingGap === 1 ? "" : "s"}`;
  }

  if (findingGap < 0) {
    return `${Math.abs(findingGap)} fewer findings`;
  }

  return "the same finding count";
}

export function summarizeBlockedCandidateGap(
  report: CriticReport,
  exportReadiness: ExportReadiness,
  candidates: ReadonlyArray<GeneratedCandidate>
): BlockedCandidateGapSummary | null {
  if (exportReadiness.canExport) {
    return null;
  }

  const bestExportReady =
    summarizeCandidateLeads(candidates).bestExportReady;

  if (!bestExportReady) {
    return null;
  }

  const scoreGap = bestExportReady.report.score - report.score;
  const findingGap = report.findings.length - bestExportReady.report.findings.length;

  return {
    bestExportReady,
    blockedReasons: [...exportReadiness.blockedReasons],
    findingGap,
    scoreGap,
    summary: `${bestExportReady.blueprint.name} is the best approved version right now at score ${
      bestExportReady.report.score
    } with ${bestExportReady.report.findings.length} findings. The current version is ${summarizeScoreGap(
      scoreGap
    )} and has ${summarizeFindingGap(findingGap)}.`
  };
}

export function summarizeBlockedCandidateGapProgress(
  beforeGap: BlockedCandidateGapSummary | null,
  afterGap: BlockedCandidateGapSummary | null
): BlockedCandidateGapProgress | null {
  if (!beforeGap) {
    return null;
  }

  if (!afterGap) {
    return {
      exportReadyNow: true,
      findingGapDelta: beforeGap.findingGap,
      improved: true,
      resolved: true,
      scoreGapDelta: beforeGap.scoreGap,
      summary: "Export-ready now. This repair cleared the blocker gap and removed the need for a repair target."
    };
  }

  const scoreGapDelta = beforeGap.scoreGap - afterGap.scoreGap;
  const findingGapDelta = beforeGap.findingGap - afterGap.findingGap;
  const improved = scoreGapDelta > 0 || findingGapDelta > 0;

  if (scoreGapDelta > 0 && findingGapDelta > 0) {
    return {
      exportReadyNow: false,
      findingGapDelta,
      improved: true,
      resolved: false,
      scoreGapDelta,
      summary: `This repair reduced both the score gap by ${scoreGapDelta} and the findings gap by ${findingGapDelta}.`
    };
  }

  if (scoreGapDelta > 0) {
    return {
      exportReadyNow: false,
      findingGapDelta,
      improved: true,
      resolved: false,
      scoreGapDelta,
      summary: `This repair reduced the score gap by ${scoreGapDelta}, but left the findings gap unchanged.`
    };
  }

  if (findingGapDelta > 0) {
    return {
      exportReadyNow: false,
      findingGapDelta,
      improved: true,
      resolved: false,
      scoreGapDelta,
      summary: `This repair reduced the findings gap by ${findingGapDelta}, but left the score gap unchanged.`
    };
  }

  return {
    exportReadyNow: false,
    findingGapDelta,
    improved,
    resolved: false,
    scoreGapDelta,
    summary: "This repair improved the candidate, but it did not reduce the current blocker gap."
  };
}
