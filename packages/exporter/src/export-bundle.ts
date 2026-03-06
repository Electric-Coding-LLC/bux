import type { PlaygroundProject } from "@bux/core-model";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createExportBundleFiles, type ExportBundleFiles } from "./bundle-files";
import {
  type SnapshotExportOptions,
  type WrittenSnapshotExport,
  writeSnapshotExport
} from "./snapshot-export";

export interface WriteExportBundleOptions {
  snapshot?: boolean | SnapshotExportOptions;
}

export interface WriteExportBundleResult {
  files: ExportBundleFiles;
  snapshot?: WrittenSnapshotExport;
}

export async function writeExportBundle(
  project: PlaygroundProject,
  outputDirectory: string,
  options: WriteExportBundleOptions = {}
): Promise<WriteExportBundleResult> {
  await mkdir(outputDirectory, { recursive: true });
  const files = createExportBundleFiles(project);

  await Promise.all(
    Object.entries(files).map(([fileName, contents]) =>
      Bun.write(join(outputDirectory, fileName), contents)
    )
  );

  const snapshotOptions =
    typeof options.snapshot === "object" ? options.snapshot : undefined;

  const snapshot = options.snapshot
    ? await writeSnapshotExport(project, outputDirectory, snapshotOptions)
    : undefined;

  return snapshot === undefined ? { files } : { files, snapshot };
}
