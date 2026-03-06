import type { BlockedCandidateGapSummary } from "./candidate-triage";
import type { ActionableFindingRepairState, FindingRepairState } from "./critic-repair";

export interface PrioritizedRepair {
  closesGap: boolean;
  rationale: string;
  repair: ActionableFindingRepairState;
}

function comparePrioritizedRepairs(
  left: PrioritizedRepair,
  right: PrioritizedRepair
): number {
  if (left.repair.nextExportReadiness.canExport !== right.repair.nextExportReadiness.canExport) {
    return left.repair.nextExportReadiness.canExport ? -1 : 1;
  }

  if (left.closesGap !== right.closesGap) {
    return left.closesGap ? -1 : 1;
  }

  if (left.repair.projectedDelta !== right.repair.projectedDelta) {
    return right.repair.projectedDelta - left.repair.projectedDelta;
  }

  if (left.repair.resolvedFindings !== right.repair.resolvedFindings) {
    return right.repair.resolvedFindings - left.repair.resolvedFindings;
  }

  return left.repair.label.localeCompare(right.repair.label);
}

function buildRationale(
  repair: ActionableFindingRepairState,
  blockedCandidateGap: BlockedCandidateGapSummary
): { closesGap: boolean; rationale: string } {
  const nextScoreGap = blockedCandidateGap.bestExportReady.report.score - repair.nextReport.score;
  const nextFindingGap =
    repair.nextReport.findings.length -
    blockedCandidateGap.bestExportReady.report.findings.length;
  const closesScoreGap = nextScoreGap < blockedCandidateGap.scoreGap;
  const closesFindingGap = nextFindingGap < blockedCandidateGap.findingGap;
  const closesGap = closesScoreGap || closesFindingGap;

  if (repair.nextExportReadiness.canExport) {
    return {
      closesGap: true,
      rationale: "Clears the current export blocker in one repair."
    };
  }

  if (closesScoreGap && closesFindingGap) {
    return {
      closesGap,
      rationale: "Closes both the score gap and the remaining findings gap."
    };
  }

  if (closesScoreGap) {
    return {
      closesGap,
      rationale: "Closes the score gap fastest toward the export-ready reference."
    };
  }

  if (closesFindingGap) {
    return {
      closesGap,
      rationale: "Reduces the remaining findings gap toward the export-ready reference."
    };
  }

  return {
    closesGap: false,
    rationale: "Improves the candidate, but does not materially close the current reference gap."
  };
}

export function prioritizeBlockedCandidateRepairs(
  findingRepairs: ReadonlyArray<FindingRepairState>,
  blockedCandidateGap: BlockedCandidateGapSummary | null
): PrioritizedRepair[] {
  if (!blockedCandidateGap) {
    return [];
  }

  return findingRepairs
    .filter(
      (repair): repair is ActionableFindingRepairState => repair.status === "actionable"
    )
    .map((repair) => {
      const rationale = buildRationale(repair, blockedCandidateGap);

      return {
        closesGap: rationale.closesGap,
        rationale: rationale.rationale,
        repair
      };
    })
    .sort(comparePrioritizedRepairs);
}
