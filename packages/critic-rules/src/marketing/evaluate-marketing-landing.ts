import { runCritic } from "@bux/critic-core";
import type {
  MarketingLandingScreenBrief,
  PlaygroundProject
} from "@bux/core-model";
import { marketingLandingCriticRules } from "./marketing-rules";

export function evaluateMarketingLanding(
  project: PlaygroundProject,
  brief: MarketingLandingScreenBrief
) {
  return runCritic(
    {
      brief,
      project
    },
    marketingLandingCriticRules
  );
}
