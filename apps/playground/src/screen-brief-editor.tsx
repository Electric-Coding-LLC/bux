import type {
  DashboardArtDirectionProfile,
  DashboardScreenDensity,
  MarketingLandingDensity,
  OnboardingScreenDensity,
  ScreenBrief,
  ScreenType,
  SettingsScreenDensity
} from "@bux/core-model";
import { dashboardArtDirectionOptions } from "./dashboard-art-direction";

interface ScreenBriefEditorProps {
  brief: ScreenBrief;
  onArtDirectionChange: (artDirection: DashboardArtDirectionProfile) => void;
  onDensityChange: (
    density:
      | DashboardScreenDensity
      | MarketingLandingDensity
      | OnboardingScreenDensity
      | SettingsScreenDensity
  ) => void;
  onScreenTypeChange: (screenType: ScreenType) => void;
  onTitleChange: (title: string) => void;
}

const settingsDensityOptions: Array<{
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

const onboardingDensityOptions: Array<{
  value: OnboardingScreenDensity;
  label: string;
  description: string;
}> = [
  {
    value: "guided",
    label: "Guided",
    description: "Explain the first-run path clearly before the user commits to setup."
  },
  {
    value: "focused",
    label: "Focused",
    description: "Keep just enough orientation to support one strong setup handoff."
  },
  {
    value: "compact",
    label: "Compact",
    description: "Strip onboarding down to the fastest possible path into the product."
  }
];

const marketingLandingDensityOptions: Array<{
  value: MarketingLandingDensity;
  label: string;
  description: string;
}> = [
  {
    value: "editorial",
    label: "Editorial",
    description: "Lead with narrative pacing and a stronger product story before the conversion ask."
  },
  {
    value: "focused",
    label: "Focused",
    description: "Keep the story tight and move quickly from value proposition to proof and CTA."
  },
  {
    value: "launch",
    label: "Launch",
    description: "Bias toward a sharper activation push with minimal supporting surfaces."
  }
];

const dashboardDensityOptions: Array<{
  value: DashboardScreenDensity;
  label: string;
  description: string;
}> = [
  {
    value: "executive",
    label: "Executive",
    description: "Lead with a concise pulse and keep deeper monitoring surfaces secondary."
  },
  {
    value: "operational",
    label: "Operational",
    description: "Expose one clear queue so teams can act directly from the dashboard."
  },
  {
    value: "focused",
    label: "Focused",
    description: "Keep the dashboard to one summary band and one follow-up surface."
  }
];

const densityOptionsByScreenType = {
  settings: settingsDensityOptions,
  onboarding: onboardingDensityOptions,
  marketingLanding: marketingLandingDensityOptions,
  dashboard: dashboardDensityOptions
} satisfies Record<
  ScreenType,
  ReadonlyArray<{
    value: ScreenBrief["density"];
    label: string;
    description: string;
  }>
>;

const headings: Record<ScreenType, string> = {
  settings: "Settings Brief",
  onboarding: "Onboarding Brief",
  marketingLanding: "Marketing Brief",
  dashboard: "Dashboard Brief"
};

const captions: Record<ScreenType, string> = {
  settings: "Live input for the current `settings` candidate.",
  onboarding: "Live input for the current `onboarding` candidate.",
  marketingLanding: "Live input for the current `marketingLanding` candidate.",
  dashboard: "Live input for the current `dashboard` candidate."
};

const screenTypeLabels: Record<ScreenType, string> = {
  settings: "settings",
  onboarding: "onboarding",
  marketingLanding: "marketing",
  dashboard: "dashboard"
};

export function ScreenBriefEditor({
  brief,
  onArtDirectionChange,
  onDensityChange,
  onScreenTypeChange,
  onTitleChange
}: ScreenBriefEditorProps) {
  const densityOptions = densityOptionsByScreenType[brief.screenType];
  const heading = headings[brief.screenType];
  const caption = captions[brief.screenType];

  return (
    <section className="panel-block">
      <div className="panel-title-row">
        <div>
          <h2>{heading}</h2>
          <p className="panel-caption">{caption}</p>
        </div>
        <span className="screen-type-chip">{brief.screenType}</span>
      </div>

      <div className="screen-type-switch" role="tablist" aria-label="Screen type">
        {(["settings", "onboarding", "marketingLanding", "dashboard"] as const).map((screenType) => {
          const selected = screenType === brief.screenType;

          return (
            <button
              key={screenType}
              type="button"
              className={`screen-type-switch-button${selected ? " selected" : ""}`}
              onClick={() => onScreenTypeChange(screenType)}
              aria-pressed={selected}
            >
              {screenTypeLabels[screenType]}
            </button>
          );
        })}
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

      <div className="brief-density-grid" role="list" aria-label={`${brief.screenType} density`}>
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

      {brief.screenType === "dashboard" ? (
        <>
          <div className="panel-title-row">
            <div>
              <h3>Art Direction</h3>
              <p className="panel-caption">
                Bias dashboard generation toward one named taste profile before you compare
                candidates.
              </p>
            </div>
          </div>

          <div
            className="brief-density-grid"
            role="list"
            aria-label="dashboard art direction"
          >
            {dashboardArtDirectionOptions.map((option) => {
              const selected = option.value === brief.artDirection;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`brief-density-card${selected ? " selected" : ""}`}
                  onClick={() => onArtDirectionChange(option.value)}
                  aria-pressed={selected}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      <p className="brief-help">
        The brief title stays synced with the candidate title used by the playground and exports.
      </p>
    </section>
  );
}
