import type { CriticRule, CriticRuleFinding } from "@bux/critic-core";
import type { DashboardScreenBrief } from "@bux/core-model";
import {
  driftSections,
  heroSections,
  operationalSections,
  sectionPath,
  summarySections
} from "./helpers";
import {
  keepOneHeroFix,
  moveSummaryToTopFix,
  removeDriftSectionsFix,
  simplifyHeroCtasFix,
  trimDashboardSurfacesFix
} from "./repair-helpers";

const missingSummaryBandRule: CriticRule<DashboardScreenBrief> = {
  code: "dashboard.missing_summary_band",
  screenType: "dashboard",
  evaluate: ({ project }) => {
    const summaries = summarySections(project);
    const primarySummary = summaries[0];
    const firstSection = project.page.sections[0];

    if (summaries.length === 0) {
      return [
        {
          severity: "high",
          message:
            "A dashboard needs a summary band so the first read establishes the current pulse before deeper operational detail.",
          path: "/page/sections"
        }
      ];
    }

    if (firstSection?.type !== "featureGrid") {
      return [
        {
          severity: "high",
          message:
            "The dashboard buries its summary band under deeper content. Move the KPI strip to the top so the scan starts with context.",
          path: "/page/sections/0",
          ...(primarySummary
            ? { suggestedFix: moveSummaryToTopFix(primarySummary.section.id) }
            : {})
        }
      ];
    }

    return [];
  }
};

const missingOperationalSurfaceRule: CriticRule<DashboardScreenBrief> = {
  code: "dashboard.missing_operational_surface",
  screenType: "dashboard",
  evaluate: ({ project }) =>
    operationalSections(project).length === 0
      ? [
          {
            severity: "high",
            message:
              "This dashboard never lands on a list or table, so it shows a pulse without exposing the work that needs attention.",
            path: "/page/sections"
          }
        ]
      : []
};

const presentationDriftRule: CriticRule<DashboardScreenBrief> = {
  code: "dashboard.presentation_drift",
  screenType: "dashboard",
  evaluate: ({ project }) => {
    const suggestedFix = removeDriftSectionsFix(project);

    return driftSections(project).map(({ index, section }) => ({
      severity: "high" as const,
      message: `A ${section.type} surface pulls this screen away from dashboard monitoring and into a different product mode.`,
      path: sectionPath(index),
      ...(suggestedFix ? { suggestedFix } : {})
    }));
  }
};

const fragmentedSurfaceStackRule: CriticRule<DashboardScreenBrief> = {
  code: "dashboard.fragmented_surface_stack",
  screenType: "dashboard",
  evaluate: ({ project }) => {
    const findings: CriticRuleFinding[] = [];
    const summaries = summarySections(project);
    const operational = operationalSections(project);
    const heroes = heroSections(project);
    const suggestedFix = trimDashboardSurfacesFix(project);

    if (summaries.length > 1) {
      findings.push({
        severity: "medium",
        message:
          "Multiple summary bands compete for the same top-level role. Keep one clear KPI strip and let the rest of the data stay subordinate.",
        path: "/page/sections",
        ...(suggestedFix ? { suggestedFix } : {})
      });
    }

    if (operational.length > 2 || project.page.sections.length > 4) {
      findings.push({
        severity: "medium",
        message:
          "Too many peer dashboard surfaces flatten the scan and make it harder to find the main operational thread.",
        path: "/page/sections",
        ...(suggestedFix ? { suggestedFix } : {})
      });
    }

    if (heroes.length > 1) {
      const keepOneBannerFix = keepOneHeroFix(project);

      findings.push({
        severity: "medium",
        message:
          "Stacking multiple hero banners turns the dashboard into a presentation deck instead of one coherent monitoring surface.",
        path: "/page/sections",
        ...(keepOneBannerFix ? { suggestedFix: keepOneBannerFix } : {})
      });
    }

    return findings;
  }
};

const densityMismatchRule: CriticRule<DashboardScreenBrief> = {
  code: "dashboard.density_mismatch",
  screenType: "dashboard",
  evaluate: ({ brief, project }) => {
    const operational = operationalSections(project);
    const tableCount = operational.filter(({ section }) => section.type === "table").length;
    const totalSections = project.page.sections.length;

    if (brief.density === "focused" && (operational.length !== 1 || totalSections > 2)) {
      const suggestedFix = trimDashboardSurfacesFix(project, 1);

      return [
        {
          severity: "medium",
          message:
            "Focused dashboard briefs should keep one summary band and one follow-up surface, not a broader monitoring stack.",
          path: "/page/sections",
          ...(suggestedFix ? { suggestedFix } : {})
        }
      ];
    }

    if (brief.density === "executive" && tableCount > 1) {
      const suggestedFix = trimDashboardSurfacesFix(project, 2);

      return [
        {
          severity: "medium",
          message:
            "Executive dashboards should summarize the state and keep only one deep table, not multiple dense data grids.",
          path: "/page/sections",
          ...(suggestedFix ? { suggestedFix } : {})
        }
      ];
    }

    if (brief.density === "operational" && tableCount === 0) {
      return [
        {
          severity: "medium",
          message:
            "Operational dashboard briefs should expose at least one table so teams can act on the current queue, not just scan summaries.",
          path: "/page/sections"
        }
      ];
    }

    return [];
  }
};

const competingDashboardCtasRule: CriticRule<DashboardScreenBrief> = {
  code: "dashboard.competing_dashboard_ctas",
  screenType: "dashboard",
  evaluate: ({ project }) =>
    heroSections(project).flatMap(({ index, section }) => {
      const ctaCount = section.props.ctaCount;

      if (typeof ctaCount === "number" && ctaCount > 1) {
        const suggestedFix = simplifyHeroCtasFix(section);

        return [
          {
            severity: "medium" as const,
            message:
              "A dashboard banner should not compete with multiple equal CTAs. Keep one clear action if a hero is present at all.",
            path: sectionPath(index, "/props/ctaCount"),
            ...(suggestedFix ? { suggestedFix } : {})
          }
        ];
      }

      return [];
    })
};

export const dashboardCriticRules: ReadonlyArray<CriticRule<DashboardScreenBrief>> = [
  missingSummaryBandRule,
  missingOperationalSurfaceRule,
  presentationDriftRule,
  fragmentedSurfaceStackRule,
  densityMismatchRule,
  competingDashboardCtasRule
];
