import {
  CURRENT_SCHEMA_VERSION,
  canonicalProjectFixture,
  canonicalSettingsScreenBriefFixture,
  migrateProjectFilesToCurrentSchema,
  type PlaygroundProject,
  type SettingsScreenBrief
} from "@bux/core-model";
import {
  canonicalJSONStringify,
  createExportBundleFiles,
  ExportValidationError
} from "@bux/exporter/browser";

const requiredProjectFiles = [
  "tokens.json",
  "page.json",
  "constraints.json",
  "summary.json"
] as const;

type ProjectFileName = (typeof requiredProjectFiles)[number];

export interface LoadedProjectState {
  brief: SettingsScreenBrief | null;
  project: PlaygroundProject;
}

type DirectoryPickerOptions = {
  id?: string;
  mode?: "read" | "readwrite";
};

function getDirectoryPicker(): ((options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>) | null {
  const maybePicker = (window as Window & {
    showDirectoryPicker?: (
      options?: DirectoryPickerOptions
    ) => Promise<FileSystemDirectoryHandle>;
  }).showDirectoryPicker;

  return typeof maybePicker === "function" ? maybePicker : null;
}

async function readJSONFile(
  directoryHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<unknown> {
  const fileHandle = await directoryHandle.getFileHandle(fileName);
  const file = await fileHandle.getFile();
  return JSON.parse(await file.text()) as unknown;
}

async function writeTextFile(
  directoryHandle: FileSystemDirectoryHandle,
  fileName: string,
  contents: string
): Promise<void> {
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSettingsDensity(value: unknown): value is SettingsScreenBrief["density"] {
  return value === "compact" || value === "comfortable" || value === "calm";
}

function parseBriefDocument(value: unknown): SettingsScreenBrief {
  if (!isRecord(value)) {
    throw new Error("brief.json must be a JSON object.");
  }

  if (value.screenType !== "settings") {
    throw new Error('brief.json screenType must be "settings".');
  }

  if (typeof value.title !== "string" || value.title.trim().length === 0) {
    throw new Error("brief.json title must be a non-empty string.");
  }

  if (!isSettingsDensity(value.density)) {
    throw new Error('brief.json density must be "comfortable", "compact", or "calm".');
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    screenType: "settings",
    title: value.title,
    density: value.density
  };
}

export function canUseDirectoryPicker(): boolean {
  return getDirectoryPicker() !== null;
}

export function createNewProject(): PlaygroundProject {
  return structuredClone(canonicalProjectFixture);
}

export function serializeProjectFingerprint(
  project: PlaygroundProject,
  brief: SettingsScreenBrief = canonicalSettingsScreenBriefFixture
): string {
  return [
    canonicalJSONStringify(project.tokens),
    canonicalJSONStringify(project.page),
    canonicalJSONStringify(project.constraints),
    canonicalJSONStringify(project.summary),
    canonicalJSONStringify(brief)
  ].join("\n");
}

export function validationErrorMessage(error: unknown): string {
  if (error instanceof ExportValidationError) {
    return `Project validation failed with ${error.issues.length} issue${
      error.issues.length === 1 ? "" : "s"
    }.`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown project error.";
}

export function isPickerAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function promptForDirectory(
  mode: "open" | "save"
): Promise<FileSystemDirectoryHandle> {
  const picker = getDirectoryPicker();
  if (!picker) {
    throw new Error("Directory access requires a browser that supports the File System Access API.");
  }

  return picker({
    id: mode === "open" ? "bux-project-open" : "bux-project-save",
    mode: mode === "open" ? "read" : "readwrite"
  });
}

export async function loadProjectFromDirectoryHandle(
  directoryHandle: FileSystemDirectoryHandle
): Promise<LoadedProjectState> {
  const [tokens, page, constraints, summary] = await Promise.all(
    requiredProjectFiles.map((fileName) => readJSONFile(directoryHandle, fileName))
  );
  let brief: SettingsScreenBrief | null = null;

  try {
    brief = parseBriefDocument(await readJSONFile(directoryHandle, "brief.json"));
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "NotFoundError")) {
      throw error;
    }
  }

  return {
    brief,
    project: migrateProjectFilesToCurrentSchema({
      tokens,
      page,
      constraints,
      summary
    })
  };
}

export async function saveProjectToDirectoryHandle(
  directoryHandle: FileSystemDirectoryHandle,
  project: PlaygroundProject,
  brief: SettingsScreenBrief
): Promise<string[]> {
  const files = createExportBundleFiles(project);

  await Promise.all(
    [
      ...Object.entries(files),
      ["brief.json", canonicalJSONStringify(brief)] as const
    ].map(([fileName, contents]) =>
      writeTextFile(directoryHandle, fileName, contents)
    )
  );

  return [...Object.keys(files), "brief.json"].sort();
}
