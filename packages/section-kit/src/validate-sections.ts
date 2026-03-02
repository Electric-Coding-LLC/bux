import type {
  PlaygroundProject,
  SectionNode,
  SectionType
} from "@bux/core-model";

export interface SectionValidationIssue {
  code:
    | "duplicate_section_id"
    | "invalid_section_id_format"
    | "unknown_section_rule"
    | "variant_not_allowed"
    | "section_count_exceeds_max"
    | "invalid_prop"
    | "invalid_slot";
  sectionId: string;
  path: string;
  message: string;
}

const sectionIdPattern = /^sec-[a-z0-9-]+-\d{3}$/;

function issue(
  code: SectionValidationIssue["code"],
  sectionId: string,
  path: string,
  message: string
): SectionValidationIssue {
  return { code, sectionId, path, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIntegerInRange(value: unknown, min: number, max: number): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

function validateHero(section: SectionNode, index: number): SectionValidationIssue[] {
  const issues: SectionValidationIssue[] = [];
  const align = section.props.align;
  const ctaCount = section.props.ctaCount;
  const hasMedia = section.props.hasMedia;
  const allowedAlign = ["start", "center", "end"];

  if (typeof align !== "string" || !allowedAlign.includes(align)) {
    issues.push(
      issue(
        "invalid_prop",
        section.id,
        `/page/sections/${index}/props/align`,
        `hero.props.align must be one of: ${allowedAlign.join(", ")}.`
      )
    );
  }

  if (!isIntegerInRange(ctaCount, 0, 2)) {
    issues.push(
      issue(
        "invalid_prop",
        section.id,
        `/page/sections/${index}/props/ctaCount`,
        "hero.props.ctaCount must be an integer between 0 and 2."
      )
    );
  }

  if (typeof hasMedia !== "boolean") {
    issues.push(
      issue(
        "invalid_prop",
        section.id,
        `/page/sections/${index}/props/hasMedia`,
        "hero.props.hasMedia must be a boolean."
      )
    );
  }

  return issues;
}

function validateFeatureGrid(
  section: SectionNode,
  index: number
): SectionValidationIssue[] {
  const issues: SectionValidationIssue[] = [];
  const columns = section.props.columns;
  const showIcons = section.props.showIcons;
  const items = section.slots.items;

  if (!isIntegerInRange(columns, 1, 4)) {
    issues.push(
      issue(
        "invalid_prop",
        section.id,
        `/page/sections/${index}/props/columns`,
        "featureGrid.props.columns must be an integer between 1 and 4."
      )
    );
  }

  if (typeof showIcons !== "boolean") {
    issues.push(
      issue(
        "invalid_prop",
        section.id,
        `/page/sections/${index}/props/showIcons`,
        "featureGrid.props.showIcons must be a boolean."
      )
    );
  }

  if (!Array.isArray(items) || items.length < 1 || items.length > 12) {
    issues.push(
      issue(
        "invalid_slot",
        section.id,
        `/page/sections/${index}/slots/items`,
        "featureGrid.slots.items must be an array with 1 to 12 items."
      )
    );
    return issues;
  }

  for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
    const item = items[itemIndex];
    if (!isRecord(item)) {
      issues.push(
        issue(
          "invalid_slot",
          section.id,
          `/page/sections/${index}/slots/items/${itemIndex}`,
          "featureGrid item must be an object with title and body strings."
        )
      );
      continue;
    }

    if (typeof item.title !== "string" || item.title.length === 0) {
      issues.push(
        issue(
          "invalid_slot",
          section.id,
          `/page/sections/${index}/slots/items/${itemIndex}/title`,
          "featureGrid item.title must be a non-empty string."
        )
      );
    }

    if (typeof item.body !== "string" || item.body.length === 0) {
      issues.push(
        issue(
          "invalid_slot",
          section.id,
          `/page/sections/${index}/slots/items/${itemIndex}/body`,
          "featureGrid item.body must be a non-empty string."
        )
      );
    }
  }

  return issues;
}

function validateForm(section: SectionNode, index: number): SectionValidationIssue[] {
  const issues: SectionValidationIssue[] = [];
  const layout = section.props.layout;
  const allowed = ["stacked", "inline"];
  const fields = section.slots.fields;
  const submitLabel = section.slots.submitLabel;

  if (typeof layout !== "string" || !allowed.includes(layout)) {
    issues.push(
      issue(
        "invalid_prop",
        section.id,
        `/page/sections/${index}/props/layout`,
        `form.props.layout must be one of: ${allowed.join(", ")}.`
      )
    );
  }

  if (!Array.isArray(fields) || fields.length === 0) {
    issues.push(
      issue(
        "invalid_slot",
        section.id,
        `/page/sections/${index}/slots/fields`,
        "form.slots.fields must be a non-empty string array."
      )
    );
  } else {
    for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex += 1) {
      const field = fields[fieldIndex];
      if (typeof field !== "string" || field.length === 0) {
        issues.push(
          issue(
            "invalid_slot",
            section.id,
            `/page/sections/${index}/slots/fields/${fieldIndex}`,
            "form field labels must be non-empty strings."
          )
        );
      }
    }
  }

  if (typeof submitLabel !== "string" || submitLabel.length === 0) {
    issues.push(
      issue(
        "invalid_slot",
        section.id,
        `/page/sections/${index}/slots/submitLabel`,
        "form.slots.submitLabel must be a non-empty string."
      )
    );
  }

  return issues;
}

function validateList(section: SectionNode, index: number): SectionValidationIssue[] {
  const issues: SectionValidationIssue[] = [];
  const items = section.slots.items;
  if (!Array.isArray(items) || items.length === 0 || items.length > 25) {
    issues.push(
      issue(
        "invalid_slot",
        section.id,
        `/page/sections/${index}/slots/items`,
        "list.slots.items must have 1 to 25 entries."
      )
    );
    return issues;
  }

  for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
    const item = items[itemIndex];
    if (typeof item !== "string" || item.length === 0) {
      issues.push(
        issue(
          "invalid_slot",
          section.id,
          `/page/sections/${index}/slots/items/${itemIndex}`,
          "list items must be non-empty strings."
        )
      );
    }
  }

  return issues;
}

function validateTable(section: SectionNode, index: number): SectionValidationIssue[] {
  const issues: SectionValidationIssue[] = [];
  const columns = section.props.columns;
  const headers = section.slots.headers;
  const rows = section.slots.rows;

  if (!isIntegerInRange(columns, 1, 12)) {
    issues.push(
      issue(
        "invalid_prop",
        section.id,
        `/page/sections/${index}/props/columns`,
        "table.props.columns must be an integer between 1 and 12."
      )
    );
  }

  if (!Array.isArray(headers) || headers.length < 1) {
    issues.push(
      issue(
        "invalid_slot",
        section.id,
        `/page/sections/${index}/slots/headers`,
        "table.slots.headers must be a non-empty string array."
      )
    );
  }

  if (!Array.isArray(rows) || rows.length < 1) {
    issues.push(
      issue(
        "invalid_slot",
        section.id,
        `/page/sections/${index}/slots/rows`,
        "table.slots.rows must be a non-empty matrix of strings."
      )
    );
    return issues;
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (!Array.isArray(row) || row.length < 1) {
      issues.push(
        issue(
          "invalid_slot",
          section.id,
          `/page/sections/${index}/slots/rows/${rowIndex}`,
          "table row must be a non-empty string array."
        )
      );
      continue;
    }

    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const cell = row[columnIndex];
      if (typeof cell !== "string") {
        issues.push(
          issue(
            "invalid_slot",
            section.id,
            `/page/sections/${index}/slots/rows/${rowIndex}/${columnIndex}`,
            "table cells must be strings."
          )
        );
      }
    }
  }

  return issues;
}

function validateSettings(
  section: SectionNode,
  index: number
): SectionValidationIssue[] {
  const issues: SectionValidationIssue[] = [];
  const groupCount = section.props.groupCount;
  const groups = section.slots.groups;

  if (!isIntegerInRange(groupCount, 1, 12)) {
    issues.push(
      issue(
        "invalid_prop",
        section.id,
        `/page/sections/${index}/props/groupCount`,
        "settings.props.groupCount must be an integer between 1 and 12."
      )
    );
  }

  if (!Array.isArray(groups) || groups.length < 1 || groups.length > 12) {
    issues.push(
      issue(
        "invalid_slot",
        section.id,
        `/page/sections/${index}/slots/groups`,
        "settings.slots.groups must have 1 to 12 entries."
      )
    );
    return issues;
  }

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const group = groups[groupIndex];
    if (typeof group !== "string" || group.length === 0) {
      issues.push(
        issue(
          "invalid_slot",
          section.id,
          `/page/sections/${index}/slots/groups/${groupIndex}`,
          "settings group labels must be non-empty strings."
        )
      );
    }
  }

  return issues;
}

function validateSectionByType(
  section: SectionNode,
  index: number
): SectionValidationIssue[] {
  switch (section.type) {
    case "hero":
      return validateHero(section, index);
    case "featureGrid":
      return validateFeatureGrid(section, index);
    case "form":
      return validateForm(section, index);
    case "list":
      return validateList(section, index);
    case "table":
      return validateTable(section, index);
    case "settings":
      return validateSettings(section, index);
    default:
      return [];
  }
}

export function validateProjectSections(
  project: PlaygroundProject
): SectionValidationIssue[] {
  const issues: SectionValidationIssue[] = [];
  const idCounts = new Map<string, number>();
  const typeCounts = new Map<SectionType, number>();

  for (const section of project.page.sections) {
    idCounts.set(section.id, (idCounts.get(section.id) ?? 0) + 1);
    typeCounts.set(section.type, (typeCounts.get(section.type) ?? 0) + 1);
  }

  for (const [index, section] of project.page.sections.entries()) {
    const rule = project.constraints.sectionRules.find(
      (entry) => entry.sectionType === section.type
    );

    if (!sectionIdPattern.test(section.id)) {
      issues.push(
        issue(
          "invalid_section_id_format",
          section.id,
          `/page/sections/${index}/id`,
          'Section id must match the pattern "sec-<type>-NNN".'
        )
      );
    }

    if ((idCounts.get(section.id) ?? 0) > 1) {
      issues.push(
        issue(
          "duplicate_section_id",
          section.id,
          `/page/sections/${index}/id`,
          `Section id "${section.id}" is duplicated.`
        )
      );
    }

    if (!rule) {
      issues.push(
        issue(
          "unknown_section_rule",
          section.id,
          `/page/sections/${index}/type`,
          `No section rule exists for type "${section.type}".`
        )
      );
    } else {
      if (!rule.allowedVariants.includes(section.variant)) {
        issues.push(
          issue(
            "variant_not_allowed",
            section.id,
            `/page/sections/${index}/variant`,
            `Variant "${section.variant}" is not allowed for ${section.type}.`
          )
        );
      }

      if (
        typeof rule.maxItems === "number" &&
        (typeCounts.get(section.type) ?? 0) > rule.maxItems
      ) {
        issues.push(
          issue(
            "section_count_exceeds_max",
            section.id,
            `/constraints/sectionRules/${section.type}/maxItems`,
            `${section.type} allows at most ${rule.maxItems} instance(s).`
          )
        );
      }
    }

    issues.push(...validateSectionByType(section, index));
  }

  return issues;
}
