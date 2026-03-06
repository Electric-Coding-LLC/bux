import type { CriticReport } from "@bux/core-model";
import type { GeneratedSettingsCandidate } from "./candidate-generation";
import type { ExportReadiness } from "./export-readiness";

export interface CandidateLeadSummary {
  bestExportReady: GeneratedSettingsCandidate | null;
  bestOverall: GeneratedSettingsCandidate | null;
}

export interface WorkbenchStandingSummary {
  label: string;
  status: "approved" | "blocked" | "neutral";
  summary: string;
}

export interface CandidateRecommendation {
  actionLabel: string;
  candidate: GeneratedSettingsCandidate;
  label: string;
  status: "approved" | "blocked";
  summary: string;
}

export interface BlockedCandidateGapSummary {
  bestExportReady: GeneratedSettingsCandidate;
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
  candidates: ReadonlyArray<GeneratedSettingsCandidate>
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
  candidates: ReadonlyArray<GeneratedSettingsCandidate>
): WorkbenchStandingSummary {
  const candidateLeads = summarizeCandidateLeads(candidates);
  const { bestExportReady, bestOverall } = candidateLeads;

  if (!bestOverall) {
    return {
      label: "No ranked field yet",
      status: exportReadiness.canExport ? "approved" : "neutral",
      summary: "The active workbench candidate is the only candidate in play right now."
    };
  }

  if (exportReadiness.canExport && !bestExportReady) {
    return {
      label: "Only export-ready option",
      status: "approved",
      summary:
        "The active workbench candidate currently clears export while every generated candidate still needs repair."
    };
  }

  if (exportReadiness.canExport && strongerOrEqual(report, bestOverall.report)) {
    return {
      label: "Strongest overall",
      status: "approved",
      summary: `The active workbench candidate now matches or beats ${bestOverall.blueprint.name} and is ready to export.`
    };
  }

  if (!exportReadiness.canExport && strongerOrEqual(report, bestOverall.report)) {
    const exportReferenceSummary = bestExportReady
      ? ` ${bestExportReady.blueprint.name} remains the current export-ready reference.`
      : "";

    return {
      label: "Highest score, still blocked",
      status: "blocked",
      summary: `The active workbench candidate currently matches or beats ${bestOverall.blueprint.name} on critic strength, but export remains blocked.${exportReferenceSummary}`
    };
  }

  if (exportReadiness.canExport && bestExportReady && strongerOrEqual(report, bestExportReady.report)) {
    return {
      label: "Strongest export-ready",
      status: "approved",
      summary: `The active workbench candidate is ready to export and now matches or beats ${bestExportReady.blueprint.name}, even though ${bestOverall.blueprint.name} still leads overall.`
    };
  }

  if (!bestExportReady) {
    return {
      label: "No export-ready reference yet",
      status: "blocked",
      summary:
        "The active workbench candidate is still blocked, and no generated candidate has cleared export yet."
    };
  }

  if (exportReadiness.canExport) {
    return {
      label: "Approved, chasing the field",
      status: "approved",
      summary: `The active workbench candidate is ready to export, but ${bestOverall.blueprint.name} still leads the ranked field overall.`
    };
  }

  return {
    label: "Blocked, chasing the field",
    status: "blocked",
    summary: `The active workbench candidate is still blocked and trails export-ready reference ${bestExportReady.blueprint.name}.`
  };
}

function summarizeRecommendationContext(
  bestOverall: GeneratedSettingsCandidate | null,
  bestExportReady: GeneratedSettingsCandidate
): string {
  if (!bestOverall || bestOverall.blueprint.id === bestExportReady.blueprint.id) {
    return " It also leads the ranked field overall.";
  }

  return ` ${bestOverall.blueprint.name} still leads overall, but remains blocked.`;
}

export function summarizeCandidateRecommendation(
  report: CriticReport,
  exportReadiness: ExportReadiness,
  candidates: ReadonlyArray<GeneratedSettingsCandidate>
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
      actionLabel: "Load export-ready reference",
      candidate: bestExportReady,
      label: "Export-ready fallback",
      status: "blocked",
      summary: `${bestExportReady.blueprint.name} is the strongest candidate that already clears export. Load it if you need an approved baseline now while the active candidate stays blocked.${summarizeRecommendationContext(
        bestOverall,
        bestExportReady
      )}`
    };
  }

  if (!exportReadiness.canExport) {
    return {
      actionLabel: "Load export-ready reference",
      candidate: bestExportReady,
      label: "Recommended export-ready candidate",
      status: "blocked",
      summary: `${bestExportReady.blueprint.name} is the strongest candidate that already clears export. Load it to continue from an approved baseline while the active candidate remains blocked.${summarizeRecommendationContext(
        bestOverall,
        bestExportReady
      )}`
    };
  }

  return {
    actionLabel: "Load stronger approved candidate",
    candidate: bestExportReady,
    label: "Stronger export-ready option",
    status: "approved",
    summary: `${bestExportReady.blueprint.name} is currently the strongest export-ready candidate. Load it if you want the best approved option before exporting.${summarizeRecommendationContext(
      bestOverall,
      bestExportReady
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
  candidates: ReadonlyArray<GeneratedSettingsCandidate>
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
    summary: `${bestExportReady.blueprint.name} is the current export-ready reference at score ${
      bestExportReady.report.score
    } with ${bestExportReady.report.findings.length} findings. Current candidate is ${summarizeScoreGap(
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
