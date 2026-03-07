export const CURRENT_SCHEMA_VERSION = "1.0.0";

export type BreakpointName = "xs" | "sm" | "md" | "lg" | "xl";
export type DensityMode = "comfortable" | "compact";
export type StressCopyMode = "short" | "long";
export type StressStateMode = "default" | "empty" | "loading" | "error";
export type ScreenType =
  | "settings"
  | "onboarding"
  | "marketingLanding"
  | "dashboard";
export type SettingsScreenDensity = DensityMode | "calm";
export type OnboardingScreenDensity = "guided" | "focused" | "compact";
export type MarketingLandingDensity = "editorial" | "focused" | "launch";
export type DashboardScreenDensity = "executive" | "operational" | "focused";
export type DashboardArtDirectionProfile =
  | "quietSignal"
  | "commandCenter"
  | "editorialPulse";
export type CriticFindingSeverity = "low" | "medium" | "high";
export type CriticVerdict = "pass" | "warn" | "fail";
export type SectionType =
  | "hero"
  | "featureGrid"
  | "form"
  | "list"
  | "table"
  | "settings";

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export interface JSONArray extends Array<JSONValue> {}

export interface TypographyTokens {
  families: {
    sans: string;
    serif: string;
    mono: string;
  };
  scale: number[];
  lineHeights: number[];
  weights: number[];
}

export interface SpacingTokens {
  scale: number[];
  density: Record<DensityMode, number>;
}

export interface RadiusTokens {
  none: number;
  sm: number;
  md: number;
  lg: number;
  pill: number;
}

export interface TokensDocument {
  schemaVersion: string;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radii: RadiusTokens;
  containers: Record<BreakpointName, number>;
  breakpoints: Record<BreakpointName, number>;
  colors: {
    roles: Record<string, string>;
  };
}

export interface SectionNode {
  id: string;
  type: SectionType;
  variant: string;
  props: JSONObject;
  slots: Record<string, JSONValue>;
}

export interface PageDocument {
  schemaVersion: string;
  title: string;
  sections: SectionNode[];
}

export interface BreakpointConstraint {
  breakpoint: BreakpointName;
  columns: number;
  gutterToken: number;
  containerToken: BreakpointName;
}

export interface SectionConstraint {
  sectionType: SectionType;
  allowedVariants: string[];
  maxItems?: number;
}

export interface ConstraintsDocument {
  schemaVersion: string;
  layout: {
    breakpoints: BreakpointConstraint[];
    defaultDensity: DensityMode;
  };
  sectionRules: SectionConstraint[];
}

export interface SummaryDocument {
  schemaVersion: string;
  generatedAt: string;
  targetProfile: "portable-core";
  stress: StressDocument;
  system: {
    typographyScaleSteps: number;
    spacingScaleSteps: number;
    defaultDensity: DensityMode;
    colorRoleCount: number;
  };
  layout: {
    sectionCount: number;
    sectionOrder: SectionType[];
  };
  notes: string[];
}

export interface SettingsScreenBrief {
  schemaVersion: string;
  screenType: "settings";
  title: string;
  density: SettingsScreenDensity;
}

export interface OnboardingScreenBrief {
  schemaVersion: string;
  screenType: "onboarding";
  title: string;
  density: OnboardingScreenDensity;
}

export interface MarketingLandingScreenBrief {
  schemaVersion: string;
  screenType: "marketingLanding";
  title: string;
  density: MarketingLandingDensity;
}

export interface DashboardScreenBrief {
  schemaVersion: string;
  screenType: "dashboard";
  title: string;
  density: DashboardScreenDensity;
  artDirection: DashboardArtDirectionProfile;
}

export type ScreenBrief =
  | SettingsScreenBrief
  | OnboardingScreenBrief
  | MarketingLandingScreenBrief
  | DashboardScreenBrief;

export interface CriticRepairActionUpdateSection {
  type: "updateSection";
  sectionId: string;
  changes: {
    variant?: string;
    props?: JSONObject;
    slots?: Record<string, JSONValue>;
  };
}

export interface CriticRepairActionReorderSection {
  type: "reorderSection";
  sectionId: string;
  toIndex: number;
}

export interface CriticRepairActionRemoveSection {
  type: "removeSection";
  sectionId: string;
}

export type CriticRepairAction =
  | CriticRepairActionUpdateSection
  | CriticRepairActionReorderSection
  | CriticRepairActionRemoveSection;

export interface CriticSuggestedFix {
  id: string;
  label: string;
  description: string;
  actions: CriticRepairAction[];
}

export interface CriticFinding {
  code: string;
  severity: CriticFindingSeverity;
  message: string;
  path: string;
  suggestedFix?: CriticSuggestedFix;
}

export interface CriticReportSummary {
  totalRules: number;
  triggeredRules: number;
  severityCounts: Record<CriticFindingSeverity, number>;
}

export interface CriticReport {
  schemaVersion: string;
  screenType: ScreenType;
  score: number;
  verdict: CriticVerdict;
  findings: CriticFinding[];
  summary: CriticReportSummary;
}

export interface StressDocument {
  copyMode: StressCopyMode;
  stateMode: StressStateMode;
  densityMode: DensityMode;
}

export interface PlaygroundProject {
  tokens: TokensDocument;
  page: PageDocument;
  constraints: ConstraintsDocument;
  stress: StressDocument;
  summary: SummaryDocument;
}
