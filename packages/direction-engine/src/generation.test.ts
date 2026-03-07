import {
  canonicalDashboardScreenBriefFixture,
  canonicalProjectFixture
} from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import { generateCandidates } from "./generation";

describe("generateCandidates", () => {
  it("returns deterministic dashboard candidates for the same brief and base project", () => {
    const brief = structuredClone(canonicalDashboardScreenBriefFixture);

    const first = generateCandidates(
      structuredClone(canonicalProjectFixture),
      brief
    );
    const second = generateCandidates(
      structuredClone(canonicalProjectFixture),
      brief
    );

    expect(first.map((candidate) => candidate.blueprint.id)).toEqual(
      second.map((candidate) => candidate.blueprint.id)
    );
    expect(first.map((candidate) => candidate.report.score)).toEqual(
      second.map((candidate) => candidate.report.score)
    );
  });

  it("prioritizes art-direction-compatible dashboard blueprints before drifting options", () => {
    const brief = {
      ...structuredClone(canonicalDashboardScreenBriefFixture),
      artDirection: "commandCenter" as const,
      density: "operational" as const
    };
    const candidates = generateCandidates(
      structuredClone(canonicalProjectFixture),
      brief
    );

    expect(candidates).toHaveLength(4);
    expect(candidates.slice(0, 2).every((candidate) => {
      return (
        candidate.blueprint.screenType === "dashboard" &&
        candidate.blueprint.artDirectionProfiles.includes(brief.artDirection)
      );
    })).toBe(true);
  });
});
