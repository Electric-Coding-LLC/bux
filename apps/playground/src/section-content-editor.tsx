import type { JSONValue, SectionNode } from "@bux/core-model";
import type { ReactNode } from "react";
import type { SectionChanges } from "./section-editor";

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function stringMatrix(value: unknown): string[][] {
  return Array.isArray(value)
    ? value.map((row) =>
        Array.isArray(row)
          ? row.filter((entry): entry is string => typeof entry === "string")
          : []
      )
    : [];
}

function featureItems(value: unknown): Array<{ title: string; body: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return [];
    }

    return [
      {
        title: stringValue((entry as { title?: unknown }).title, ""),
        body: stringValue((entry as { body?: unknown }).body, "")
      }
    ];
  });
}

function linesToArray(rawValue: string): string[] {
  return rawValue
    .split("\n")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function resizeStringArray(
  existing: string[],
  nextCount: number,
  fallbackPrefix: string
): string[] {
  return Array.from(
    { length: nextCount },
    (_, index) => existing[index] ?? `${fallbackPrefix} ${index + 1}`
  );
}

function serializeFeatureItems(items: Array<{ title: string; body: string }>): string {
  return items.map((item) => `${item.title} | ${item.body}`).join("\n");
}

function parseFeatureItems(rawValue: string): Array<{ title: string; body: string }> {
  return rawValue
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => {
      const [rawTitle, ...rest] = line.split("|");
      const title = rawTitle?.trim() || `Feature ${index + 1}`;
      const body = rest.join("|").trim() || "Describe the value of this feature.";

      return { title, body };
    });
}

function serializeTableRows(rows: string[][]): string {
  return rows.map((row) => row.join(" | ")).join("\n");
}

function parseTableRows(rawValue: string, columns: number): string[][] {
  return rawValue
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, rowIndex) =>
      Array.from({ length: columns }, (_, columnIndex) => {
        const rawCell = line.split("|")[columnIndex];
        return rawCell?.trim() || `Cell ${rowIndex + 1}-${columnIndex + 1}`;
      })
    );
}

function TextSlotField({
  label,
  value,
  multiline = false,
  onChange
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="section-inline-control">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.currentTarget.value)} rows={4} />
      ) : (
        <input type="text" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
      )}
    </label>
  );
}

export function renderSectionContentEditor(
  section: SectionNode,
  onUpdateSection: (sectionId: string, changes: SectionChanges) => void
): ReactNode {
  switch (section.type) {
    case "hero":
      return (
        <div className="section-content-grid">
          <TextSlotField
            label="Eyebrow"
            value={stringValue(section.slots.eyebrow)}
            onChange={(value) => onUpdateSection(section.id, { slots: { eyebrow: value } })}
          />
          <TextSlotField
            label="Heading"
            value={stringValue(section.slots.heading)}
            onChange={(value) => onUpdateSection(section.id, { slots: { heading: value } })}
          />
          <TextSlotField
            label="Body"
            value={stringValue(section.slots.body)}
            multiline
            onChange={(value) => onUpdateSection(section.id, { slots: { body: value } })}
          />
          <TextSlotField
            label="Primary CTA"
            value={stringValue(section.slots.primaryCta)}
            onChange={(value) => onUpdateSection(section.id, { slots: { primaryCta: value } })}
          />
          <TextSlotField
            label="Secondary CTA"
            value={stringValue(section.slots.secondaryCta)}
            onChange={(value) => onUpdateSection(section.id, { slots: { secondaryCta: value } })}
          />
        </div>
      );
    case "featureGrid": {
      const items = featureItems(section.slots.items);
      return (
        <div className="section-content-grid">
          <TextSlotField
            label="Heading"
            value={stringValue(section.slots.heading)}
            onChange={(value) => onUpdateSection(section.id, { slots: { heading: value } })}
          />
          <TextSlotField
            label="Items"
            value={serializeFeatureItems(items)}
            multiline
            onChange={(value) =>
              onUpdateSection(section.id, { slots: { items: parseFeatureItems(value) as JSONValue } })
            }
          />
        </div>
      );
    }
    case "form":
      return (
        <div className="section-content-grid">
          <TextSlotField
            label="Heading"
            value={stringValue(section.slots.heading)}
            onChange={(value) => onUpdateSection(section.id, { slots: { heading: value } })}
          />
          <TextSlotField
            label="Fields"
            value={stringArray(section.slots.fields).join("\n")}
            multiline
            onChange={(value) =>
              onUpdateSection(section.id, { slots: { fields: linesToArray(value) } })
            }
          />
          <TextSlotField
            label="Submit Label"
            value={stringValue(section.slots.submitLabel)}
            onChange={(value) => onUpdateSection(section.id, { slots: { submitLabel: value } })}
          />
        </div>
      );
    case "list":
      return (
        <div className="section-content-grid">
          <TextSlotField
            label="Heading"
            value={stringValue(section.slots.heading)}
            onChange={(value) => onUpdateSection(section.id, { slots: { heading: value } })}
          />
          <TextSlotField
            label="Items"
            value={stringArray(section.slots.items).join("\n")}
            multiline
            onChange={(value) =>
              onUpdateSection(section.id, { slots: { items: linesToArray(value) } })
            }
          />
        </div>
      );
    case "table": {
      const columns =
        typeof section.props.columns === "number" ? Math.max(1, section.props.columns) : 4;
      return (
        <div className="section-content-grid">
          <TextSlotField
            label="Heading"
            value={stringValue(section.slots.heading)}
            onChange={(value) => onUpdateSection(section.id, { slots: { heading: value } })}
          />
          <TextSlotField
            label="Headers"
            value={stringArray(section.slots.headers).join("\n")}
            multiline
            onChange={(value) =>
              onUpdateSection(section.id, {
                slots: { headers: resizeStringArray(linesToArray(value), columns, "Column") }
              })
            }
          />
          <TextSlotField
            label="Rows"
            value={serializeTableRows(stringMatrix(section.slots.rows))}
            multiline
            onChange={(value) =>
              onUpdateSection(section.id, {
                slots: { rows: parseTableRows(value, columns) as JSONValue }
              })
            }
          />
        </div>
      );
    }
    case "settings":
      return (
        <div className="section-content-grid">
          <TextSlotField
            label="Heading"
            value={stringValue(section.slots.heading)}
            onChange={(value) => onUpdateSection(section.id, { slots: { heading: value } })}
          />
          <TextSlotField
            label="Groups"
            value={stringArray(section.slots.groups).join("\n")}
            multiline
            onChange={(value) =>
              onUpdateSection(section.id, { slots: { groups: linesToArray(value) } })
            }
          />
        </div>
      );
    default:
      return null;
  }
}
