import {
  constraintsSchema,
  pageSchema,
  summarySchema,
  tokensSchema,
  type ConstraintsDocument,
  type PageDocument,
  type PlaygroundProject,
  type SummaryDocument,
  type TokensDocument
} from "@bux/core-model";
import { validateProjectSections } from "@bux/section-kit";
import type { ErrorObject } from "ajv";
import Ajv2020 from "ajv/dist/2020";

const ajv = new Ajv2020({
  allErrors: true,
  strict: true
});

const validateTokens = ajv.compile<TokensDocument>(tokensSchema);
const validatePage = ajv.compile<PageDocument>(pageSchema);
const validateConstraints = ajv.compile<ConstraintsDocument>(constraintsSchema);
const validateSummary = ajv.compile<SummaryDocument>(summarySchema);

export interface ValidationIssue {
  document: "tokens.json" | "page.json" | "constraints.json" | "summary.json";
  instancePath: string;
  schemaPath: string;
  message: string;
}

export class ExportValidationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(
      `Export validation failed with ${issues.length} issue${
        issues.length === 1 ? "" : "s"
      }.`
    );
    this.name = "ExportValidationError";
    this.issues = issues;
  }
}

function mapIssues(
  document: ValidationIssue["document"],
  errors: ErrorObject[] | null | undefined
): ValidationIssue[] {
  if (!errors || errors.length === 0) {
    return [];
  }

  return errors.map((error) => ({
    document,
    instancePath: error.instancePath || "/",
    schemaPath: error.schemaPath,
    message: error.message ?? "Validation error"
  }));
}

export function collectValidationIssues(
  project: PlaygroundProject
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  validateTokens(project.tokens);
  issues.push(...mapIssues("tokens.json", validateTokens.errors));

  validatePage(project.page);
  issues.push(...mapIssues("page.json", validatePage.errors));

  validateConstraints(project.constraints);
  issues.push(...mapIssues("constraints.json", validateConstraints.errors));

  validateSummary(project.summary);
  issues.push(...mapIssues("summary.json", validateSummary.errors));

  const sectionIssues = validateProjectSections(project).map((sectionIssue) => ({
    document: "page.json" as const,
    instancePath: sectionIssue.path,
    schemaPath: `/section-kit/${sectionIssue.code}`,
    message: sectionIssue.message
  }));
  issues.push(...sectionIssues);

  return issues;
}

export function validateProjectForExport(project: PlaygroundProject): void {
  const issues = collectValidationIssues(project);
  if (issues.length > 0) {
    throw new ExportValidationError(issues);
  }
}
