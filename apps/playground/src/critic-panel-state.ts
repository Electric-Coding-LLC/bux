import type { CriticReport } from "@bux/core-model";
import type { RepairHistoryEntry } from "./critic-repair";
import type { BlockedCandidateGapSummary } from "./candidate-triage";

export interface CriticPanelApprovalStateOptions {
  blockedCandidateGap: BlockedCandidateGapSummary | null;
  prioritizedRepairCount: number;
  repairHistory: ReadonlyArray<RepairHistoryEntry>;
  report: CriticReport;
}

export function shouldShowApprovalState({
  blockedCandidateGap,
  prioritizedRepairCount,
  repairHistory,
  report
}: CriticPanelApprovalStateOptions): boolean {
  const latestRepair = repairHistory[0] ?? null;

  return (
    blockedCandidateGap === null &&
    prioritizedRepairCount === 0 &&
    report.verdict === "pass" &&
    latestRepair?.gapProgress?.exportReadyNow === true
  );
}
