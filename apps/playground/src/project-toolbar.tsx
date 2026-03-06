export interface ProjectNotice {
  tone: "neutral" | "success" | "error";
  message: string;
}

interface ProjectToolbarProps {
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
        <button onClick={onExport} type="button" disabled={isBusy || !supportsDirectoryPicker}>
          Export
        </button>
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
