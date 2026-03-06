import type { PlaygroundProject } from "@bux/core-model";

export function sectionPath(index: number, suffix?: string): string {
  return suffix ? `/page/sections/${index}${suffix}` : `/page/sections/${index}`;
}

export function summarySections(project: PlaygroundProject) {
  return project.page.sections.flatMap((section, index) =>
    section.type === "featureGrid" ? [{ index, section }] : []
  );
}

export function operationalSections(project: PlaygroundProject) {
  return project.page.sections.flatMap((section, index) =>
    section.type === "list" || section.type === "table"
      ? [{ index, section }]
      : []
  );
}

export function driftSections(project: PlaygroundProject) {
  return project.page.sections.flatMap((section, index) =>
    section.type === "form" || section.type === "settings"
      ? [{ index, section }]
      : []
  );
}

export function heroSections(project: PlaygroundProject) {
  return project.page.sections.flatMap((section, index) =>
    section.type === "hero" ? [{ index, section }] : []
  );
}
