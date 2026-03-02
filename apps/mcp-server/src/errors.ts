import { ExportValidationError, type ValidationIssue } from "@bux/exporter";

export const CONTRACT_VERSION = "1.0.0";

export type McpErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "IO_ERROR"
  | "INTERNAL_ERROR";

export interface McpErrorShape {
  code: McpErrorCode;
  message: string;
  details?: unknown;
}

export class McpToolError extends Error {
  readonly code: McpErrorCode;
  readonly details?: unknown;

  constructor(code: McpErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "McpToolError";
    this.code = code;
    this.details = details;
  }
}

export function validationFailed(
  message: string,
  issues: ValidationIssue[]
): McpToolError {
  return new McpToolError("VALIDATION_FAILED", message, issues);
}

export function toErrorShape(error: unknown): McpErrorShape {
  if (error instanceof McpToolError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details
    };
  }

  if (error instanceof ExportValidationError) {
    return {
      code: "VALIDATION_FAILED",
      message: error.message,
      details: error.issues
    };
  }

  if (error instanceof Error) {
    return {
      code: "INTERNAL_ERROR",
      message: error.message
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "Unknown internal error."
  };
}
