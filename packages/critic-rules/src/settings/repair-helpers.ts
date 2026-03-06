import type {
  CriticSuggestedFix,
  PlaygroundProject,
  SectionNode
} from "@bux/core-model";
import {
  normalizeLabel,
  settingsSections,
  stringGroups
} from "./helpers";

function uniqueGroups(groups: string[]): string[] {
  const seen = new Set<string>();

  return groups.filter((group) => {
    const normalized = normalizeLabel(group);
    if (normalized.length === 0 || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

function sectionGroupDescriptions(section: SectionNode): string[] {
  return Array.isArray(section.slots.groupDescriptions)
    ? section.slots.groupDescriptions.filter(
        (entry): entry is string => typeof entry === "string"
      )
    : [];
}

function splitCompoundLabel(label: string): string[] {
  return label
    .split(/,|\/| & | and /i)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function moveSettingsSectionToTopFix(
  sectionId: string
): CriticSuggestedFix {
  return {
    id: "settings.move_primary_to_top",
    label: "Move settings to the top",
    description: "Start the screen with the main settings block so the first read matches the task.",
    actions: [
      {
        type: "reorderSection",
        sectionId,
        toIndex: 0
      }
    ]
  };
}

export function mergeSettingsSectionsFix(
  project: PlaygroundProject
): CriticSuggestedFix | null {
  const settings = settingsSections(project);
  const [primary, ...rest] = settings;

  if (!primary || rest.length === 0) {
    return null;
  }

  const mergedGroups = uniqueGroups(
    settings.flatMap(({ section }) => stringGroups(section))
  );
  const mergedDescriptions = settings.flatMap(({ section }) =>
    sectionGroupDescriptions(section)
  );

  return {
    id: "settings.merge_shallow_panels",
    label: "Merge settings panels",
    description: "Collapse fragmented settings panels into one grouped section with clearer semantic grouping.",
    actions: [
      {
        type: "updateSection",
        sectionId: primary.section.id,
        changes: {
          variant: "grouped",
          props: {
            groupCount: mergedGroups.length
          },
          slots: {
            groupDescriptions: mergedDescriptions,
            groups: mergedGroups
          }
        }
      },
      ...rest.map(({ section }) => ({
        type: "removeSection" as const,
        sectionId: section.id
      }))
    ]
  };
}

export function removeDecorativeSectionsFix(
  project: PlaygroundProject
): CriticSuggestedFix | null {
  const decorativeSections = project.page.sections.filter(
    (section) => section.type === "hero" || section.type === "featureGrid"
  );

  if (decorativeSections.length === 0) {
    return null;
  }

  return {
    id: "settings.remove_decorative_sections",
    label: "Remove decorative sections",
    description: "Drop presentation-heavy companion sections so the screen stays focused on configuration work.",
    actions: decorativeSections.map((section) => ({
      type: "removeSection" as const,
      sectionId: section.id
    }))
  };
}

export function normalizeSettingsVariantsFix(
  project: PlaygroundProject
): CriticSuggestedFix | null {
  const settings = settingsSections(project);
  const groupedExists = settings.some(({ section }) => section.variant === "grouped");
  const targetVariant = groupedExists ? "grouped" : settings[0]?.section.variant;

  if (!targetVariant) {
    return null;
  }

  const mismatchedSections = settings.filter(
    ({ section }) => section.variant !== targetVariant
  );

  if (mismatchedSections.length === 0) {
    return null;
  }

  return {
    id: "settings.normalize_variants",
    label: "Normalize settings variants",
    description: "Use one settings variant across the screen so the hierarchy reads as one system.",
    actions: mismatchedSections.map(({ section }) => ({
      type: "updateSection" as const,
      sectionId: section.id,
      changes: {
        variant: targetVariant
      }
    }))
  };
}

export function switchFlatSectionToGroupedFix(
  section: SectionNode
): CriticSuggestedFix {
  const groups = stringGroups(section);

  return {
    id: `settings.group_flat_${section.id}`,
    label: "Restore grouped settings",
    description: "Switch this flat section to grouped so users can scan the semantic boundaries more easily.",
    actions: [
      {
        type: "updateSection",
        sectionId: section.id,
        changes: {
          variant: "grouped",
          props: {
            groupCount: groups.length
          }
        }
      }
    ]
  };
}

export function splitCompoundGroupFix(
  section: SectionNode,
  groupIndex: number
): CriticSuggestedFix | null {
  const groups = stringGroups(section);
  const group = groups[groupIndex];

  if (!group) {
    return null;
  }

  const splitGroups = splitCompoundLabel(group);
  if (splitGroups.length < 2) {
    return null;
  }

  const nextGroups = uniqueGroups([
    ...groups.slice(0, groupIndex),
    ...splitGroups,
    ...groups.slice(groupIndex + 1)
  ]);

  return {
    id: `settings.split_group_${section.id}_${groupIndex}`,
    label: "Split the mixed-topic group",
    description: "Break this combined label into separate groups so related controls are not bundled together.",
    actions: [
      {
        type: "updateSection",
        sectionId: section.id,
        changes: {
          variant: "grouped",
          props: {
            groupCount: nextGroups.length
          },
          slots: {
            groups: nextGroups
          }
        }
      }
    ]
  };
}
