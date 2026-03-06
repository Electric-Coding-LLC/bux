import {
  canonicalProjectFixture,
  canonicalSettingsScreenBriefFixture,
  type PlaygroundProject,
  type SectionNode
} from "@bux/core-model";
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
  });
});
