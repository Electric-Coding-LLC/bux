import { canonicalProjectFixture } from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import { generateCandidates } from "./candidate-generation";
import {
  getDashboardReferencePack,
  summarizeDashboardVisualCompare
} from "./dashboard-visual-compare";
import { createInitialBrief } from "./screen-workbench";

describe("dashboard visual compare", () => {
  it("returns a reference pack for each dashboard art-direction profile", () => {
    const quietPack = getDashboardReferencePack("quietSignal");
    const commandPack = getDashboardReferencePack("commandCenter");
    const editorialPack = getDashboardReferencePack("editorialPulse");

    expect(quietPack.references).toHaveLength(2);
    expect(commandPack.references).toHaveLength(2);
    expect(editorialPack.references).toHaveLength(2);
    expect(quietPack.title).toContain("calm operational dashboards");
    expect(commandPack.profileLabel).toBe("Command Center");
    expect(editorialPack.profileLabel).toBe("Editorial Pulse");
  });

  it("marks strong dashboard candidates that match the chosen reference canon", () => {
    const quietBrief = createInitialBrief("dashboard");
    const commandBrief = {
      ...quietBrief,
      artDirection: "commandCenter" as const
    };

    const quietExecutive = generateCandidates(
      structuredClone(canonicalProjectFixture),
      quietBrief
    ).find((candidate) => candidate.blueprint.id === "executive-briefing");
    const commandOps = generateCandidates(
      structuredClone(canonicalProjectFixture),
      commandBrief
    ).find((candidate) => candidate.blueprint.id === "ops-radar");

    expect(quietExecutive).toBeDefined();
    expect(commandOps).toBeDefined();

    expect(summarizeDashboardVisualCompare(quietExecutive!)).toMatchObject({
      label: "Strong reference fit",
      status: "strong"
    });
    expect(summarizeDashboardVisualCompare(commandOps!)).toMatchObject({
      label: "Strong reference fit",
      status: "strong"
    });
  });

  it("flags dashboard candidates that still drift from the chosen visual canon", () => {
    const commandBrief = {
      ...createInitialBrief("dashboard"),
      artDirection: "commandCenter" as const
    };
    const driftingCandidate = generateCandidates(
      structuredClone(canonicalProjectFixture),
      commandBrief
    ).find((candidate) => candidate.blueprint.id === "flash-overview");

    expect(driftingCandidate).toBeDefined();
    expect(summarizeDashboardVisualCompare(driftingCandidate!)).toMatchObject({
      label: "Drifting from the reference canon",
      status: "drifting"
    });
  });
});
