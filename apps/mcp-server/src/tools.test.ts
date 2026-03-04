import { canonicalProjectFixture } from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executeToolRequest, type ToolResponse } from "./tools";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectOk(response: ToolResponse): Record<string, unknown> {
  expect(response.ok).toBe(true);
  if (!response.ok) {
    throw new Error(`Expected success, received ${response.error.code}`);
  }

  if (!isRecord(response.result)) {
    throw new Error("Expected object result.");
  }

  return response.result;
}

function expectError(response: ToolResponse): {
  code: string;
  message: string;
  details?: unknown;
} {
  expect(response.ok).toBe(false);
  if (response.ok) {
    throw new Error("Expected error response.");
  }

  return response.error;
}

describe("mcp tools", () => {
  it("creates and opens a project from disk", async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), "bux-mcp-create-"));

    try {
      const created = await executeToolRequest({
        id: 1,
        tool: "project.create",
        input: { rootPath: outputDirectory }
      });
      const createResult = expectOk(created);
      expect(Array.isArray(createResult.savedFiles)).toBe(true);
      expect((createResult.savedFiles as unknown[]).length).toBe(4);

      const opened = await executeToolRequest({
        id: 2,
        tool: "project.open",
        input: { rootPath: outputDirectory }
      });
      const openResult = expectOk(opened);
      const project = openResult.project as typeof canonicalProjectFixture;
      expect(project.page.sections.length).toBeGreaterThan(0);
      expect(project.summary.schemaVersion).toBe("1.0.0");
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });

  it("updates tokens and summary timestamp through tokens.set", async () => {
    const response = await executeToolRequest({
      id: 3,
      tool: "tokens.set",
      input: {
        project: canonicalProjectFixture,
        path: ["radii", "md"],
        value: 12,
        generatedAt: "2026-03-02T12:00:00.000Z"
      }
    });
    const result = expectOk(response);
    const project = result.project as typeof canonicalProjectFixture;

    expect(project.tokens.radii.md).toBe(12);
    expect(project.summary.generatedAt).toBe("2026-03-02T12:00:00.000Z");
  });

  it("reports validation issues through validate.run", async () => {
    const invalidProject = structuredClone(canonicalProjectFixture);
    invalidProject.page.sections[0]!.props.ctaCount = 999;

    const response = await executeToolRequest({
      id: 4,
      tool: "validate.run",
      input: { project: invalidProject }
    });
    const result = expectOk(response);

    expect(result.ok).toBe(false);
    expect(Array.isArray(result.issues)).toBe(true);
    expect((result.issues as unknown[]).length).toBeGreaterThan(0);
  });

  it("exports bundle files in-memory and on disk", async () => {
    const inMemory = await executeToolRequest({
      id: 5,
      tool: "export.bundle",
      input: { project: canonicalProjectFixture }
    });
    const inMemoryResult = expectOk(inMemory);
    expect(isRecord(inMemoryResult.files)).toBe(true);
    expect(typeof (inMemoryResult.files as Record<string, unknown>)["tokens.json"]).toBe(
      "string"
    );

    const outputDirectory = await mkdtemp(join(tmpdir(), "bux-mcp-export-"));
    try {
      const onDisk = await executeToolRequest({
        id: 6,
        tool: "export.bundle",
        input: { project: canonicalProjectFixture, outputDirectory }
      });
      const diskResult = expectOk(onDisk);

      expect(diskResult.writtenTo).toBe(outputDirectory);
      expect(await Bun.file(join(outputDirectory, "tokens.json")).exists()).toBe(true);
      expect(await Bun.file(join(outputDirectory, "summary.json")).exists()).toBe(true);
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });

  it("returns adapter output for nextjs target", async () => {
    const response = await executeToolRequest({
      id: 7,
      tool: "adapter.emit",
      input: {
        project: canonicalProjectFixture,
        target: "nextjs",
        generatedAt: "2026-03-02T12:30:00.000Z"
      }
    });
    const result = expectOk(response);

    expect(Array.isArray(result.validationIssues)).toBe(true);
    expect(isRecord(result.layoutSpec)).toBe(true);
    expect((result.layoutSpec as Record<string, unknown>).target).toBe("nextjs");
    expect((result.layoutSpec as Record<string, unknown>).generatedAt).toBe(
      "2026-03-02T12:30:00.000Z"
    );
  });

  it("returns INVALID_INPUT for unsupported stress value", async () => {
    const response = await executeToolRequest({
      id: 8,
      tool: "stress.set",
      input: {
        project: canonicalProjectFixture,
        mode: "copyMode",
        value: "compact"
      }
    });
    const error = expectError(response);

    expect(error.code).toBe("INVALID_INPUT");
    expect(error.message).toContain("short or long");
  });

  it("returns INVALID_INPUT for empty token path", async () => {
    const response = await executeToolRequest({
      id: 9,
      tool: "tokens.set",
      input: {
        project: canonicalProjectFixture,
        path: [],
        value: 16
      }
    });
    const error = expectError(response);

    expect(error.code).toBe("INVALID_INPUT");
    expect(error.message).toContain("non-empty array");
  });

  it("returns INVALID_INPUT for malformed section add payload", async () => {
    const response = await executeToolRequest({
      id: 10,
      tool: "page.sections.add",
      input: {
        project: canonicalProjectFixture,
        section: {
          type: "hero",
          props: {},
          slots: {}
        }
      }
    });
    const error = expectError(response);

    expect(error.code).toBe("INVALID_INPUT");
    expect(error.message).toContain("input.section.variant");
  });

  it("updates and removes sections through section tools", async () => {
    const sectionId = canonicalProjectFixture.page.sections[0]!.id;

    const updated = await executeToolRequest({
      id: 11,
      tool: "page.sections.update",
      input: {
        project: canonicalProjectFixture,
        sectionId,
        changes: {
          props: {
            heading: "Updated heading from MCP"
          }
        },
        generatedAt: "2026-03-03T10:00:00.000Z"
      }
    });
    const updatedResult = expectOk(updated);
    const updatedProject = updatedResult.project as typeof canonicalProjectFixture;
    const updatedSection = updatedProject.page.sections.find(
      (section) => section.id === sectionId
    );
    expect(updatedSection?.props.heading).toBe("Updated heading from MCP");
    expect(updatedProject.summary.generatedAt).toBe("2026-03-03T10:00:00.000Z");

    const removed = await executeToolRequest({
      id: 12,
      tool: "page.sections.remove",
      input: {
        project: updatedProject,
        sectionId
      }
    });
    const removedResult = expectOk(removed);
    const removedProject = removedResult.project as typeof canonicalProjectFixture;
    expect(removedProject.page.sections.some((section) => section.id === sectionId)).toBe(
      false
    );
  });

  it("returns INVALID_INPUT when section update has no recognized changes", async () => {
    const response = await executeToolRequest({
      id: 13,
      tool: "page.sections.update",
      input: {
        project: canonicalProjectFixture,
        sectionId: canonicalProjectFixture.page.sections[0]!.id,
        changes: {}
      }
    });
    const error = expectError(response);

    expect(error.code).toBe("INVALID_INPUT");
    expect(error.message).toContain("at least one of variant, props, or slots");
  });

  it("returns IO_ERROR when project.save rootPath points to a file", async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), "bux-mcp-save-io-"));
    const blockedPath = join(outputDirectory, "blocked-path");
    await Bun.write(blockedPath, "not-a-directory");

    try {
      const response = await executeToolRequest({
        id: 14,
        tool: "project.save",
        input: {
          rootPath: blockedPath,
          project: canonicalProjectFixture
        }
      });
      const error = expectError(response);

      expect(error.code).toBe("IO_ERROR");
      expect(error.message).toContain("Unable to save project files");
      expect(isRecord(error.details)).toBe(true);
      expect((error.details as Record<string, unknown>).rootPath).toBe(blockedPath);
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });

  it("returns IO_ERROR when export.bundle outputDirectory points to a file", async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), "bux-mcp-export-io-"));
    const blockedPath = join(outputDirectory, "blocked-path");
    await Bun.write(blockedPath, "not-a-directory");

    try {
      const response = await executeToolRequest({
        id: 15,
        tool: "export.bundle",
        input: {
          project: canonicalProjectFixture,
          outputDirectory: blockedPath
        }
      });
      const error = expectError(response);

      expect(error.code).toBe("IO_ERROR");
      expect(error.message).toContain("Unable to write export bundle");
      expect(isRecord(error.details)).toBe(true);
      expect((error.details as Record<string, unknown>).outputDirectory).toBe(blockedPath);
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });

  it("returns INVALID_INPUT when reordering unknown section id", async () => {
    const response = await executeToolRequest({
      id: 16,
      tool: "page.sections.reorder",
      input: {
        project: canonicalProjectFixture,
        sectionId: "sec-missing-999",
        toIndex: 0
      }
    });
    const error = expectError(response);

    expect(error.code).toBe("INVALID_INPUT");
    expect(error.message).toContain("was not found");
  });
});
