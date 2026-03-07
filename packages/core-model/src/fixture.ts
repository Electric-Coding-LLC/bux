import {
  type CriticReport,
  type ConstraintsDocument,
  CURRENT_SCHEMA_VERSION,
  type DashboardScreenBrief,
  type MarketingLandingScreenBrief,
  type OnboardingScreenBrief,
  type PageDocument,
  type PlaygroundProject,
  type SettingsScreenBrief,
  type StressDocument,
  type SummaryDocument,
  type TokensDocument
} from "./types";

export const canonicalTokensFixture: TokensDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  typography: {
    families: {
      sans: "Inter",
      serif: "Merriweather",
      mono: "Fira Code"
    },
    scale: [12, 14, 16, 20, 24, 32, 40],
    lineHeights: [1.2, 1.4, 1.5],
    weights: [400, 500, 600, 700]
  },
  spacing: {
    scale: [4, 8, 12, 16, 24, 32, 40, 48],
    density: {
      comfortable: 1,
      compact: 0.8
    }
  },
  radii: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 16,
    pill: 999
  },
  containers: {
    xs: 360,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280
  },
  breakpoints: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280
  },
  colors: {
    roles: {
      "surface.default": "#FFFFFF",
      "surface.muted": "#F6F7F8",
      "text.primary": "#111827",
      "text.secondary": "#4B5563",
      "border.subtle": "#D1D5DB",
      "accent.primary": "#0F766E"
    }
  }
};

export const canonicalPageFixture: PageDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  title: "System Playground Baseline",
  sections: [
    {
      id: "sec-hero-001",
      type: "hero",
      variant: "split",
      props: {
        align: "start",
        ctaCount: 2,
        hasMedia: true
      },
      slots: {
        eyebrow: "Ship faster with systemized UI",
        heading: "A deterministic UI system playground",
        body:
          "Tune tokens and section constraints, then export machine-friendly artifacts.",
        primaryCta: "Start from baseline",
        secondaryCta: "Review constraints"
      }
    },
    {
      id: "sec-feature-grid-001",
      type: "featureGrid",
      variant: "cards",
      props: {
        columns: 3,
        showIcons: true
      },
      slots: {
        heading: "Core foundations",
        items: [
          {
            title: "Typography scale",
            body: "Role-based typography mapped from shared tokens."
          },
          {
            title: "Spacing system",
            body: "Density modes validated against global spacing scales."
          },
          {
            title: "Layout constraints",
            body: "Breakpoint-aware columns and container widths."
          }
        ]
      }
    }
  ]
};

export const canonicalConstraintsFixture: ConstraintsDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  layout: {
    defaultDensity: "comfortable",
    breakpoints: [
      { breakpoint: "xs", columns: 4, gutterToken: 4, containerToken: "xs" },
      { breakpoint: "sm", columns: 8, gutterToken: 4, containerToken: "sm" },
      { breakpoint: "md", columns: 12, gutterToken: 6, containerToken: "md" },
      { breakpoint: "lg", columns: 12, gutterToken: 6, containerToken: "lg" },
      { breakpoint: "xl", columns: 12, gutterToken: 8, containerToken: "xl" }
    ]
  },
  sectionRules: [
    {
      sectionType: "hero",
      allowedVariants: ["split", "centered", "stacked"],
      maxItems: 1
    },
    {
      sectionType: "featureGrid",
      allowedVariants: ["cards", "minimal"],
      maxItems: 12
    },
    {
      sectionType: "form",
      allowedVariants: ["stacked", "inline"]
    },
    {
      sectionType: "list",
      allowedVariants: ["simple", "detailed"]
    },
    {
      sectionType: "table",
      allowedVariants: ["comfortable", "compact"]
    },
    {
      sectionType: "settings",
      allowedVariants: ["grouped", "flat"]
    }
  ]
};

export const canonicalSummaryFixture: SummaryDocument = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  generatedAt: "2026-02-26T00:00:00.000Z",
  targetProfile: "portable-core",
  stress: {
    copyMode: "short",
    stateMode: "default",
    densityMode: "comfortable"
  },
  system: {
    typographyScaleSteps: canonicalTokensFixture.typography.scale.length,
    spacingScaleSteps: canonicalTokensFixture.spacing.scale.length,
    defaultDensity: canonicalConstraintsFixture.layout.defaultDensity,
    colorRoleCount: Object.keys(canonicalTokensFixture.colors.roles).length
  },
  layout: {
    sectionCount: canonicalPageFixture.sections.length,
    sectionOrder: canonicalPageFixture.sections.map((section) => section.type)
  },
  notes: [
    "Portable core model avoids raw CSS in section props.",
    "Preview targets authentic DOM layout while exports remain framework-agnostic."
  ]
};

export const canonicalStressFixture: StressDocument = {
  copyMode: "short",
  stateMode: "default",
  densityMode: "comfortable"
};

export const canonicalSettingsScreenBriefFixture: SettingsScreenBrief = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  screenType: "settings",
  title: "Workspace settings",
  density: "comfortable"
};

export const canonicalOnboardingScreenBriefFixture: OnboardingScreenBrief = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  screenType: "onboarding",
  title: "Get your workspace ready",
  density: "guided"
};

export const canonicalMarketingLandingScreenBriefFixture: MarketingLandingScreenBrief = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  screenType: "marketingLanding",
  title: "Launch with a clearer product story",
  density: "focused"
};

export const canonicalDashboardScreenBriefFixture: DashboardScreenBrief = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  screenType: "dashboard",
  title: "Team operations pulse",
  density: "operational",
  artDirection: "quietSignal"
};

export const canonicalCriticReportFixture: CriticReport = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  screenType: "settings",
  score: 100,
  verdict: "pass",
  findings: [],
  summary: {
    totalRules: 0,
    triggeredRules: 0,
    severityCounts: {
      low: 0,
      medium: 0,
      high: 0
    }
  }
};

export const canonicalProjectFixture: PlaygroundProject = {
  tokens: canonicalTokensFixture,
  page: canonicalPageFixture,
  constraints: canonicalConstraintsFixture,
  stress: canonicalStressFixture,
  summary: canonicalSummaryFixture
};
