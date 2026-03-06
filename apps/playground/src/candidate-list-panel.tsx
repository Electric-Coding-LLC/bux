import type { CriticVerdict, SettingsScreenBrief } from "@bux/core-model";
import type { GeneratedSettingsCandidate } from "./candidate-generation";

interface CandidateListPanelProps {
  activeBlueprintId: string | null;
  brief: SettingsScreenBrief;
  candidates: ReadonlyArray<GeneratedSettingsCandidate>;
  onLoadCandidate: (candidate: GeneratedSettingsCandidate) => void;
}

const verdictLabels: Record<CriticVerdict, string> = {
  fail: "Fail",
  pass: "Pass",
  warn: "Warn"
};

export function CandidateListPanel({
  activeBlueprintId,
  brief,
  candidates,
  onLoadCandidate
}: CandidateListPanelProps) {
  return (
    <section className="candidate-panel">
      <div className="candidate-panel-header">
        <div>
          <p className="critic-eyebrow">Generated Candidates</p>
          <h2>Ranked from the current brief</h2>
          <p className="candidate-panel-copy">
            Deterministic candidates generated from authored blueprints and scored with the current critic.
          </p>
        </div>
        <span className="screen-type-chip">{brief.density}</span>
      </div>

      <ol className="candidate-list">
        {candidates.map((candidate, index) => {
          const isActive = candidate.blueprint.id === activeBlueprintId;
          const densityAligned = candidate.blueprint.densityEnvelope.includes(brief.density);

          return (
            <li key={candidate.blueprint.id} className={`candidate-card${isActive ? " active" : ""}`}>
              <div className="candidate-rank">
                <strong>#{index + 1}</strong>
                <span>{candidate.blueprint.name}</span>
              </div>
              <div className="candidate-stats">
                <span className={`candidate-verdict verdict-${candidate.report.verdict}`}>
                  {verdictLabels[candidate.report.verdict]}
                </span>
                <span>Score {candidate.report.score}</span>
                <span>{candidate.report.findings.length} findings</span>
                <span>{densityAligned ? "Density aligned" : "Density stretched"}</span>
              </div>
              <p className="candidate-description">{candidate.blueprint.description}</p>
              <p className="candidate-intent">{candidate.blueprint.hierarchyIntent}</p>
              <button type="button" onClick={() => onLoadCandidate(candidate)}>
                {isActive ? "Reload into editor" : "Load into editor"}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
