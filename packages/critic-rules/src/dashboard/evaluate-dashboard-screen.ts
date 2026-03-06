import { runCritic } from "@bux/critic-core";
import type { DashboardScreenBrief, PlaygroundProject } from "@bux/core-model";
import { dashboardCriticRules } from "./dashboard-rules";

export function evaluateDashboardScreen(
  project: PlaygroundProject,
  brief: DashboardScreenBrief
) {
  return runCritic(
    {
      brief,
      project
    },
    dashboardCriticRules
  );
}
