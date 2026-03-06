import {
  canonicalProjectFixture,
  canonicalSettingsScreenBriefFixture
} from "@bux/core-model";
import { describe, expect, it } from "bun:test";
import { runCritic, type CriticRule } from "./scoring";

describe("runCritic", () => {
  it("returns a passing report when no rules trigger", () => {
    const report = runCritic(
      {
        brief: canonicalSettingsScreenBriefFixture,
        project: structuredClone(canonicalProjectFixture)
      },
      [
        {
          code: "settings.noop",
          screenType: "settings",
          evaluate: () => []
        }
      ]
    );

    expect(report.score).toBe(100);
    expect(report.verdict).toBe("pass");
    expect(report.summary.totalRules).toBe(1);
    expect(report.summary.triggeredRules).toBe(0);
  });

  it("deducts by severity and fails on high-severity findings", () => {
    const rules: CriticRule[] = [
      {
        code: "settings.table_misuse",
        screenType: "settings",
        evaluate: () => [
          {
            severity: "high",
            message: "Table layouts should not drive a settings screen.",
            path: "/page/sections/1"
          }
        ]
      },
      {
        code: "settings.label_repetition",
        screenType: "settings",
        evaluate: () => [
          {
            severity: "low",
            message: "Heading repeats a group label.",
            path: "/page/sections/0/slots/heading"
          }
        ]
      }
    ];

    const report = runCritic(
      {
        brief: canonicalSettingsScreenBriefFixture,
        project: structuredClone(canonicalProjectFixture)
      },
      rules
    );

    expect(report.score).toBe(66);
    expect(report.verdict).toBe("fail");
    expect(report.findings.map((finding) => finding.code)).toEqual([
      "settings.table_misuse",
      "settings.label_repetition"
    ]);
    expect(report.summary.severityCounts).toEqual({
      low: 1,
      medium: 0,
      high: 1
    });
  });
});
