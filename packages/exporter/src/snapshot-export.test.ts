import { canonicalProjectFixture } from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeExportBundle } from "./export-bundle";
import {
  SNAPSHOT_DEFAULT_FILE_NAME,
  SNAPSHOT_DEFAULT_METADATA_FILE_NAME,
  createSnapshotMetadata,
  writeSnapshotExport
} from "./snapshot-export";

describe("createSnapshotMetadata", () => {
  it("uses deterministic defaults from project summary and baseline rules", () => {
    const metadata = createSnapshotMetadata(canonicalProjectFixture);

    expect(metadata.seed).toBe(424242);
    expect(metadata.generatedAt).toBe(canonicalProjectFixture.summary.generatedAt);
    expect(metadata.captureProfile.viewport).toEqual({
      width: 1440,
      height: 900,
      deviceScaleFactor: 1
    });
    expect(metadata.captureProfile.locale).toBe("en-US");
    expect(metadata.captureProfile.timezone).toBe("UTC");
    expect(metadata.captureProfile.outputFile).toBe(SNAPSHOT_DEFAULT_FILE_NAME);
  });
});

describe("writeSnapshotExport", () => {
  it("writes snapshot and metadata via the injected capture engine", async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), "bux-snapshot-test-"));
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

    try {
      const written = await writeSnapshotExport(canonicalProjectFixture, outputDirectory, {
        seed: 111,
        generatedAt: "2026-03-02T00:00:00.000Z",
        captureEngine: {
          async capturePng() {
            return pngBytes;
          }
        }
      });

      const snapshotBuffer = await Bun.file(written.filePath).arrayBuffer();
      const metadataText = await Bun.file(written.metadataPath).text();

      expect(new Uint8Array(snapshotBuffer)).toEqual(pngBytes);
      expect(metadataText).toContain('"seed": 111');
      expect(metadataText).toContain('"generatedAt": "2026-03-02T00:00:00.000Z"');
      expect(written.filePath.endsWith(SNAPSHOT_DEFAULT_FILE_NAME)).toBe(true);
      expect(written.metadataPath.endsWith(SNAPSHOT_DEFAULT_METADATA_FILE_NAME)).toBe(true);
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });
});

describe("writeExportBundle with snapshot option", () => {
  it("includes snapshot result when snapshot export is enabled", async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), "bux-export-test-"));

    try {
      const result = await writeExportBundle(canonicalProjectFixture, outputDirectory, {
        snapshot: {
          seed: 7,
          captureEngine: {
            async capturePng() {
              return new Uint8Array([1, 2, 3]);
            }
          }
        }
      });

      expect(result.files["tokens.json"]).toContain('"schemaVersion": "1.0.0"');
      expect(result.snapshot?.metadata.seed).toBe(7);
      expect(await Bun.file(join(outputDirectory, "tokens.json")).exists()).toBe(true);
      expect(await Bun.file(join(outputDirectory, "summary.json")).exists()).toBe(true);
      expect(await Bun.file(join(outputDirectory, "snapshot.png")).exists()).toBe(true);
      expect(await Bun.file(join(outputDirectory, "snapshot.meta.json")).exists()).toBe(true);
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });
});
