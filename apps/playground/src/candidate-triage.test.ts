import { describe, expect, it } from "bun:test";
import type { CriticReport, PlaygroundProject } from "@bux/core-model";
import type { GeneratedSettingsCandidate } from "./candidate-generation";
import {
  summarizeBlockedCandidateGap,
  summarizeBlockedCandidateGapProgress,
  summarizeCandidateLeads,
  summarizeWorkbenchStanding
} from "./candidate-triage";

function makeCandidate(
  blueprintId: string,
  score: number,
  canExport: boolean
): GeneratedSettingsCandidate {
  return {
    blueprint: {
      id: blueprintId,
      name: blueprintId,
      description: `${blueprintId} description`,
      hierarchyIntent: `${blueprintId} intent`,
      densityEnvelope: ["comfortable"],
      ctaStrategy: "single-primary",
      allowedVariants: ["grouped"],
      antiPatternNotes: [],
      createPage: () => ({ schemaVersion: "1.0.0", title: blueprintId, sections: [] })
    },
    exportReadiness: {
      blockedReasons: canExport ? [] : ["Blocked"],
      canExport,
      label: canExport ? "Approved for Export" : "Export Blocked",
      status: canExport ? "approved" : "blocked",
      summary: canExport ? "Ready" : "Blocked"
    },
    project: {} as PlaygroundProject,
    report: {
      schemaVersion: "1.0.0",
      screenType: "settings",
      score,
      verdict: canExport ? "pass" : "warn",
      findings: [],
      summary: {
        totalRules: 12,
        triggeredRules: canExport ? 0 : 1,
        severityCounts: {
          high: 0,
          low: 0,
          medium: canExport ? 0 : 1
        }
      }
    } as CriticReport
  };
}

describe("summarizeCandidateLeads", () => {
  it("returns the first ranked candidate as best overall", () => {
    const candidates = [
      makeCandidate("top-blocked", 94, false),
      makeCandidate("runner-up", 90, true)
    ];

    const summary = summarizeCandidateLeads(candidates);

    expect(summary.bestOverall?.blueprint.id).toBe("top-blocked");
  });

  it("returns the first exportable candidate as best export-ready", () => {
    const candidates = [
      makeCandidate("top-blocked", 94, false),
      makeCandidate("best-ready", 90, true),
      makeCandidate("later-ready", 88, true)
    ];

    const summary = summarizeCandidateLeads(candidates);

    expect(summary.bestExportReady?.blueprint.id).toBe("best-ready");
  });

  it("returns null for best export-ready when every ranked candidate is blocked", () => {
    const summary = summarizeCandidateLeads([
      makeCandidate("blocked-one", 80, false),
      makeCandidate("blocked-two", 74, false)
    ]);

    expect(summary.bestOverall?.blueprint.id).toBe("blocked-one");
    expect(summary.bestExportReady).toBeNull();
  });

  it("summarizes the gap from a blocked active candidate to the best export-ready reference", () => {
    const blockedCandidate = makeCandidate("blocked-one", 80, false);
    const summary = summarizeBlockedCandidateGap(
      blockedCandidate.report,
      blockedCandidate.exportReadiness,
      [
        blockedCandidate,
        makeCandidate("best-ready", 94, true),
        makeCandidate("later-ready", 90, true)
      ]
    );

    expect(summary?.bestExportReady.blueprint.id).toBe("best-ready");
    expect(summary?.scoreGap).toBe(14);
    expect(summary?.findingGap).toBe(0);
    expect(summary?.summary).toContain("best-ready is the current export-ready reference");
  });

  it("returns null when the active candidate is already export-ready", () => {
    const readyCandidate = makeCandidate("best-ready", 94, true);

    const summary = summarizeBlockedCandidateGap(
      readyCandidate.report,
      readyCandidate.exportReadiness,
      [readyCandidate]
    );

    expect(summary).toBeNull();
  });

  it("returns null when no export-ready reference exists", () => {
    const blockedCandidate = makeCandidate("blocked-one", 80, false);

    const summary = summarizeBlockedCandidateGap(
      blockedCandidate.report,
      blockedCandidate.exportReadiness,
      [
        blockedCandidate,
        makeCandidate("blocked-two", 74, false)
      ]
    );

    expect(summary).toBeNull();
  });

  it("summarizes when a repair fully clears the blocker gap", () => {
    const beforeGap = summarizeBlockedCandidateGap(
      makeCandidate("blocked-one", 80, false).report,
      makeCandidate("blocked-one", 80, false).exportReadiness,
      [
        makeCandidate("blocked-one", 80, false),
        makeCandidate("best-ready", 94, true)
      ]
    );

    const progress = summarizeBlockedCandidateGapProgress(beforeGap, null);

    expect(progress?.resolved).toBe(true);
    expect(progress?.improved).toBe(true);
    expect(progress?.exportReadyNow).toBe(true);
    expect(progress?.summary).toContain("Export-ready now");
  });

  it("summarizes when a repair narrows but does not eliminate the blocker gap", () => {
    const beforeGap = {
      bestExportReady: makeCandidate("best-ready", 94, true),
      blockedReasons: ["Blocked"],
      findingGap: 3,
      scoreGap: 20,
      summary: "Before"
    };
    const afterGap = {
      bestExportReady: makeCandidate("best-ready", 94, true),
      blockedReasons: ["Blocked"],
      findingGap: 1,
      scoreGap: 10,
      summary: "After"
    };

    const progress = summarizeBlockedCandidateGapProgress(beforeGap, afterGap);

    expect(progress?.resolved).toBe(false);
    expect(progress?.improved).toBe(true);
    expect(progress?.exportReadyNow).toBe(false);
    expect(progress?.scoreGapDelta).toBe(10);
    expect(progress?.findingGapDelta).toBe(2);
    expect(progress?.summary).toContain("reduced both the score gap");
  });

  it("summarizes when a repair does not reduce the blocker gap", () => {
    const beforeGap = {
      bestExportReady: makeCandidate("best-ready", 94, true),
      blockedReasons: ["Blocked"],
      findingGap: 2,
      scoreGap: 10,
      summary: "Before"
    };
    const afterGap = {
      bestExportReady: makeCandidate("best-ready", 94, true),
      blockedReasons: ["Blocked"],
      findingGap: 2,
      scoreGap: 10,
      summary: "After"
    };

    const progress = summarizeBlockedCandidateGapProgress(beforeGap, afterGap);

    expect(progress?.improved).toBe(false);
    expect(progress?.resolved).toBe(false);
    expect(progress?.exportReadyNow).toBe(false);
    expect(progress?.summary).toContain("did not reduce");
  });
});

describe("summarizeWorkbenchStanding", () => {
  it("marks the active candidate as strongest overall when it is export-ready and ahead", () => {
    const standing = summarizeWorkbenchStanding(
      makeCandidate("active", 96, true).report,
      makeCandidate("active", 96, true).exportReadiness,
      [
        makeCandidate("top-blocked", 94, false),
        makeCandidate("best-ready", 90, true)
      ]
    );

    expect(standing.label).toBe("Strongest overall");
    expect(standing.status).toBe("approved");
    expect(standing.summary).toContain("matches or beats top-blocked");
  });

  it("marks the active candidate as highest score when it still cannot export", () => {
    const standing = summarizeWorkbenchStanding(
      makeCandidate("active", 96, false).report,
      makeCandidate("active", 96, false).exportReadiness,
      [
        makeCandidate("top-blocked", 94, false),
        makeCandidate("best-ready", 90, true)
      ]
    );

    expect(standing.label).toBe("Highest score, still blocked");
    expect(standing.status).toBe("blocked");
    expect(standing.summary).toContain("export remains blocked");
    expect(standing.summary).toContain("best-ready remains the current export-ready reference");
  });

  it("marks the active candidate as strongest export-ready when a blocked candidate still leads overall", () => {
    const standing = summarizeWorkbenchStanding(
      makeCandidate("active", 88, true).report,
      makeCandidate("active", 88, true).exportReadiness,
      [
        makeCandidate("top-blocked", 94, false),
        makeCandidate("best-ready", 86, true)
      ]
    );

    expect(standing.label).toBe("Strongest export-ready");
    expect(standing.status).toBe("approved");
    expect(standing.summary).toContain("matches or beats best-ready");
    expect(standing.summary).toContain("top-blocked still leads overall");
  });

  it("reports when no generated candidate has cleared export yet", () => {
    const standing = summarizeWorkbenchStanding(
      makeCandidate("active", 84, false).report,
      makeCandidate("active", 84, false).exportReadiness,
      [
        makeCandidate("blocked-one", 90, false),
        makeCandidate("blocked-two", 86, false)
      ]
    );

    expect(standing.label).toBe("No export-ready reference yet");
    expect(standing.status).toBe("blocked");
    expect(standing.summary).toContain("no generated candidate has cleared export yet");
  });
});
