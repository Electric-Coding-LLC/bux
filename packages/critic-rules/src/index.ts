import type { PlaygroundProject, ScreenBrief } from "@bux/core-model";
import { evaluateMarketingLanding } from "./marketing/evaluate-marketing-landing";
import { evaluateOnboardingScreen } from "./onboarding/evaluate-onboarding-screen";
import { evaluateSettingsScreen } from "./settings/evaluate-settings-screen";

export function evaluateScreen(
  project: PlaygroundProject,
  brief: ScreenBrief
) {
  return brief.screenType === "settings"
    ? evaluateSettingsScreen(project, brief)
    : brief.screenType === "onboarding"
      ? evaluateOnboardingScreen(project, brief)
      : evaluateMarketingLanding(project, brief);
}

export * from "./marketing/evaluate-marketing-landing";
export * from "./marketing/marketing-rules";
export * from "./onboarding/evaluate-onboarding-screen";
export * from "./onboarding/onboarding-rules";
export * from "./settings/evaluate-settings-screen";
export * from "./settings/settings-rules";
