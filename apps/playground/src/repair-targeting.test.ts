import { describe, expect, it } from "bun:test";
import type { CriticReport } from "@bux/core-model";
import type { BlockedCandidateGapSummary } from "./candidate-triage";
import type { ActionableFindingRepairState, FindingRepairState } from "./critic-repair";
import { prioritizeBlockedCandidateRepairs } from "./repair-targeting";

function makeActionableRepair(
  label: string,
  score: number,
  findingCount: number,
  canExport: boolean,
  projectedDelta: number,
  resolvedFindings: number
): ActionableFindingRepairState {
  return {
    beforeFindingCount: 3,
    beforeScore: 70,
    beforeVerdict: "fail",
    finding: {
      code: `finding.${label}`,
      severity: "medium",
      message: `${label} finding`,
      path: "/page/sections/0"
    },
    fix: {
      id: `fix.${label}`,
      label,
      description: `${label} description`,
      actions: []
    },
    helperText: `${label} helper`,
    label,
    nextExportReadiness: {
      blockedReasons: canExport ? [] : ["Still blocked"],
      canExport,
      label: canExport ? "Approved for Export" : "Export Blocked",
      status: canExport ? "approved" : "blocked",
      summary: canExport ? "Ready" : "Blocked"
    },
    nextProject: {} as never,
    nextReport: {
      schemaVersion: "1.0.0",
      screenType: "settings",
      score,
      verdict: canExport ? "pass" : "warn",
      findings: Array.from({ length: findingCount }, (_, index) => ({
        code: `remaining.${label}.${index}`,
        severity: "low" as const,
        message: `remaining ${index}`,
        path: "/page/sections/0"
      })),
      summary: {
        totalRules: 12,
        triggeredRules: findingCount,
        severityCounts: {
          high: 0,
          medium: canExport ? 0 : 1,
          low: Math.max(0, findingCount - (canExport ? 0 : 1))
        }
      }
    } as CriticReport,
    projectedDelta,
    resolvedFindings,
    status: "actionable"
  };
}

describe("prioritizeBlockedCandidateRepairs", () => {
  const blockedGap: BlockedCandidateGapSummary = {
    bestExportReady: {
      blueprint: {
        id: "best-ready",
        name: "Best Ready",
        description: "",
        hierarchyIntent: "",
        densityEnvelope: ["comfortable"],
        ctaStrategy: "single-primary",
        allowedVariants: ["grouped"],
        antiPatternNotes: [],
        createPage: () => ({ schemaVersion: "1.0.0", title: "", sections: [] })
      },
      exportReadiness: {
        blockedReasons: [],
        canExport: true,
        label: "Approved for Export",
        status: "approved",
        summary: "Ready"
      },
      project: {} as never,
      report: {
        schemaVersion: "1.0.0",
        screenType: "settings",
        score: 90,
        verdict: "pass",
        findings: [],
        summary: {
          totalRules: 12,
          triggeredRules: 0,
          severityCounts: {
            high: 0,
            medium: 0,
            low: 0
          }
        }
      }
    },
    blockedReasons: ["Critic verdict is fail."],
    findingGap: 3,
    scoreGap: 20,
    summary: "Gap summary"
  };

  it("puts export-clearing repairs first", () => {
    const prioritized = prioritizeBlockedCandidateRepairs(
      [
        makeActionableRepair("Helpful", 82, 2, false, 12, 1),
        makeActionableRepair("Clear blocker", 91, 0, true, 21, 3)
      ],
      blockedGap
    );

    expect(prioritized[0]?.repair.label).toBe("Clear blocker");
    expect(prioritized[0]?.rationale).toContain("Clears the current export blocker");
  });

  it("prefers repairs that close the reference gap faster", () => {
    const prioritized = prioritizeBlockedCandidateRepairs(
      [
        makeActionableRepair("Small gain", 74, 3, false, 4, 0),
        makeActionableRepair("Big gain", 84, 1, false, 14, 2)
      ],
      blockedGap
    );

    expect(prioritized[0]?.repair.label).toBe("Big gain");
    expect(prioritized[0]?.closesGap).toBe(true);
    expect(prioritized[0]?.rationale).toContain("score gap");
  });

  it("returns no priorities when the active candidate is not blocked against a reference", () => {
    const repairs: FindingRepairState[] = [
      makeActionableRepair("Big gain", 84, 1, false, 14, 2)
    ];

    expect(prioritizeBlockedCandidateRepairs(repairs, null)).toEqual([]);
  });
});
