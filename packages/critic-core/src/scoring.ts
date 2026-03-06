import {
  CURRENT_SCHEMA_VERSION,
  type CriticFinding,
  type CriticFindingSeverity,
  type CriticReport,
  type CriticSuggestedFix,
  type CriticVerdict,
  type PlaygroundProject,
  type ScreenBrief
} from "@bux/core-model";

export interface CriticContext<TBrief extends ScreenBrief = ScreenBrief> {
  brief: TBrief;
  project: PlaygroundProject;
}

export interface CriticRuleFinding {
  severity: CriticFindingSeverity;
  message: string;
  path: string;
  suggestedFix?: CriticSuggestedFix;
}

export interface CriticRule<TBrief extends ScreenBrief = ScreenBrief> {
  code: string;
  screenType: TBrief["screenType"];
  evaluate: (context: CriticContext<TBrief>) => CriticRuleFinding[];
}

export interface CriticScoringConfig {
  failBelow: number;
  warnBelow: number;
  deductions: Record<CriticFindingSeverity, number>;
}

const defaultScoringConfig: CriticScoringConfig = {
  failBelow: 70,
  warnBelow: 90,
  deductions: {
    low: 6,
    medium: 14,
    high: 28
  }
};

const severityOrder: Record<CriticFindingSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2
};

function toFinding<TBrief extends ScreenBrief>(
  rule: CriticRule<TBrief>,
  finding: CriticRuleFinding
): CriticFinding {
  return {
    code: rule.code,
    severity: finding.severity,
    message: finding.message,
    path: finding.path,
    ...(finding.suggestedFix ? { suggestedFix: finding.suggestedFix } : {})
  };
}

function compareFindings(left: CriticFinding, right: CriticFinding): number {
  const severityDelta = severityOrder[left.severity] - severityOrder[right.severity];
  if (severityDelta !== 0) {
    return severityDelta;
  }

  const pathDelta = left.path.localeCompare(right.path);
  if (pathDelta !== 0) {
    return pathDelta;
  }

  return left.code.localeCompare(right.code);
}

function resolveVerdict(
  score: number,
  findings: CriticFinding[],
  config: CriticScoringConfig
): CriticVerdict {
  if (score < config.failBelow || findings.some((finding) => finding.severity === "high")) {
    return "fail";
  }

  if (score < config.warnBelow || findings.length > 0) {
    return "warn";
  }

  return "pass";
}

export function runCritic<TBrief extends ScreenBrief>(
  context: CriticContext<TBrief>,
  rules: ReadonlyArray<CriticRule<TBrief>>,
  scoringConfig: Partial<CriticScoringConfig> = {}
): CriticReport {
  const config: CriticScoringConfig = {
    ...defaultScoringConfig,
    ...scoringConfig,
    deductions: {
      ...defaultScoringConfig.deductions,
      ...scoringConfig.deductions
    }
  };
  const matchingRules = rules.filter((rule) => rule.screenType === context.brief.screenType);
  const findings = matchingRules
    .flatMap((rule) => rule.evaluate(context).map((finding) => toFinding(rule, finding)))
    .sort(compareFindings);
  const severityCounts = findings.reduce<Record<CriticFindingSeverity, number>>(
    (counts, finding) => {
      counts[finding.severity] += 1;
      return counts;
    },
    {
      low: 0,
      medium: 0,
      high: 0
    }
  );
  const totalDeduction = findings.reduce(
    (sum, finding) => sum + config.deductions[finding.severity],
    0
  );
  const score = Math.max(0, 100 - totalDeduction);

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    screenType: context.brief.screenType,
    score,
    verdict: resolveVerdict(score, findings, config),
    findings,
    summary: {
      totalRules: matchingRules.length,
      triggeredRules: new Set(findings.map((finding) => finding.code)).size,
      severityCounts
    }
  };
}
