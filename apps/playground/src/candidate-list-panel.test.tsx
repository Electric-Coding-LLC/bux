import {
  canonicalProjectFixture,
  type CriticReport,
  type PlaygroundProject
} from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CandidateListPanel } from "./candidate-list-panel";
import { generateCandidates, type GeneratedCandidate, type GeneratedSettingsCandidate } from "./candidate-generation";
import type { WorkbenchStandingSummary } from "./candidate-triage";
import { createInitialBrief } from "./screen-workbench";
import { createInitialSettingsBrief } from "./settings-workbench";

function makeProject(title: string): PlaygroundProject {
  return {
    ...structuredClone(canonicalProjectFixture),
    page: {
      ...structuredClone(canonicalProjectFixture.page),
      title
    }
  };
}

function makeCandidate(
  blueprintId: string,
  score: number,
  canExport: boolean,
  options?: {
    findingCount?: number;
    project?: PlaygroundProject;
  }
): GeneratedSettingsCandidate {
  const findingCount = options?.findingCount ?? (canExport ? 0 : 1);

  return {
    brief: createInitialSettingsBrief(),
    blueprint: {
      id: blueprintId,
      name: blueprintId,
      description: `${blueprintId} description`,
      hierarchyIntent: `${blueprintId} intent`,
      screenType: "settings",
      densityEnvelope: ["comfortable"],
      ctaStrategy: "single-primary",
      allowedVariants: ["grouped"],
      antiPatternNotes: [],
      createPage: () => ({ schemaVersion: "1.0.0", title: blueprintId, sections: [] })
    },
    exportReadiness: {
      blockedReasons: canExport ? [] : ["Critic still blocked"],
      canExport,
      label: canExport ? "Approved for Export" : "Export Blocked",
      status: canExport ? "approved" : "blocked",
      summary: canExport ? "Ready to export." : "Still blocked."
    },
    project: options?.project ?? makeProject(blueprintId),
    report: {
      schemaVersion: "1.0.0",
      screenType: "settings",
      score,
      verdict: canExport ? "pass" : "warn",
      findings: Array.from({ length: findingCount }, (_, index) => ({
        code: `${blueprintId}.finding_${index + 1}`,
        severity: "medium" as const,
        message: `${blueprintId} finding ${index + 1}`,
        path: "/page/sections/0"
      })),
      summary: {
        totalRules: 12,
        triggeredRules: findingCount,
        severityCounts: {
          high: 0,
          low: 0,
          medium: findingCount
        }
      }
    } as CriticReport
  };
}

describe("CandidateListPanel", () => {
  it("renders task-oriented next-step copy and simplified candidate actions", () => {
    const activeProject = makeProject("Workspace settings");
    const approvedCandidate = makeCandidate("anchor-balance", 92, true, {
      project: activeProject
    });
    const blockedCandidate = makeCandidate("quiet-zones", 84, false);
    const alternateApprovedCandidate = makeCandidate("guided-rail", 88, true);
    const html = renderToStaticMarkup(
      <CandidateListPanel
        activeBlueprintId="anchor-balance"
        activeExportReadiness={approvedCandidate.exportReadiness}
        activeProject={activeProject}
        activeReport={approvedCandidate.report}
        brief={createInitialSettingsBrief()}
        candidates={[blockedCandidate, approvedCandidate, alternateApprovedCandidate]}
        onLoadCandidate={() => {}}
        workbenchStanding={{
          label: "Export the current version",
          status: "approved",
          summary: "The current version is ready to export and is at least as strong as anchor-balance."
        } satisfies WorkbenchStandingSummary}
      />
    );

    expect(html).toContain("Next step");
    expect(html).toContain("Export the current version");
    expect(html).toContain("Why these versions are ordered this way");
    expect(html).toContain("All generated versions");
    expect(html).toContain("Ready now");
    expect(html).toContain("Top score");
    expect(html).toContain("Use current version");
    expect(html).toContain("Open approved version");
  });

  it("renders the dashboard reference canon and per-candidate fit summaries", () => {
    const brief = {
      ...createInitialBrief("dashboard"),
      artDirection: "commandCenter" as const
    };
    const candidates = generateCandidates(
      structuredClone(canonicalProjectFixture),
      brief
    );
    const activeCandidate = candidates.find(
      (candidate) => candidate.blueprint.id === "ops-radar"
    ) as GeneratedCandidate;

    const html = renderToStaticMarkup(
      <CandidateListPanel
        activeBlueprintId={activeCandidate.blueprint.id}
        activeExportReadiness={activeCandidate.exportReadiness}
        activeProject={activeCandidate.project}
        activeReport={activeCandidate.report}
        brief={brief}
        candidates={candidates}
        onLoadCandidate={() => {}}
        workbenchStanding={{
          label: "Export the current version",
          status: "approved",
          summary: "The current version is ready to export and matches the strongest approved option."
        } satisfies WorkbenchStandingSummary}
      />
    );

    expect(html).toContain("Reference Canon");
    expect(html).toContain("Reference canon for sharper operator dashboards");
    expect(html).toContain("Control room pulse");
    expect(html).toContain("Visual review");
    expect(html).toContain("Live preview");
    expect(html).toContain("Ops Radar preview");
    expect(html).toContain("Strong reference fit");
    expect(html).toContain("Drifting from the reference canon");
  });
});
