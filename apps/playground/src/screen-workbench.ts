import {
  createPageFromBlueprint,
  getDefaultBlueprintId
} from "@bux/blueprint-library";
import { applyAction } from "@bux/core-engine";
import {
  canonicalDashboardScreenBriefFixture,
  canonicalMarketingLandingScreenBriefFixture,
  canonicalOnboardingScreenBriefFixture,
  canonicalProjectFixture,
  canonicalSettingsScreenBriefFixture,
  type DashboardScreenBrief,
  type MarketingLandingScreenBrief,
  type OnboardingScreenBrief,
  type PlaygroundProject,
  type ScreenBrief,
  type ScreenType,
  type SettingsScreenBrief
} from "@bux/core-model";

export function createInitialBrief(screenType: "settings"): SettingsScreenBrief;
export function createInitialBrief(
  screenType: "onboarding"
): OnboardingScreenBrief;
export function createInitialBrief(
  screenType: "marketingLanding"
): MarketingLandingScreenBrief;
export function createInitialBrief(screenType: "dashboard"): DashboardScreenBrief;
export function createInitialBrief(screenType: ScreenType): ScreenBrief;
export function createInitialBrief(screenType: ScreenType): ScreenBrief {
  switch (screenType) {
    case "settings":
      return structuredClone(canonicalSettingsScreenBriefFixture);
    case "onboarding":
      return structuredClone(canonicalOnboardingScreenBriefFixture);
    case "marketingLanding":
      return structuredClone(canonicalMarketingLandingScreenBriefFixture);
    case "dashboard":
      return structuredClone(canonicalDashboardScreenBriefFixture);
  }
}

export function applyBlueprintToProject<TBrief extends ScreenBrief>(
  project: PlaygroundProject,
  brief: TBrief,
  blueprintId: string
): PlaygroundProject {
  let nextProject = structuredClone(project);
  const page = createPageFromBlueprint(blueprintId, brief);

  for (const sectionId of nextProject.page.sections.map((section) => section.id)) {
    nextProject = applyAction(nextProject, {
      type: "removeSection",
      sectionId
    });
  }

  for (const section of page.sections) {
    nextProject = applyAction(nextProject, {
      type: "addSection",
      section
    });
  }

  nextProject.page.title = page.title;

  return nextProject;
}

export function createStarterProject(screenType: ScreenType): PlaygroundProject;
export function createStarterProject(screenType: ScreenType): PlaygroundProject {
  const brief = createInitialBrief(screenType);

  return applyBlueprintToProject(
    structuredClone(canonicalProjectFixture),
    brief,
    getDefaultBlueprintId(screenType)
  );
}

export function deriveBriefFromProject<TBrief extends ScreenBrief>(
  project: PlaygroundProject,
  sourceBrief: TBrief
): TBrief {
  const nextTitle = project.page.title.trim();

  return {
    ...sourceBrief,
    title: nextTitle.length > 0 ? nextTitle : sourceBrief.title
  };
}

export function syncProjectTitle(
  project: PlaygroundProject,
  title: string
): PlaygroundProject {
  if (project.page.title === title) {
    return project;
  }

  return {
    ...project,
    page: {
      ...project.page,
      title
    }
  };
}
