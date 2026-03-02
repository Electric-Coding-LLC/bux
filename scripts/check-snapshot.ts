import { canonicalProjectFixture } from "@bux/core-model";
import { writeSnapshotExport } from "@bux/exporter";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

function hashBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readBytes(path: string): Promise<Uint8Array> {
  const buffer = await Bun.file(path).arrayBuffer();
  return new Uint8Array(buffer);
}

async function main(): Promise<void> {
  const tempRoot = await mkdtemp(join(tmpdir(), "bux-snapshot-check-"));

  try {
    const firstOutputDirectory = join(tempRoot, "first");
    const secondOutputDirectory = join(tempRoot, "second");

    const first = await writeSnapshotExport(canonicalProjectFixture, firstOutputDirectory);
    const second = await writeSnapshotExport(canonicalProjectFixture, secondOutputDirectory);

    const firstHash = hashBytes(await readBytes(first.filePath));
    const secondHash = hashBytes(await readBytes(second.filePath));

    if (firstHash !== secondHash) {
      console.error("Snapshot determinism check failed.");
      console.error(`first hash:  ${firstHash}`);
      console.error(`second hash: ${secondHash}`);
      process.exitCode = 1;
      return;
    }

    if (first.metadata.seed !== 424242) {
      console.error("Snapshot metadata check failed: expected default seed 424242.");
      process.exitCode = 1;
      return;
    }

    console.log("Snapshot check passed: snapshot.png is deterministic for repeated capture.");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error("Snapshot check crashed.");
  console.error(error);
  process.exit(1);
});
