import type { PlaygroundProject } from "@bux/core-model";
import { join } from "node:path";

export const requiredProjectFiles = [
  "tokens.json",
  "page.json",
  "constraints.json",
  "summary.json"
] as const;

type RequiredProjectFile = (typeof requiredProjectFiles)[number];

export function projectFilePath(rootPath: string, fileName: RequiredProjectFile): string {
  return join(rootPath, fileName);
}

export async function loadProjectFromDirectory(
  rootPath: string
): Promise<PlaygroundProject> {
  const [tokens, page, constraints, summary] = await Promise.all(
    requiredProjectFiles.map((fileName) =>
      Bun.file(projectFilePath(rootPath, fileName)).json()
    )
  );

  return {
    tokens,
    page,
    constraints,
    summary,
    stress: structuredClone(summary.stress)
  } as PlaygroundProject;
}
