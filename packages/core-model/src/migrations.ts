import { canonicalStressFixture } from "./fixture";
import {
  CURRENT_SCHEMA_VERSION,
  type ConstraintsDocument,
  type DensityMode,
  type PageDocument,
  type PlaygroundProject,
  type StressCopyMode,
  type StressDocument,
  type StressStateMode,
  type SummaryDocument,
  type TokensDocument
} from "./types";

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function copyModeOrDefault(value: unknown): StressCopyMode {
  if (value === undefined) {
    return canonicalStressFixture.copyMode;
  }

  if (value === "short" || value === "long") {
    return value;
  }

  throw new ProjectMigrationError(
    "summary.json stress.copyMode must be short or long when present."
  );
}

function stateModeOrDefault(value: unknown): StressStateMode {
  if (value === undefined) {
    return canonicalStressFixture.stateMode;
  }

  if (
    value === "default" ||
    value === "empty" ||
    value === "loading" ||
    value === "error"
  ) {
    return value;
  }

  throw new ProjectMigrationError(
    "summary.json stress.stateMode must be default, empty, loading, or error when present."
  );
}

function densityModeOrDefault(value: unknown): DensityMode {
  if (value === undefined) {
    return canonicalStressFixture.densityMode;
  }

  if (value === "comfortable" || value === "compact") {
    return value;
  }

  throw new ProjectMigrationError(
    "summary.json stress.densityMode must be comfortable or compact when present."
  );
}

function normalizeStress(stress: unknown): StressDocument {
  if (stress === undefined) {
    return structuredClone(canonicalStressFixture);
  }

  if (!isRecord(stress)) {
    throw new ProjectMigrationError("summary.json stress must be an object when present.");
  }

  return {
    copyMode: copyModeOrDefault(stress.copyMode),
    stateMode: stateModeOrDefault(stress.stateMode),
    densityMode: densityModeOrDefault(stress.densityMode)
  };
}

export class ProjectMigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectMigrationError";
  }
}

function normalizeDocumentSchemaVersion(
  document: unknown,
  fileName: string
): RecordValue {
  if (!isRecord(document)) {
    throw new ProjectMigrationError(`${fileName} must be a JSON object.`);
  }

  const rawVersion = document.schemaVersion;
  if (rawVersion !== undefined && rawVersion !== CURRENT_SCHEMA_VERSION) {
    throw new ProjectMigrationError(
      `${fileName} schemaVersion "${rawVersion}" is unsupported. Expected "${CURRENT_SCHEMA_VERSION}" or an omitted version for legacy files.`
    );
  }

  return {
    ...document,
    schemaVersion: CURRENT_SCHEMA_VERSION
  };
}

function asDocument<T>(value: RecordValue): T {
  return value as unknown as T;
}

export interface ProjectFilesForMigration {
  tokens: unknown;
  page: unknown;
  constraints: unknown;
  summary: unknown;
}

export function migrateProjectFilesToCurrentSchema(
  files: ProjectFilesForMigration
): PlaygroundProject {
  const tokens = normalizeDocumentSchemaVersion(files.tokens, "tokens.json");
  const page = normalizeDocumentSchemaVersion(files.page, "page.json");
  const constraints = normalizeDocumentSchemaVersion(
    files.constraints,
    "constraints.json"
  );
  const normalizedSummary = normalizeDocumentSchemaVersion(
    files.summary,
    "summary.json"
  );
  const summaryStress = normalizeStress(normalizedSummary.stress);
  const summary: SummaryDocument = {
    ...asDocument<SummaryDocument>(normalizedSummary),
    stress: summaryStress
  };

  return {
    tokens: asDocument<TokensDocument>(tokens),
    page: asDocument<PageDocument>(page),
    constraints: asDocument<ConstraintsDocument>(constraints),
    summary,
    stress: structuredClone(summaryStress)
  };
}
