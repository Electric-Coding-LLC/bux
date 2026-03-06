import { runCritic } from "@bux/critic-core";
import type { PlaygroundProject, SettingsScreenBrief } from "@bux/core-model";
import { settingsCriticRules } from "./settings-rules";

export function evaluateSettingsScreen(
  project: PlaygroundProject,
  brief: SettingsScreenBrief
) {
  return runCritic(
    {
      brief,
      project
    },
    settingsCriticRules
  );
}
