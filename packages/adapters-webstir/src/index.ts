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

function withWebstirMeta(base: AdapterLayoutSpec): AdapterLayoutSpec {
  const components = base.sections.map((section) => ({
    sectionId: section.id,
    blockType: section.type,
    variant: section.variant
  }));

  return {
    ...base,
    adapterMeta: {
      framework: "webstir",
      styling: "token-role-map",
      components,
      outputHints: {
        renderer: "block-runtime",
        preferStructuredSlots: true
      }
    }
  };
}

export function createWebstirAdapter(): Adapter {
  return {
    target: "webstir",
    validate(project: PlaygroundProject) {
      return toValidationIssues(project);
    },
    emitLayoutSpec(project: PlaygroundProject, options?: { generatedAt?: string }) {
      return withWebstirMeta(createBaseLayoutSpec(project, "webstir", options));
    }
  };
}

export const webstirAdapter = createWebstirAdapter();
