import type { PlaygroundProject, SectionType } from "@bux/core-model";

export type AdapterTarget = "nextjs" | "webstir";
export type ValidationSeverity = "error" | "warning";

export interface AdapterValidationIssue {
  path: string;
  message: string;
  severity: ValidationSeverity;
}

export interface AdapterSectionSpec {
  id: string;
  type: SectionType;
  variant: string;
  props: Record<string, unknown>;
  slots: Record<string, unknown>;
}

export interface AdapterLayoutSpec {
  schemaVersion: string;
  target: AdapterTarget;
  generatedAt: string;
  stress: PlaygroundProject["stress"];
  constraints: PlaygroundProject["constraints"];
  sections: AdapterSectionSpec[];
  tokenSummary: {
    typographyScaleSteps: number;
    spacingScaleSteps: number;
    colorRoleCount: number;
  };
  adapterMeta: {
    framework: string;
    [key: string]: unknown;
  };
}

export interface Adapter {
  target: AdapterTarget;
  validate(project: PlaygroundProject): AdapterValidationIssue[];
  emitLayoutSpec(
    project: PlaygroundProject,
    options?: { generatedAt?: string }
  ): AdapterLayoutSpec;
}

export function createBaseLayoutSpec(
  project: PlaygroundProject,
  target: AdapterTarget,
  options: { generatedAt?: string } = {}
): AdapterLayoutSpec {
  return {
    schemaVersion: project.summary.schemaVersion,
    target,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    stress: project.stress,
    constraints: project.constraints,
    sections: project.page.sections.map((section) => ({
      id: section.id,
      type: section.type,
      variant: section.variant,
      props: section.props,
      slots: section.slots
    })),
    tokenSummary: {
      typographyScaleSteps: project.tokens.typography.scale.length,
      spacingScaleSteps: project.tokens.spacing.scale.length,
      colorRoleCount: Object.keys(project.tokens.colors.roles).length
    },
    adapterMeta: {
      framework: target
    }
  };
}
