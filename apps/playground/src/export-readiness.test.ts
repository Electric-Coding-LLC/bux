import { describe, expect, it } from "bun:test";
import {
  canonicalSettingsScreenBriefFixture,
  type CriticReport
} from "@bux/core-model";
import type { ValidationIssue } from "@bux/exporter/browser";
import { evaluateSettingsScreen } from "@bux/critic-rules";
import { createSettingsStarterProject } from "./settings-workbench";
import { evaluateExportReadiness } from "./export-readiness";

function makeValidationIssue(message: string): ValidationIssue {
  return {
    document: "page.json",
    instancePath: "/page/sections/0",
    schemaPath: "/section-kit/test",
    message
  };
}

describe("evaluateExportReadiness", () => {
  it("approves export when the critic passes and validation is clean", () => {
    const report = evaluateSettingsScreen(
      createSettingsStarterProject(),
      canonicalSettingsScreenBriefFixture
    );

    const readiness = evaluateExportReadiness(report, []);

    expect(report.verdict).toBe("pass");
    expect(readiness.canExport).toBe(true);
    expect(readiness.status).toBe("approved");
    expect(readiness.label).toBe("Approved for Export");
  });

  it("blocks export when the critic has not cleared the candidate", () => {
    const report: CriticReport = {
      schemaVersion: "1.0.0",
      screenType: "settings",
      score: 78,
      verdict: "warn",
      findings: [
        {
          code: "settings.variant_drift",
          severity: "medium",
          message: "Settings variants feel mixed.",
          path: "/page/sections/0"
        }
      ],
      summary: {
        totalRules: 12,
        triggeredRules: 1,
        severityCounts: {
          high: 0,
          medium: 1,
          low: 0
        }
      }
    };

    const readiness = evaluateExportReadiness(report, []);

    expect(readiness.canExport).toBe(false);
    expect(readiness.status).toBe("blocked");
    expect(readiness.summary).toContain("Critic verdict is warn");
    expect(readiness.blockedReasons).toHaveLength(1);
  });

  it("blocks export when validation still fails even after a critic pass", () => {
    const report = evaluateSettingsScreen(
      createSettingsStarterProject(),
      canonicalSettingsScreenBriefFixture
    );
    const readiness = evaluateExportReadiness(report, [
      makeValidationIssue("Settings props are invalid.")
    ]);

    expect(report.verdict).toBe("pass");
    expect(readiness.canExport).toBe(false);
    expect(readiness.blockedReasons).toEqual(["1 export validation issue remains."]);
  });

  it("combines critic and validation blockers into one export decision", () => {
    const report: CriticReport = {
      schemaVersion: "1.0.0",
      screenType: "settings",
      score: 42,
      verdict: "fail",
      findings: [
        {
          code: "settings.weak_primary_focus",
          severity: "high",
          message: "Primary focus is weak.",
          path: "/page/sections"
        }
      ],
      summary: {
        totalRules: 12,
        triggeredRules: 1,
        severityCounts: {
          high: 1,
          medium: 0,
          low: 0
        }
      }
    };

    const readiness = evaluateExportReadiness(report, [
      makeValidationIssue("Missing required section prop."),
      makeValidationIssue("Constraint value is invalid.")
    ]);

    expect(readiness.canExport).toBe(false);
    expect(readiness.blockedReasons).toHaveLength(2);
    expect(readiness.summary).toContain("Critic verdict is fail");
    expect(readiness.summary).toContain("2 export validation issues remain.");
  });
});
