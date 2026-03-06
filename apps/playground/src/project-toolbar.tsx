import type { ExportReadiness } from "./export-readiness";

export interface ProjectNotice {
  tone: "neutral" | "success" | "error";
  message: string;
}

interface ProjectToolbarProps {
  exportReadiness: ExportReadiness;
  projectName: string;
  isDirty: boolean;
  isBusy: boolean;
  supportsDirectoryPicker: boolean;
  notice: ProjectNotice | null;
  onCreateNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExport: () => void;
}

export function ProjectToolbar({
  exportReadiness,
  projectName,
  isDirty,
  isBusy,
  supportsDirectoryPicker,
  notice,
  onCreateNew,
  onOpen,
  onSave,
  onSaveAs,
  onExport
}: ProjectToolbarProps) {
  const exportDisabled = isBusy || !supportsDirectoryPicker || !exportReadiness.canExport;

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
          Export
        </button>
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
