import type {
  ScreenBrief,
  ScreenType,
  PageDocument
} from "@bux/core-model";
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
import type { MarketingLandingBlueprint, OnboardingBlueprint, SettingsBlueprint } from "./types";

export * from "./marketing/marketing-blueprints";
export * from "./onboarding/onboarding-blueprints";
export * from "./settings/settings-blueprints";
export * from "./types";

export function getBlueprintsForScreenType(screenType: ScreenType) {
  return screenType === "settings"
    ? settingsBlueprints
    : screenType === "onboarding"
      ? onboardingBlueprints
      : marketingLandingBlueprints;
}

export function getDefaultBlueprintId(screenType: ScreenType): string {
  return screenType === "settings"
    ? defaultSettingsBlueprintId
    : screenType === "onboarding"
      ? defaultOnboardingBlueprintId
      : defaultMarketingLandingBlueprintId;
}

export function getBlueprint(
  blueprintId: string,
  screenType: ScreenType
): SettingsBlueprint | OnboardingBlueprint | MarketingLandingBlueprint {
  return screenType === "settings"
    ? getSettingsBlueprint(blueprintId)
    : screenType === "onboarding"
      ? getOnboardingBlueprint(blueprintId)
      : getMarketingLandingBlueprint(blueprintId);
}

export function createPageFromBlueprint(
  blueprintId: string,
  brief: ScreenBrief
): PageDocument {
  return brief.screenType === "settings"
    ? createSettingsPageFromBlueprint(blueprintId, brief)
    : brief.screenType === "onboarding"
      ? createOnboardingPageFromBlueprint(blueprintId, brief)
      : createMarketingLandingPageFromBlueprint(blueprintId, brief);
}
