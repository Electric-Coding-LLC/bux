import {
  CURRENT_SCHEMA_VERSION,
  type PageDocument,
  type SectionNode,
  type SettingsScreenBrief
} from "@bux/core-model";
import type { SettingsBlueprint } from "../types";

function settingsSection(
  id: string,
  options: {
    actionLabel?: string;
    actionTone?: "neutral" | "accent";
    description?: string;
    emphasizedIndex?: number;
    groupDescriptions?: string[];
    groupCount: number;
    groups: string[];
    heading: string;
    layoutStyle:
      | "balanced"
      | "spotlight"
      | "rail"
      | "dense"
      | "calm";
    note?: string;
    railItems?: string[];
    railTitle?: string;
    variant: "grouped" | "flat";
  }
): SectionNode {
  const slots: SectionNode["slots"] = {
    groups: options.groups,
    heading: options.heading
  };

  if (options.actionLabel !== undefined) {
    slots.actionLabel = options.actionLabel;
  }

  if (options.description !== undefined) {
    slots.description = options.description;
  }

  if (options.groupDescriptions !== undefined) {
    slots.groupDescriptions = options.groupDescriptions;
  }

  if (options.note !== undefined) {
    slots.note = options.note;
  }

  if (options.railItems !== undefined) {
    slots.railItems = options.railItems;
  }

  if (options.railTitle !== undefined) {
    slots.railTitle = options.railTitle;
  }

  return {
    id,
    type: "settings",
    variant: options.variant,
    props: {
      actionTone: options.actionTone ?? "neutral",
      emphasizedIndex: options.emphasizedIndex ?? 0,
      groupCount: options.groupCount,
      layoutStyle: options.layoutStyle
    },
    slots
  };
}

function page(title: string, sections: SectionNode[]): PageDocument {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    title,
    sections
  };
}

const settingsBlueprintDefinitions: SettingsBlueprint[] = [
  {
    id: "anchor-balance",
    screenType: "settings",
    name: "Anchor Balance",
    description: "A balanced grouped screen with one clear starting area and evenly paced support groups.",
    hierarchyIntent: "Open with a strong central settings block, then let secondary groups scan cleanly around it.",
    densityEnvelope: ["comfortable", "calm"],
    ctaStrategy: "One quiet action at the section edge so the controls remain primary.",
    allowedVariants: ["grouped"],
    antiPatternNotes: [
      "Do not split the same topic into multiple tiny cards.",
      "Do not add decorative promo or dashboard chrome above the settings block."
    ],
    createPage: (brief) =>
      page(brief.title, [
        settingsSection("sec-settings-001", {
          actionLabel: "Save changes",
          description: "A clear baseline settings screen with a stable scan pattern.",
          emphasizedIndex: 0,
          groupCount: 3,
          groupDescriptions: [
            "Profile identity and core workspace defaults.",
            "Notification cadence and interruption rules.",
            "Access, sessions, and security controls."
          ],
          groups: ["Profile", "Notifications", "Security"],
          heading: brief.title,
          layoutStyle: "balanced",
          variant: "grouped"
        })
      ])
  },
  {
    id: "primary-spotlight",
    screenType: "settings",
    name: "Primary Spotlight",
    description: "A featured lead group with quieter supporting groups arranged beneath it.",
    hierarchyIntent: "Make one topic dominant, then cluster related follow-up groups underneath.",
    densityEnvelope: ["comfortable"],
    ctaStrategy: "Use a single accent action attached to the featured group, not repeated across the screen.",
    allowedVariants: ["grouped"],
    antiPatternNotes: [
      "Do not give multiple groups equal visual weight.",
      "Do not let secondary groups compete with the spotlight group."
    ],
    createPage: (brief) =>
      page(brief.title, [
        settingsSection("sec-settings-001", {
          actionLabel: "Review security",
          actionTone: "accent",
          description: "One dominant control area sets the first read before the support groups.",
          emphasizedIndex: brief.density === "calm" ? 1 : 0,
          groupCount: 4,
          groupDescriptions: [
            "Personal details, naming, and visibility controls.",
            "Login protection and device trust settings.",
            "Digest timing and delivery preferences.",
            "Team access requests and seat permissions."
          ],
          groups: ["Profile", "Security", "Notifications", "Team access"],
          heading: brief.title,
          layoutStyle: "spotlight",
          variant: "grouped"
        })
      ])
  },
  {
    id: "guided-rail",
    screenType: "settings",
    name: "Guided Rail",
    description: "A main settings body paired with a side rail for context, reminders, and one explicit next action.",
    hierarchyIntent: "Keep the editable controls dominant while a narrow rail handles guidance and supporting context.",
    densityEnvelope: ["comfortable", "compact"],
    ctaStrategy: "Place the action in the rail so it reads as a final confirm step, not a competing region.",
    allowedVariants: ["grouped"],
    antiPatternNotes: [
      "Do not let the rail become a second settings surface.",
      "Do not stack multiple action bars around the page."
    ],
    createPage: (brief) =>
      page(brief.title, [
        settingsSection("sec-settings-001", {
          actionLabel: "Apply policy",
          actionTone: "accent",
          description: "The main body stays focused while the rail handles context and reminders.",
          emphasizedIndex: 0,
          groupCount: brief.density === "compact" ? 3 : 4,
          groupDescriptions:
            brief.density === "compact"
              ? [
                  "Branding, locale, and workspace defaults.",
                  "Digest timing, alerts, and quiet hours.",
                  "Password, sign-in, and admin approval rules."
                ]
              : [
                  "Branding, locale, and workspace defaults.",
                  "Digest timing and high-signal alerts.",
                  "Permissions, invites, and role approvals.",
                  "Password, sign-in, and session controls."
                ],
          groups:
            brief.density === "compact"
              ? ["Workspace", "Notifications", "Security"]
              : ["Workspace", "Notifications", "Team access", "Security"],
          heading: brief.title,
          layoutStyle: "rail",
          railItems: [
            "Changes affect everyone in this workspace.",
            "Security updates require admin approval.",
            "Save after reviewing the highlighted group."
          ],
          railTitle: "Before you apply",
          variant: "grouped"
        })
      ])
  },
  {
    id: "dense-ops",
    screenType: "settings",
    name: "Dense Ops",
    description: "A flatter, tighter settings screen for operational teams that need quick scanning without decorative cards.",
    hierarchyIntent: "Favor dense scanning and minimal chrome while preserving one obvious action target.",
    densityEnvelope: ["compact"],
    ctaStrategy: "Use one inline action for the whole section and avoid multiple highlighted buttons.",
    allowedVariants: ["flat"],
    antiPatternNotes: [
      "Do not reintroduce boxed sub-panels around every row.",
      "Do not add more than three top-level groups or the flat layout loses clarity."
    ],
    createPage: (brief) =>
      page(brief.title, [
        settingsSection("sec-settings-001", {
          actionLabel: "Update workspace",
          actionTone: "accent",
          description: "Tighter spacing and flatter presentation keep operational settings quick to review.",
          emphasizedIndex: 0,
          groupCount: 3,
          groupDescriptions: [
            "Naming, locale, and visible defaults.",
            "Alert routing and delivery preferences.",
            "Roles, approvals, and recovery rules."
          ],
          groups: ["Workspace", "Alerts", "Security"],
          heading: brief.title,
          layoutStyle: "dense",
          note: "Keep dense mode focused on high-frequency controls. Avoid extra grouping chrome.",
          variant: "flat"
        })
      ])
  },
  {
    id: "quiet-zones",
    screenType: "settings",
    name: "Quiet Zones",
    description: "A calmer grouped composition with explicit semantic zones and softer pacing between sections.",
    hierarchyIntent: "Reduce noise and let a few strong semantic zones do the organizational work.",
    densityEnvelope: ["calm", "comfortable"],
    ctaStrategy: "Use a single low-pressure action after the calmest read is established.",
    allowedVariants: ["grouped"],
    antiPatternNotes: [
      "Do not add shallow sub-groups inside each zone.",
      "Do not turn calm pacing into empty decorative whitespace."
    ],
    createPage: (brief) =>
      page(brief.title, [
        settingsSection("sec-settings-001", {
          actionLabel: "Save preferences",
          description: "Semantic zones separate personal, team, and risk-sensitive settings without extra noise.",
          emphasizedIndex: 2,
          groupCount: 3,
          groupDescriptions: [
            "Identity, language, and local workspace behavior.",
            "Team norms, summaries, and shared visibility choices.",
            "Account protection, session review, and destructive controls."
          ],
          groups: ["Personal workspace", "Team preferences", "Security and recovery"],
          heading: brief.title,
          layoutStyle: "calm",
          note: "Calm mode should feel intentional, not empty. Hold the screen to a few strong zones.",
          variant: "grouped"
        })
      ])
  }
];

export const settingsBlueprints: ReadonlyArray<SettingsBlueprint> =
  settingsBlueprintDefinitions;

export const defaultSettingsBlueprintId = settingsBlueprintDefinitions[0]?.id ?? "anchor-balance";

export function getSettingsBlueprint(
  blueprintId: string
): SettingsBlueprint {
  const blueprint = settingsBlueprintDefinitions.find((entry) => entry.id === blueprintId);

  if (!blueprint) {
    throw new Error(`Unknown settings blueprint "${blueprintId}".`);
  }

  return blueprint;
}

export function createSettingsPageFromBlueprint(
  blueprintId: string,
  brief: SettingsScreenBrief
): PageDocument {
  return getSettingsBlueprint(blueprintId).createPage(brief);
}
