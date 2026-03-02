import {
  CURRENT_SCHEMA_VERSION,
  type DensityMode,
  type JSONValue,
  type JSONObject,
  type PlaygroundProject,
  type SectionNode,
  type SectionType,
  type StressCopyMode,
  type StressStateMode,
  type SummaryDocument
} from "@bux/core-model";

export interface EngineOptions {
  generatedAt?: string;
}

export interface SetTokenValueAction {
  type: "setTokenValue";
  path: string[];
  value: JSONValue;
}

export interface AddSectionAction {
  type: "addSection";
  section: Omit<SectionNode, "id"> & { id?: string };
  index?: number;
}

export interface UpdateSectionAction {
  type: "updateSection";
  sectionId: string;
  changes: {
    variant?: string;
    props?: JSONObject;
    slots?: Record<string, JSONValue>;
  };
}

export interface ReorderSectionAction {
  type: "reorderSection";
  sectionId: string;
  toIndex: number;
}

export interface RemoveSectionAction {
  type: "removeSection";
  sectionId: string;
}

export interface SetStressModeAction {
  type: "setStressMode";
  mode: "copyMode" | "stateMode" | "densityMode";
  value: StressCopyMode | StressStateMode | DensityMode;
}

export type EngineAction =
  | SetTokenValueAction
  | AddSectionAction
  | UpdateSectionAction
  | ReorderSectionAction
  | RemoveSectionAction
  | SetStressModeAction;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseArrayIndex(rawIndex: string): number {
  const parsed = Number(rawIndex);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid array index "${rawIndex}" in token path.`);
  }

  return parsed;
}

function setValueAtPath(root: unknown, path: string[], value: JSONValue): void {
  if (path.length === 0) {
    throw new Error("Token path cannot be empty.");
  }

  let cursor: unknown = root;

  for (const segment of path.slice(0, -1)) {
    if (Array.isArray(cursor)) {
      const index = parseArrayIndex(segment);
      if (index >= cursor.length) {
        throw new Error(`Array index "${segment}" is out of range in token path.`);
      }
      cursor = cursor[index];
      continue;
    }

    if (isRecord(cursor)) {
      if (!(segment in cursor)) {
        throw new Error(`Token path segment "${segment}" does not exist.`);
      }
      cursor = cursor[segment];
      continue;
    }

    throw new Error(`Token path segment "${segment}" is not traversable.`);
  }

  const finalSegment = path[path.length - 1];
  if (finalSegment === undefined) {
    throw new Error("Token path cannot be empty.");
  }

  if (Array.isArray(cursor)) {
    const index = parseArrayIndex(finalSegment);
    if (index >= cursor.length) {
      throw new Error(`Array index "${finalSegment}" is out of range in token path.`);
    }
    cursor[index] = value;
    return;
  }

  if (isRecord(cursor)) {
    cursor[finalSegment] = value;
    return;
  }

  throw new Error(`Token path segment "${finalSegment}" is not writable.`);
}

function toKebabCase(input: string): string {
  return input.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function assertUniqueSectionId(
  existingSections: SectionNode[],
  sectionId: string
): void {
  const alreadyExists = existingSections.some((section) => section.id === sectionId);
  if (alreadyExists) {
    throw new Error(`Section with id "${sectionId}" already exists.`);
  }
}

function clampIndex(index: number, min: number, max: number): number {
  return Math.max(min, Math.min(index, max));
}

function rebuildSummary(
  project: PlaygroundProject,
  options: EngineOptions = {}
): SummaryDocument {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    generatedAt: options.generatedAt ?? project.summary.generatedAt,
    targetProfile: "portable-core",
    stress: {
      copyMode: project.stress.copyMode,
      stateMode: project.stress.stateMode,
      densityMode: project.stress.densityMode
    },
    system: {
      typographyScaleSteps: project.tokens.typography.scale.length,
      spacingScaleSteps: project.tokens.spacing.scale.length,
      defaultDensity: project.constraints.layout.defaultDensity,
      colorRoleCount: Object.keys(project.tokens.colors.roles).length
    },
    layout: {
      sectionCount: project.page.sections.length,
      sectionOrder: project.page.sections.map((section) => section.type)
    },
    notes: project.summary.notes
  };
}

function withUpdatedSummary(
  project: PlaygroundProject,
  options: EngineOptions = {}
): PlaygroundProject {
  project.summary = rebuildSummary(project, options);
  return project;
}

export function generateSectionId(
  sectionType: SectionType,
  existingSections: SectionNode[]
): string {
  const prefix = `sec-${toKebabCase(sectionType)}-`;
  let maxIndex = 0;

  for (const section of existingSections) {
    if (!section.id.startsWith(prefix)) {
      continue;
    }

    const suffix = section.id.slice(prefix.length);
    const parsed = Number(suffix);
    if (Number.isInteger(parsed)) {
      maxIndex = Math.max(maxIndex, parsed);
    }
  }

  return `${prefix}${String(maxIndex + 1).padStart(3, "0")}`;
}

export function applyAction(
  project: PlaygroundProject,
  action: EngineAction,
  options: EngineOptions = {}
): PlaygroundProject {
  const nextProject = structuredClone(project);

  switch (action.type) {
    case "setTokenValue": {
      setValueAtPath(nextProject.tokens, action.path, action.value);
      return withUpdatedSummary(nextProject, options);
    }
    case "addSection": {
      const nextSection = structuredClone(action.section);
      const id = nextSection.id ?? generateSectionId(nextSection.type, nextProject.page.sections);

      assertUniqueSectionId(nextProject.page.sections, id);

      const insertionIndex =
        action.index === undefined
          ? nextProject.page.sections.length
          : clampIndex(action.index, 0, nextProject.page.sections.length);

      nextProject.page.sections.splice(insertionIndex, 0, {
        ...nextSection,
        id
      });
      return withUpdatedSummary(nextProject, options);
    }
    case "updateSection": {
      const section = nextProject.page.sections.find(
        (entry) => entry.id === action.sectionId
      );
      if (!section) {
        throw new Error(`Section with id "${action.sectionId}" was not found.`);
      }

      if (action.changes.variant !== undefined) {
        section.variant = action.changes.variant;
      }

      if (action.changes.props !== undefined) {
        section.props = { ...section.props, ...action.changes.props };
      }

      if (action.changes.slots !== undefined) {
        section.slots = { ...section.slots, ...action.changes.slots };
      }

      return withUpdatedSummary(nextProject, options);
    }
    case "reorderSection": {
      const existingIndex = nextProject.page.sections.findIndex(
        (entry) => entry.id === action.sectionId
      );
      if (existingIndex < 0) {
        throw new Error(`Section with id "${action.sectionId}" was not found.`);
      }

      const [section] = nextProject.page.sections.splice(existingIndex, 1);
      if (!section) {
        throw new Error(`Section with id "${action.sectionId}" was not found.`);
      }
      const targetIndex = clampIndex(action.toIndex, 0, nextProject.page.sections.length);
      nextProject.page.sections.splice(targetIndex, 0, section);
      return withUpdatedSummary(nextProject, options);
    }
    case "removeSection": {
      const existingIndex = nextProject.page.sections.findIndex(
        (entry) => entry.id === action.sectionId
      );
      if (existingIndex < 0) {
        throw new Error(`Section with id "${action.sectionId}" was not found.`);
      }

      nextProject.page.sections.splice(existingIndex, 1);
      return withUpdatedSummary(nextProject, options);
    }
    case "setStressMode": {
      switch (action.mode) {
        case "copyMode":
          if (action.value !== "short" && action.value !== "long") {
            throw new Error("Stress copyMode value must be short or long.");
          }
          nextProject.stress.copyMode = action.value;
          break;
        case "stateMode":
          if (
            action.value !== "default" &&
            action.value !== "empty" &&
            action.value !== "loading" &&
            action.value !== "error"
          ) {
            throw new Error("Stress stateMode value is invalid.");
          }
          nextProject.stress.stateMode = action.value;
          break;
        case "densityMode":
          if (action.value !== "comfortable" && action.value !== "compact") {
            throw new Error("Stress densityMode value must be comfortable or compact.");
          }
          nextProject.stress.densityMode = action.value;
          break;
        default: {
          const exhaustive: never = action.mode;
          return exhaustive;
        }
      }

      return withUpdatedSummary(nextProject, options);
    }
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

export function applyActions(
  project: PlaygroundProject,
  actions: EngineAction[],
  options: EngineOptions = {}
): PlaygroundProject {
  return actions.reduce(
    (current, action) => applyAction(current, action, options),
    project
  );
}
