import type { CriticFindingSeverity, CriticReport } from "@bux/core-model";
import type { ValidationIssue } from "@bux/exporter/browser";

export interface ExportReadiness {
  blockedReasons: string[];
  canExport: boolean;
  label: string;
  status: "approved" | "blocked";
  summary: string;
}

function formatSeveritySummary(
  severityCounts: Record<CriticFindingSeverity, number>
): string | null {
  const parts = (["high", "medium", "low"] as const)
    .map((severity) => {
      const count = severityCounts[severity];
      return count > 0 ? `${count} ${severity}` : null;
    })
    .filter((value) => value !== null);

  return parts.length > 0 ? parts.join(", ") : null;
}

function summarizeValidationIssues(issues: ReadonlyArray<ValidationIssue>): string {
  if (issues.length === 1) {
    return "1 export validation issue remains.";
  }

  return `${issues.length} export validation issues remain.`;
}

function summarizeCriticBlock(report: CriticReport): string {
  const severitySummary = formatSeveritySummary(report.summary.severityCounts);

  if (report.verdict === "warn") {
    return severitySummary
      ? `Critic verdict is warn with ${severitySummary} findings still unresolved.`
      : "Critic verdict is warn and the candidate has not cleared the current bar.";
  }

  return severitySummary
    ? `Critic verdict is fail with ${severitySummary} findings still unresolved.`
    : "Critic verdict is fail and the candidate has not cleared the current bar.";
}

export function evaluateExportReadiness(
  report: CriticReport,
  validationIssues: ReadonlyArray<ValidationIssue>
): ExportReadiness {
  const blockedReasons: string[] = [];

  if (report.verdict !== "pass") {
    blockedReasons.push(summarizeCriticBlock(report));
  }

  if (validationIssues.length > 0) {
    blockedReasons.push(summarizeValidationIssues(validationIssues));
  }

  if (blockedReasons.length === 0) {
    return {
      blockedReasons: [],
      canExport: true,
      label: "Approved for Export",
      status: "approved",
      summary: "Critic pass and export validation are both clear."
    };
  }

  return {
    blockedReasons,
    canExport: false,
    label: "Export Blocked",
    status: "blocked",
    summary: blockedReasons.join(" ")
  };
}
