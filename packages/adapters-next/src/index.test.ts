import { canonicalProjectFixture } from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import { createNextAdapter } from "./index";

describe("nextAdapter", () => {
  it("emits deterministic layout specs", () => {
    const adapter = createNextAdapter();
    const project = structuredClone(canonicalProjectFixture);

    const first = adapter.emitLayoutSpec(project, {
      generatedAt: "2026-03-02T00:00:00.000Z"
    });
    const second = adapter.emitLayoutSpec(project, {
      generatedAt: "2026-03-02T00:00:00.000Z"
    });

    expect(first).toEqual(second);
    expect(first.target).toBe("nextjs");
    expect(first.adapterMeta.framework).toBe("nextjs-react");
  });

  it("returns validation issues for invalid section config", () => {
    const adapter = createNextAdapter();
    const project = structuredClone(canonicalProjectFixture);
    project.page.sections[0]!.props.ctaCount = 7;

    const issues = adapter.validate(project);
    expect(issues.length).toBeGreaterThan(0);
  });
});
