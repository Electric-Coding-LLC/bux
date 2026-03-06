import {
  canonicalMarketingLandingScreenBriefFixture,
  canonicalProjectFixture,
  type PlaygroundProject,
  type SectionNode
} from "@bux/core-model";
import { applyActions } from "@bux/core-engine";
import { describe, expect, it } from "bun:test";
import { evaluateMarketingLanding } from "./evaluate-marketing-landing";

function makeProject(sections: SectionNode[]): PlaygroundProject {
  const project = structuredClone(canonicalProjectFixture);
  project.page.title = "Marketing landing candidate";
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
      eyebrow: "Product launch",
      heading: "Launch with a clearer product story",
      body: "Lead with the product claim, then move into proof and conversion.",
      primaryCta: "Book a demo",
      secondaryCta: "Read more"
    }
  };
}

function featureGridSection(): SectionNode {
  return {
    id: "sec-feature-grid-001",
    type: "featureGrid",
    variant: "minimal",
    props: {
      columns: 3,
      showIcons: false
    },
    slots: {
      heading: "Why it is stronger",
      items: [
        { title: "Stronger hierarchy", body: "One clear visual story." },
        { title: "Deterministic output", body: "Repeatable export boundary." },
        { title: "Less revision debt", body: "Reject weak candidates earlier." }
      ]
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
      heading: "What teams stop doing",
      items: [
        "Correcting weak hierarchy by hand",
        "Accepting generic dashboard chrome",
        "Exporting weak candidates by accident"
      ]
    }
  };
}

function formSection(): SectionNode {
  return {
    id: "sec-form-001",
    type: "form",
    variant: "inline",
    props: {
      layout: "inline"
    },
    slots: {
      heading: "Talk to us",
      fields: ["Work email", "Company"],
      submitLabel: "Request demo"
    }
  };
}

function settingsSection(): SectionNode {
  return {
    id: "sec-settings-001",
    type: "settings",
    variant: "grouped",
    props: {
      groupCount: 3
    },
    slots: {
      heading: "Workspace settings",
      groups: ["Profile", "Notifications", "Security"]
    }
  };
}

describe("evaluateMarketingLanding", () => {
  it("passes a focused landing page with one clear pitch and proof stack", () => {
    const report = evaluateMarketingLanding(
      makeProject([heroSection(), featureGridSection(), formSection()]),
      canonicalMarketingLandingScreenBriefFixture
    );

    expect(report.verdict).toBe("pass");
    expect(report.score).toBe(100);
    expect(report.findings).toHaveLength(0);
  });

  it("flags a buried hero and dashboard drift when operational sections appear", () => {
    const report = evaluateMarketingLanding(
      makeProject([settingsSection(), heroSection(), featureGridSection()]),
      canonicalMarketingLandingScreenBriefFixture
    );

    expect(report.verdict).toBe("fail");
    expect(report.findings.map((finding) => finding.code)).toEqual([
      "marketing.dashboard_drift",
      "marketing.missing_primary_pitch"
    ]);
    expect(report.findings[0]?.suggestedFix?.id).toBe(
      "marketing.remove_operational_sections"
    );
    expect(report.findings[1]?.suggestedFix?.id).toBe("marketing.move_hero_to_top");
  });

  it("flags fragmented narrative and launch CTA competition", () => {
    const report = evaluateMarketingLanding(
      makeProject([
        heroSection(2),
        featureGridSection(),
        listSection(),
        formSection(),
        {
          ...featureGridSection(),
          id: "sec-feature-grid-002"
        }
      ]),
      {
        ...canonicalMarketingLandingScreenBriefFixture,
        density: "launch"
      }
    );

    expect(report.findings.map((finding) => finding.code)).toEqual([
      "marketing.fragmented_narrative",
      "marketing.weak_conversion_path"
    ]);
    expect(report.findings[0]?.suggestedFix?.id).toBe("marketing.trim_narrative_surfaces");
    expect(report.findings[1]?.suggestedFix?.id).toBe("marketing.simplify_ctas_sec-hero-001");
  });

  it("applies the hero reorder fix and improves the critic score", () => {
    const project = makeProject([featureGridSection(), heroSection(), formSection()]);
    const firstReport = evaluateMarketingLanding(
      project,
      canonicalMarketingLandingScreenBriefFixture
    );
    const suggestedFix = firstReport.findings[0]?.suggestedFix;

    expect(suggestedFix).toBeDefined();

    const repairedProject = applyActions(project, suggestedFix?.actions ?? []);
    const repairedReport = evaluateMarketingLanding(
      repairedProject,
      canonicalMarketingLandingScreenBriefFixture
    );

    expect(repairedReport.score).toBeGreaterThan(firstReport.score);
    expect(repairedProject.page.sections[0]?.type).toBe("hero");
  });
});
