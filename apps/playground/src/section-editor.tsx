import type {
  JSONValue,
  JSONObject,
  PlaygroundProject,
  SectionNode,
  SectionType
} from "@bux/core-model";
import { type ReactNode } from "react";

export interface SectionChanges {
  variant?: string;
  props?: JSONObject;
  slots?: Record<string, JSONValue>;
}

interface SectionEditorProps {
  project: PlaygroundProject;
  newSectionType: SectionType;
  sectionTypes: SectionType[];
  onNewSectionTypeChange: (value: SectionType) => void;
  onAddSection: () => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onRemoveSection: (sectionId: string) => void;
  onUpdateSection: (sectionId: string, changes: SectionChanges) => void;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function rangeLabels(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix} ${index + 1}`);
}

function renderSectionControls(
  section: SectionNode,
  onUpdateSection: (sectionId: string, changes: SectionChanges) => void
): ReactNode {
  switch (section.type) {
    case "hero":
      return (
        <>
          <label className="section-inline-control">
            <span>Align</span>
            <select
              value={typeof section.props.align === "string" ? section.props.align : "start"}
              onChange={(event) =>
                onUpdateSection(section.id, { props: { align: event.currentTarget.value } })
              }
            >
              <option value="start">start</option>
              <option value="center">center</option>
              <option value="end">end</option>
            </select>
          </label>
          <label className="section-inline-control">
            <span>CTA Count</span>
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={typeof section.props.ctaCount === "number" ? section.props.ctaCount : 1}
              onChange={(event) =>
                onUpdateSection(section.id, {
                  props: { ctaCount: Number(event.currentTarget.value) }
                })
              }
            />
          </label>
          <label className="section-inline-control">
            <span>Media</span>
            <input
              type="checkbox"
              checked={Boolean(section.props.hasMedia)}
              onChange={(event) =>
                onUpdateSection(section.id, { props: { hasMedia: event.currentTarget.checked } })
              }
            />
          </label>
        </>
      );
    case "featureGrid":
      return (
        <>
          <label className="section-inline-control">
            <span>Columns</span>
            <input
              type="range"
              min={1}
              max={4}
              step={1}
              value={typeof section.props.columns === "number" ? section.props.columns : 3}
              onChange={(event) =>
                onUpdateSection(section.id, {
                  props: { columns: Number(event.currentTarget.value) }
                })
              }
            />
          </label>
          <label className="section-inline-control">
            <span>Show Icons</span>
            <input
              type="checkbox"
              checked={Boolean(section.props.showIcons)}
              onChange={(event) =>
                onUpdateSection(section.id, { props: { showIcons: event.currentTarget.checked } })
              }
            />
          </label>
          <label className="section-inline-control">
            <span>Items</span>
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={Array.isArray(section.slots.items) ? section.slots.items.length : 3}
              onChange={(event) => {
                const nextCount = Number(event.currentTarget.value);
                const existing = Array.isArray(section.slots.items) ? section.slots.items : [];
                const items = Array.from({ length: nextCount }, (_, index) => {
                  const current = existing[index];
                  if (current && typeof current === "object") {
                    return current;
                  }
                  return {
                    title: `Feature ${index + 1}`,
                    body: "Describe the value of this feature."
                  };
                });
                onUpdateSection(section.id, { slots: { items } });
              }}
            />
          </label>
        </>
      );
    case "form":
      return (
        <>
          <label className="section-inline-control">
            <span>Layout</span>
            <select
              value={typeof section.props.layout === "string" ? section.props.layout : "stacked"}
              onChange={(event) =>
                onUpdateSection(section.id, { props: { layout: event.currentTarget.value } })
              }
            >
              <option value="stacked">stacked</option>
              <option value="inline">inline</option>
            </select>
          </label>
          <label className="section-inline-control">
            <span>Fields</span>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={stringArray(section.slots.fields).length || 4}
              onChange={(event) =>
                onUpdateSection(section.id, {
                  slots: { fields: rangeLabels("Field", Number(event.currentTarget.value)) }
                })
              }
            />
          </label>
        </>
      );
    case "list":
      return (
        <label className="section-inline-control">
          <span>Items</span>
          <input
            type="range"
            min={1}
            max={25}
            step={1}
            value={stringArray(section.slots.items).length || 3}
            onChange={(event) => {
              const count = Number(event.currentTarget.value);
              const existing = stringArray(section.slots.items);
              const next = Array.from(
                { length: count },
                (_, index) => existing[index] ?? `List item ${index + 1}`
              );
              onUpdateSection(section.id, { slots: { items: next } });
            }}
          />
        </label>
      );
    case "table":
      return (
        <label className="section-inline-control">
          <span>Columns</span>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={typeof section.props.columns === "number" ? section.props.columns : 4}
            onChange={(event) =>
              onUpdateSection(section.id, { props: { columns: Number(event.currentTarget.value) } })
            }
          />
        </label>
      );
    case "settings":
      return (
        <label className="section-inline-control">
          <span>Groups</span>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={typeof section.props.groupCount === "number" ? section.props.groupCount : 3}
            onChange={(event) => {
              const count = Number(event.currentTarget.value);
              onUpdateSection(section.id, {
                props: { groupCount: count },
                slots: { groups: rangeLabels("Group", count) }
              });
            }}
          />
        </label>
      );
    default:
      return null;
  }
}

export function SectionEditor({
  project,
  newSectionType,
  sectionTypes,
  onNewSectionTypeChange,
  onAddSection,
  onMoveSection,
  onRemoveSection,
  onUpdateSection
}: SectionEditorProps) {
  return (
    <section className="panel-block">
      <h2>Sections</h2>
      <div className="add-section-row">
        <select
          value={newSectionType}
          onChange={(event) => onNewSectionTypeChange(event.currentTarget.value as SectionType)}
        >
          {sectionTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <button onClick={onAddSection} type="button">
          Add
        </button>
      </div>
      <ul className="section-list">
        {project.page.sections.map((section, index) => {
          const rule = project.constraints.sectionRules.find(
            (entry) => entry.sectionType === section.type
          );

          return (
            <li className="section-item" key={section.id}>
              <div className="section-item-header">
                <div>
                  <strong>{section.type}</strong>
                  <div className="section-item-id">{section.id}</div>
                </div>
                <div className="section-item-controls">
                  <button
                    onClick={() => onMoveSection(section.id, -1)}
                    type="button"
                    disabled={index === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => onMoveSection(section.id, 1)}
                    type="button"
                    disabled={index === project.page.sections.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => onRemoveSection(section.id)}
                    type="button"
                    title="Remove section"
                  >
                    ×
                  </button>
                </div>
              </div>

              {rule ? (
                <label className="section-inline-control">
                  <span>Variant</span>
                  <select
                    value={section.variant}
                    onChange={(event) =>
                      onUpdateSection(section.id, { variant: event.currentTarget.value })
                    }
                  >
                    {rule.allowedVariants.map((variant) => (
                      <option key={variant} value={variant}>
                        {variant}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {renderSectionControls(section, onUpdateSection)}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
