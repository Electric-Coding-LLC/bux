import type {
  CriticSuggestedFix,
  PlaygroundProject,
  SectionNode
} from "@bux/core-model";
import {
  driftSections,
  heroSections,
  operationalSections,
  summarySections
} from "./helpers";

export function moveSummaryToTopFix(sectionId: string): CriticSuggestedFix {
  return {
    id: "dashboard.move_summary_to_top",
    label: "Move summary band to the top",
    description:
      "Start the dashboard with the KPI summary so the first read establishes the current pulse before detailed queues.",
    actions: [
      {
        type: "reorderSection",
        sectionId,
        toIndex: 0
      }
    ]
  };
}

export function removeDriftSectionsFix(
  project: PlaygroundProject
): CriticSuggestedFix | null {
  const removable = driftSections(project);

  if (removable.length === 0) {
    return null;
  }

  return {
    id: "dashboard.remove_drift_sections",
    label: "Remove off-task surfaces",
    description:
      "Drop form and settings surfaces so the dashboard stays focused on summary and operational monitoring.",
    actions: removable.map(({ section }) => ({
      type: "removeSection" as const,
      sectionId: section.id
    }))
  };
}

export function trimDashboardSurfacesFix(
  project: PlaygroundProject,
  maxOperationalSurfaces = 2
): CriticSuggestedFix | null {
  const summaries = summarySections(project);
  const operational = operationalSections(project);
  const keepSectionIds = new Set<string>();

  if (summaries[0]) {
    keepSectionIds.add(summaries[0].section.id);
  }

  for (const entry of operational.slice(0, maxOperationalSurfaces)) {
    keepSectionIds.add(entry.section.id);
  }

  const removable = project.page.sections.filter(
    (section) =>
      !keepSectionIds.has(section.id) &&
      (section.type === "featureGrid" ||
        section.type === "list" ||
        section.type === "table")
  );

  if (removable.length === 0) {
    return null;
  }

  return {
    id: "dashboard.trim_surface_stack",
    label: "Trim extra dashboard surfaces",
    description:
      "Keep one summary band and only the most relevant operational surfaces so the dashboard scan stays deliberate.",
    actions: removable.map((section) => ({
      type: "removeSection" as const,
      sectionId: section.id
    }))
  };
}

export function simplifyHeroCtasFix(section: SectionNode): CriticSuggestedFix | null {
  if (section.type !== "hero") {
    return null;
  }

  const currentCount = section.props.ctaCount;

  if (typeof currentCount !== "number" || currentCount <= 1) {
    return null;
  }

  return {
    id: `dashboard.simplify_ctas_${section.id}`,
    label: "Reduce dashboard CTA competition",
    description:
      "If a dashboard uses a hero banner, keep it to one clear action so it does not read like a marketing surface.",
    actions: [
      {
        type: "updateSection",
        sectionId: section.id,
        changes: {
          props: {
            ctaCount: 1
          }
        }
      }
    ]
  };
}

export function keepOneHeroFix(project: PlaygroundProject): CriticSuggestedFix | null {
  const heroes = heroSections(project);

  if (heroes.length <= 1) {
    return null;
  }

  return {
    id: "dashboard.keep_one_hero",
    label: "Keep one dashboard banner",
    description:
      "If a dashboard uses a hero-style banner, keep only one so the screen does not stack presentation surfaces.",
    actions: heroes.slice(1).map(({ section }) => ({
      type: "removeSection" as const,
      sectionId: section.id
    }))
  };
}
