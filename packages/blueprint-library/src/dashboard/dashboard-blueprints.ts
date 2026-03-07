import {
  CURRENT_SCHEMA_VERSION,
  type DashboardScreenBrief,
  type PageDocument,
  type SectionNode
} from "@bux/core-model";
import type { DashboardBlueprint } from "../types";

function featureGridSection(
  id: string,
  options: {
    heading: string;
    items: Array<{ title: string; body: string }>;
    variant: "cards" | "minimal";
  }
): SectionNode {
  return {
    id,
    type: "featureGrid",
    variant: options.variant,
    props: {
      columns: Math.min(4, Math.max(2, options.items.length)),
      showIcons: options.variant === "cards"
    },
    slots: {
      heading: options.heading,
      items: options.items
    }
  };
}

function listSection(
  id: string,
  options: {
    heading: string;
    items: string[];
    variant: "detailed" | "simple";
  }
): SectionNode {
  return {
    id,
    type: "list",
    variant: options.variant,
    props: {},
    slots: {
      heading: options.heading,
      items: options.items
    }
  };
}

function tableSection(
  id: string,
  options: {
    columns: number;
    headers: string[];
    heading: string;
    rows: string[][];
    variant: "comfortable" | "compact";
  }
): SectionNode {
  return {
    id,
    type: "table",
    variant: options.variant,
    props: {
      columns: options.columns
    },
    slots: {
      headers: options.headers,
      heading: options.heading,
      rows: options.rows
    }
  };
}

function page(title: string, sections: SectionNode[]): PageDocument {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    title,
    sections
  };
}

function isCommandCenter(
  brief: DashboardScreenBrief
): boolean {
  return brief.artDirection === "commandCenter";
}

function isEditorialPulse(
  brief: DashboardScreenBrief
): boolean {
  return brief.artDirection === "editorialPulse";
}

function isQuietSignal(
  brief: DashboardScreenBrief
): boolean {
  return brief.artDirection === "quietSignal";
}

const dashboardBlueprintDefinitions: DashboardBlueprint[] = [
  {
    id: "executive-briefing",
    screenType: "dashboard",
    name: "Executive Briefing",
    description:
      "A high-level pulse that opens with key shifts, then narrows into one watchlist and one escalation queue.",
    hierarchyIntent:
      "Make the summary band dominant so leaders can orient quickly before reading the supporting queues.",
    densityEnvelope: ["executive", "focused"],
    ctaStrategy:
      "Keep actions implicit in the operational surfaces instead of adding promo-style buttons above the data.",
    allowedVariants: [
      "cards",
      "minimal",
      "simple",
      "detailed",
      "comfortable",
      "compact"
    ],
    artDirectionProfiles: ["quietSignal", "editorialPulse"],
    antiPatternNotes: [
      "Do not stack multiple equal-weight tables above the summary band.",
      "Do not drift into setup or marketing surfaces."
    ],
    createPage: (brief) =>
      page(brief.title, [
        featureGridSection("sec-feature-grid-001", {
          heading: isEditorialPulse(brief)
            ? "What moved the program this week"
            : "This week at a glance",
          items: [
            {
              title: "SLA risk",
              body: "4 workflows need intervention before the next approval window closes."
            },
            {
              title: "Launch coverage",
              body: "92% of priority screens have an approved candidate ready for export."
            },
            {
              title: "Review load",
              body: "Design review volume dropped after repairs started clearing weak layouts earlier."
            },
            {
              title: "Blocked teams",
              body: "2 workspaces are waiting on policy fixes before they can ship."
            }
          ],
          variant: isQuietSignal(brief) ? "minimal" : "cards"
        }),
        listSection("sec-list-001", {
          heading: isEditorialPulse(brief)
            ? "Signals leadership should read next"
            : "Where leadership should look next",
          items: [
            "Security policy drift is climbing in the enterprise workspaces.",
            "Two onboarding candidates cleared the critic but still need export fixes.",
            "Marketing launch briefs are trending toward weaker proof density."
          ],
          variant: isEditorialPulse(brief) ? "detailed" : "simple"
        }),
        tableSection("sec-table-001", {
          columns: 4,
          headers: ["Program", "Owner", "Status", "Next step"],
          heading: "Priority follow-up queue",
          rows: [
            ["Growth launch", "Tara", "At risk", "Approve proof edits"],
            ["Admin reset", "Luis", "Blocked", "Repair settings grouping"],
            ["Activation refresh", "Mina", "Watching", "Validate export bundle"]
          ],
          variant: isCommandCenter(brief) ? "compact" : "comfortable"
        })
      ])
  },
  {
    id: "ops-radar",
    screenType: "dashboard",
    name: "Ops Radar",
    description:
      "An operations-first dashboard with a KPI strip, a main queue table, and a concise escalation list.",
    hierarchyIntent:
      "Lead with the pulse, then let one main operational surface carry the dense work while the side list stays secondary.",
    densityEnvelope: ["operational"],
    ctaStrategy:
      "Keep the dashboard action model inside the queue rows and escalation list rather than introducing extra banners.",
    allowedVariants: [
      "minimal",
      "cards",
      "comfortable",
      "compact",
      "simple",
      "detailed"
    ],
    artDirectionProfiles: ["commandCenter", "quietSignal"],
    antiPatternNotes: [
      "Do not replace the main queue with scattered card fragments.",
      "Do not introduce a settings block into the dashboard spine."
    ],
    createPage: (brief) =>
      page(brief.title, [
        featureGridSection("sec-feature-grid-001", {
          heading: isCommandCenter(brief)
            ? "Control room pulse"
            : "Operations pulse",
          items: [
            {
              title: "Open blockers",
              body: "7 candidates still fail critic review and need intervention."
            },
            {
              title: "Exports today",
              body: "14 approved bundles are ready for downstream adapter runs."
            },
            {
              title: "Repair win rate",
              body: "One-click repairs clear the current blocker gap on 61% of attempts."
            }
          ],
          variant: isCommandCenter(brief) ? "cards" : "minimal"
        }),
        tableSection("sec-table-001", {
          columns: 5,
          headers: ["Queue", "Lead", "Age", "Risk", "Next step"],
          heading: "Active operator queue",
          rows: [
            ["Settings drift", "Jules", "18m", "Medium", "Normalize variants"],
            ["Onboarding gap", "Ari", "27m", "High", "Move intro to top"],
            ["Landing proof", "Dev", "11m", "Medium", "Restore proof surface"]
          ],
          variant:
            brief.density === "focused" || isCommandCenter(brief)
              ? "compact"
              : "comfortable"
        }),
        listSection("sec-list-001", {
          heading: isQuietSignal(brief)
            ? "Escalations to clear today"
            : "Escalations that need action today",
          items: [
            "Approve the security-copy rewrite before the enterprise export closes.",
            "Confirm the blocked onboarding baseline is still the right reference candidate.",
            "Watch the marketing launch queue for repeated hero CTA competition."
          ],
          variant: isQuietSignal(brief) ? "simple" : "detailed"
        })
      ])
  },
  {
    id: "queue-pulse",
    screenType: "dashboard",
    name: "Queue Pulse",
    description:
      "A tighter dashboard that moves from the KPI strip directly into one compact work queue.",
    hierarchyIntent:
      "Keep one summary band and one queue so the dashboard is immediately actionable without a long scan.",
    densityEnvelope: ["focused", "operational"],
    ctaStrategy:
      "Use the queue rows as the action surface and avoid additional call-to-action treatment elsewhere.",
    allowedVariants: ["cards", "minimal", "compact", "comfortable"],
    artDirectionProfiles: ["commandCenter", "quietSignal"],
    antiPatternNotes: [
      "Do not add extra explainer sections between the summary and the queue.",
      "Do not duplicate the queue in both list and table form."
    ],
    createPage: (brief) =>
      page(brief.title, [
        featureGridSection("sec-feature-grid-001", {
          heading: isCommandCenter(brief)
            ? "Immediate action band"
            : "Immediate attention",
          items: [
            {
              title: "Blocked exports",
              body: "3 candidates cleared critic review but still fail bundle validation."
            },
            {
              title: "Repair backlog",
              body: "5 candidates have actionable fixes that directly close the approval gap."
            },
            {
              title: "Approval drift",
              body: "One previously approved baseline was edited into blocked territory."
            }
          ],
          variant:
            brief.density === "focused" || isEditorialPulse(brief)
              ? "cards"
              : "minimal"
        }),
        tableSection("sec-table-001", {
          columns: 4,
          headers: ["Candidate", "Issue", "Owner", "Next action"],
          heading: "Repair queue",
          rows: [
            ["Workspace settings", "Variant drift", "Mina", "Normalize variants"],
            ["Welcome flow", "Missing intro", "Luis", "Move hero to top"],
            ["Launch page", "Weak proof", "Tara", "Restore proof section"]
          ],
          variant: isQuietSignal(brief) ? "comfortable" : "compact"
        })
      ])
  },
  {
    id: "flash-overview",
    screenType: "dashboard",
    name: "Flash Overview",
    description:
      "A summary-led dashboard with one follow-up watchlist for teams that only need the current pulse and next checks.",
    hierarchyIntent:
      "Make the KPI strip carry most of the information so the list can stay short and intentionally secondary.",
    densityEnvelope: ["focused", "executive"],
    ctaStrategy:
      "Keep the follow-up list terse and avoid adding a second heavy operational surface.",
    allowedVariants: ["minimal", "cards", "simple", "detailed"],
    artDirectionProfiles: ["quietSignal", "editorialPulse"],
    antiPatternNotes: [
      "Do not turn the follow-up list into a full backlog table.",
      "Do not bury the summary band under an announcement block."
    ],
    createPage: (brief) =>
      page(brief.title, [
        featureGridSection("sec-feature-grid-001", {
          heading: isEditorialPulse(brief)
            ? "Current program pulse"
            : "Current pulse",
          items: [
            {
              title: "Approved now",
              body: "11 candidates are ready to export without manual cleanup."
            },
            {
              title: "Watch list",
              body: "4 candidates are one repair away from approval."
            },
            {
              title: "Escalated",
              body: "2 workspaces need human judgment on critic tradeoffs."
            }
          ],
          variant: isEditorialPulse(brief) ? "cards" : "minimal"
        }),
        listSection("sec-list-001", {
          heading: isEditorialPulse(brief)
            ? "What to review next"
            : "Next checks",
          items: [
            "Confirm the strongest export-ready onboarding baseline is still the right recommendation.",
            "Review the queued enterprise settings repair before the policy window closes.",
            "Re-run the snapshot export check after the next approved landing candidate loads."
          ],
          variant:
            brief.density === "focused" && !isEditorialPulse(brief)
              ? "simple"
              : "detailed"
        })
      ])
  }
];

export const dashboardBlueprints: ReadonlyArray<DashboardBlueprint> =
  dashboardBlueprintDefinitions;

export const defaultDashboardBlueprintId =
  dashboardBlueprintDefinitions[0]?.id ?? "executive-briefing";

export function getDashboardBlueprint(blueprintId: string): DashboardBlueprint {
  const blueprint = dashboardBlueprintDefinitions.find((entry) => entry.id === blueprintId);

  if (!blueprint) {
    throw new Error(`Unknown dashboard blueprint "${blueprintId}".`);
  }

  return blueprint;
}

export function createDashboardPageFromBlueprint(
  blueprintId: string,
  brief: DashboardScreenBrief
): PageDocument {
  return getDashboardBlueprint(blueprintId).createPage(brief);
}
