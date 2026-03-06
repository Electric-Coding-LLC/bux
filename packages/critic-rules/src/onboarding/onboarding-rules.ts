import type { CriticRule, CriticRuleFinding } from "@bux/critic-core";
import type { OnboardingScreenBrief } from "@bux/core-model";
import {
  onboardingForms,
  onboardingGuidanceSections,
  onboardingHeroes,
  sectionPath
} from "./helpers";
import {
  moveHeroToTopFix,
  simplifyHeroCtasFix,
  trimOnboardingSurfacesFix
} from "./repair-helpers";

const missingIntroRule: CriticRule<OnboardingScreenBrief> = {
  code: "onboarding.missing_intro",
  screenType: "onboarding",
  evaluate: ({ project }) => {
    const heroes = onboardingHeroes(project);
    const firstSection = project.page.sections[0];
    const primaryHero = heroes[0];

    if (heroes.length === 0) {
      return [
        {
          severity: "high",
          message:
            "Onboarding needs an intro section so the first read explains what will happen before the setup surfaces begin.",
          path: "/page/sections"
        }
      ];
    }

    if (firstSection?.type !== "hero") {
      return [
        {
          severity: "high",
          message:
            "The onboarding intro is buried under setup content. Start with the hero so the flow is explained before users act.",
          path: "/page/sections/0",
          ...(primaryHero
            ? { suggestedFix: moveHeroToTopFix(primaryHero.section.id) }
            : {})
        }
      ];
    }

    return [];
  }
};

const missingActivationRule: CriticRule<OnboardingScreenBrief> = {
  code: "onboarding.missing_activation_surface",
  screenType: "onboarding",
  evaluate: ({ project }) =>
    onboardingForms(project).length === 0
      ? [
          {
            severity: "high",
            message:
              "The onboarding flow never lands on a clear activation surface. Add one focused form as the handoff into the product.",
            path: "/page/sections"
          }
        ]
      : []
};

const weakGuidanceRule: CriticRule<OnboardingScreenBrief> = {
  code: "onboarding.weak_guidance",
  screenType: "onboarding",
  evaluate: ({ brief, project }) => {
    const guidanceSections = onboardingGuidanceSections(project);

    if (brief.density === "guided" && guidanceSections.length === 0) {
      return [
        {
          severity: "medium",
          message:
            "A guided onboarding brief should include a short guidance section that makes the first-run sequence explicit.",
          path: "/page/sections"
        }
      ];
    }

    if (brief.density === "compact" && guidanceSections.length > 1) {
      const suggestedFix = trimOnboardingSurfacesFix(project);

      return [
        {
          severity: "medium",
          message:
            "Compact onboarding should keep supporting explanation tight instead of splitting it across multiple guidance sections.",
          path: "/page/sections",
          ...(suggestedFix ? { suggestedFix } : {})
        }
      ];
    }

    return [];
  }
};

const fragmentedFlowRule: CriticRule<OnboardingScreenBrief> = {
  code: "onboarding.fragmented_flow",
  screenType: "onboarding",
  evaluate: ({ project }) => {
    const findings: CriticRuleFinding[] = [];
    const heroCount = onboardingHeroes(project).length;
    const sectionCount = project.page.sections.length;

    if (heroCount > 1) {
      const suggestedFix = trimOnboardingSurfacesFix(project);

      findings.push({
        severity: "high",
        message:
          "Multiple hero sections make onboarding read like stacked promos instead of one guided flow.",
        path: "/page/sections",
        ...(suggestedFix ? { suggestedFix } : {})
      });
    }

    if (sectionCount > 4) {
      const suggestedFix = trimOnboardingSurfacesFix(project);

      findings.push({
        severity: "medium",
        message:
          "Too many peer regions turn onboarding into a fragmented sequence. Keep the path to a few deliberate sections.",
        path: "/page/sections",
        ...(suggestedFix ? { suggestedFix } : {})
      });
    }

    return findings;
  }
};

const tableMisuseRule: CriticRule<OnboardingScreenBrief> = {
  code: "onboarding.table_misuse",
  screenType: "onboarding",
  evaluate: ({ project }) =>
    project.page.sections.flatMap((section, index) =>
      section.type === "table"
        ? [
            {
              severity: "high" as const,
              message:
                "Tables are too heavy for first-run onboarding. Use a short checklist or setup form instead of grid rows.",
              path: sectionPath(index)
            }
          ]
        : []
    )
};

const competingCtasRule: CriticRule<OnboardingScreenBrief> = {
  code: "onboarding.competing_ctas",
  screenType: "onboarding",
  evaluate: ({ project }) =>
    onboardingHeroes(project).flatMap(({ index, section }) => {
      const ctaCount = section.props.ctaCount;

      if (typeof ctaCount === "number" && ctaCount > 1) {
        const suggestedFix = simplifyHeroCtasFix(section);

        return [
          {
            severity: "medium" as const,
            message:
              "Too many intro CTAs make the first-run path ambiguous. Onboarding should point users to one next step.",
            path: sectionPath(index, "/props/ctaCount"),
            ...(suggestedFix ? { suggestedFix } : {})
          }
        ];
      }

      return [];
    })
};

export const onboardingCriticRules: ReadonlyArray<
  CriticRule<OnboardingScreenBrief>
> = [
  missingIntroRule,
  missingActivationRule,
  weakGuidanceRule,
  fragmentedFlowRule,
  tableMisuseRule,
  competingCtasRule
];
