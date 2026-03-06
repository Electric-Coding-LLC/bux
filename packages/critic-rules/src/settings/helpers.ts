import type { PlaygroundProject, SectionNode } from "@bux/core-model";

export interface IndexedSection {
  section: SectionNode;
  index: number;
}

export function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function settingsSections(project: PlaygroundProject): IndexedSection[] {
  return project.page.sections.flatMap((section, index) =>
    section.type === "settings" ? [{ section, index }] : []
  );
}

export function nonSettingsSections(project: PlaygroundProject): IndexedSection[] {
  return project.page.sections.flatMap((section, index) =>
    section.type !== "settings" ? [{ section, index }] : []
  );
}

export function sectionPath(index: number, suffix?: string): string {
  return suffix ? `/page/sections/${index}${suffix}` : `/page/sections/${index}`;
}

export function stringGroups(section: SectionNode): string[] {
  return Array.isArray(section.slots.groups)
    ? section.slots.groups.filter((entry): entry is string => typeof entry === "string")
    : [];
}

export function headingText(section: SectionNode): string {
  return typeof section.slots.heading === "string" ? section.slots.heading : "";
}

export function hasCompoundGroupLabel(label: string): boolean {
  return /,|\/| & | and /i.test(label);
}
