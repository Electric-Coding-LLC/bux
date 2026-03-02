import { canonicalProjectFixture, type JSONValue } from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import { canonicalJSONStringify } from "./canonical-json";
import { createExportBundleFiles } from "./export-bundle";
import { ExportValidationError, collectValidationIssues } from "./validate-project";

const fixtureDirectory = join(import.meta.dir, "../../../fixtures/canonical-project");

async function readFixtureFile(fileName: string): Promise<string> {
  return Bun.file(join(fixtureDirectory, fileName)).text();
}

describe("canonicalJSONStringify", () => {
  it("sorts object keys recursively", () => {
    const sample = {
      z: 1,
      a: {
        k: 3,
        b: 2
      }
    } satisfies JSONValue;

    const serialized = canonicalJSONStringify(sample);
    expect(serialized).toBe('{\n  "a": {\n    "b": 2,\n    "k": 3\n  },\n  "z": 1\n}\n');
  });
});

describe("createExportBundleFiles", () => {
  it("produces deterministic output for identical input", () => {
    const first = createExportBundleFiles(canonicalProjectFixture);
    const second = createExportBundleFiles(canonicalProjectFixture);

    expect(first).toEqual(second);
  });

  it("matches the canonical fixture documents", async () => {
    const output = createExportBundleFiles(canonicalProjectFixture);

    const expectedTokens = await readFixtureFile("tokens.json");
    const expectedPage = await readFixtureFile("page.json");
    const expectedConstraints = await readFixtureFile("constraints.json");
    const expectedSummary = await readFixtureFile("summary.json");

    expect(output["tokens.json"]).toBe(expectedTokens);
    expect(output["page.json"]).toBe(expectedPage);
    expect(output["constraints.json"]).toBe(expectedConstraints);
    expect(output["summary.json"]).toBe(expectedSummary);
  });

  it("throws structured errors for invalid documents", () => {
    const invalidProject = structuredClone(canonicalProjectFixture);
    invalidProject.tokens.spacing.density.compact = 0.1;

    expect(() => createExportBundleFiles(invalidProject)).toThrow(
      ExportValidationError
    );
  });

  it("throws when semantic section constraints are invalid", () => {
    const invalidProject = structuredClone(canonicalProjectFixture);
    invalidProject.page.sections[0]!.props.ctaCount = 7;

    expect(() => createExportBundleFiles(invalidProject)).toThrow(
      ExportValidationError
    );
  });
});

describe("collectValidationIssues", () => {
  it("returns document-scoped validation details", () => {
    const invalidProject = structuredClone(canonicalProjectFixture);
    invalidProject.tokens.spacing.density.compact = 0.1;

    const issues = collectValidationIssues(invalidProject);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.document).toBe("tokens.json");
    expect(issues[0]?.instancePath).toContain("/spacing/density/compact");
  });

  it("includes section-kit validation issues in page scope", () => {
    const invalidProject = structuredClone(canonicalProjectFixture);
    invalidProject.page.sections[0]!.props.ctaCount = 7;

    const issues = collectValidationIssues(invalidProject);
    const sectionIssue = issues.find((entry) =>
      entry.schemaPath.startsWith("/section-kit/")
    );

    expect(sectionIssue?.document).toBe("page.json");
    expect(sectionIssue?.instancePath).toContain("/page/sections/0/props/ctaCount");
  });
});
