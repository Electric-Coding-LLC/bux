import type {
  ScreenBrief,
  ScreenType,
  PageDocument
} from "@bux/core-model";
import {
  createDashboardPageFromBlueprint,
  dashboardBlueprints,
  defaultDashboardBlueprintId,
  getDashboardBlueprint
} from "./dashboard/dashboard-blueprints";
import {
  createMarketingLandingPageFromBlueprint,
  defaultMarketingLandingBlueprintId,
  getMarketingLandingBlueprint,
  marketingLandingBlueprints
} from "./marketing/marketing-blueprints";
import {
  createOnboardingPageFromBlueprint,
  defaultOnboardingBlueprintId,
  getOnboardingBlueprint,
  onboardingBlueprints
} from "./onboarding/onboarding-blueprints";
import {
  createSettingsPageFromBlueprint,
  defaultSettingsBlueprintId,
  getSettingsBlueprint,
  settingsBlueprints
} from "./settings/settings-blueprints";
import type {
  DashboardBlueprint,
  MarketingLandingBlueprint,
  OnboardingBlueprint,
  SettingsBlueprint
} from "./types";

export * from "./dashboard/dashboard-blueprints";
export * from "./marketing/marketing-blueprints";
export * from "./onboarding/onboarding-blueprints";
export * from "./settings/settings-blueprints";
export * from "./types";

export function getBlueprintsForScreenType(screenType: ScreenType) {
  switch (screenType) {
    case "settings":
      return settingsBlueprints;
    case "onboarding":
      return onboardingBlueprints;
    case "marketingLanding":
      return marketingLandingBlueprints;
    case "dashboard":
      return dashboardBlueprints;
  }
}

export function getDefaultBlueprintId(screenType: ScreenType): string {
  switch (screenType) {
    case "settings":
      return defaultSettingsBlueprintId;
    case "onboarding":
      return defaultOnboardingBlueprintId;
    case "marketingLanding":
      return defaultMarketingLandingBlueprintId;
    case "dashboard":
      return defaultDashboardBlueprintId;
  }
}

export function getBlueprint(
  blueprintId: string,
  screenType: ScreenType
):
  | SettingsBlueprint
  | OnboardingBlueprint
  | MarketingLandingBlueprint
  | DashboardBlueprint {
  switch (screenType) {
    case "settings":
      return getSettingsBlueprint(blueprintId);
    case "onboarding":
      return getOnboardingBlueprint(blueprintId);
    case "marketingLanding":
      return getMarketingLandingBlueprint(blueprintId);
    case "dashboard":
      return getDashboardBlueprint(blueprintId);
  }
}

export function createPageFromBlueprint(
  blueprintId: string,
  brief: ScreenBrief
): PageDocument {
  switch (brief.screenType) {
    case "settings":
      return createSettingsPageFromBlueprint(blueprintId, brief);
    case "onboarding":
      return createOnboardingPageFromBlueprint(blueprintId, brief);
    case "marketingLanding":
      return createMarketingLandingPageFromBlueprint(blueprintId, brief);
    case "dashboard":
      return createDashboardPageFromBlueprint(blueprintId, brief);
  }
}
