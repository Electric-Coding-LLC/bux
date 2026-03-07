import type { AdapterTarget } from "@bux/adapter-contract";
import {
  CURRENT_SCHEMA_VERSION,
  canonicalDashboardScreenBriefFixture,
  canonicalProjectFixture,
  canonicalSettingsScreenBriefFixture,
  type DashboardScreenBrief,
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
import {
  createAdapterLayoutSpecFile,
  defaultAdapterTarget,
  isAdapterTarget
} from "./adapter-targets";

const requiredProjectFiles = [
  "tokens.json",
  "page.json",
  "constraints.json",
  "summary.json"
] as const;

type ProjectFileName = (typeof requiredProjectFiles)[number];

export interface LoadedProjectState {
  activeBlueprintId: string | null;
  adapterTarget: AdapterTarget;
  brief: ScreenBrief | null;
  project: PlaygroundProject;
}

interface WorkbenchDocument {
  activeBlueprintId: string | null;
  adapterTarget: AdapterTarget;
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

async function writeFilesToDirectoryHandle(
  directoryHandle: FileSystemDirectoryHandle,
  files: Record<string, string>
): Promise<string[]> {
  await Promise.all(
    Object.entries(files).map(([fileName, contents]) =>
      writeTextFile(directoryHandle, fileName, contents)
    )
  );

  return Object.keys(files).sort();
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

function isDashboardDensity(
  value: unknown
): value is DashboardScreenBrief["density"] {
  return value === "executive" || value === "operational" || value === "focused";
}

function isDashboardArtDirection(
  value: unknown
): value is DashboardScreenBrief["artDirection"] {
  return (
    value === "quietSignal" ||
    value === "commandCenter" ||
    value === "editorialPulse"
  );
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

function parseAdapterTarget(value: unknown): AdapterTarget {
  if (value === undefined || value === null) {
    return defaultAdapterTarget;
  }

  if (!isAdapterTarget(value)) {
    throw new Error('brief.json adapterTarget must be "nextjs" or "webstir" when provided.');
  }

  return value;
}

function parseDashboardArtDirection(
  value: unknown
): DashboardScreenBrief["artDirection"] {
  if (value === undefined || value === null) {
    return canonicalDashboardScreenBriefFixture.artDirection;
  }

  if (!isDashboardArtDirection(value)) {
    throw new Error(
      'brief.json artDirection must be "quietSignal", "commandCenter", or "editorialPulse" for dashboard.'
    );
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
    screenType !== "marketingLanding" &&
    screenType !== "dashboard"
  ) {
    throw new Error(
      'brief.json screenType must be "settings", "onboarding", "marketingLanding", or "dashboard".'
    );
  }

  if (typeof value.title !== "string" || value.title.trim().length === 0) {
    throw new Error("brief.json title must be a non-empty string.");
  }

  const activeBlueprintId = parseActiveBlueprintId(value.activeBlueprintId);
  const adapterTarget = parseAdapterTarget(value.adapterTarget);

  if (screenType === "settings") {
    if (!isSettingsDensity(value.density)) {
      throw new Error('brief.json density must be "comfortable", "compact", or "calm" for settings.');
    }

    return {
      activeBlueprintId,
      adapterTarget,
      brief: {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        screenType,
        title: value.title,
        density: value.density as SettingsScreenBrief["density"]
      }
    };
  }

  if (screenType === "onboarding") {
    if (!isOnboardingDensity(value.density)) {
      throw new Error(
        'brief.json density must be "guided", "focused", or "compact" for onboarding.'
      );
    }

    return {
      activeBlueprintId,
      adapterTarget,
      brief: {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        screenType,
        title: value.title,
        density: value.density as OnboardingScreenBrief["density"]
      }
    };
  }

  if (screenType === "marketingLanding") {
    if (!isMarketingLandingDensity(value.density)) {
      throw new Error(
        'brief.json density must be "editorial", "focused", or "launch" for marketingLanding.'
      );
    }

    return {
      activeBlueprintId,
      adapterTarget,
      brief: {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        screenType,
        title: value.title,
        density: value.density as MarketingLandingScreenBrief["density"]
      }
    };
  }

  if (!isDashboardDensity(value.density)) {
    throw new Error(
      'brief.json density must be "executive", "operational", or "focused" for dashboard.'
    );
  }

  return {
    activeBlueprintId,
    adapterTarget,
    brief: {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      screenType,
      title: value.title,
      density: value.density as DashboardScreenBrief["density"],
      artDirection: parseDashboardArtDirection(value.artDirection)
    }
  };
}

export function serializeWorkbenchDocument(
  brief: ScreenBrief,
  activeBlueprintId: string | null,
  adapterTarget: AdapterTarget
): string {
  return canonicalJSONStringify({
    activeBlueprintId,
    adapterTarget,
    ...(brief.screenType === "dashboard"
      ? { artDirection: brief.artDirection }
      : {}),
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
  activeBlueprintId: string | null = null,
  adapterTarget: AdapterTarget = defaultAdapterTarget
): string {
  return [
    canonicalJSONStringify(project.tokens),
    canonicalJSONStringify(project.page),
    canonicalJSONStringify(project.constraints),
    canonicalJSONStringify(project.summary),
    canonicalJSONStringify(brief),
    canonicalJSONStringify(activeBlueprintId),
    canonicalJSONStringify(adapterTarget)
  ].join("\n");
}

export function createWorkbenchSaveFiles(
  project: PlaygroundProject,
  brief: ScreenBrief,
  activeBlueprintId: string | null,
  adapterTarget: AdapterTarget
): Record<string, string> {
  return {
    ...createExportBundleFiles(project),
    "brief.json": serializeWorkbenchDocument(brief, activeBlueprintId, adapterTarget)
  };
}

export function createProjectExportFiles(
  project: PlaygroundProject,
  adapterTarget: AdapterTarget
): Record<string, string> {
  const layoutSpec = createAdapterLayoutSpecFile(project, adapterTarget);

  return {
    ...createExportBundleFiles(project),
    [layoutSpec.fileName]: layoutSpec.contents
  };
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
  let adapterTarget = defaultAdapterTarget;

  try {
    const workbenchDocument = parseWorkbenchDocument(
      await readJSONFile(directoryHandle, "brief.json")
    );
    brief = workbenchDocument.brief;
    activeBlueprintId = workbenchDocument.activeBlueprintId;
    adapterTarget = workbenchDocument.adapterTarget;
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "NotFoundError")) {
      throw error;
    }
  }

  return {
    activeBlueprintId,
    adapterTarget,
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
  activeBlueprintId: string | null,
  adapterTarget: AdapterTarget
): Promise<string[]> {
  return writeFilesToDirectoryHandle(
    directoryHandle,
    createWorkbenchSaveFiles(project, brief, activeBlueprintId, adapterTarget)
  );
}

export async function exportProjectToDirectoryHandle(
  directoryHandle: FileSystemDirectoryHandle,
  project: PlaygroundProject,
  adapterTarget: AdapterTarget
): Promise<string[]> {
  return writeFilesToDirectoryHandle(
    directoryHandle,
    createProjectExportFiles(project, adapterTarget)
  );
}
