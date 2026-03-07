import type {
  DashboardArtDirectionProfile,
  DashboardScreenBrief,
  MarketingLandingScreenBrief,
  OnboardingScreenBrief,
  PageDocument,
  ScreenBrief,
  SettingsScreenBrief
} from "@bux/core-model";

export interface ScreenBlueprintBase<TBrief extends ScreenBrief> {
  id: string;
  screenType: TBrief["screenType"];
  name: string;
  description: string;
  hierarchyIntent: string;
  densityEnvelope: TBrief["density"][];
  ctaStrategy: string;
  allowedVariants: string[];
  antiPatternNotes: string[];
  createPage: (brief: TBrief) => PageDocument;
}

export type SettingsBlueprint = ScreenBlueprintBase<SettingsScreenBrief>;
export type OnboardingBlueprint = ScreenBlueprintBase<OnboardingScreenBrief>;
export type MarketingLandingBlueprint =
  ScreenBlueprintBase<MarketingLandingScreenBrief>;
export interface DashboardBlueprint
  extends ScreenBlueprintBase<DashboardScreenBrief> {
  artDirectionProfiles: DashboardArtDirectionProfile[];
}
export type ScreenBlueprint =
  | SettingsBlueprint
  | OnboardingBlueprint
  | MarketingLandingBlueprint
  | DashboardBlueprint;
