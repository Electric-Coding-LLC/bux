import { createNextAdapter } from "@bux/adapters-next";
import { type Adapter, type AdapterTarget } from "@bux/adapter-contract";
import { createWebstirAdapter } from "@bux/adapters-webstir";
import type { PlaygroundProject } from "@bux/core-model";
import { canonicalJSONStringify } from "@bux/exporter/browser";

const adapters: Record<AdapterTarget, Adapter> = {
  nextjs: createNextAdapter(),
  webstir: createWebstirAdapter()
};

export const defaultAdapterTarget: AdapterTarget = "nextjs";
export const adapterTargetOptions: AdapterTarget[] = ["nextjs", "webstir"];

const adapterTargetLabels: Record<AdapterTarget, string> = {
  nextjs: "Next.js",
  webstir: "Webstir"
};

export interface AdapterLayoutSpecFile {
  contents: string;
  fileName: string;
}

export function isAdapterTarget(value: unknown): value is AdapterTarget {
  return value === "nextjs" || value === "webstir";
}

export function getAdapterTargetLabel(target: AdapterTarget): string {
  return adapterTargetLabels[target];
}

export function getAdapter(target: AdapterTarget): Adapter {
  return adapters[target];
}

export function getAdapterLayoutSpecFileName(target: AdapterTarget): string {
  return `layout-spec.${target}.json`;
}

export function createAdapterLayoutSpecFile(
  project: PlaygroundProject,
  target: AdapterTarget
): AdapterLayoutSpecFile {
  const layoutSpec = getAdapter(target).emitLayoutSpec(project, {
    generatedAt: project.summary.generatedAt
  });

  return {
    contents: canonicalJSONStringify(layoutSpec),
    fileName: getAdapterLayoutSpecFileName(target)
  };
}
