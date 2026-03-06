import { applyAction } from "@bux/core-engine";
import {
  type BreakpointName,
  canonicalProjectFixture,
  type DensityMode,
  type PlaygroundProject,
  type SectionType,
  type StressCopyMode,
  type StressStateMode
} from "@bux/core-model";
import { collectValidationIssues } from "@bux/exporter/browser";
import { PlaygroundPreview, resolvePreviewLayout } from "@bux/preview-runtime";
import { createSectionDraft } from "@bux/section-kit";
import { startTransition, useEffect, useMemo, useState } from "react";
import { ConstraintsEditor } from "./constraints-editor";
import {
  canUseDirectoryPicker,
  createNewProject,
  isPickerAbort,
  loadProjectFromDirectoryHandle,
  promptForDirectory,
  saveProjectToDirectoryHandle,
  serializeProjectFingerprint,
  validationErrorMessage
} from "./project-io";
import { PreviewControls } from "./preview-controls";
import { ProjectToolbar, type ProjectNotice } from "./project-toolbar";
import { SectionEditor, type SectionChanges } from "./section-editor";
import { SectionRulesEditor } from "./section-rules-editor";
import { ValidationPanel } from "./validation-panel";

type NumericTokenField = {
  id: string;
  label: string;
  path: string[];
  min: number;
  max: number;
  step: number;
};

const numericTokenFields: NumericTokenField[] = [
  {
    id: "typography-scale-body",
    label: "Body Font Size",
    path: ["typography", "scale", "2"],
    min: 10,
    max: 24,
    step: 1
  },
  {
    id: "spacing-density-compact",
    label: "Compact Density",
    path: ["spacing", "density", "compact"],
    min: 0.5,
    max: 1,
    step: 0.05
  },
  {
    id: "spacing-density-comfortable",
    label: "Comfortable Density",
    path: ["spacing", "density", "comfortable"],
    min: 0.8,
    max: 1.4,
    step: 0.05
  },
  {
    id: "radius-md",
    label: "Radius (md)",
    path: ["radii", "md"],
    min: 0,
    max: 24,
    step: 1
  }
];

const sectionTypes: SectionType[] = [
  "hero",
  "featureGrid",
  "form",
  "list",
  "table",
  "settings"
];
const stressCopyOptions: StressCopyMode[] = ["short", "long"];
const stressStateOptions: StressStateMode[] = [
  "default",
  "empty",
  "loading",
  "error"
];
const stressDensityOptions: DensityMode[] = ["comfortable", "compact"];

function readNumberAtPath(project: PlaygroundProject, path: string[]): number {
  const value = path.reduce<unknown>((cursor, segment) => {
    if (Array.isArray(cursor)) {
      const index = Number(segment);
      return cursor[index];
    }

    if (cursor && typeof cursor === "object") {
      return (cursor as Record<string, unknown>)[segment];
    }

    return undefined;
  }, project.tokens);

  return typeof value === "number" ? value : 0;
}

export function App() {
  const [project, setProject] = useState<PlaygroundProject>(
    structuredClone(canonicalProjectFixture)
  );
  const [newSectionType, setNewSectionType] = useState<SectionType>("form");
  const [activeBreakpoint, setActiveBreakpoint] = useState<BreakpointName>("md");
  const [projectDirectoryHandle, setProjectDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState(() =>
    serializeProjectFingerprint(canonicalProjectFixture)
  );
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [notice, setNotice] = useState<ProjectNotice | null>({
    tone: "neutral",
    message: "Editing the baseline fixture in memory."
  });
  const validationIssues = useMemo(() => collectValidationIssues(project), [project]);
  const supportsDirectoryPicker = canUseDirectoryPicker();
  const currentFingerprint = useMemo(() => serializeProjectFingerprint(project), [project]);
  const previewLayout = useMemo(
    () => resolvePreviewLayout(project, activeBreakpoint),
    [project, activeBreakpoint]
  );
  const accentColor = project.tokens.colors.roles["accent.primary"] ?? "#0F766E";
  const configuredBreakpoints = useMemo(
    () => project.constraints.layout.breakpoints.map((entry) => entry.breakpoint),
    [project]
  );
  const isDirty = currentFingerprint !== savedFingerprint;
  const projectName = projectDirectoryHandle?.name ?? "Untitled project";

  function dispatch(action: Parameters<typeof applyAction>[1]) {
    setProject((current) => applyAction(current, action));
  }

  useEffect(() => {
    if (!configuredBreakpoints.includes(activeBreakpoint)) {
      setActiveBreakpoint(previewLayout.breakpoint);
    }
  }, [activeBreakpoint, configuredBreakpoints, previewLayout.breakpoint]);

  function setNumericToken(path: string[], value: number) {
    dispatch({ type: "setTokenValue", path, value });
  }

  function setAccentColor(value: string) {
    dispatch({
      type: "setTokenValue",
      path: ["colors", "roles", "accent.primary"],
      value
    });
  }

  function setStressMode(
    mode: "copyMode" | "stateMode" | "densityMode",
    value: StressCopyMode | StressStateMode | DensityMode
  ) {
    dispatch({ type: "setStressMode", mode, value });
  }

  function setConstraintValue(path: string[], value: string | number) {
    dispatch({ type: "setConstraintValue", path, value });
  }

  function updateSectionRule(
    sectionType: SectionType,
    changes: {
      allowedVariants?: string[];
      maxItems?: number | null;
    }
  ) {
    dispatch({
      type: "updateSectionRule",
      sectionType,
      changes
    });
  }

  function addSection() {
    dispatch({
      type: "addSection",
      section: createSectionDraft(newSectionType)
    });
  }

  function removeSection(sectionId: string) {
    dispatch({ type: "removeSection", sectionId });
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    const currentIndex = project.page.sections.findIndex((entry) => entry.id === sectionId);
    if (currentIndex < 0) {
      return;
    }

    dispatch({
      type: "reorderSection",
      sectionId,
      toIndex: currentIndex + direction
    });
  }

  function updateSection(sectionId: string, changes: SectionChanges) {
    dispatch({
      type: "updateSection",
      sectionId,
      changes
    });
  }

  async function withBusyState(
    label: string,
    action: () => Promise<void>
  ): Promise<void> {
    setBusyLabel(label);

    try {
      await action();
    } finally {
      setBusyLabel(null);
    }
  }

  function applyLoadedProject(
    nextProject: PlaygroundProject,
    directoryHandle: FileSystemDirectoryHandle | null,
    nextNotice: ProjectNotice
  ) {
    const fingerprint = serializeProjectFingerprint(nextProject);

    startTransition(() => {
      setProject(nextProject);
      setProjectDirectoryHandle(directoryHandle);
      setSavedFingerprint(fingerprint);
      setActiveBreakpoint(resolvePreviewLayout(nextProject, activeBreakpoint).breakpoint);
      setNotice(nextNotice);
    });
  }

  function createFreshProject() {
    const nextProject = createNewProject();
    applyLoadedProject(nextProject, null, {
      tone: "neutral",
      message: "Started a new in-memory project from the canonical baseline."
    });
  }

  async function openProject() {
    await withBusyState("Opening project...", async () => {
      try {
        const directoryHandle = await promptForDirectory("open");
        const nextProject = await loadProjectFromDirectoryHandle(directoryHandle);

        applyLoadedProject(nextProject, directoryHandle, {
          tone: "success",
          message: `Opened project from ${directoryHandle.name}.`
        });
      } catch (error) {
        if (isPickerAbort(error)) {
          setNotice({ tone: "neutral", message: "Open cancelled." });
          return;
        }

        setNotice({
          tone: "error",
          message: `Could not open project. ${validationErrorMessage(error)}`
        });
      }
    });
  }

  async function saveProject(saveAs: boolean) {
    await withBusyState(saveAs ? "Saving project as..." : "Saving project...", async () => {
      try {
        const directoryHandle =
          !saveAs && projectDirectoryHandle
            ? projectDirectoryHandle
            : await promptForDirectory("save");
        const savedFiles = await saveProjectToDirectoryHandle(directoryHandle, project);

        setProjectDirectoryHandle(directoryHandle);
        setSavedFingerprint(currentFingerprint);
        setNotice({
          tone: "success",
          message: `Saved ${savedFiles.length} files to ${directoryHandle.name}.`
        });
      } catch (error) {
        if (isPickerAbort(error)) {
          setNotice({ tone: "neutral", message: "Save cancelled." });
          return;
        }

        setNotice({
          tone: "error",
          message: `Could not save project. ${validationErrorMessage(error)}`
        });
      }
    });
  }

  async function exportProject() {
    await withBusyState("Exporting bundle...", async () => {
      try {
        const directoryHandle = await promptForDirectory("save");
        const savedFiles = await saveProjectToDirectoryHandle(directoryHandle, project);

        setNotice({
          tone: "success",
          message: `Exported ${savedFiles.length} canonical files to ${directoryHandle.name}.`
        });
      } catch (error) {
        if (isPickerAbort(error)) {
          setNotice({ tone: "neutral", message: "Export cancelled." });
          return;
        }

        setNotice({
          tone: "error",
          message: `Could not export bundle. ${validationErrorMessage(error)}`
        });
      }
    });
  }

  return (
    <main className="app-shell">
      <aside className="left-panel">
        <header className="panel-header">
          <h1>UI System Playground</h1>
          <p>
            Model-driven controls for token, section, and export fundamentals.
            {busyLabel ? ` ${busyLabel}` : ""}
          </p>
        </header>

        <ProjectToolbar
          projectName={projectName}
          isDirty={isDirty}
          isBusy={busyLabel !== null}
          supportsDirectoryPicker={supportsDirectoryPicker}
          notice={notice}
          onCreateNew={createFreshProject}
          onOpen={openProject}
          onSave={() => saveProject(false)}
          onSaveAs={() => saveProject(true)}
          onExport={exportProject}
        />

        <section className="panel-block">
          <h2>Tokens</h2>
          <div className="control-list">
            {numericTokenFields.map((field) => {
              const value = readNumberAtPath(project, field.path);
              return (
                <label className="control-row" key={field.id}>
                  <span>{field.label}</span>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={value}
                    onChange={(event) =>
                      setNumericToken(field.path, Number(event.currentTarget.value))
                    }
                  />
                  <output>{value.toFixed(field.step < 1 ? 2 : 0)}</output>
                </label>
              );
            })}

            <label className="control-row">
              <span>Accent Color</span>
              <input
                type="color"
                value={accentColor}
                onChange={(event) => setAccentColor(event.currentTarget.value)}
              />
            </label>
          </div>
        </section>

        <SectionEditor
          project={project}
          newSectionType={newSectionType}
          sectionTypes={sectionTypes}
          onNewSectionTypeChange={setNewSectionType}
          onAddSection={addSection}
          onMoveSection={moveSection}
          onRemoveSection={removeSection}
          onUpdateSection={updateSection}
        />

        <ConstraintsEditor
          project={project}
          onSetConstraintValue={setConstraintValue}
        />

        <SectionRulesEditor
          project={project}
          onUpdateSectionRule={updateSectionRule}
        />

        <section className="panel-block">
          <h2>Stress Modes</h2>
          <div className="control-list">
            <label className="control-row">
              <span>Copy Length</span>
              <select
                value={project.stress.copyMode}
                onChange={(event) =>
                  setStressMode("copyMode", event.currentTarget.value as StressCopyMode)
                }
              >
                {stressCopyOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="control-row">
              <span>State</span>
              <select
                value={project.stress.stateMode}
                onChange={(event) =>
                  setStressMode("stateMode", event.currentTarget.value as StressStateMode)
                }
              >
                {stressStateOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="control-row">
              <span>Density</span>
              <select
                value={project.stress.densityMode}
                onChange={(event) =>
                  setStressMode("densityMode", event.currentTarget.value as DensityMode)
                }
              >
                {stressDensityOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <ValidationPanel issues={validationIssues} />
      </aside>

      <section className="preview-panel">
        <PreviewControls
          activeBreakpoint={previewLayout.breakpoint}
          breakpoints={configuredBreakpoints}
          columns={previewLayout.columns}
          gutter={previewLayout.gutter}
          containerWidth={previewLayout.containerWidth}
          onBreakpointChange={setActiveBreakpoint}
        />
        <PlaygroundPreview project={project} activeBreakpoint={previewLayout.breakpoint} />
      </section>
    </main>
  );
}
