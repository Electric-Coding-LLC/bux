import type {
  CriticReport,
  CriticVerdict,
  PlaygroundProject,
  ScreenBrief
} from "@bux/core-model";
import { PlaygroundPreview } from "@bux/preview-runtime";
import type { GeneratedCandidate } from "./candidate-generation";
import {
  summarizeActiveBlueprintStatus,
  summarizeCandidateRecommendation,
  summarizeCandidateLeads,
  type WorkbenchStandingSummary
} from "./candidate-triage";
import {
  getDashboardReferencePack,
  summarizeDashboardVisualCompare
} from "./dashboard-visual-compare";
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

function shouldShowVisualReview(brief: ScreenBrief): boolean {
  return brief.screenType === "dashboard";
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
  const showVisualReview = shouldShowVisualReview(brief);
  const screenTypeChipLabel =
    brief.screenType === "dashboard"
      ? `${brief.density} · ${getDashboardReferencePack(brief.artDirection).profileLabel}`
      : brief.density;
  const candidateLeads = summarizeCandidateLeads(candidates);
  const recommendation = summarizeCandidateRecommendation(
    activeReport,
    activeExportReadiness,
    candidates
  );
  const dashboardReferencePack =
    brief.screenType === "dashboard"
      ? getDashboardReferencePack(brief.artDirection)
      : null;
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
        <span className="screen-type-chip">{screenTypeChipLabel}</span>
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

      {dashboardReferencePack ? (
        <section className="dashboard-reference-pack">
          <div className="dashboard-reference-pack-header">
            <div>
              <p className="critic-eyebrow">Reference Canon</p>
              <h3>{dashboardReferencePack.title}</h3>
              <p>{dashboardReferencePack.summary}</p>
            </div>
            <span>{dashboardReferencePack.profileLabel}</span>
          </div>
          <div className="dashboard-reference-grid">
            {dashboardReferencePack.references.map((reference) => (
              <article key={reference.id} className="dashboard-reference-card">
                <div className="dashboard-reference-card-header">
                  <strong>{reference.label}</strong>
                  <span>{reference.signals.length} cues</span>
                </div>
                <p>{reference.summary}</p>
                <div className="dashboard-reference-signals">
                  {reference.signals.map((signal) => (
                    <span key={signal}>{signal}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

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
          const visualCompare = summarizeDashboardVisualCompare(candidate);

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
              {showVisualReview ? (
                <section className="candidate-preview-review">
                  <div className="candidate-preview-review-header">
                    <strong>Visual review</strong>
                    <span>Live preview</span>
                  </div>
                  <div className="candidate-preview-frame" aria-label={`${candidate.blueprint.name} preview`}>
                    <div className="candidate-preview-scale">
                      <PlaygroundPreview project={candidate.project} activeBreakpoint="md" />
                    </div>
                  </div>
                </section>
              ) : null}
              {visualCompare ? (
                <section
                  className={`candidate-reference-fit candidate-reference-fit-${visualCompare.status}`}
                >
                  <div className="candidate-reference-fit-header">
                    <strong>{visualCompare.label}</strong>
                    <span>{visualCompare.scoreLabel}</span>
                  </div>
                  <p>{visualCompare.summary}</p>
                  <div className="candidate-reference-signals">
                    {visualCompare.matchedSignals.slice(0, 2).map((signal) => (
                      <span
                        key={`${candidate.blueprint.id}-${signal}`}
                        className="reference-signal matched"
                      >
                        {signal}
                      </span>
                    ))}
                    {visualCompare.missingSignals.slice(0, 1).map((signal) => (
                      <span
                        key={`${candidate.blueprint.id}-missing-${signal}`}
                        className="reference-signal missing"
                      >
                        Needs {signal}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}
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
