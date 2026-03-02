import type { PlaygroundProject } from "@bux/core-model";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { canonicalJSONStringify } from "./canonical-json";
import { validateProjectForExport } from "./validate-project";

export interface ExportBundleFiles {
  "tokens.json": string;
  "page.json": string;
  "constraints.json": string;
  "summary.json": string;
}

export function createExportBundleFiles(
  project: PlaygroundProject
): ExportBundleFiles {
  validateProjectForExport(project);

  return {
    "tokens.json": canonicalJSONStringify(project.tokens),
    "page.json": canonicalJSONStringify(project.page),
    "constraints.json": canonicalJSONStringify(project.constraints),
    "summary.json": canonicalJSONStringify(project.summary)
  };
}

export async function writeExportBundle(
  project: PlaygroundProject,
  outputDirectory: string
): Promise<ExportBundleFiles> {
  await mkdir(outputDirectory, { recursive: true });
  const files = createExportBundleFiles(project);

  await Promise.all(
    Object.entries(files).map(([fileName, contents]) =>
      Bun.write(join(outputDirectory, fileName), contents)
    )
  );

  return files;
}
