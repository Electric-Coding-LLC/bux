import { canonicalProjectFixture } from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import { createSectionDraft } from "./section-templates";
import { validateProjectSections } from "./validate-sections";

function getProject() {
  return structuredClone(canonicalProjectFixture);
}

describe("validateProjectSections", () => {
  it("returns no issues for canonical fixture", () => {
    const issues = validateProjectSections(getProject());
    expect(issues).toHaveLength(0);
  });

  it("catches invalid props for hero and featureGrid", () => {
    const project = getProject();
    project.page.sections[0]!.props.ctaCount = 5;
    project.page.sections[1]!.props.columns = 8;

    const issues = validateProjectSections(project);
    expect(issues.some((entry) => entry.path.endsWith("/props/ctaCount"))).toBe(true);
    expect(issues.some((entry) => entry.path.endsWith("/props/columns"))).toBe(true);
  });

  it("catches disallowed variants", () => {
    const project = getProject();
    project.page.sections[0]!.variant = "invalid-variant";

    const issues = validateProjectSections(project);
    expect(issues.some((entry) => entry.code === "variant_not_allowed")).toBe(true);
  });

  it("catches duplicate section ids", () => {
    const project = getProject();
    project.page.sections[1]!.id = project.page.sections[0]!.id;

    const issues = validateProjectSections(project);
    const duplicateCount = issues.filter(
      (entry) => entry.code === "duplicate_section_id"
    ).length;

    expect(duplicateCount).toBe(2);
  });

  it("accepts template drafts for all v1 section types", () => {
    const base = getProject();
    base.page.sections = [];

    const types = [
      "hero",
      "featureGrid",
      "form",
      "list",
      "table",
      "settings"
    ] as const;

    base.page.sections = types.map((type, index) => ({
      id: `sec-${type.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}-${String(
        index + 1
      ).padStart(3, "0")}`,
      ...createSectionDraft(type)
    }));

    const issues = validateProjectSections(base);
    expect(issues).toHaveLength(0);
  });
});
