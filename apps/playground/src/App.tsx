import { applyAction } from "@bux/core-engine";
import {
  canonicalProjectFixture,
  type DensityMode,
  type PlaygroundProject,
  type SectionType,
  type StressCopyMode,
  type StressStateMode
} from "@bux/core-model";
import { PlaygroundPreview } from "@bux/preview-runtime";
import { createSectionDraft, validateProjectSections } from "@bux/section-kit";
import { useMemo, useState } from "react";
import { SectionEditor, type SectionChanges } from "./section-editor";

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
  const validationIssues = useMemo(() => validateProjectSections(project), [project]);
  const accentColor = project.tokens.colors.roles["accent.primary"] ?? "#0F766E";

  function dispatch(action: Parameters<typeof applyAction>[1]) {
    setProject((current) => applyAction(current, action));
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

  return (
    <main className="app-shell">
      <aside className="left-panel">
        <header className="panel-header">
          <h1>UI System Playground</h1>
          <p>Model-driven controls for token and section fundamentals.</p>
        </header>

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

        <section className="panel-block">
          <h2>Validation</h2>
          {validationIssues.length === 0 ? (
            <p className="validation-ok">No section issues.</p>
          ) : (
            <ul className="validation-list">
              {validationIssues.map((entry, index) => (
                <li key={`${entry.code}-${entry.path}-${index}`}>
                  <strong>{entry.sectionId}</strong>
                  <span>{entry.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>

      <section className="preview-panel">
        <PlaygroundPreview project={project} />
      </section>
    </main>
  );
}
