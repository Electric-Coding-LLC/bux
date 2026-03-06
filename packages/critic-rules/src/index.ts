import type { PlaygroundProject, ScreenBrief } from "@bux/core-model";
import { evaluateDashboardScreen } from "./dashboard/evaluate-dashboard-screen";
import { evaluateMarketingLanding } from "./marketing/evaluate-marketing-landing";
import { evaluateOnboardingScreen } from "./onboarding/evaluate-onboarding-screen";
import { evaluateSettingsScreen } from "./settings/evaluate-settings-screen";

export function evaluateScreen(
  project: PlaygroundProject,
  brief: ScreenBrief
) {
  switch (brief.screenType) {
    case "settings":
      return evaluateSettingsScreen(project, brief);
    case "onboarding":
      return evaluateOnboardingScreen(project, brief);
    case "marketingLanding":
      return evaluateMarketingLanding(project, brief);
    case "dashboard":
      return evaluateDashboardScreen(project, brief);
  }
}

export * from "./dashboard/evaluate-dashboard-screen";
export * from "./dashboard/dashboard-rules";
export * from "./marketing/evaluate-marketing-landing";
export * from "./marketing/marketing-rules";
export * from "./onboarding/evaluate-onboarding-screen";
export * from "./onboarding/onboarding-rules";
export * from "./settings/evaluate-settings-screen";
export * from "./settings/settings-rules";
