import { type ScreenBlueprint } from "@bux/blueprint-library";
import { type ScreenBrief } from "@bux/core-model";

interface BlueprintLibraryPanelProps {
  activeBlueprintId: string | null;
  blueprints: ReadonlyArray<ScreenBlueprint>;
  brief: ScreenBrief;
  onApplyBlueprint: () => void;
  onBlueprintChange: (blueprintId: string) => void;
}

function densityLabel(briefDensity: ScreenBrief["density"], blueprint: ScreenBlueprint) {
  return blueprint.densityEnvelope.some((density) => density === briefDensity)
    ? "Density aligned"
    : "Density outside envelope";
}

export function BlueprintLibraryPanel({
  activeBlueprintId,
  blueprints,
  brief,
  onApplyBlueprint,
  onBlueprintChange
}: BlueprintLibraryPanelProps) {
  return (
    <section className="panel-block">
      <div className="panel-title-row">
        <div>
          <h2>Blueprints</h2>
          <p className="panel-caption">
            Apply one authored <code>{brief.screenType}</code> composition to the current
            candidate.
          </p>
        </div>
      </div>

      <div className="blueprint-grid">
        {blueprints.map((blueprint) => {
          const selected = blueprint.id === activeBlueprintId;

          return (
            <button
              key={blueprint.id}
              type="button"
              className={`blueprint-card${selected ? " selected" : ""}`}
              onClick={() => onBlueprintChange(blueprint.id)}
              aria-pressed={selected}
            >
              <div className="blueprint-card-header">
                <strong>{blueprint.name}</strong>
                <span>{densityLabel(brief.density, blueprint)}</span>
              </div>
              <p>{blueprint.description}</p>
              <div className="blueprint-meta-list">
                <span>Hierarchy: {blueprint.hierarchyIntent}</span>
                <span>CTA: {blueprint.ctaStrategy}</span>
                <span>Variants: {blueprint.allowedVariants.join(", ")}</span>
                <span>Density: {blueprint.densityEnvelope.join(", ")}</span>
                <span>Watch for: {blueprint.antiPatternNotes[0]}</span>
              </div>
            </button>
          );
        })}
      </div>

      <button type="button" className="apply-blueprint-button" onClick={onApplyBlueprint}>
        Apply blueprint to candidate
      </button>
    </section>
  );
}
