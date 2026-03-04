import { createNextAdapter } from "@bux/adapters-next";
import { createWebstirAdapter } from "@bux/adapters-webstir";
import {
  applyAction,
  type AddSectionAction,
  type UpdateSectionAction
} from "@bux/core-engine";
import {
  canonicalProjectFixture,
  type DensityMode,
  type JSONObject,
  type JSONValue,
  type PlaygroundProject,
  type StressCopyMode,
  type StressStateMode
} from "@bux/core-model";
import {
  collectValidationIssues,
  createExportBundleFiles,
  writeExportBundle
} from "@bux/exporter";
import { access } from "node:fs/promises";
import { join } from "node:path";
import {
  CONTRACT_VERSION,
  McpToolError,
  toErrorShape,
  validationFailed
} from "./errors";
import { loadProjectFromDirectory, requiredProjectFiles } from "./project-files";

type RequestId = string | number | null;

export interface ToolRequestEnvelope {
  id?: RequestId;
  tool?: unknown;
  input?: unknown;
}

export interface ToolSuccessResponse {
  id: RequestId;
  contractVersion: typeof CONTRACT_VERSION;
  ok: true;
  result: unknown;
}

export interface ToolErrorResponse {
  id: RequestId;
  contractVersion: typeof CONTRACT_VERSION;
  ok: false;
  error: ReturnType<typeof toErrorShape>;
}

export type ToolResponse = ToolSuccessResponse | ToolErrorResponse;

const adapters = {
  nextjs: createNextAdapter(),
  webstir: createWebstirAdapter()
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new McpToolError("INVALID_INPUT", `${path} must be an object.`);
  }

  return value;
}

function assertString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new McpToolError("INVALID_INPUT", `${path} must be a non-empty string.`);
  }

  return value;
}

function optionalString(value: unknown, path: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return assertString(value, path);
}

function optionalBoolean(value: unknown, path: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new McpToolError("INVALID_INPUT", `${path} must be a boolean.`);
  }

  return value;
}

function optionalNumber(value: unknown, path: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new McpToolError("INVALID_INPUT", `${path} must be a number.`);
  }

  return value;
}

function assertStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new McpToolError(
      "INVALID_INPUT",
      `${path} must be an array of strings.`
    );
  }

  return value;
}

function isJSONValue(value: unknown): value is JSONValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((entry) => isJSONValue(entry));
  }

  if (isRecord(value)) {
    return Object.values(value).every((entry) => isJSONValue(entry));
  }

  return false;
}

function assertJSONValue(value: unknown, path: string): JSONValue {
  if (!isJSONValue(value)) {
    throw new McpToolError("INVALID_INPUT", `${path} must be JSON-serializable.`);
  }

  return value;
}

function assertJSONObject(value: unknown, path: string): JSONObject {
  const record = assertRecord(value, path);
  for (const [key, entry] of Object.entries(record)) {
    assertJSONValue(entry, `${path}.${key}`);
  }

  return record as JSONObject;
}

function optionalGeneratedAt(input: Record<string, unknown>): string | undefined {
  return optionalString(input.generatedAt, "input.generatedAt");
}

function assertProject(value: unknown): PlaygroundProject {
  if (!isRecord(value)) {
    throw new McpToolError("INVALID_INPUT", "input.project must be an object.");
  }

  return value as unknown as PlaygroundProject;
}

async function ensureCanCreateProject(rootPath: string, overwrite: boolean): Promise<void> {
  if (overwrite) {
    return;
  }

  const existingPaths = (
    await Promise.all(
      requiredProjectFiles.map(async (fileName) => {
        const filePath = join(rootPath, fileName);
        try {
          await access(filePath);
          return filePath;
        } catch {
          return null;
        }
      })
    )
  ).filter((entry): entry is string => entry !== null);

  if (existingPaths.length > 0) {
    throw new McpToolError(
      "IO_ERROR",
      "Refusing to overwrite existing project files.",
      existingPaths
    );
  }
}

function ensureProjectValid(project: PlaygroundProject): void {
  const issues = collectValidationIssues(project);
  if (issues.length > 0) {
    throw validationFailed(
      `Project validation failed with ${issues.length} issue${
        issues.length === 1 ? "" : "s"
      }.`,
      issues
    );
  }
}

function toEngineOptions(generatedAt: string | undefined): { generatedAt?: string } {
  return generatedAt === undefined ? {} : { generatedAt };
}

async function handleProjectOpen(input: unknown): Promise<unknown> {
  const payload = assertRecord(input, "input");
  const rootPath = assertString(payload.rootPath, "input.rootPath");

  try {
    const project = await loadProjectFromDirectory(rootPath);
    ensureProjectValid(project);
    return { project };
  } catch (error: unknown) {
    if (error instanceof McpToolError) {
      throw error;
    }

    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      throw new McpToolError("NOT_FOUND", "Project files were not found.", {
        rootPath
      });
    }

    if (error instanceof SyntaxError) {
      throw new McpToolError("INVALID_INPUT", "Project file contains invalid JSON.", {
        rootPath
      });
    }

    throw new McpToolError("IO_ERROR", "Unable to open project.", {
      rootPath,
      cause: error instanceof Error ? error.message : "unknown"
    });
  }
}

async function handleProjectSave(input: unknown): Promise<unknown> {
  const payload = assertRecord(input, "input");
  const rootPath = assertString(payload.rootPath, "input.rootPath");
  const project = assertProject(payload.project);

  const result = await writeExportBundle(project, rootPath);
  return {
    savedFiles: Object.keys(result.files).map((fileName) => join(rootPath, fileName))
  };
}

async function handleProjectCreate(input: unknown): Promise<unknown> {
  const payload = assertRecord(input, "input");
  const rootPath = assertString(payload.rootPath, "input.rootPath");
  const overwrite = optionalBoolean(payload.overwrite, "input.overwrite") ?? false;

  await ensureCanCreateProject(rootPath, overwrite);

  const project = structuredClone(canonicalProjectFixture);
  const result = await writeExportBundle(project, rootPath);

  return {
    project,
    savedFiles: Object.keys(result.files).map((fileName) => join(rootPath, fileName))
  };
}

async function handleTokensSet(input: unknown): Promise<unknown> {
  const payload = assertRecord(input, "input");
  const project = assertProject(payload.project);
  const path = assertStringArray(payload.path, "input.path");
  const generatedAt = optionalGeneratedAt(payload);

  const nextProject = applyAction(
    project,
    {
      type: "setTokenValue",
      path,
      value: assertJSONValue(payload.value, "input.value")
    },
    toEngineOptions(generatedAt)
  );

  return { project: nextProject };
}

async function handlePageSectionsAdd(input: unknown): Promise<unknown> {
  const payload = assertRecord(input, "input");
  const project = assertProject(payload.project);
  const section = assertRecord(payload.section, "input.section");
  const generatedAt = optionalGeneratedAt(payload);
  const index = optionalNumber(payload.index, "input.index");

  const action: AddSectionAction = {
    type: "addSection",
    section: section as AddSectionAction["section"],
    ...(index === undefined ? {} : { index })
  };
  const nextProject = applyAction(project, action, toEngineOptions(generatedAt));
  return { project: nextProject };
}

async function handlePageSectionsUpdate(input: unknown): Promise<unknown> {
  const payload = assertRecord(input, "input");
  const project = assertProject(payload.project);
  const sectionId = assertString(payload.sectionId, "input.sectionId");
  const changesPayload = assertRecord(payload.changes, "input.changes");
  const generatedAt = optionalGeneratedAt(payload);

  const changes: UpdateSectionAction["changes"] = {};

  if (changesPayload.variant !== undefined) {
    changes.variant = assertString(changesPayload.variant, "input.changes.variant");
  }

  if (changesPayload.props !== undefined) {
    changes.props = assertJSONObject(changesPayload.props, "input.changes.props");
  }

  if (changesPayload.slots !== undefined) {
    changes.slots = assertJSONObject(changesPayload.slots, "input.changes.slots");
  }

  const nextProject = applyAction(
    project,
    {
      type: "updateSection",
      sectionId,
      changes
    },
    toEngineOptions(generatedAt)
  );

  return { project: nextProject };
}

async function handlePageSectionsReorder(input: unknown): Promise<unknown> {
  const payload = assertRecord(input, "input");
  const project = assertProject(payload.project);
  const sectionId = assertString(payload.sectionId, "input.sectionId");
  const toIndex = optionalNumber(payload.toIndex, "input.toIndex");
  const generatedAt = optionalGeneratedAt(payload);

  if (toIndex === undefined) {
    throw new McpToolError("INVALID_INPUT", "input.toIndex must be a number.");
  }

  const nextProject = applyAction(
    project,
    {
      type: "reorderSection",
      sectionId,
      toIndex
    },
    toEngineOptions(generatedAt)
  );

  return { project: nextProject };
}

async function handlePageSectionsRemove(input: unknown): Promise<unknown> {
  const payload = assertRecord(input, "input");
  const project = assertProject(payload.project);
  const sectionId = assertString(payload.sectionId, "input.sectionId");
  const generatedAt = optionalGeneratedAt(payload);

  const nextProject = applyAction(
    project,
    {
      type: "removeSection",
      sectionId
    },
    toEngineOptions(generatedAt)
  );

  return { project: nextProject };
}

async function handleStressSet(input: unknown): Promise<unknown> {
  const payload = assertRecord(input, "input");
  const project = assertProject(payload.project);
  const mode = assertString(payload.mode, "input.mode");
  const value = assertString(payload.value, "input.value");
  const generatedAt = optionalGeneratedAt(payload);

  if (mode !== "copyMode" && mode !== "stateMode" && mode !== "densityMode") {
    throw new McpToolError(
      "INVALID_INPUT",
      "input.mode must be copyMode, stateMode, or densityMode."
    );
  }

  const typedValue = value as StressCopyMode | StressStateMode | DensityMode;

  const nextProject = applyAction(
    project,
    {
      type: "setStressMode",
      mode,
      value: typedValue
    },
    toEngineOptions(generatedAt)
  );

  return { project: nextProject };
}

async function handleValidateRun(input: unknown): Promise<unknown> {
  const payload = assertRecord(input, "input");
  const project = assertProject(payload.project);
  const issues = collectValidationIssues(project);

  return {
    issues,
    ok: issues.length === 0
  };
}

async function handleExportBundle(input: unknown): Promise<unknown> {
  const payload = assertRecord(input, "input");
  const project = assertProject(payload.project);
  const outputDirectory = optionalString(payload.outputDirectory, "input.outputDirectory");
  const snapshot = optionalBoolean(payload.snapshot, "input.snapshot") ?? false;

  if (snapshot && outputDirectory === undefined) {
    throw new McpToolError(
      "INVALID_INPUT",
      "snapshot export requires input.outputDirectory."
    );
  }

  if (outputDirectory === undefined) {
    return {
      files: createExportBundleFiles(project)
    };
  }

  const result = await writeExportBundle(project, outputDirectory, {
    snapshot
  });

  return {
    files: result.files,
    writtenTo: outputDirectory,
    snapshot:
      result.snapshot === undefined
        ? undefined
        : {
            filePath: result.snapshot.filePath,
            metadataPath: result.snapshot.metadataPath,
            metadata: result.snapshot.metadata
          }
  };
}

async function handleAdapterEmit(input: unknown): Promise<unknown> {
  const payload = assertRecord(input, "input");
  const project = assertProject(payload.project);
  const target = assertString(payload.target, "input.target");
  const generatedAt = optionalGeneratedAt(payload);

  if (target !== "nextjs" && target !== "webstir") {
    throw new McpToolError("INVALID_INPUT", "input.target must be nextjs or webstir.");
  }

  const adapter = adapters[target];

  return {
    validationIssues: adapter.validate(project),
    layoutSpec: adapter.emitLayoutSpec(project, toEngineOptions(generatedAt))
  };
}

async function invokeTool(tool: string, input: unknown): Promise<unknown> {
  switch (tool) {
    case "project.open":
      return handleProjectOpen(input);
    case "project.save":
      return handleProjectSave(input);
    case "project.create":
      return handleProjectCreate(input);
    case "tokens.set":
      return handleTokensSet(input);
    case "page.sections.add":
      return handlePageSectionsAdd(input);
    case "page.sections.update":
      return handlePageSectionsUpdate(input);
    case "page.sections.reorder":
      return handlePageSectionsReorder(input);
    case "page.sections.remove":
      return handlePageSectionsRemove(input);
    case "stress.set":
      return handleStressSet(input);
    case "validate.run":
      return handleValidateRun(input);
    case "export.bundle":
      return handleExportBundle(input);
    case "adapter.emit":
      return handleAdapterEmit(input);
    default:
      throw new McpToolError("INVALID_INPUT", `Unsupported tool "${tool}".`);
  }
}

export async function executeToolRequest(envelope: ToolRequestEnvelope): Promise<ToolResponse> {
  const id = envelope.id ?? null;

  try {
    const tool = assertString(envelope.tool, "tool");
    const result = await invokeTool(tool, envelope.input);

    return {
      id,
      contractVersion: CONTRACT_VERSION,
      ok: true,
      result
    };
  } catch (error: unknown) {
    return {
      id,
      contractVersion: CONTRACT_VERSION,
      ok: false,
      error: toErrorShape(error)
    };
  }
}
