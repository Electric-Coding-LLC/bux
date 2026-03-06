import type { CriticRule, CriticRuleFinding } from "@bux/critic-core";
import type { SettingsScreenBrief } from "@bux/core-model";
import {
  hasCompoundGroupLabel,
  headingText,
  nonSettingsSections,
  normalizeLabel,
  sectionPath,
  settingsSections,
  stringGroups
} from "./helpers";

const tableMisuseRule: CriticRule<SettingsScreenBrief> = {
  code: "settings.table_misuse",
  screenType: "settings",
  evaluate: ({ project }) =>
    project.page.sections.flatMap((section, index) =>
      section.type === "table"
        ? [
            {
              severity: "high" as const,
              message:
                "Settings content is using a table section. Use grouped controls instead of grid rows.",
              path: sectionPath(index)
            }
          ]
        : []
    )
};

const weakPrimaryFocusRule: CriticRule<SettingsScreenBrief> = {
  code: "settings.weak_primary_focus",
  screenType: "settings",
  evaluate: ({ project }) => {
    const settings = settingsSections(project);
    const firstSection = project.page.sections[0];
    const nonSettings = nonSettingsSections(project);

    if (settings.length === 0) {
      return [
        {
          severity: "high",
          message: "Candidate has no settings section, so the screen never establishes a settings-focused anchor.",
          path: "/page/sections"
        }
      ];
    }

    if (firstSection?.type !== "settings") {
      return [
        {
          severity: "high",
          message: `Settings screens should open with settings content, not a ${firstSection?.type ?? "non-settings"} section.`,
          path: "/page/sections/0"
        }
      ];
    }

    if (nonSettings.length > 1 || project.page.sections.length > 3) {
      return [
        {
          severity: "medium",
          message:
            "Too many peer regions compete with the main settings block, so the screen loses a clear first read.",
          path: "/page/sections"
        }
      ];
    }

    return [];
  }
};

const overSegmentedGroupsRule: CriticRule<SettingsScreenBrief> = {
  code: "settings.over_segmented_groups",
  screenType: "settings",
  evaluate: ({ project }) => {
    const findings: CriticRuleFinding[] = settingsSections(project).flatMap(({ section, index }) => {
      const groups = stringGroups(section);

      if (groups.length > 6) {
        return [
          {
            severity: "medium" as const,
            message:
              "This settings section is split into too many shallow groups, which adds scanning overhead.",
            path: sectionPath(index, "/slots/groups")
          }
        ];
      }

      return [];
    });
    const shallowSectionCount = settingsSections(project).filter(
      ({ section }) => stringGroups(section).length <= 2
    ).length;

    if (settingsSections(project).length >= 3 && shallowSectionCount >= 2) {
      findings.push({
        severity: "high",
        message:
          "Multiple tiny settings panels suggest the screen has been fragmented into one-purpose groups.",
        path: "/page/sections"
      });
    }

    return findings;
  }
};

const densityMismatchRule: CriticRule<SettingsScreenBrief> = {
  code: "settings.density_mismatch",
  screenType: "settings",
  evaluate: ({ brief, project }) => {
    const settings = settingsSections(project);
    const nonSettings = nonSettingsSections(project);
    const totalGroups = settings.reduce(
      (sum, entry) => sum + stringGroups(entry.section).length,
      0
    );
    const hasGroupedSettings = settings.some(({ section }) => section.variant === "grouped");

    if (brief.density === "compact" && (hasGroupedSettings || project.page.sections.length > 2)) {
      return [
        {
          severity: "medium",
          message:
            "The brief asks for a compact settings screen, but the current structure uses roomy grouped panels or too many top-level regions.",
          path: "/page/sections"
        }
      ];
    }

    if (brief.density === "calm" && (totalGroups >= 6 || nonSettings.length > 0)) {
      return [
        {
          severity: "medium",
          message:
            "The brief asks for a calm screen, but the current layout reads as dense or visually busy.",
          path: "/page/sections"
        }
      ];
    }

    return [];
  }
};

const variantDriftRule: CriticRule<SettingsScreenBrief> = {
  code: "settings.variant_drift",
  screenType: "settings",
  evaluate: ({ project }) => {
    const settings = settingsSections(project);
    const variantCount = new Set(settings.map(({ section }) => section.variant)).size;
    const decorativeTypes = project.page.sections.filter(
      (section) => section.type === "hero" || section.type === "featureGrid"
    );
    const findings: CriticRuleFinding[] = [];

    if (variantCount > 1) {
      findings.push({
        severity: "medium" as const,
        message:
          "The settings screen mixes multiple settings variants, which weakens a coherent hierarchy.",
        path: "/page/sections"
      });
    }

    if (decorativeTypes.length > 0) {
      findings.push({
        severity: "medium" as const,
        message:
          "Presentation-heavy sections are fighting the settings flow instead of supporting a focused configuration screen.",
        path: "/page/sections"
      });
    }

    return findings;
  }
};

const redundantLabelsRule: CriticRule<SettingsScreenBrief> = {
  code: "settings.redundant_labels",
  screenType: "settings",
  evaluate: ({ project }) =>
    settingsSections(project).flatMap(({ section, index }) => {
      const findings: CriticRuleFinding[] = [];
      const groups = stringGroups(section);
      const normalizedHeading = normalizeLabel(headingText(section));

      if (normalizedHeading.length > 0) {
        const duplicateHeadingIndex = groups.findIndex(
          (group) => normalizeLabel(group) === normalizedHeading
        );

        if (duplicateHeadingIndex >= 0) {
          findings.push({
            severity: "low" as const,
            message: "The section heading repeats one of the group labels instead of adding new hierarchy.",
            path: sectionPath(index, `/slots/groups/${duplicateHeadingIndex}`)
          });
        }
      }

      const seen = new Set<string>();
      groups.forEach((group, groupIndex) => {
        const normalized = normalizeLabel(group);
        if (normalized.length === 0 || !seen.has(normalized)) {
          seen.add(normalized);
          return;
        }

        findings.push({
          severity: "low" as const,
          message: "Repeated group labels make the settings structure feel redundant.",
          path: sectionPath(index, `/slots/groups/${groupIndex}`)
        });
      });

      return findings;
    })
};

const missingSemanticGroupingRule: CriticRule<SettingsScreenBrief> = {
  code: "settings.missing_semantic_grouping",
  screenType: "settings",
  evaluate: ({ project }) =>
    settingsSections(project).flatMap(({ section, index }) => {
      const findings: CriticRuleFinding[] = [];
      const groups = stringGroups(section);

      if (section.variant === "flat" && groups.length >= 4) {
        findings.push({
          severity: "medium" as const,
          message:
            "A flat settings variant with this many groups hides the semantic boundaries users need.",
          path: sectionPath(index)
        });
      }

      groups.forEach((group, groupIndex) => {
        if (!hasCompoundGroupLabel(group)) {
          return;
        }

        findings.push({
          severity: "medium" as const,
          message:
            "This group label bundles multiple topics together, which suggests related controls are not cleanly separated.",
          path: sectionPath(index, `/slots/groups/${groupIndex}`)
        });
      });

      return findings;
    })
};

const redundantSurfaceNestingRule: CriticRule<SettingsScreenBrief> = {
  code: "settings.redundant_surface_nesting",
  screenType: "settings",
  evaluate: ({ project }) => {
    const groupedSettings = settingsSections(project).filter(
      ({ section }) => section.variant === "grouped"
    );

    if (
      groupedSettings.length >= 2 &&
      groupedSettings.every(({ section }) => stringGroups(section).length <= 2)
    ) {
      return [
        {
          severity: "medium",
          message:
            "Stacking multiple small grouped settings panels creates extra surface chrome without adding meaningful structure.",
          path: "/page/sections"
        }
      ];
    }

    return [];
  }
};

export const settingsCriticRules: ReadonlyArray<CriticRule<SettingsScreenBrief>> = [
  tableMisuseRule,
  weakPrimaryFocusRule,
  overSegmentedGroupsRule,
  densityMismatchRule,
  variantDriftRule,
  redundantLabelsRule,
  missingSemanticGroupingRule,
  redundantSurfaceNestingRule
];
