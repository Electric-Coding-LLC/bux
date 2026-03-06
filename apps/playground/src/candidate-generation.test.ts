import { canonicalProjectFixture } from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import { generateSettingsCandidates } from "./candidate-generation";
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
});
