import type { CriticRule, CriticRuleFinding } from "@bux/critic-core";
import type { MarketingLandingScreenBrief } from "@bux/core-model";
import {
  conversionSections,
  heroSections,
  operationalSections,
  proofSections,
  sectionPath
} from "./helpers";
import {
  moveHeroToTopFix,
  removeOperationalSectionsFix,
  simplifyHeroCtaFix,
  trimNarrativeSurfaceFix
} from "./repair-helpers";

const missingHeroRule: CriticRule<MarketingLandingScreenBrief> = {
  code: "marketing.missing_primary_pitch",
  screenType: "marketingLanding",
  evaluate: ({ project }) => {
    const heroes = heroSections(project);
    const firstSection = project.page.sections[0];
    const primaryHero = heroes[0];

    if (heroes.length === 0) {
      return [
        {
          severity: "high",
          message:
            "A marketing landing page needs a hero so the first read establishes the product claim immediately.",
          path: "/page/sections"
        }
      ];
    }

    if (firstSection?.type !== "hero") {
      return [
        {
          severity: "high",
          message:
            "The landing page buries its primary pitch under support content. Start with the hero so the offer lands first.",
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

const dashboardDriftRule: CriticRule<MarketingLandingScreenBrief> = {
  code: "marketing.dashboard_drift",
  screenType: "marketingLanding",
  evaluate: ({ project }) => {
    const suggestedFix = removeOperationalSectionsFix(project);

    return operationalSections(project).flatMap(({ index, section }) => [
      {
        severity: "high" as const,
        message: `This landing page is drifting into ${section.type} territory instead of telling a focused product story.`,
        path: sectionPath(index),
        ...(suggestedFix ? { suggestedFix } : {})
      }
    ]);
  }
};

const fragmentedNarrativeRule: CriticRule<MarketingLandingScreenBrief> = {
  code: "marketing.fragmented_narrative",
  screenType: "marketingLanding",
  evaluate: ({ project }) => {
    const findings: CriticRuleFinding[] = [];
    const heroes = heroSections(project);
    const proofs = proofSections(project);
    const conversions = conversionSections(project);

    if (heroes.length > 1) {
      const suggestedFix = trimNarrativeSurfaceFix(project);

      findings.push({
        severity: "high",
        message:
          "Multiple hero sections make the landing page read like stacked promos instead of one clear story arc.",
        path: "/page/sections",
        ...(suggestedFix ? { suggestedFix } : {})
      });
    }

    if (proofs.length > 2 || conversions.length > 1 || project.page.sections.length > 4) {
      const suggestedFix = trimNarrativeSurfaceFix(project);

      findings.push({
        severity: "medium",
        message:
          "Too many peer surfaces flatten the narrative and weaken the page's product hierarchy.",
        path: "/page/sections",
        ...(suggestedFix ? { suggestedFix } : {})
      });
    }

    return findings;
  }
};

const missingProofRule: CriticRule<MarketingLandingScreenBrief> = {
  code: "marketing.missing_proof",
  screenType: "marketingLanding",
  evaluate: ({ brief, project }) => {
    const proofs = proofSections(project);

    if (brief.density !== "launch" && proofs.length === 0) {
      return [
        {
          severity: "medium",
          message:
            "This landing page moves from pitch to end state without a proof surface to support the claim.",
          path: "/page/sections"
        }
      ];
    }

    return [];
  }
};

const weakConversionRule: CriticRule<MarketingLandingScreenBrief> = {
  code: "marketing.weak_conversion_path",
  screenType: "marketingLanding",
  evaluate: ({ brief, project }) => {
    const heroes = heroSections(project);
    const leadHero = heroes[0]?.section;
    const conversions = conversionSections(project);
    const findings: CriticRuleFinding[] = [];

    if (leadHero) {
      const ctaCount = leadHero.props.ctaCount;

      if (typeof ctaCount !== "number" || ctaCount < 1) {
        findings.push({
          severity: "high",
          message:
            "The primary hero has no CTA, so the landing page never presents a clear next step.",
          path: "/page/sections/0/props/ctaCount"
        });
      }

      if (brief.density === "launch" && typeof ctaCount === "number" && ctaCount > 1) {
        const suggestedFix = simplifyHeroCtaFix(leadHero);

        findings.push({
          severity: "medium",
          message:
            "Launch-oriented landing pages should emphasize one dominant CTA instead of splitting attention at the top.",
          path: "/page/sections/0/props/ctaCount",
          ...(suggestedFix ? { suggestedFix } : {})
        });
      }
    }

    if (brief.density === "launch" && conversions.length === 0) {
      findings.push({
        severity: "medium",
        message:
          "Launch density should end in a compact conversion surface so the page has a clear close after the pitch.",
        path: "/page/sections"
      });
    }

    return findings;
  }
};

export const marketingLandingCriticRules: ReadonlyArray<
  CriticRule<MarketingLandingScreenBrief>
> = [
  missingHeroRule,
  dashboardDriftRule,
  fragmentedNarrativeRule,
  missingProofRule,
  weakConversionRule
];
