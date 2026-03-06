import { describe, expect, it } from "bun:test";
import {
  canonicalProjectFixture,
  canonicalSettingsScreenBriefFixture,
  type CriticFinding,
  type PlaygroundProject,
  type SectionNode
} from "@bux/core-model";
import { evaluateSettingsScreen } from "@bux/critic-rules";
import {
  createRepairHistoryEntry,
  prepareFindingRepairState
} from "./critic-repair";

function makeProject(sections: SectionNode[]): PlaygroundProject {
  const project = structuredClone(canonicalProjectFixture);
  project.page.title = "Settings candidate";
  project.page.sections = sections;
  return project;
}

function settingsSection(
  id: string,
  variant: "grouped" | "flat",
  groups: string[],
  heading = "Workspace settings"
): SectionNode {
  return {
    id,
    type: "settings",
    variant,
    props: {
      groupCount: groups.length
    },
    slots: {
      heading,
      groups
    }
  };
}

function heroSection(): SectionNode {
  return {
    id: "sec-hero-001",
    type: "hero",
    variant: "split",
    props: {
      align: "start",
      ctaCount: 2,
      hasMedia: true
    },
    slots: {
      heading: "Polish your workspace",
      body: "Tune everything here."
    }
  };
}

describe("playground critic repair flow", () => {
  it("prepares an actionable repair and records the post-repair outcome", () => {
    const project = makeProject([
      heroSection(),
      settingsSection("sec-settings-001", "grouped", ["Profile", "Notifications"])
    ]);
    const report = evaluateSettingsScreen(project, canonicalSettingsScreenBriefFixture);
    const finding = report.findings[0];

    expect(finding?.suggestedFix).toBeDefined();

    const repair = prepareFindingRepairState(
      project,
      canonicalSettingsScreenBriefFixture,
      report,
      finding as CriticFinding
    );

    expect(repair.status).toBe("actionable");

    if (repair.status !== "actionable") {
      throw new Error("Expected actionable repair state.");
    }

    const historyEntry = createRepairHistoryEntry(repair, null);

    expect(repair.nextProject.page.sections[0]?.type).toBe("settings");
    expect(repair.nextReport.score).toBeGreaterThan(report.score);
    expect(historyEntry.beforeScore).toBe(report.score);
    expect(historyEntry.afterScore).toBe(repair.nextReport.score);
    expect(historyEntry.resolvedFindings).toBeGreaterThan(0);
    expect(historyEntry.afterFindingCount).toBeLessThan(historyEntry.beforeFindingCount);
  });

  it("marks findings without automated fixes as disabled", () => {
    const project = makeProject([
      settingsSection(
        "sec-settings-001",
        "flat",
        [
          "Profile",
          "Appearance & Notifications",
          "Security",
          "Billing",
          "Integrations",
          "Danger zone"
        ],
        "Profile"
      )
    ]);
    const brief = {
      ...canonicalSettingsScreenBriefFixture,
      density: "calm" as const
    };
    const report = evaluateSettingsScreen(project, brief);
    const finding = report.findings.find((entry) => !entry.suggestedFix);

    expect(finding).toBeDefined();

    const repair = prepareFindingRepairState(
      project,
      brief,
      report,
      finding as CriticFinding
    );

    expect(repair.status).toBe("disabled");
    expect(repair.label).toBe("No repair yet");
    expect(repair.helperText).toContain("No deterministic repair");
  });

  it("disables repairs that no longer change the current candidate", () => {
    const project = makeProject([
      settingsSection("sec-settings-001", "grouped", ["Profile", "Notifications"])
    ]);
    const report = evaluateSettingsScreen(project, canonicalSettingsScreenBriefFixture);
    const finding: CriticFinding = {
      code: "settings.synthetic_noop",
      severity: "low",
      message: "Synthetic finding for no-op repair coverage.",
      path: "/page/sections/0",
      suggestedFix: {
        id: "settings.synthetic_noop",
        label: "Keep section in place",
        description: "Reapply the current section order.",
        actions: [
          {
            type: "reorderSection",
            sectionId: "sec-settings-001",
            toIndex: 0
          }
        ]
      }
    };

    const repair = prepareFindingRepairState(
      project,
      canonicalSettingsScreenBriefFixture,
      report,
      finding
    );

    expect(repair.status).toBe("disabled");
    expect(repair.label).toBe("Keep section in place");
    expect(repair.helperText).toContain("no longer changes");
  });
});
