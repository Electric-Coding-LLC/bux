import type { BreakpointName } from "@bux/core-model";

interface PreviewControlsProps {
  activeBreakpoint: BreakpointName;
  breakpoints: BreakpointName[];
  columns: number;
  gutter: number;
  containerWidth: number;
  onBreakpointChange: (value: BreakpointName) => void;
}

export function PreviewControls({
  activeBreakpoint,
  breakpoints,
  columns,
  gutter,
  containerWidth,
  onBreakpointChange
}: PreviewControlsProps) {
  return (
    <div className="preview-toolbar">
      <div className="preview-toolbar-group">
        <label className="control-row">
          <span>Breakpoint</span>
          <select
            value={activeBreakpoint}
            onChange={(event) => onBreakpointChange(event.currentTarget.value as BreakpointName)}
          >
            {breakpoints.map((breakpoint) => (
              <option key={breakpoint} value={breakpoint}>
                {breakpoint}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="preview-stats">
        <span>{columns} cols</span>
        <span>{gutter}px gutter</span>
        <span>{containerWidth}px container</span>
      </div>
    </div>
  );
}
