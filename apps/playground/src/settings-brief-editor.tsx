import type {
  SettingsScreenBrief,
  SettingsScreenDensity
} from "@bux/core-model";

interface SettingsBriefEditorProps {
  brief: SettingsScreenBrief;
  onDensityChange: (density: SettingsScreenDensity) => void;
  onTitleChange: (title: string) => void;
}

const densityOptions: Array<{
  value: SettingsScreenDensity;
  label: string;
  description: string;
}> = [
  {
    value: "comfortable",
    label: "Comfortable",
    description: "Balanced grouping with enough structure to scan without feeling sparse."
  },
  {
    value: "compact",
    label: "Compact",
    description: "Tighten top-level regions and minimize extra chrome around simple controls."
  },
  {
    value: "calm",
    label: "Calm",
    description: "Reduce visual noise and keep related controls in a few clear semantic groups."
  }
];

export function SettingsBriefEditor({
  brief,
  onDensityChange,
  onTitleChange
}: SettingsBriefEditorProps) {
  return (
    <section className="panel-block">
      <div className="panel-title-row">
        <div>
          <h2>Settings Brief</h2>
          <p className="panel-caption">Live input for the current `settings` candidate.</p>
        </div>
        <span className="screen-type-chip">{brief.screenType}</span>
      </div>

      <div className="control-list">
        <label className="control-row">
          <span>Brief Title</span>
          <input
            type="text"
            value={brief.title}
            onChange={(event) => onTitleChange(event.currentTarget.value)}
          />
        </label>
      </div>

      <div className="brief-density-grid" role="list" aria-label="Settings density">
        {densityOptions.map((option) => {
          const selected = option.value === brief.density;

          return (
            <button
              key={option.value}
              type="button"
              className={`brief-density-card${selected ? " selected" : ""}`}
              onClick={() => onDensityChange(option.value)}
              aria-pressed={selected}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          );
        })}
      </div>

      <p className="brief-help">
        The brief title stays synced with the candidate title used by the playground and exports.
      </p>
    </section>
  );
}
