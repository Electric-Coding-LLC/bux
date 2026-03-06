import type { PlaygroundProject, SectionType } from "@bux/core-model";

interface SectionRulesEditorProps {
  project: PlaygroundProject;
  onUpdateSectionRule: (
    sectionType: SectionType,
    changes: {
      allowedVariants?: string[];
      maxItems?: number | null;
    }
  ) => void;
}

function serializeVariants(allowedVariants: string[]): string {
  return allowedVariants.join(", ");
}

function parseVariants(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry, index, entries) => entry.length > 0 && entries.indexOf(entry) === index);
}

export function SectionRulesEditor({
  project,
  onUpdateSectionRule
}: SectionRulesEditorProps) {
  return (
    <section className="panel-block">
      <h2>Section Rules</h2>
      <div className="constraint-list">
        {project.constraints.sectionRules.map((rule) => (
          <article className="constraint-card" key={rule.sectionType}>
            <div className="constraint-card-header">
              <strong>{rule.sectionType}</strong>
              <span>{rule.allowedVariants.length} variant(s)</span>
            </div>

            <label className="section-inline-control">
              <span>Allowed Variants</span>
              <input
                type="text"
                value={serializeVariants(rule.allowedVariants)}
                onChange={(event) =>
                  onUpdateSectionRule(rule.sectionType, {
                    allowedVariants: parseVariants(event.currentTarget.value)
                  })
                }
                placeholder="split, centered"
              />
            </label>

            <label className="section-inline-control rule-toggle-row">
              <span>Unlimited Instances</span>
              <input
                type="checkbox"
                checked={rule.maxItems === undefined}
                onChange={(event) =>
                  onUpdateSectionRule(rule.sectionType, {
                    maxItems: event.currentTarget.checked ? null : 1
                  })
                }
              />
            </label>

            {rule.maxItems !== undefined ? (
              <label className="section-inline-control">
                <span>Max Instances</span>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  value={rule.maxItems}
                  onChange={(event) =>
                    onUpdateSectionRule(rule.sectionType, {
                      maxItems: Number(event.currentTarget.value)
                    })
                  }
                />
                <output>{rule.maxItems}</output>
              </label>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
