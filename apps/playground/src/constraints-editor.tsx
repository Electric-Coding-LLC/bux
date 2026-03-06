import type {
  BreakpointConstraint,
  BreakpointName,
  DensityMode,
  PlaygroundProject
} from "@bux/core-model";

interface ConstraintsEditorProps {
  project: PlaygroundProject;
  onSetConstraintValue: (path: string[], value: string | number) => void;
}

const densityModes: DensityMode[] = ["comfortable", "compact"];
const breakpointNames: BreakpointName[] = ["xs", "sm", "md", "lg", "xl"];

function controlPath(index: number, key: keyof BreakpointConstraint): string[] {
  return ["layout", "breakpoints", String(index), key];
}

export function ConstraintsEditor({
  project,
  onSetConstraintValue
}: ConstraintsEditorProps) {
  const spacingTokenLimit = Math.max(project.tokens.spacing.scale.length, 1);

  return (
    <section className="panel-block">
      <h2>Constraints</h2>

      <div className="control-list">
        <label className="control-row">
          <span>Default Density</span>
          <select
            value={project.constraints.layout.defaultDensity}
            onChange={(event) =>
              onSetConstraintValue(["layout", "defaultDensity"], event.currentTarget.value)
            }
          >
            {densityModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="constraint-list">
        {project.constraints.layout.breakpoints.map((entry, index) => (
          <article className="constraint-card" key={entry.breakpoint}>
            <div className="constraint-card-header">
              <strong>{entry.breakpoint}</strong>
              <span>{project.tokens.containers[entry.containerToken]}px container</span>
            </div>

            <label className="section-inline-control">
              <span>Columns</span>
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                value={entry.columns}
                onChange={(event) =>
                  onSetConstraintValue(
                    controlPath(index, "columns"),
                    Number(event.currentTarget.value)
                  )
                }
              />
              <output>{entry.columns}</output>
            </label>

            <label className="section-inline-control">
              <span>Gutter Token</span>
              <input
                type="range"
                min={0}
                max={spacingTokenLimit}
                step={1}
                value={entry.gutterToken}
                onChange={(event) =>
                  onSetConstraintValue(
                    controlPath(index, "gutterToken"),
                    Number(event.currentTarget.value)
                  )
                }
              />
              <output>{entry.gutterToken}</output>
            </label>

            <label className="section-inline-control">
              <span>Container Token</span>
              <select
                value={entry.containerToken}
                onChange={(event) =>
                  onSetConstraintValue(
                    controlPath(index, "containerToken"),
                    event.currentTarget.value
                  )
                }
              >
                {breakpointNames.map((breakpoint) => (
                  <option key={breakpoint} value={breakpoint}>
                    {breakpoint}
                  </option>
                ))}
              </select>
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
