import type { PlaygroundProject } from "@bux/core-model";
import { PlaygroundPreview, previewStyles } from "@bux/preview-runtime";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { canonicalJSONStringify } from "./canonical-json";
import { validateProjectForExport } from "./validate-project";

export const SNAPSHOT_DEFAULT_FILE_NAME = "snapshot.png";
export const SNAPSHOT_DEFAULT_METADATA_FILE_NAME = "snapshot.meta.json";
export const SNAPSHOT_DEFAULT_SEED = 424242;
export const SNAPSHOT_DEFAULT_WIDTH = 1440;
export const SNAPSHOT_DEFAULT_HEIGHT = 900;

export interface SnapshotCaptureMetadata {
  schemaVersion: string;
  generatedAt: string;
  seed: number;
  captureProfile: {
    viewport: {
      width: number;
      height: number;
      deviceScaleFactor: number;
    };
    colorScheme: "light";
    locale: "en-US";
    timezone: "UTC";
    outputFormat: "png";
    outputFile: string;
  };
  stress: PlaygroundProject["stress"];
}

export interface SnapshotCaptureEngine {
  capturePng(html: string, metadata: SnapshotCaptureMetadata): Promise<Uint8Array>;
}

export interface SnapshotExportOptions {
  fileName?: string;
  metadataFileName?: string;
  seed?: number;
  generatedAt?: string;
  captureEngine?: SnapshotCaptureEngine;
}

export interface SnapshotExportResult {
  png: Uint8Array;
  metadata: SnapshotCaptureMetadata;
}

export interface WrittenSnapshotExport {
  filePath: string;
  metadataPath: string;
  metadata: SnapshotCaptureMetadata;
}

const snapshotPageBaseStyles = `
html,
body {
  margin: 0;
  padding: 0;
}

body {
  color: #111827;
  background: #f3f4f6;
  font-family: "Inter", "Segoe UI", sans-serif;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.snapshot-root {
  padding: 1.2rem;
}
`;

const disableMotionStyles = `
*,
*::before,
*::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}
`;

function toEpochMs(isoTimestamp: string): number {
  const parsed = Date.parse(isoTimestamp);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid snapshot timestamp "${isoTimestamp}".`);
  }

  return parsed;
}

function buildSnapshotInitScript(seed: number, fixedNowMs: number): string {
  return `
(() => {
  const fixedNow = ${fixedNowMs};
  let state = ${seed >>> 0};
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };

  const RealDate = Date;
  class FixedDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super(fixedNow);
        return;
      }
      super(...args);
    }

    static now() {
      return fixedNow;
    }
  }

  FixedDate.UTC = RealDate.UTC;
  FixedDate.parse = RealDate.parse;
  FixedDate.prototype = RealDate.prototype;
  Object.setPrototypeOf(FixedDate, RealDate);

  globalThis.Date = FixedDate;
  Object.defineProperty(Math, "random", {
    configurable: true,
    writable: true,
    value: random
  });
})();
`;
}

function renderSnapshotHtml(project: PlaygroundProject): string {
  const previewMarkup = renderToStaticMarkup(
    <div className="snapshot-root">
      <PlaygroundPreview project={project} />
    </div>
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${snapshotPageBaseStyles}</style>
    <style>${previewStyles}</style>
  </head>
  <body>${previewMarkup}</body>
</html>`;
}

function resolveSnapshotMetadata(
  project: PlaygroundProject,
  options: SnapshotExportOptions = {}
): SnapshotCaptureMetadata {
  const fileName = options.fileName ?? SNAPSHOT_DEFAULT_FILE_NAME;

  return {
    schemaVersion: project.summary.schemaVersion,
    generatedAt: options.generatedAt ?? project.summary.generatedAt,
    seed: options.seed ?? SNAPSHOT_DEFAULT_SEED,
    captureProfile: {
      viewport: {
        width: SNAPSHOT_DEFAULT_WIDTH,
        height: SNAPSHOT_DEFAULT_HEIGHT,
        deviceScaleFactor: 1
      },
      colorScheme: "light",
      locale: "en-US",
      timezone: "UTC",
      outputFormat: "png",
      outputFile: fileName
    },
    stress: {
      copyMode: project.stress.copyMode,
      stateMode: project.stress.stateMode,
      densityMode: project.stress.densityMode
    }
  };
}

const defaultSnapshotCaptureEngine: SnapshotCaptureEngine = {
  async capturePng(html: string, metadata: SnapshotCaptureMetadata): Promise<Uint8Array> {
    const browser = await chromium.launch({ headless: true });

    try {
      const context = await browser.newContext({
        viewport: {
          width: metadata.captureProfile.viewport.width,
          height: metadata.captureProfile.viewport.height
        },
        deviceScaleFactor: metadata.captureProfile.viewport.deviceScaleFactor,
        colorScheme: metadata.captureProfile.colorScheme,
        locale: metadata.captureProfile.locale,
        timezoneId: metadata.captureProfile.timezone,
        reducedMotion: "reduce"
      });

      await context.addInitScript(
        buildSnapshotInitScript(
          metadata.seed,
          toEpochMs(metadata.generatedAt)
        )
      );

      const page = await context.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      await page.addStyleTag({ content: disableMotionStyles });

      await page.evaluate(async () => {
        if ("fonts" in document) {
          await document.fonts.ready;
        }

        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      });

      const screenshot = await page.screenshot({ type: "png" });
      await context.close();
      return screenshot;
    } finally {
      await browser.close();
    }
  }
};

export async function createSnapshotExport(
  project: PlaygroundProject,
  options: SnapshotExportOptions = {}
): Promise<SnapshotExportResult> {
  validateProjectForExport(project);

  const metadata = resolveSnapshotMetadata(project, options);
  const html = renderSnapshotHtml(project);
  const captureEngine = options.captureEngine ?? defaultSnapshotCaptureEngine;
  const png = await captureEngine.capturePng(html, metadata);

  return { png, metadata };
}

export async function writeSnapshotExport(
  project: PlaygroundProject,
  outputDirectory: string,
  options: SnapshotExportOptions = {}
): Promise<WrittenSnapshotExport> {
  const snapshotResult = await createSnapshotExport(project, options);
  const fileName = options.fileName ?? SNAPSHOT_DEFAULT_FILE_NAME;
  const metadataFileName =
    options.metadataFileName ?? SNAPSHOT_DEFAULT_METADATA_FILE_NAME;
  const filePath = join(outputDirectory, fileName);
  const metadataPath = join(outputDirectory, metadataFileName);

  await mkdir(outputDirectory, { recursive: true });
  await Bun.write(filePath, snapshotResult.png);
  await Bun.write(metadataPath, canonicalJSONStringify(snapshotResult.metadata));

  return {
    filePath,
    metadataPath,
    metadata: snapshotResult.metadata
  };
}

export function createSnapshotMetadata(
  project: PlaygroundProject,
  options: SnapshotExportOptions = {}
): SnapshotCaptureMetadata {
  validateProjectForExport(project);
  return resolveSnapshotMetadata(project, options);
}
