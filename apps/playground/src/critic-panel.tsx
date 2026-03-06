import type {
  CriticFindingSeverity,
  CriticReport,
  PlaygroundProject,
  ScreenBrief
} from "@bux/core-model";
import type {
  FindingRepairState,
  RepairHistoryEntry
} from "./critic-repair";
import type { BlockedCandidateGapSummary } from "./candidate-triage";
import { shouldShowApprovalState } from "./critic-panel-state";
import type { PrioritizedRepair } from "./repair-targeting";

interface CriticPanelProps {
  blockedCandidateGap: BlockedCandidateGapSummary | null;
  findingRepairs: ReadonlyArray<FindingRepairState>;
  onApplySuggestedFix: (repair: FindingRepairState) => void;
  brief: ScreenBrief;
  project: PlaygroundProject;
  prioritizedRepairs: ReadonlyArray<PrioritizedRepair>;
  repairHistory: ReadonlyArray<RepairHistoryEntry>;
  report: CriticReport;
}

const severityLabels: Record<CriticFindingSeverity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low"
};

function summarizePath(path: string): string {
  if (path === "/page/sections") {
    return "Page sections";
  }

  const sectionMatch = path.match(/^\/page\/sections\/(\d+)(.*)$/);
  if (!sectionMatch) {
    return path;
  }

  const sectionIndex = Number(sectionMatch[1]) + 1;
  const suffix = sectionMatch[2] ?? "";

  if (suffix.length === 0) {
    return `Section ${sectionIndex}`;
  }

  return `Section ${sectionIndex}${suffix.replaceAll("/", " ")}`;
}

export function CriticPanel({
  blockedCandidateGap,
  brief,
  findingRepairs,
  onApplySuggestedFix,
  project,
  prioritizedRepairs,
  repairHistory,
  report
}: CriticPanelProps) {
  const latestRepair = repairHistory[0] ?? null;
  const previousRepairs = repairHistory.slice(1);
  const showApprovalState = shouldShowApprovalState({
    blockedCandidateGap,
    prioritizedRepairCount: prioritizedRepairs.length,
    repairHistory,
    report
  });

  return (
    <section className="critic-panel">
      <div className="critic-summary">
        <div>
          <p className="critic-eyebrow">Current Candidate</p>
          <h2>{project.page.title}</h2>
          <p className="critic-description">
            Live critic output for the active {brief.screenType} brief.
          </p>
        </div>
        <div className={`critic-score verdict-${report.verdict}`}>
          <strong>{report.score}</strong>
          <span>{report.verdict}</span>
        </div>
      </div>

      <div className="critic-meta">
        <span>Density target: {brief.density}</span>
        <span>Rules checked: {report.summary.totalRules}</span>
        <span>Sections: {project.page.sections.length}</span>
        <span>Triggered rules: {report.summary.triggeredRules}</span>
      </div>

      {latestRepair ? (
        <div className={`repair-outcome ${latestRepair.delta >= 0 ? "positive" : "negative"}`}>
          <strong>Latest repair</strong>
          {latestRepair.gapProgress?.exportReadyNow ? (
            <span className="repair-ready-chip">Export-ready now</span>
          ) : null}
          <p>
            {latestRepair.label}: {latestRepair.beforeScore} to {latestRepair.afterScore} (
            {latestRepair.delta >= 0 ? "+" : ""}
            {latestRepair.delta}) with {latestRepair.resolvedFindings} finding
            {latestRepair.resolvedFindings === 1 ? "" : "s"} cleared and{" "}
            {latestRepair.afterFindingCount} remaining.
          </p>
          <span>
            Verdict {latestRepair.beforeVerdict} to {latestRepair.afterVerdict}
          </span>
          {latestRepair.gapProgress ? (
            <span className="repair-gap-progress">{latestRepair.gapProgress.summary}</span>
          ) : null}
        </div>
      ) : null}

      {previousRepairs.length > 0 ? (
        <section className="repair-history">
          <div className="repair-history-header">
            <h3>Earlier Repairs</h3>
            <span>{previousRepairs.length} earlier</span>
          </div>
          <ol className="repair-history-list">
            {previousRepairs.map((entry, index) => (
              <li key={`${entry.fixId}-${entry.findingCode}-${index}`}>
                <strong>{entry.label}</strong>
                {entry.gapProgress?.exportReadyNow ? (
                  <span className="repair-ready-chip">Export-ready now</span>
                ) : null}
                <span>
                  {entry.beforeScore} to {entry.afterScore} ({entry.delta >= 0 ? "+" : ""}
                  {entry.delta})
                </span>
                <span>
                  Cleared {entry.resolvedFindings}, {entry.afterFindingCount} remaining
                </span>
                {entry.gapProgress ? <span>{entry.gapProgress.summary}</span> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {blockedCandidateGap ? (
        <section className="candidate-gap">
          <div className="candidate-gap-header">
            <h3>Repair Target</h3>
            <span>{blockedCandidateGap.bestExportReady.blueprint.name}</span>
          </div>
          <p>{blockedCandidateGap.summary}</p>
          <div className="candidate-gap-stats">
            <span>Score gap: {blockedCandidateGap.scoreGap}</span>
            <span>
              Finding gap: {blockedCandidateGap.findingGap >= 0 ? "+" : ""}
              {blockedCandidateGap.findingGap}
            </span>
          </div>
          {blockedCandidateGap.blockedReasons.length > 0 ? (
            <ul className="candidate-gap-reasons">
              {blockedCandidateGap.blockedReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {prioritizedRepairs.length > 0 ? (
        <section className="priority-repairs">
          <div className="priority-repairs-header">
            <h3>Priority Repairs</h3>
            <span>Shortest path back to exportable</span>
          </div>
          <ol className="priority-repairs-list">
            {prioritizedRepairs.map((entry) => (
              <li key={entry.repair.fix.id}>
                <div className="priority-repair-copy">
                  <strong>{entry.repair.label}</strong>
                  <p>{entry.rationale}</p>
                  <span>
                    Score {entry.repair.beforeScore} to {entry.repair.nextReport.score} (
                    {entry.repair.projectedDelta >= 0 ? "+" : ""}
                    {entry.repair.projectedDelta}), clears {entry.repair.resolvedFindings} finding
                    {entry.repair.resolvedFindings === 1 ? "" : "s"}.
                  </span>
                </div>
                <button type="button" onClick={() => onApplySuggestedFix(entry.repair)}>
                  {entry.repair.label}
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {showApprovalState ? (
        <section className="approval-state">
          <div className="approval-state-header">
            <h3>Approved Candidate</h3>
            <span>Export-ready now</span>
          </div>
          <p>
            The latest repair moved this candidate out of repair mode. Export it from the Project
            panel when you are ready.
          </p>
          <div className="approval-state-stats">
            <span>Score {report.score}</span>
            <span>Verdict {report.verdict}</span>
            <span>{report.findings.length} findings</span>
          </div>
        </section>
      ) : null}

      {report.findings.length === 0 ? (
        showApprovalState ? null : (
          <p className="critic-clear">No findings. This candidate clears the current rules.</p>
        )
      ) : (
        <ol className="critic-findings">
          {report.findings.map((finding, index) => {
            const repair = findingRepairs[index];

            return (
              <li key={`${finding.code}-${finding.path}-${index}`} className="critic-finding">
                <div className="critic-finding-header">
                  <span className={`finding-severity severity-${finding.severity}`}>
                    {severityLabels[finding.severity]}
                  </span>
                  <code>{finding.code}</code>
                </div>
                <p>{finding.message}</p>
                <span className="critic-path">{summarizePath(finding.path)}</span>
                {repair ? (
                  <div className={`critic-fix critic-fix-${repair.status}`}>
                    <div className="critic-fix-copy">
                      <span>{repair.helperText}</span>
                      {repair.status === "actionable" ? (
                        <span className="critic-fix-projection">
                          Verdict {repair.beforeVerdict} to {repair.nextReport.verdict}.{" "}
                          {repair.resolvedFindings} finding
                          {repair.resolvedFindings === 1 ? "" : "s"} would clear.
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={repair.status === "disabled"}
                      onClick={() => onApplySuggestedFix(repair)}
                      title={repair.status === "disabled" ? repair.helperText : undefined}
                    >
                      {repair.label}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
