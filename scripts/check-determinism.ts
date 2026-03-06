import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalProjectFixture } from "../packages/core-model/src/fixture";
import { createExportBundleFiles } from "../packages/exporter/src/bundle-files";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const fixtureDirectory = resolve(scriptDirectory, "../fixtures/canonical-project");

const expectedFiles = createExportBundleFiles(canonicalProjectFixture);

async function readFixtureFile(fileName: keyof typeof expectedFiles): Promise<string> {
  const filePath = resolve(fixtureDirectory, fileName);
  return readFile(filePath, "utf8");
}

function createDiffSummary(
  actual: string,
  expected: string,
  maxContext: number = 160
): string {
  const normalizedActual = actual.replace(/\r\n/g, "\n");
  const normalizedExpected = expected.replace(/\r\n/g, "\n");

  if (normalizedActual === normalizedExpected) {
    return "";
  }

  const mismatchIndex = [...normalizedActual].findIndex(
    (_, index) => normalizedActual[index] !== normalizedExpected[index]
  );
  const pointer = mismatchIndex === -1 ? 0 : mismatchIndex;
  const start = Math.max(pointer - 40, 0);
  const end = Math.min(pointer + maxContext, normalizedActual.length);

  return [
    `first mismatch at char ${pointer}`,
    `expected: ${JSON.stringify(normalizedExpected.slice(start, end))}`,
    `actual:   ${JSON.stringify(normalizedActual.slice(start, end))}`
  ].join("\n");
}

async function main(): Promise<void> {
  const mismatches: string[] = [];
  const expectedFileNames = Object.keys(expectedFiles) as Array<
    Extract<keyof typeof expectedFiles, string>
  >;

  await Promise.all(
    expectedFileNames.map(async (fileName) => {
      const fixtureContents = await readFixtureFile(fileName);
      const generatedContents = expectedFiles[fileName];

      if (fixtureContents !== generatedContents) {
        mismatches.push(
          [
            `${fileName} does not match canonical exporter output.`,
            createDiffSummary(fixtureContents, generatedContents)
          ].join("\n")
        );
      }
    })
  );

  if (mismatches.length > 0) {
    console.error("Determinism check failed:\n");
    for (const mismatch of mismatches) {
      console.error(`- ${mismatch}\n`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Determinism check passed: fixture exports are byte-identical.");
}

main().catch((error: unknown) => {
  console.error("Determinism check crashed.");
  console.error(error);
  process.exit(1);
});
