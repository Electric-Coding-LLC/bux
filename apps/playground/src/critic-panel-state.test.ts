import { describe, expect, it } from "bun:test";
import type { CriticReport } from "@bux/core-model";
import type { RepairHistoryEntry } from "./critic-repair";
import { shouldShowApprovalState } from "./critic-panel-state";

function makeReport(verdict: CriticReport["verdict"]): CriticReport {
  return {
    schemaVersion: "1.0.0",
    screenType: "settings",
    score: verdict === "pass" ? 100 : 80,
    verdict,
    findings: verdict === "pass" ? [] : [{
      code: "settings.test",
      severity: "medium",
      message: "test",
      path: "/page/sections/0"
    }],
    summary: {
      totalRules: 12,
      triggeredRules: verdict === "pass" ? 0 : 1,
      severityCounts: {
        high: 0,
        medium: verdict === "pass" ? 0 : 1,
        low: 0
      }
    }
  };
}

function makeRepairHistoryEntry(exportReadyNow: boolean): RepairHistoryEntry {
  return {
    afterFindingCount: exportReadyNow ? 0 : 1,
    afterScore: exportReadyNow ? 100 : 82,
    afterVerdict: exportReadyNow ? "pass" : "warn",
    beforeFindingCount: 2,
    beforeScore: 74,
    beforeVerdict: "fail",
    delta: exportReadyNow ? 26 : 8,
    findingCode: "settings.test",
    findingPath: "/page/sections/0",
    fixId: "settings.test_fix",
    gapProgress: {
      exportReadyNow,
      findingGapDelta: exportReadyNow ? 2 : 1,
      improved: true,
      resolved: exportReadyNow,
      scoreGapDelta: exportReadyNow ? 20 : 6,
      summary: exportReadyNow ? "Export-ready now." : "Gap reduced."
    },
    label: "Test repair",
    resolvedFindings: exportReadyNow ? 2 : 1
  };
}

describe("shouldShowApprovalState", () => {
  it("returns true when the latest repair made the candidate export-ready", () => {
    expect(
      shouldShowApprovalState({
        blockedCandidateGap: null,
        prioritizedRepairCount: 0,
        repairHistory: [makeRepairHistoryEntry(true)],
        report: makeReport("pass")
      })
    ).toBe(true);
  });

  it("returns false when blocker-specific guidance is still present", () => {
    expect(
      shouldShowApprovalState({
        blockedCandidateGap: {
          bestExportReady: {} as never,
          blockedReasons: ["Blocked"],
          findingGap: 1,
          scoreGap: 4,
          summary: "Blocked"
        },
        prioritizedRepairCount: 1,
        repairHistory: [makeRepairHistoryEntry(true)],
        report: makeReport("pass")
      })
    ).toBe(false);
  });

  it("returns false when the current pass state did not come from a repair completion", () => {
    expect(
      shouldShowApprovalState({
        blockedCandidateGap: null,
        prioritizedRepairCount: 0,
        repairHistory: [],
        report: makeReport("pass")
      })
    ).toBe(false);
  });
});
