import type {
  CriticReport,
  CriticVerdict,
  PlaygroundProject,
  ScreenBrief
} from "@bux/core-model";
import type { GeneratedCandidate } from "./candidate-generation";
import {
  summarizeActiveBlueprintStatus,
  summarizeCandidateRecommendation,
  summarizeCandidateLeads,
  type WorkbenchStandingSummary
} from "./candidate-triage";
import type { ExportReadiness } from "./export-readiness";

interface CandidateListPanelProps {
  activeBlueprintId: string | null;
  activeExportReadiness: ExportReadiness;
  activeProject: PlaygroundProject;
  activeReport: CriticReport;
  brief: ScreenBrief;
  candidates: ReadonlyArray<GeneratedCandidate>;
  onLoadCandidate: (candidate: GeneratedCandidate) => void;
  workbenchStanding: WorkbenchStandingSummary;
}

const verdictLabels: Record<CriticVerdict, string> = {
  fail: "Fail",
  pass: "Pass",
  warn: "Warn"
};

function formatDelta(value: number, suffix = ""): string {
  if (value > 0) {
    return `+${value}${suffix}`;
  }

  return `${value}${suffix}`;
}

function panelCopy(canExport: boolean): string {
  return canExport
    ? "The current version is ready to export. You can keep it, or switch to a stronger option below."
    : "The current version still needs repair. Pick an approved fallback or open another version to keep working.";
}

export function CandidateListPanel({
  activeBlueprintId,
  activeExportReadiness,
  activeProject,
  activeReport,
  brief,
  candidates,
  onLoadCandidate,
  workbenchStanding
}: CandidateListPanelProps) {
  const candidateLeads = summarizeCandidateLeads(candidates);
  const recommendation = summarizeCandidateRecommendation(
    activeReport,
    activeExportReadiness,
    candidates
  );
  const activeBlueprintStatus = summarizeActiveBlueprintStatus(
    activeBlueprintId,
    activeProject,
    brief,
    activeReport,
    activeExportReadiness,
    candidates
  );

  return (
    <section className="candidate-panel">
      <div className="candidate-panel-header">
        <div>
          <p className="critic-eyebrow">Choose A Version</p>
          <h2>Pick what to keep editing or export</h2>
          <p className="candidate-panel-copy">{panelCopy(activeExportReadiness.canExport)}</p>
        </div>
        <span className="screen-type-chip">{brief.density}</span>
      </div>

      <section className={`workbench-standing workbench-standing-${workbenchStanding.status}`}>
        <div className="workbench-standing-header">
          <h3>Next step</h3>
          <span>{workbenchStanding.label}</span>
        </div>
        <p>{workbenchStanding.summary}</p>
        <div className="workbench-standing-stats">
          <span className={`candidate-verdict verdict-${activeReport.verdict}`}>
            {verdictLabels[activeReport.verdict]}
          </span>
          <span>Score {activeReport.score}</span>
          <span>{activeReport.findings.length} findings</span>
          <span>{activeExportReadiness.canExport ? "Ready to export" : "Needs repair"}</span>
        </div>
      </section>

      {recommendation ? (
        <section
          className={`candidate-recommendation candidate-recommendation-${recommendation.status}`}
        >
          <div className="candidate-recommendation-header">
            <div>
              <h3>{recommendation.label}</h3>
              <span>{recommendation.candidate.blueprint.name}</span>
            </div>
            <button type="button" onClick={() => onLoadCandidate(recommendation.candidate)}>
              {recommendation.actionLabel}
            </button>
          </div>
          <p>{recommendation.summary}</p>
        </section>
      ) : null}

      <details className="candidate-supporting-details">
        <summary>Why these versions are ordered this way</summary>
        <div className="candidate-supporting-content">
          <div className="candidate-lead-summary">
            <span>Top score: {candidateLeads.bestOverall?.blueprint.name ?? "None yet"}</span>
            <span>
              Ready to export now:{" "}
              {candidateLeads.bestExportReady?.blueprint.name ?? "None yet"}
            </span>
          </div>

          {activeBlueprintStatus ? (
            <section
              className={`active-blueprint-status active-blueprint-status-${activeBlueprintStatus.status}`}
            >
              <div className="active-blueprint-status-header">
                <div>
                  <h3>{activeBlueprintStatus.label}</h3>
                  <span>{activeBlueprintStatus.candidate.blueprint.name}</span>
                </div>
                <div className="active-blueprint-status-actions">
                  <span className="active-blueprint-status-chip">
                    {activeBlueprintStatus.status === "approved" ? "Ready" : "Blocked"}
                  </span>
                  {activeBlueprintStatus.canRestoreBaseline ? (
                    <button
                      type="button"
                      onClick={() => onLoadCandidate(activeBlueprintStatus.candidate)}
                    >
                      Restore blueprint baseline
                    </button>
                  ) : null}
                </div>
              </div>
              <p>{activeBlueprintStatus.summary}</p>
              <div className="active-blueprint-compare">
                <div className="active-blueprint-compare-row">
                  <strong>Score</strong>
                  <span>
                    Current {activeBlueprintStatus.comparison.scores.current}, blueprint{" "}
                    {activeBlueprintStatus.comparison.scores.baseline}
                  </span>
                  <span>{formatDelta(activeBlueprintStatus.comparison.scoreDelta)}</span>
                </div>
                <div className="active-blueprint-compare-row">
                  <strong>Findings</strong>
                  <span>
                    Current {activeBlueprintStatus.comparison.findings.current}, blueprint{" "}
                    {activeBlueprintStatus.comparison.findings.baseline}
                  </span>
                  <span>{formatDelta(activeBlueprintStatus.comparison.findingDelta)}</span>
                </div>
                <div className="active-blueprint-compare-row">
                  <strong>Export</strong>
                  <span>
                    Current{" "}
                    {activeBlueprintStatus.comparison.exportStatus.current === "approved"
                      ? "ready"
                      : "blocked"}
                    , blueprint{" "}
                    {activeBlueprintStatus.comparison.exportStatus.baseline === "approved"
                      ? "ready"
                      : "blocked"}
                  </span>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </details>

      <div className="candidate-list-header">
        <h3>All generated versions</h3>
        <p>Open any version below to continue from it in the editor.</p>
      </div>

      <ol className="candidate-list">
        {candidates.map((candidate, index) => {
          const isActive = candidate.blueprint.id === activeBlueprintId;
          const densityAligned = candidate.blueprint.densityEnvelope.some(
            (density) => density === brief.density
          );
          const isBestOverall =
            candidateLeads.bestOverall?.blueprint.id === candidate.blueprint.id;
          const isBestExportReady =
            candidateLeads.bestExportReady?.blueprint.id === candidate.blueprint.id;

          return (
            <li key={candidate.blueprint.id} className={`candidate-card${isActive ? " active" : ""}`}>
              <div className="candidate-rank">
                <div className="candidate-rank-copy">
                  <strong>#{index + 1}</strong>
                  <span>{candidate.blueprint.name}</span>
                </div>
                <span
                  className={`candidate-export-status candidate-export-status-${candidate.exportReadiness.status}`}
                  title={candidate.exportReadiness.summary}
                >
                  {candidate.exportReadiness.status === "approved" ? "Ready now" : "Blocked"}
                </span>
              </div>
              {isBestOverall || isBestExportReady ? (
                <div className="candidate-lead-badges">
                  {isBestOverall ? <span>Top score</span> : null}
                  {isBestExportReady ? <span>Ready now</span> : null}
                </div>
              ) : null}
              <div className="candidate-stats">
                <span className={`candidate-verdict verdict-${candidate.report.verdict}`}>
                  {verdictLabels[candidate.report.verdict]}
                </span>
                <span>Score {candidate.report.score}</span>
                <span>{candidate.report.findings.length} findings</span>
                <span>{densityAligned ? "Fits this brief" : "Stretch for this brief"}</span>
              </div>
              <p className="candidate-description">{candidate.blueprint.description}</p>
              <p className="candidate-intent">{candidate.blueprint.hierarchyIntent}</p>
              <p
                className={`candidate-export-summary candidate-export-summary-${candidate.exportReadiness.status}`}
              >
                {candidate.exportReadiness.summary}
              </p>
              {candidate.exportReadiness.blockedReasons.length > 0 ? (
                <ul className="candidate-export-reasons">
                  {candidate.exportReadiness.blockedReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : null}
              <button type="button" onClick={() => onLoadCandidate(candidate)}>
                {isActive
                  ? "Use current version"
                  : candidate.exportReadiness.canExport
                    ? "Open approved version"
                    : "Open to fix"}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
