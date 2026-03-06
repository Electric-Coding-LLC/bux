import {
  getBlueprintsForScreenType,
  getDefaultBlueprintId
} from "@bux/blueprint-library";
import { applyAction } from "@bux/core-engine";
import { evaluateScreen } from "@bux/critic-rules";
import {
  type BreakpointName,
  type DensityMode,
  type MarketingLandingDensity,
  type OnboardingScreenDensity,
  type PlaygroundProject,
  type ScreenBrief,
  type ScreenType,
  type SectionType,
  type SettingsScreenDensity,
  type StressCopyMode,
  type StressStateMode
} from "@bux/core-model";
import { collectValidationIssues } from "@bux/exporter/browser";
import { PlaygroundPreview, resolvePreviewLayout } from "@bux/preview-runtime";
import { createSectionDraft } from "@bux/section-kit";
import { startTransition, useEffect, useMemo, useState } from "react";
import { BlueprintLibraryPanel } from "./blueprint-library-panel";
import {
  generateCandidates,
  type GeneratedCandidate
} from "./candidate-generation";
import { CandidateListPanel } from "./candidate-list-panel";
import {
  summarizeBlockedCandidateGap,
  summarizeWorkbenchStanding,
  summarizeBlockedCandidateGapProgress
} from "./candidate-triage";
import {
  createRepairHistoryEntry,
  prepareFindingRepairStates,
  type FindingRepairState,
  type RepairHistoryEntry
} from "./critic-repair";
import { ConstraintsEditor } from "./constraints-editor";
import { CriticPanel } from "./critic-panel";
import { evaluateExportReadiness } from "./export-readiness";
import {
  canUseDirectoryPicker,
  isPickerAbort,
  loadProjectFromDirectoryHandle,
  promptForDirectory,
  saveProjectToDirectoryHandle,
  serializeProjectFingerprint,
  validationErrorMessage
} from "./project-io";
import { PreviewControls } from "./preview-controls";
import { ProjectToolbar, type ProjectNotice } from "./project-toolbar";
import { prioritizeBlockedCandidateRepairs } from "./repair-targeting";
import { ScreenBriefEditor } from "./screen-brief-editor";
import {
  applyBlueprintToProject,
  createInitialBrief,
  createStarterProject,
  deriveBriefFromProject,
  syncProjectTitle
} from "./screen-workbench";
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
  const [project, setProject] = useState<PlaygroundProject>(() =>
    createStarterProject("settings")
  );
  const [brief, setBrief] = useState<ScreenBrief>(() => createInitialBrief("settings"));
  const [activeBlueprintId, setActiveBlueprintId] = useState<string | null>(
    getDefaultBlueprintId("settings")
  );
  const [newSectionType, setNewSectionType] = useState<SectionType>("settings");
  const [activeBreakpoint, setActiveBreakpoint] = useState<BreakpointName>("md");
  const [projectDirectoryHandle, setProjectDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState(() =>
    serializeProjectFingerprint(
      createStarterProject("settings"),
      createInitialBrief("settings"),
      getDefaultBlueprintId("settings")
    )
  );
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [repairHistory, setRepairHistory] = useState<RepairHistoryEntry[]>([]);
  const [notice, setNotice] = useState<ProjectNotice | null>({
    tone: "neutral",
    message: "Editing a settings-focused starter candidate in memory."
  });

  const validationIssues = useMemo(() => collectValidationIssues(project), [project]);
  const criticReport = useMemo(
    () => evaluateScreen(project, brief),
    [brief, project]
  );
  const generatedCandidates = useMemo(
    () => generateCandidates(project, brief),
    [brief, project]
  );
  const availableBlueprints = useMemo(
    () => getBlueprintsForScreenType(brief.screenType),
    [brief.screenType]
  );
  const exportReadiness = useMemo(
    () => evaluateExportReadiness(criticReport, validationIssues),
    [criticReport, validationIssues]
  );
  const blockedCandidateGap = useMemo(
    () =>
      summarizeBlockedCandidateGap(
        criticReport,
        exportReadiness,
        generatedCandidates
      ),
    [criticReport, exportReadiness, generatedCandidates]
  );
  const workbenchStanding = useMemo(
    () =>
      summarizeWorkbenchStanding(
        criticReport,
        exportReadiness,
        generatedCandidates
      ),
    [criticReport, exportReadiness, generatedCandidates]
  );
  const findingRepairs = useMemo(
    () => prepareFindingRepairStates(project, brief, criticReport),
    [brief, criticReport, project]
  );
  const prioritizedRepairs = useMemo(
    () => prioritizeBlockedCandidateRepairs(findingRepairs, blockedCandidateGap).slice(0, 3),
    [blockedCandidateGap, findingRepairs]
  );
  const supportsDirectoryPicker = canUseDirectoryPicker();
  const currentFingerprint = useMemo(
    () => serializeProjectFingerprint(project, brief, activeBlueprintId),
    [activeBlueprintId, brief, project]
  );
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

  function setBriefTitle(title: string) {
    startTransition(() => {
      setRepairHistory([]);
      setBrief((current) => ({
        ...current,
        title
      }));
      setProject((current) => syncProjectTitle(current, title));
    });
  }

  function setBriefDensity(
    value: OnboardingScreenDensity | SettingsScreenDensity | MarketingLandingDensity
  ) {
    setRepairHistory([]);
    setBrief((current) =>
      current.screenType === "settings"
        ? {
            ...current,
            density: value as SettingsScreenDensity
          }
        : current.screenType === "onboarding"
          ? {
              ...current,
              density: value as OnboardingScreenDensity
            }
          : {
              ...current,
              density: value as MarketingLandingDensity
            }
    );
  }

  function applySelectedBlueprint() {
    const blueprint =
      activeBlueprintId === null
        ? null
        : availableBlueprints.find((entry) => entry.id === activeBlueprintId) ?? null;

    if (!blueprint) {
      return;
    }

    const selectedBlueprintId = blueprint.id;

    startTransition(() => {
      setRepairHistory([]);
      setProject((current) => applyBlueprintToProject(current, brief, selectedBlueprintId));
      setActiveBlueprintId(blueprint.id);
      setNotice({
        tone: "success",
        message: `Applied the ${blueprint.name} blueprint to the current candidate.`
      });
    });
  }

  function loadGeneratedCandidate(candidate: GeneratedCandidate) {
    const rank = generatedCandidates.findIndex(
      (entry) => entry.blueprint.id === candidate.blueprint.id
    );

    startTransition(() => {
      setRepairHistory([]);
      setProject(candidate.project);
      setActiveBlueprintId(candidate.blueprint.id);
      setNotice({
        tone: "success",
        message: `Loaded ranked candidate #${rank + 1}: ${candidate.blueprint.name}.`
      });
    });
  }

  function applySuggestedFix(repair: FindingRepairState) {
    if (repair.status !== "actionable") {
      setNotice({
        tone: "neutral",
        message: repair.helperText
      });
      return;
    }

    const nextGeneratedCandidates = generateCandidates(repair.nextProject, brief);
    const nextBlockedCandidateGap = summarizeBlockedCandidateGap(
      repair.nextReport,
      repair.nextExportReadiness,
      nextGeneratedCandidates
    );
    const gapProgress = summarizeBlockedCandidateGapProgress(
      blockedCandidateGap,
      nextBlockedCandidateGap
    );
    const historyEntry = createRepairHistoryEntry(repair, gapProgress);

    startTransition(() => {
      setProject(repair.nextProject);
      setRepairHistory((current) => [historyEntry, ...current].slice(0, 6));
      setNotice({
        tone: repair.nextReport.score >= criticReport.score ? "success" : "neutral",
        message: `Applied repair: ${repair.label}. Score ${criticReport.score} to ${
          repair.nextReport.score
        }, cleared ${historyEntry.resolvedFindings} finding${
          historyEntry.resolvedFindings === 1 ? "" : "s"
        }.${
          gapProgress
            ? gapProgress.exportReadyNow
              ? " Export-ready now."
              : ` ${gapProgress.summary}`
            : ""
        }`
      });
    });
  }

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
    nextNotice: ProjectNotice,
    nextBrief = deriveBriefFromProject(nextProject, brief),
    nextActiveBlueprintId: string | null = null
  ) {
    const fingerprint = serializeProjectFingerprint(
      nextProject,
      nextBrief,
      nextActiveBlueprintId
    );

    startTransition(() => {
      setProject(nextProject);
      setBrief(nextBrief);
      setProjectDirectoryHandle(directoryHandle);
      setActiveBlueprintId(nextActiveBlueprintId);
      setRepairHistory([]);
      setSavedFingerprint(fingerprint);
      setActiveBreakpoint(resolvePreviewLayout(nextProject, activeBreakpoint).breakpoint);
      setNotice(nextNotice);
    });
  }

  function createFreshProject(screenType: ScreenType = brief.screenType) {
    const nextProject = createStarterProject(screenType);
    const nextBrief = createInitialBrief(screenType);
    const nextDefaultBlueprintId = getDefaultBlueprintId(screenType);
    const fingerprint = serializeProjectFingerprint(
      nextProject,
      nextBrief,
      nextDefaultBlueprintId
    );

    startTransition(() => {
      setProject(nextProject);
      setBrief(nextBrief);
      setActiveBlueprintId(nextDefaultBlueprintId);
      setRepairHistory([]);
      setProjectDirectoryHandle(null);
      setSavedFingerprint(fingerprint);
      setActiveBreakpoint(resolvePreviewLayout(nextProject, activeBreakpoint).breakpoint);
      setNotice({
        tone: "neutral",
        message: `Started a new ${screenType} candidate from the local starter baseline.`
      });
    });
  }

  function switchScreenType(screenType: ScreenType) {
    if (screenType === brief.screenType) {
      return;
    }

    createFreshProject(screenType);
  }

  async function openProject() {
    await withBusyState("Opening project...", async () => {
      try {
        const directoryHandle = await promptForDirectory("open");
        const loadedState = await loadProjectFromDirectoryHandle(directoryHandle);
        const nextBrief = loadedState.brief
          ? loadedState.brief
          : deriveBriefFromProject(loadedState.project, brief);

        applyLoadedProject(
          loadedState.project,
          directoryHandle,
          {
            tone: "success",
            message: `Opened project from ${directoryHandle.name}.`
          },
          nextBrief,
          loadedState.activeBlueprintId
        );
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
        const savedFiles = await saveProjectToDirectoryHandle(
          directoryHandle,
          project,
          brief,
          activeBlueprintId
        );

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
    if (!exportReadiness.canExport) {
      setNotice({
        tone: "error",
        message: `Export blocked. ${exportReadiness.summary}`
      });
      return;
    }

    await withBusyState("Exporting bundle...", async () => {
      try {
        const directoryHandle = await promptForDirectory("save");
        const savedFiles = await saveProjectToDirectoryHandle(
          directoryHandle,
          project,
          brief,
          activeBlueprintId
        );

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
          <h1>UI Critic Workbench</h1>
          <p>
            Author a structured screen brief, edit one candidate, and score it live against the
            critic rules.
            {busyLabel ? ` ${busyLabel}` : ""}
          </p>
        </header>

        <ProjectToolbar
          exportReadiness={exportReadiness}
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

        <ScreenBriefEditor
          brief={brief}
          onScreenTypeChange={switchScreenType}
          onTitleChange={setBriefTitle}
          onDensityChange={setBriefDensity}
        />

        <BlueprintLibraryPanel
          activeBlueprintId={activeBlueprintId}
          blueprints={availableBlueprints}
          brief={brief}
          onApplyBlueprint={applySelectedBlueprint}
          onBlueprintChange={setActiveBlueprintId}
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
        <CandidateListPanel
          activeBlueprintId={activeBlueprintId}
          activeExportReadiness={exportReadiness}
          activeProject={project}
          activeReport={criticReport}
          brief={brief}
          candidates={generatedCandidates}
          onLoadCandidate={loadGeneratedCandidate}
          workbenchStanding={workbenchStanding}
        />
        <CriticPanel
          blockedCandidateGap={blockedCandidateGap}
          brief={brief}
          findingRepairs={findingRepairs}
          onApplySuggestedFix={applySuggestedFix}
          project={project}
          prioritizedRepairs={prioritizedRepairs}
          repairHistory={repairHistory}
          report={criticReport}
        />
        <PlaygroundPreview project={project} activeBreakpoint={previewLayout.breakpoint} />
      </section>
    </main>
  );
}
