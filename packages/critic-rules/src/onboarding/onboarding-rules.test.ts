import {
  canonicalOnboardingScreenBriefFixture,
  canonicalProjectFixture,
  type PlaygroundProject,
  type SectionNode
} from "@bux/core-model";
import { applyActions } from "@bux/core-engine";
import { describe, expect, it } from "bun:test";
import { evaluateOnboardingScreen } from "./evaluate-onboarding-screen";

function makeProject(sections: SectionNode[]): PlaygroundProject {
  const project = structuredClone(canonicalProjectFixture);
  project.page.title = "Onboarding candidate";
  project.page.sections = sections;
  return project;
}

function heroSection(ctaCount = 1): SectionNode {
  return {
    id: "sec-hero-001",
    type: "hero",
    variant: "split",
    props: {
      align: "start",
      ctaCount,
      hasMedia: true
    },
    slots: {
      eyebrow: "New workspace",
      heading: "Get your workspace ready",
      body: "Walk through the essential setup path before launch.",
      primaryCta: "Start setup"
    }
  };
}

function listSection(): SectionNode {
  return {
    id: "sec-list-001",
    type: "list",
    variant: "simple",
    props: {},
    slots: {
      heading: "Complete these steps",
      items: ["Name the workspace", "Invite the first owner", "Choose alerts"]
    }
  };
}

function formSection(): SectionNode {
  return {
    id: "sec-form-001",
    type: "form",
    variant: "stacked",
    props: {
      layout: "stacked"
    },
    slots: {
      heading: "Finish setup",
      fields: ["Workspace name", "Owner email", "Locale"],
      submitLabel: "Activate workspace"
    }
  };
}

function tableSection(): SectionNode {
  return {
    id: "sec-table-001",
    type: "table",
    variant: "comfortable",
    props: {
      columns: 3
    },
    slots: {
      heading: "Setup matrix",
      headers: ["Step", "Owner", "Status"],
      rows: [["Invite team", "Ops", "Pending"]]
    }
  };
}

describe("evaluateOnboardingScreen", () => {
  it("passes a focused onboarding flow with one intro and one activation surface", () => {
    const report = evaluateOnboardingScreen(
      makeProject([heroSection(), listSection(), formSection()]),
      canonicalOnboardingScreenBriefFixture
    );

    expect(report.verdict).toBe("pass");
    expect(report.score).toBe(100);
    expect(report.findings).toHaveLength(0);
  });

  it("flags missing intro and table misuse when onboarding starts too deep in the flow", () => {
    const report = evaluateOnboardingScreen(
      makeProject([formSection(), heroSection(), tableSection()]),
      canonicalOnboardingScreenBriefFixture
    );

    expect(report.verdict).toBe("fail");
    expect(report.findings.map((finding) => finding.code)).toEqual([
      "onboarding.missing_intro",
      "onboarding.table_misuse",
      "onboarding.weak_guidance"
    ]);
    expect(report.findings[0]?.suggestedFix?.id).toBe("onboarding.move_intro_to_top");
  });

  it("flags fragmented flow and competing CTAs when onboarding sprawls", () => {
    const report = evaluateOnboardingScreen(
      makeProject([
        heroSection(2),
        listSection(),
        {
          ...heroSection(1),
          id: "sec-hero-002"
        },
        formSection(),
        tableSection()
      ]),
      {
        ...canonicalOnboardingScreenBriefFixture,
        density: "compact"
      }
    );

    expect(report.findings.map((finding) => finding.code)).toEqual([
      "onboarding.fragmented_flow",
      "onboarding.table_misuse",
      "onboarding.fragmented_flow",
      "onboarding.competing_ctas"
    ]);
    expect(report.findings[0]?.suggestedFix?.id).toBe("onboarding.trim_extra_surfaces");
    expect(report.findings[3]?.suggestedFix?.id).toBe(
      "onboarding.simplify_ctas_sec-hero-001"
    );
  });

  it("applies the intro reorder fix and improves the critic score", () => {
    const project = makeProject([formSection(), heroSection(), listSection()]);
    const firstReport = evaluateOnboardingScreen(
      project,
      canonicalOnboardingScreenBriefFixture
    );
    const suggestedFix = firstReport.findings[0]?.suggestedFix;

    expect(suggestedFix).toBeDefined();

    const repairedProject = applyActions(project, suggestedFix?.actions ?? []);
    const repairedReport = evaluateOnboardingScreen(
      repairedProject,
      canonicalOnboardingScreenBriefFixture
    );

    expect(repairedReport.score).toBeGreaterThan(firstReport.score);
    expect(repairedProject.page.sections[0]?.type).toBe("hero");
  });
});
