import { runCritic } from "@bux/critic-core";
import type { OnboardingScreenBrief, PlaygroundProject } from "@bux/core-model";
import { onboardingCriticRules } from "./onboarding-rules";

export function evaluateOnboardingScreen(
  project: PlaygroundProject,
  brief: OnboardingScreenBrief
) {
  return runCritic(
    {
      brief,
      project
    },
    onboardingCriticRules
  );
}
