import type { PlaygroundProject } from "@bux/core-model";

export function sectionPath(index: number, suffix?: string): string {
  return suffix ? `/page/sections/${index}${suffix}` : `/page/sections/${index}`;
}

export function heroSections(project: PlaygroundProject) {
  return project.page.sections.flatMap((section, index) =>
    section.type === "hero" ? [{ index, section }] : []
  );
}

export function proofSections(project: PlaygroundProject) {
  return project.page.sections.flatMap((section, index) =>
    section.type === "featureGrid" || section.type === "list"
      ? [{ index, section }]
      : []
  );
}

export function conversionSections(project: PlaygroundProject) {
  return project.page.sections.flatMap((section, index) =>
    section.type === "form" ? [{ index, section }] : []
  );
}

export function operationalSections(project: PlaygroundProject) {
  return project.page.sections.flatMap((section, index) =>
    section.type === "settings" || section.type === "table"
      ? [{ index, section }]
      : []
  );
}
