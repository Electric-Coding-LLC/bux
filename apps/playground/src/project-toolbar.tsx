import type { AdapterTarget } from "@bux/adapter-contract";
import {
  adapterTargetOptions,
  getAdapterTargetLabel
} from "./adapter-targets";
import type { ExportReadiness } from "./export-readiness";

export interface ProjectNotice {
  tone: "neutral" | "success" | "error";
  message: string;
}

interface ProjectToolbarProps {
  adapterTarget: AdapterTarget;
  exportReadiness: ExportReadiness;
  projectName: string;
  isDirty: boolean;
  isBusy: boolean;
  supportsDirectoryPicker: boolean;
  notice: ProjectNotice | null;
  onCreateNew: () => void;
  onAdapterTargetChange: (target: AdapterTarget) => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExport: () => void;
}

export function ProjectToolbar({
  adapterTarget,
  exportReadiness,
  projectName,
  isDirty,
  isBusy,
  supportsDirectoryPicker,
  notice,
  onCreateNew,
  onAdapterTargetChange,
  onOpen,
  onSave,
  onSaveAs,
  onExport
}: ProjectToolbarProps) {
  const exportDisabled = isBusy || !supportsDirectoryPicker || !exportReadiness.canExport;
  const adapterTargetLabel = getAdapterTargetLabel(adapterTarget);

  return (
    <section className="panel-block">
      <div className="project-toolbar-header">
        <div>
          <h2>Project</h2>
          <p className="project-path">{projectName}</p>
        </div>
        <span className={`status-chip${isDirty ? " dirty" : ""}`}>
          {isDirty ? "Unsaved changes" : "Saved"}
        </span>
      </div>

      <div className="project-toolbar-actions">
        <button onClick={onCreateNew} type="button" disabled={isBusy}>
          New
        </button>
        <button onClick={onOpen} type="button" disabled={isBusy || !supportsDirectoryPicker}>
          Open
        </button>
        <button onClick={onSave} type="button" disabled={isBusy || !supportsDirectoryPicker}>
          Save
        </button>
        <button onClick={onSaveAs} type="button" disabled={isBusy || !supportsDirectoryPicker}>
          Save As
        </button>
        <button
          onClick={onExport}
          type="button"
          disabled={exportDisabled}
          title={!exportReadiness.canExport ? exportReadiness.summary : undefined}
        >
          Export {adapterTargetLabel}
        </button>
      </div>

      <div className="project-export-target">
        <label className="control-row">
          <span>Export target</span>
          <select
            value={adapterTarget}
            onChange={(event) =>
              onAdapterTargetChange(event.currentTarget.value as AdapterTarget)
            }
            disabled={isBusy}
          >
            {adapterTargetOptions.map((target) => (
              <option key={target} value={target}>
                {getAdapterTargetLabel(target)}
              </option>
            ))}
          </select>
        </label>
        <p className="project-export-caption">
          Save keeps the editable workbench bundle. Export writes the canonical project files plus
          the current {adapterTargetLabel} layout spec.
        </p>
      </div>

      <div className={`export-readiness export-readiness-${exportReadiness.status}`}>
        <div className="export-readiness-header">
          <strong>{exportReadiness.label}</strong>
          <span className={`status-chip status-chip-${exportReadiness.status}`}>
            {exportReadiness.status === "approved" ? "Ready" : "Blocked"}
          </span>
        </div>
        <p>{exportReadiness.summary}</p>
        {exportReadiness.blockedReasons.length > 0 ? (
          <ul className="export-readiness-list">
            {exportReadiness.blockedReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {!supportsDirectoryPicker ? (
        <p className="project-note">
          Directory open/save requires a File System Access API compatible browser.
        </p>
      ) : null}

      {notice ? (
        <p className={`project-note tone-${notice.tone}`}>{notice.message}</p>
      ) : null}
    </section>
  );
}
