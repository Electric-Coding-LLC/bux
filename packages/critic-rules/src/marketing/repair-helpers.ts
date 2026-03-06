import type {
  CriticSuggestedFix,
  PlaygroundProject,
  SectionNode
} from "@bux/core-model";
import {
  conversionSections,
  heroSections,
  operationalSections,
  proofSections
} from "./helpers";

export function moveHeroToTopFix(sectionId: string): CriticSuggestedFix {
  return {
    id: "marketing.move_hero_to_top",
    label: "Move hero to the top",
    description:
      "Start the landing page with the primary pitch so the page establishes its offer before any support content.",
    actions: [
      {
        type: "reorderSection",
        sectionId,
        toIndex: 0
      }
    ]
  };
}

export function removeOperationalSectionsFix(
  project: PlaygroundProject
): CriticSuggestedFix | null {
  const removable = operationalSections(project);

  if (removable.length === 0) {
    return null;
  }

  return {
    id: "marketing.remove_operational_sections",
    label: "Remove operational sections",
    description:
      "Drop settings and table surfaces so the landing page stays focused on product story and conversion.",
    actions: removable.map(({ section }) => ({
      type: "removeSection" as const,
      sectionId: section.id
    }))
  };
}

export function trimNarrativeSurfaceFix(
  project: PlaygroundProject
): CriticSuggestedFix | null {
  const heroes = heroSections(project);
  const proofs = proofSections(project);
  const conversions = conversionSections(project);
  const keepSectionIds = new Set<string>();

  if (heroes[0]) {
    keepSectionIds.add(heroes[0].section.id);
  }

  for (const entry of proofs.slice(0, 2)) {
    keepSectionIds.add(entry.section.id);
  }

  if (conversions[0]) {
    keepSectionIds.add(conversions[0].section.id);
  }

  const removable = project.page.sections.filter(
    (section) =>
      !keepSectionIds.has(section.id) &&
      (section.type === "hero" ||
        section.type === "featureGrid" ||
        section.type === "list" ||
        section.type === "form")
  );

  if (removable.length === 0) {
    return null;
  }

  return {
    id: "marketing.trim_narrative_surfaces",
    label: "Trim extra narrative surfaces",
    description:
      "Keep one hero, a small proof stack, and one conversion surface so the landing page reads as one deliberate narrative.",
    actions: removable.map((section) => ({
      type: "removeSection" as const,
      sectionId: section.id
    }))
  };
}

export function simplifyHeroCtaFix(section: SectionNode): CriticSuggestedFix | null {
  if (section.type !== "hero") {
    return null;
  }

  const currentCount = section.props.ctaCount;

  if (typeof currentCount !== "number" || currentCount <= 1) {
    return null;
  }

  return {
    id: `marketing.simplify_ctas_${section.id}`,
    label: "Reduce CTA competition",
    description:
      "Use one dominant hero CTA so the landing page has a clearer conversion priority.",
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
