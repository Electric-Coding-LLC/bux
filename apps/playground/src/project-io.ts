import {
  CURRENT_SCHEMA_VERSION,
  canonicalProjectFixture,
  canonicalSettingsScreenBriefFixture,
  migrateProjectFilesToCurrentSchema,
  type MarketingLandingScreenBrief,
  type OnboardingScreenBrief,
  type PlaygroundProject,
  type ScreenBrief,
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
  activeBlueprintId: string | null;
  brief: ScreenBrief | null;
  project: PlaygroundProject;
}

interface WorkbenchDocument {
  activeBlueprintId: string | null;
  brief: ScreenBrief;
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

function isOnboardingDensity(
  value: unknown
): value is OnboardingScreenBrief["density"] {
  return value === "guided" || value === "focused" || value === "compact";
}

function isMarketingLandingDensity(
  value: unknown
): value is MarketingLandingScreenBrief["density"] {
  return value === "editorial" || value === "focused" || value === "launch";
}

function parseActiveBlueprintId(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("brief.json activeBlueprintId must be a non-empty string when provided.");
  }

  return value;
}

export function parseWorkbenchDocument(value: unknown): WorkbenchDocument {
  if (!isRecord(value)) {
    throw new Error("brief.json must be a JSON object.");
  }

  const screenType = value.screenType;

  if (
    screenType !== "settings" &&
    screenType !== "onboarding" &&
    screenType !== "marketingLanding"
  ) {
    throw new Error(
      'brief.json screenType must be "settings", "onboarding", or "marketingLanding".'
    );
  }

  if (typeof value.title !== "string" || value.title.trim().length === 0) {
    throw new Error("brief.json title must be a non-empty string.");
  }

  if (screenType === "settings") {
    if (!isSettingsDensity(value.density)) {
      throw new Error('brief.json density must be "comfortable", "compact", or "calm" for settings.');
    }

    return {
      activeBlueprintId: parseActiveBlueprintId(value.activeBlueprintId),
      brief: {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        screenType,
        title: value.title,
        density: value.density as SettingsScreenBrief["density"]
      }
    };
  }

  if (!isOnboardingDensity(value.density)) {
    if (screenType === "onboarding") {
      throw new Error(
        'brief.json density must be "guided", "focused", or "compact" for onboarding.'
      );
    }
  }

  if (screenType === "onboarding") {
    return {
      activeBlueprintId: parseActiveBlueprintId(value.activeBlueprintId),
      brief: {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        screenType,
        title: value.title,
        density: value.density as OnboardingScreenBrief["density"]
      }
    };
  }

  if (!isMarketingLandingDensity(value.density)) {
    throw new Error(
      'brief.json density must be "editorial", "focused", or "launch" for marketingLanding.'
    );
  }

  return {
    activeBlueprintId: parseActiveBlueprintId(value.activeBlueprintId),
    brief: {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      screenType,
      title: value.title,
      density: value.density as MarketingLandingScreenBrief["density"]
    }
  };
}

export function serializeWorkbenchDocument(
  brief: ScreenBrief,
  activeBlueprintId: string | null
): string {
  return canonicalJSONStringify({
    activeBlueprintId,
    density: brief.density,
    schemaVersion: brief.schemaVersion,
    screenType: brief.screenType,
    title: brief.title
  });
}

export function canUseDirectoryPicker(): boolean {
  return getDirectoryPicker() !== null;
}

export function createNewProject(): PlaygroundProject {
  return structuredClone(canonicalProjectFixture);
}

export function serializeProjectFingerprint(
  project: PlaygroundProject,
  brief: ScreenBrief = canonicalSettingsScreenBriefFixture,
  activeBlueprintId: string | null = null
): string {
  return [
    canonicalJSONStringify(project.tokens),
    canonicalJSONStringify(project.page),
    canonicalJSONStringify(project.constraints),
    canonicalJSONStringify(project.summary),
    canonicalJSONStringify(brief),
    canonicalJSONStringify(activeBlueprintId)
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
  let brief: ScreenBrief | null = null;
  let activeBlueprintId: string | null = null;

  try {
    const workbenchDocument = parseWorkbenchDocument(
      await readJSONFile(directoryHandle, "brief.json")
    );
    brief = workbenchDocument.brief;
    activeBlueprintId = workbenchDocument.activeBlueprintId;
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "NotFoundError")) {
      throw error;
    }
  }

  return {
    activeBlueprintId,
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
  brief: ScreenBrief,
  activeBlueprintId: string | null
): Promise<string[]> {
  const files = createExportBundleFiles(project);

  await Promise.all(
    [
      ...Object.entries(files),
      ["brief.json", serializeWorkbenchDocument(brief, activeBlueprintId)] as const
    ].map(([fileName, contents]) =>
      writeTextFile(directoryHandle, fileName, contents)
    )
  );

  return [...Object.keys(files), "brief.json"].sort();
}
