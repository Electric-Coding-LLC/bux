import { canonicalProjectFixture } from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import { createWebstirAdapter } from "./index";

describe("webstirAdapter", () => {
  it("emits deterministic layout specs", () => {
    const adapter = createWebstirAdapter();
    const project = structuredClone(canonicalProjectFixture);

    const first = adapter.emitLayoutSpec(project, {
      generatedAt: "2026-03-02T00:00:00.000Z"
    });
    const second = adapter.emitLayoutSpec(project, {
      generatedAt: "2026-03-02T00:00:00.000Z"
    });

    expect(first).toEqual(second);
    expect(first.target).toBe("webstir");
    expect(first.adapterMeta.framework).toBe("webstir");
  });

  it("returns validation issues for invalid section config", () => {
    const adapter = createWebstirAdapter();
    const project = structuredClone(canonicalProjectFixture);
    project.page.sections[1]!.props.columns = 9;

    const issues = adapter.validate(project);
    expect(issues.length).toBeGreaterThan(0);
  });
});
