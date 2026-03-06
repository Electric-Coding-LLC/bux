import { canonicalProjectFixture } from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import {
  clampResponsiveColumns,
  resolveInlineFieldColumns,
  resolvePreviewLayout
} from "./layout";

describe("resolvePreviewLayout", () => {
  it("uses the requested constraint breakpoint when present", () => {
    const layout = resolvePreviewLayout(canonicalProjectFixture, "sm");

    expect(layout.breakpoint).toBe("sm");
    expect(layout.columns).toBe(8);
    expect(layout.containerWidth).toBe(640);
    expect(layout.gutter).toBe(16);
  });

  it("falls back to md when the requested breakpoint is unavailable", () => {
    const project = structuredClone(canonicalProjectFixture);
    project.constraints.layout.breakpoints = project.constraints.layout.breakpoints.filter(
      (entry) => entry.breakpoint !== "xl"
    );

    const layout = resolvePreviewLayout(project, "xl");
    expect(layout.breakpoint).toBe("md");
  });
});

describe("responsive helpers", () => {
  it("clamps section columns based on layout density", () => {
    const compactLayout = resolvePreviewLayout(canonicalProjectFixture, "xs");
    const mediumLayout = resolvePreviewLayout(canonicalProjectFixture, "sm");
    const wideLayout = resolvePreviewLayout(canonicalProjectFixture, "lg");

    expect(
      clampResponsiveColumns(4, compactLayout, { compact: 1, medium: 2, wide: 4 })
    ).toBe(1);
    expect(
      clampResponsiveColumns(4, mediumLayout, { compact: 1, medium: 2, wide: 4 })
    ).toBe(2);
    expect(
      clampResponsiveColumns(4, wideLayout, { compact: 1, medium: 2, wide: 4 })
    ).toBe(4);
  });

  it("resolves inline form columns by breakpoint scale", () => {
    expect(resolveInlineFieldColumns(resolvePreviewLayout(canonicalProjectFixture, "xs"))).toBe(
      1
    );
    expect(resolveInlineFieldColumns(resolvePreviewLayout(canonicalProjectFixture, "sm"))).toBe(
      2
    );
    expect(resolveInlineFieldColumns(resolvePreviewLayout(canonicalProjectFixture, "lg"))).toBe(
      3
    );
  });
});
