import {
  canonicalProjectFixture,
  migrateProjectFilesToCurrentSchema,
  type PlaygroundProject
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
  fileName: ProjectFileName
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

export function canUseDirectoryPicker(): boolean {
  return getDirectoryPicker() !== null;
}

export function createNewProject(): PlaygroundProject {
  return structuredClone(canonicalProjectFixture);
}

export function serializeProjectFingerprint(project: PlaygroundProject): string {
  return [
    canonicalJSONStringify(project.tokens),
    canonicalJSONStringify(project.page),
    canonicalJSONStringify(project.constraints),
    canonicalJSONStringify(project.summary)
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
): Promise<PlaygroundProject> {
  const [tokens, page, constraints, summary] = await Promise.all(
    requiredProjectFiles.map((fileName) => readJSONFile(directoryHandle, fileName))
  );

  return migrateProjectFilesToCurrentSchema({
    tokens,
    page,
    constraints,
    summary
  });
}

export async function saveProjectToDirectoryHandle(
  directoryHandle: FileSystemDirectoryHandle,
  project: PlaygroundProject
): Promise<string[]> {
  const files = createExportBundleFiles(project);

  await Promise.all(
    Object.entries(files).map(([fileName, contents]) =>
      writeTextFile(directoryHandle, fileName, contents)
    )
  );

  return Object.keys(files).sort();
}
