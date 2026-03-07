import { canonicalProjectFixture } from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import {
  generateCandidates,
  generateSettingsCandidates
} from "./candidate-generation";
import { createInitialBrief } from "./screen-workbench";
import { createInitialSettingsBrief } from "./settings-workbench";

describe("generateSettingsCandidates", () => {
  it("returns four deterministic candidates ranked strongest first", () => {
    const brief = createInitialSettingsBrief();
    const candidates = generateSettingsCandidates(
      structuredClone(canonicalProjectFixture),
      brief
    );

    expect(candidates).toHaveLength(4);
    expect([...candidates].map((candidate) => candidate.report.score)).toEqual(
      [...candidates]
        .map((candidate) => candidate.report.score)
        .sort((left, right) => right - left)
    );
    expect([...candidates].map((candidate) => candidate.blueprint.id).sort()).toEqual([
      "anchor-balance",
      "guided-rail",
      "primary-spotlight",
      "quiet-zones"
    ]);
    expect(candidates.every((candidate) => candidate.project.page.sections[0]?.type === "settings")).toBe(
      true
    );
    expect(candidates.some((candidate) => candidate.exportReadiness.status === "approved")).toBe(
      true
    );
    expect(
      candidates.find((candidate) => candidate.blueprint.id === "quiet-zones")?.exportReadiness
        .status
    ).toBe("blocked");
  });

  it("prioritizes density-aligned blueprints before fallback options", () => {
    const candidates = generateSettingsCandidates(
      structuredClone(canonicalProjectFixture),
      {
        ...createInitialSettingsBrief(),
        density: "compact"
      }
    );

    expect(candidates).toHaveLength(4);
    expect(candidates.map((candidate) => candidate.blueprint.id)).toEqual(
      expect.arrayContaining([
        "dense-ops",
        "guided-rail"
      ])
    );
    expect(candidates.map((candidate) => candidate.blueprint.id)).not.toContain(
      "quiet-zones"
    );
    expect(candidates.map((candidate) => candidate.blueprint.id).filter((blueprintId) =>
      ["dense-ops", "guided-rail"].includes(blueprintId)
    ).sort()).toEqual([
      "dense-ops",
      "guided-rail"
    ]);
  });

  it("attaches export-readiness metadata to each generated candidate", () => {
    const candidates = generateSettingsCandidates(
      structuredClone(canonicalProjectFixture),
      createInitialSettingsBrief()
    );

    const approvedCandidates = candidates.filter((candidate) => candidate.exportReadiness.canExport);
    const blockedCandidates = candidates.filter((candidate) => !candidate.exportReadiness.canExport);

    expect(approvedCandidates).toHaveLength(3);
    expect(blockedCandidates).toHaveLength(1);
    expect(approvedCandidates.every((candidate) => candidate.exportReadiness.summary === "Critic pass and export validation are both clear.")).toBe(
      true
    );
    expect(blockedCandidates[0]?.blueprint.id).toBe("quiet-zones");
    expect(blockedCandidates[0]?.exportReadiness.summary).toContain("Critic verdict is warn");
    expect(blockedCandidates[0]?.exportReadiness.blockedReasons).toHaveLength(1);
  });

  it("generates ranked onboarding candidates with hero-led flows", () => {
    const brief = createInitialBrief("onboarding");
    const candidates = generateCandidates(structuredClone(canonicalProjectFixture), brief);

    expect(candidates).toHaveLength(4);
    expect(candidates.every((candidate) => candidate.blueprint.screenType === "onboarding")).toBe(
      true
    );
    expect(candidates.every((candidate) => candidate.project.page.sections[0]?.type === "hero")).toBe(
      true
    );
    expect(candidates.some((candidate) => candidate.exportReadiness.canExport)).toBe(true);
  });

  it("generates ranked marketing landing candidates with hero-led story structure", () => {
    const brief = createInitialBrief("marketingLanding");
    const candidates = generateCandidates(structuredClone(canonicalProjectFixture), brief);

    expect(candidates).toHaveLength(4);
    expect(
      candidates.every((candidate) => candidate.blueprint.screenType === "marketingLanding")
    ).toBe(true);
    expect(candidates.every((candidate) => candidate.project.page.sections[0]?.type === "hero")).toBe(
      true
    );
    expect(
      candidates.some((candidate) =>
        candidate.project.page.sections.some((section) => section.type === "featureGrid")
      )
    ).toBe(true);
  });

  it("generates ranked dashboard candidates with a summary band and operational follow-up", () => {
    const brief = createInitialBrief("dashboard");
    const candidates = generateCandidates(structuredClone(canonicalProjectFixture), brief);

    expect(candidates).toHaveLength(4);
    expect(candidates.every((candidate) => candidate.blueprint.screenType === "dashboard")).toBe(
      true
    );
    expect(candidates.every((candidate) => candidate.project.page.sections[0]?.type === "featureGrid")).toBe(
      true
    );
    expect(
      candidates.some((candidate) =>
        candidate.project.page.sections.some(
          (section) => section.type === "list" || section.type === "table"
        )
      )
    ).toBe(true);
  });

  it("generates materially different dashboard candidates across art-direction profiles", () => {
    const quietBrief = createInitialBrief("dashboard");
    const commandBrief = {
      ...quietBrief,
      artDirection: "commandCenter" as const
    };

    const quietCandidates = generateCandidates(
      structuredClone(canonicalProjectFixture),
      quietBrief
    );
    const commandCandidates = generateCandidates(
      structuredClone(canonicalProjectFixture),
      commandBrief
    );

    const quietRadar = quietCandidates.find(
      (candidate) => candidate.blueprint.id === "ops-radar"
    );
    const commandRadar = commandCandidates.find(
      (candidate) => candidate.blueprint.id === "ops-radar"
    );

    expect(quietRadar).toBeDefined();
    expect(commandRadar).toBeDefined();
    expect(
      quietRadar?.project.tokens.colors.roles["accent.primary"]
    ).not.toBe(commandRadar?.project.tokens.colors.roles["accent.primary"]);
    expect(quietRadar?.project.page.sections[0]?.variant).toBe("minimal");
    expect(commandRadar?.project.page.sections[0]?.variant).toBe("cards");
    expect(quietRadar?.project.page.sections[2]?.variant).toBe("simple");
    expect(commandRadar?.project.page.sections[2]?.variant).toBe("detailed");
  });
});
