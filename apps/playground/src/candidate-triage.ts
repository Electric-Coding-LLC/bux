import type { CriticReport } from "@bux/core-model";
import type { GeneratedSettingsCandidate } from "./candidate-generation";
import type { ExportReadiness } from "./export-readiness";

export interface CandidateLeadSummary {
  bestExportReady: GeneratedSettingsCandidate | null;
  bestOverall: GeneratedSettingsCandidate | null;
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
