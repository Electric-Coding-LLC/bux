import {
  canonicalProjectFixture,
  canonicalSettingsScreenBriefFixture,
  type PlaygroundProject,
  type SectionNode
} from "@bux/core-model";
import { applyActions } from "@bux/core-engine";
import { describe, expect, it } from "bun:test";
import { evaluateSettingsScreen } from "./evaluate-settings-screen";

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

function tableSection(): SectionNode {
  return {
    id: "sec-table-001",
    type: "table",
    variant: "comfortable",
    props: {
      columns: 3
    },
    slots: {
      heading: "Settings matrix",
      headers: ["Setting", "Value", "Scope"],
      rows: [["Theme", "Dark", "Workspace"]]
    }
  };
}

describe("evaluateSettingsScreen", () => {
  it("passes a focused settings-only candidate", () => {
    const report = evaluateSettingsScreen(
      makeProject([
        settingsSection("sec-settings-001", "grouped", [
          "Profile",
          "Notifications",
          "Security"
        ])
      ]),
      canonicalSettingsScreenBriefFixture
    );

    expect(report.verdict).toBe("pass");
    expect(report.score).toBe(100);
    expect(report.findings).toHaveLength(0);
  });

  it("flags table misuse and weak focus when settings are displaced by other sections", () => {
    const report = evaluateSettingsScreen(
      makeProject([
        heroSection(),
        settingsSection("sec-settings-001", "grouped", ["Profile", "Notifications"]),
        tableSection()
      ]),
      canonicalSettingsScreenBriefFixture
    );

    expect(report.verdict).toBe("fail");
    expect(report.findings.map((finding) => finding.code)).toEqual([
      "settings.weak_primary_focus",
      "settings.table_misuse",
      "settings.variant_drift"
    ]);
    expect(report.findings[0]?.suggestedFix?.id).toBe("settings.move_primary_to_top");
    expect(report.findings[2]?.suggestedFix?.id).toBe("settings.remove_decorative_sections");
  });

  it("flags grouping and density problems for a noisy flat settings layout", () => {
    const brief = {
      ...canonicalSettingsScreenBriefFixture,
      density: "calm" as const
    };
    const report = evaluateSettingsScreen(
      makeProject([
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
      ]),
      brief
    );

    expect(report.verdict).toBe("fail");
    expect(report.findings.map((finding) => finding.code)).toEqual([
      "settings.density_mismatch",
      "settings.missing_semantic_grouping",
      "settings.missing_semantic_grouping",
      "settings.redundant_labels"
    ]);
    expect(report.findings[1]?.suggestedFix?.id).toBe("settings.group_flat_sec-settings-001");
    expect(report.findings[2]?.suggestedFix?.id).toBe(
      "settings.split_group_sec-settings-001_1"
    );
  });

  it("flags redundant surface nesting across multiple tiny grouped settings panels", () => {
    const report = evaluateSettingsScreen(
      makeProject([
        settingsSection("sec-settings-001", "grouped", ["Profile"]),
        settingsSection("sec-settings-002", "grouped", ["Notifications", "Alerts"]),
        settingsSection("sec-settings-003", "grouped", ["Billing"])
      ]),
      {
        ...canonicalSettingsScreenBriefFixture,
        density: "compact"
      }
    );

    expect(report.findings.map((finding) => finding.code)).toEqual([
      "settings.over_segmented_groups",
      "settings.density_mismatch",
      "settings.redundant_surface_nesting"
    ]);
    expect(report.findings[0]?.suggestedFix?.id).toBe("settings.merge_shallow_panels");
  });

  it("applies a suggested fix and improves the critic score", () => {
    const project = makeProject([
      heroSection(),
      settingsSection("sec-settings-001", "grouped", ["Profile", "Notifications"])
    ]);
    const firstReport = evaluateSettingsScreen(project, canonicalSettingsScreenBriefFixture);
    const suggestedFix = firstReport.findings[0]?.suggestedFix;

    expect(suggestedFix).toBeDefined();

    const repairedProject = applyActions(project, suggestedFix?.actions ?? []);
    const repairedReport = evaluateSettingsScreen(
      repairedProject,
      canonicalSettingsScreenBriefFixture
    );

    expect(repairedReport.score).toBeGreaterThan(firstReport.score);
    expect(repairedProject.page.sections[0]?.type).toBe("settings");
  });
});
