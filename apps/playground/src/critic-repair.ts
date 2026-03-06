import { applyActions, type EngineAction } from "@bux/core-engine";
import type {
  CriticRepairAction,
  CriticSuggestedFix,
  CriticVerdict,
  PlaygroundProject
} from "@bux/core-model";

export interface AppliedRepairOutcome {
  afterScore: number;
  afterVerdict: CriticVerdict;
  beforeScore: number;
  beforeVerdict: CriticVerdict;
  delta: number;
  label: string;
}

function toEngineAction(action: CriticRepairAction): EngineAction {
  switch (action.type) {
    case "removeSection":
      return action;
    case "reorderSection":
      return action;
    case "updateSection":
      return action;
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

export function applyCriticSuggestedFix(
  project: PlaygroundProject,
  fix: CriticSuggestedFix
): PlaygroundProject {
  return applyActions(project, fix.actions.map(toEngineAction));
}
