import {
  createBaseLayoutSpec,
  type Adapter,
  type AdapterLayoutSpec,
  type AdapterValidationIssue
} from "@bux/adapter-contract";
import type { PlaygroundProject } from "@bux/core-model";
import { validateProjectSections } from "@bux/section-kit";

function toValidationIssues(project: PlaygroundProject): AdapterValidationIssue[] {
  const sectionIssues = validateProjectSections(project);
  return sectionIssues.map((issue) => ({
    path: issue.path,
    message: issue.message,
    severity: "error"
  }));
}

function withNextMeta(base: AdapterLayoutSpec): AdapterLayoutSpec {
  const components = base.sections.map((section) => ({
    sectionId: section.id,
    importPath: `@/components/sections/${section.type}`,
    componentName: `${section.type.charAt(0).toUpperCase()}${section.type.slice(1)}Section`
  }));

  return {
    ...base,
    adapterMeta: {
      framework: "nextjs-react",
      styling: "css-variables",
      components,
      outputHints: {
        appRouter: true,
        serverComponentsDefault: true
      }
    }
  };
}

export function createNextAdapter(): Adapter {
  return {
    target: "nextjs",
    validate(project: PlaygroundProject) {
      return toValidationIssues(project);
    },
    emitLayoutSpec(project: PlaygroundProject, options?: { generatedAt?: string }) {
      return withNextMeta(createBaseLayoutSpec(project, "nextjs", options));
    }
  };
}

export const nextAdapter = createNextAdapter();
