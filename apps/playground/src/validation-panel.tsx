import type { ValidationIssue } from "@bux/exporter/browser";

interface ValidationPanelProps {
  issues: ValidationIssue[];
}

function issueLabel(issue: ValidationIssue): string {
  if (issue.document === "constraints.json") {
    return "Constraint";
  }

  if (issue.document === "page.json" && issue.schemaPath.startsWith("/section-kit/")) {
    return "Section";
  }

  if (issue.document === "tokens.json") {
    return "Token";
  }

  return issue.document;
}

export function ValidationPanel({ issues }: ValidationPanelProps) {
  return (
    <section className="panel-block">
      <h2>Validation</h2>
      {issues.length === 0 ? (
        <p className="validation-ok">No export-blocking issues.</p>
      ) : (
        <ul className="validation-list">
          {issues.map((issue, index) => (
            <li key={`${issue.document}-${issue.instancePath}-${issue.schemaPath}-${index}`}>
              <div className="validation-label-row">
                <strong>{issueLabel(issue)}</strong>
                <code>{issue.instancePath}</code>
              </div>
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
