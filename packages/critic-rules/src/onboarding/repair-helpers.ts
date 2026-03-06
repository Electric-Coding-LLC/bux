import type {
  CriticSuggestedFix,
  PlaygroundProject,
  SectionNode
} from "@bux/core-model";
import {
  onboardingGuidanceSections,
  onboardingHeroes,
  onboardingForms
} from "./helpers";

export function moveHeroToTopFix(sectionId: string): CriticSuggestedFix {
  return {
    id: "onboarding.move_intro_to_top",
    label: "Move onboarding intro to the top",
    description:
      "Start the onboarding screen with the main intro so the first read explains the flow before setup details.",
    actions: [
      {
        type: "reorderSection",
        sectionId,
        toIndex: 0
      }
    ]
  };
}

export function simplifyHeroCtasFix(section: SectionNode): CriticSuggestedFix | null {
  const currentCount = section.props.ctaCount;

  if (typeof currentCount !== "number" || currentCount <= 1) {
    return null;
  }

  return {
    id: `onboarding.simplify_ctas_${section.id}`,
    label: "Reduce competing CTAs",
    description:
      "Keep onboarding focused on one clear next step instead of splitting attention across multiple actions.",
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

export function trimOnboardingSurfacesFix(
  project: PlaygroundProject
): CriticSuggestedFix | null {
  const heroes = onboardingHeroes(project);
  const forms = onboardingForms(project);
  const guidanceSections = onboardingGuidanceSections(project);
  const keepSectionIds = new Set<string>();

  if (heroes[0]) {
    keepSectionIds.add(heroes[0].section.id);
  }

  if (guidanceSections[0]) {
    keepSectionIds.add(guidanceSections[0].section.id);
  }

  if (forms[0]) {
    keepSectionIds.add(forms[0].section.id);
  }

  const removableSections = project.page.sections.filter(
    (section) =>
      !keepSectionIds.has(section.id) &&
      (section.type === "hero" ||
        section.type === "featureGrid" ||
        section.type === "list" ||
        section.type === "table")
  );

  if (removableSections.length === 0) {
    return null;
  }

  return {
    id: "onboarding.trim_extra_surfaces",
    label: "Trim extra onboarding surfaces",
    description:
      "Keep one intro, one guidance surface, and one activation surface so onboarding reads as one deliberate flow.",
    actions: removableSections.map((section) => ({
      type: "removeSection" as const,
      sectionId: section.id
    }))
  };
}
