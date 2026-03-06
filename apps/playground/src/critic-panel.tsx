import type {
  CriticSuggestedFix,
  CriticFindingSeverity,
  CriticReport,
  PlaygroundProject,
  SettingsScreenBrief
} from "@bux/core-model";
import type { AppliedRepairOutcome } from "./critic-repair";

interface CriticPanelProps {
  lastRepairOutcome: AppliedRepairOutcome | null;
  onApplySuggestedFix: (fix: CriticSuggestedFix) => void;
  brief: SettingsScreenBrief;
  project: PlaygroundProject;
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
  brief,
  lastRepairOutcome,
  onApplySuggestedFix,
  project,
  report
}: CriticPanelProps) {
  const settingsSectionCount = project.page.sections.filter(
    (section) => section.type === "settings"
  ).length;

  return (
    <section className="critic-panel">
      <div className="critic-summary">
        <div>
          <p className="critic-eyebrow">Current Candidate</p>
          <h2>{project.page.title}</h2>
          <p className="critic-description">
            Live critic output for the active settings brief.
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
        <span>Settings sections: {settingsSectionCount}</span>
        <span>Triggered rules: {report.summary.triggeredRules}</span>
      </div>

      {lastRepairOutcome ? (
        <p className={`repair-outcome ${lastRepairOutcome.delta >= 0 ? "positive" : "negative"}`}>
          {lastRepairOutcome.label}: {lastRepairOutcome.beforeScore} to {lastRepairOutcome.afterScore} (
          {lastRepairOutcome.delta >= 0 ? "+" : ""}
          {lastRepairOutcome.delta})
        </p>
      ) : null}

      {report.findings.length === 0 ? (
        <p className="critic-clear">No findings. This candidate clears the current rules.</p>
      ) : (
        <ol className="critic-findings">
          {report.findings.map((finding, index) => {
            const suggestedFix = finding.suggestedFix;

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
                {suggestedFix ? (
                  <div className="critic-fix">
                    <span>{suggestedFix.description}</span>
                    <button
                      type="button"
                      onClick={() => onApplySuggestedFix(suggestedFix)}
                    >
                      {suggestedFix.label}
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
