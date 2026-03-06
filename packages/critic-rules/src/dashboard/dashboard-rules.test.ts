import {
  canonicalDashboardScreenBriefFixture,
  canonicalProjectFixture,
  type PlaygroundProject,
  type SectionNode
} from "@bux/core-model";
import { applyActions } from "@bux/core-engine";
import { describe, expect, it } from "bun:test";
import { evaluateDashboardScreen } from "./evaluate-dashboard-screen";

function makeProject(sections: SectionNode[]): PlaygroundProject {
  const project = structuredClone(canonicalProjectFixture);
  project.page.title = "Team operations pulse";
  project.page.sections = sections;
  return project;
}

function featureGridSection(): SectionNode {
  return {
    id: "sec-feature-grid-001",
    type: "featureGrid",
    variant: "cards",
    props: {
      columns: 3,
      showIcons: true
    },
    slots: {
      heading: "Current pulse",
      items: [
        { title: "Blocked exports", body: "3 candidates are still blocked." },
        { title: "Repair backlog", body: "5 fixes are immediately actionable." },
        { title: "Approvals now", body: "11 bundles are ready to ship." }
      ]
    }
  };
}

function listSection(): SectionNode {
  return {
    id: "sec-list-001",
    type: "list",
    variant: "simple",
    props: {},
    slots: {
      heading: "Next checks",
      items: [
        "Review the onboarding baseline recommendation.",
        "Watch the enterprise settings blocker.",
        "Confirm the next snapshot export."
      ]
    }
  };
}

function tableSection(): SectionNode {
  return {
    id: "sec-table-001",
    type: "table",
    variant: "comfortable",
    props: {
      columns: 4
    },
    slots: {
      heading: "Repair queue",
      headers: ["Candidate", "Issue", "Owner", "Next action"],
      rows: [
        ["Workspace settings", "Variant drift", "Mina", "Normalize variants"],
        ["Welcome flow", "Missing intro", "Luis", "Move intro to top"]
      ]
    }
  };
}

function formSection(): SectionNode {
  return {
    id: "sec-form-001",
    type: "form",
    variant: "stacked",
    props: {
      layout: "stacked"
    },
    slots: {
      heading: "Start setup",
      fields: ["Email", "Workspace"],
      submitLabel: "Continue"
    }
  };
}

function heroSection(ctaCount = 2): SectionNode {
  return {
    id: "sec-hero-001",
    type: "hero",
    variant: "split",
    props: {
      align: "start",
      ctaCount,
      hasMedia: false
    },
    slots: {
      eyebrow: "Operations banner",
      heading: "Team operations pulse",
      body: "A short banner above the dashboard.",
      primaryCta: "Review blockers",
      secondaryCta: "Open queue"
    }
  };
}

describe("evaluateDashboardScreen", () => {
  it("passes a dashboard with a clear summary band and one operational surface", () => {
    const report = evaluateDashboardScreen(
      makeProject([featureGridSection(), tableSection()]),
      {
        ...canonicalDashboardScreenBriefFixture,
        density: "focused"
      }
    );

    expect(report.verdict).toBe("pass");
    expect(report.score).toBe(100);
    expect(report.findings).toHaveLength(0);
  });

  it("flags a buried summary band and off-task form drift", () => {
    const report = evaluateDashboardScreen(
      makeProject([tableSection(), featureGridSection(), formSection()]),
      canonicalDashboardScreenBriefFixture
    );

    expect(report.verdict).toBe("fail");
    expect(report.findings.map((finding) => finding.code)).toEqual([
      "dashboard.missing_summary_band",
      "dashboard.presentation_drift"
    ]);
    expect(report.findings[0]?.suggestedFix?.id).toBe("dashboard.move_summary_to_top");
    expect(report.findings[1]?.suggestedFix?.id).toBe("dashboard.remove_drift_sections");
  });

  it("flags focused density sprawl and competing banner CTAs", () => {
    const report = evaluateDashboardScreen(
      makeProject([featureGridSection(), heroSection(2), tableSection(), listSection()]),
      {
        ...canonicalDashboardScreenBriefFixture,
        density: "focused"
      }
    );

    expect(report.findings.map((finding) => finding.code)).toEqual([
      "dashboard.density_mismatch",
      "dashboard.competing_dashboard_ctas"
    ]);
    expect(report.findings[0]?.suggestedFix?.id).toBe("dashboard.trim_surface_stack");
    expect(report.findings[1]?.suggestedFix?.id).toBe(
      "dashboard.simplify_ctas_sec-hero-001"
    );
  });

  it("applies the summary reorder fix and improves the critic score", () => {
    const project = makeProject([tableSection(), featureGridSection(), listSection()]);
    const firstReport = evaluateDashboardScreen(
      project,
      canonicalDashboardScreenBriefFixture
    );
    const suggestedFix = firstReport.findings[0]?.suggestedFix;

    expect(suggestedFix).toBeDefined();

    const repairedProject = applyActions(project, suggestedFix?.actions ?? []);
    const repairedReport = evaluateDashboardScreen(
      repairedProject,
      canonicalDashboardScreenBriefFixture
    );

    expect(repairedReport.score).toBeGreaterThan(firstReport.score);
    expect(repairedProject.page.sections[0]?.type).toBe("featureGrid");
  });
});
