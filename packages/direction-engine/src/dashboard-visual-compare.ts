import type { DashboardArtDirectionProfile } from "@bux/core-model";
import type { GeneratedCandidate } from "./generation";

export interface DashboardReferenceStudy {
  id: string;
  label: string;
  summary: string;
  signals: string[];
}

export interface DashboardReferencePack {
  profile: DashboardArtDirectionProfile;
  profileLabel: string;
  summary: string;
  title: string;
  references: DashboardReferenceStudy[];
}

export interface DashboardVisualCompareSummary {
  label: string;
  matchedSignals: string[];
  missingSignals: string[];
  scoreLabel: string;
  status: "drifting" | "mixed" | "strong";
  summary: string;
}

const dashboardReferencePacks: Record<
  DashboardArtDirectionProfile,
  DashboardReferencePack
> = {
  quietSignal: {
    profile: "quietSignal",
    profileLabel: "Quiet Signal",
    title: "Reference canon for calm operational dashboards",
    summary:
      "Look for restrained chrome, a quieter summary band, and one measured follow-up surface instead of a loud control-room stack.",
    references: [
      {
        id: "calm-signal-board",
        label: "Calm signal board",
        summary:
          "A restrained pulse view with softened surfaces that never fights the content for attention.",
        signals: [
          "Soft chrome and rounded surfaces",
          "Minimal summary band",
          "Measured follow-up surface"
        ]
      },
      {
        id: "measured-watchlist",
        label: "Measured watchlist",
        summary:
          "A short queue or watchlist that stays supportive instead of turning the dashboard into an urgent operations wall.",
        signals: [
          "Quiet supporting copy",
          "One supporting queue",
          "Compatible authored baseline"
        ]
      }
    ]
  },
  commandCenter: {
    profile: "commandCenter",
    profileLabel: "Command Center",
    title: "Reference canon for sharper operator dashboards",
    summary:
      "Bias toward stronger contrast, tighter radii, and one compact operational queue that feels immediately actionable.",
    references: [
      {
        id: "control-room-pulse",
        label: "Control room pulse",
        summary:
          "The summary band reads like a tactical pulse, using stronger card contrast to frame the current state quickly.",
        signals: [
          "Sharpened control-room chrome",
          "High-contrast summary cards",
          "Compact operator queue"
        ]
      },
      {
        id: "operator-stack",
        label: "Operator stack",
        summary:
          "The main queue carries the action, while the supporting surface stays terse and subordinate.",
        signals: [
          "Urgent blue accent posture",
          "One main queue",
          "Compatible authored baseline"
        ]
      }
    ]
  },
  editorialPulse: {
    profile: "editorialPulse",
    profileLabel: "Editorial Pulse",
    title: "Reference canon for authored briefing dashboards",
    summary:
      "Use warmer accents, larger headline contrast, and richer supporting notes so the dashboard feels like a brief instead of a raw queue.",
    references: [
      {
        id: "program-briefing",
        label: "Program briefing",
        summary:
          "The summary band carries more voice and contrast, setting up the rest of the dashboard like an authored review.",
        signals: [
          "Warm briefing palette",
          "Headline-led summary cards",
          "Spacious typography cadence"
        ]
      },
      {
        id: "narrative-pulse",
        label: "Narrative pulse",
        summary:
          "The follow-up surface reads like edited notes, not a pure queue dump, while preserving a clean decision path.",
        signals: [
          "Detailed follow-up notes",
          "Authored section pacing",
          "Compatible authored baseline"
        ]
      }
    ]
  }
};

function hexToRgb(hex: string): { b: number; g: number; r: number } | null {
  const normalized = hex.trim().replace("#", "");

  if (!/^[\da-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function accentTone(
  accentColor: string
): "cool" | "teal" | "warm" | "unknown" {
  const rgb = hexToRgb(accentColor);

  if (!rgb) {
    return "unknown";
  }

  if (rgb.b > rgb.r && rgb.b > rgb.g) {
    return "cool";
  }

  if (rgb.g >= rgb.b && rgb.g >= rgb.r) {
    return "teal";
  }

  if (rgb.r >= rgb.g && rgb.g > rgb.b) {
    return "warm";
  }

  return "unknown";
}

function firstVariant(
  candidate: GeneratedCandidate,
  sectionType: "featureGrid" | "list" | "table"
): string | null {
  const section = candidate.project.page.sections.find(
    (entry) => entry.type === sectionType
  );

  return typeof section?.variant === "string" ? section.variant : null;
}

function countSections(
  candidate: GeneratedCandidate,
  sectionType: "list" | "table"
): number {
  return candidate.project.page.sections.filter(
    (entry) => entry.type === sectionType
  ).length;
}

function buildSignalMap(candidate: GeneratedCandidate): Record<string, boolean> {
  const accent =
    candidate.project.tokens.colors.roles["accent.primary"] ?? "#000000";
  const radiusMd = candidate.project.tokens.radii.md;
  const spacingStep = candidate.project.tokens.spacing.scale[5] ?? 0;
  const headlineScale = candidate.project.tokens.typography.scale[5] ?? 0;
  const featureGridVariant = firstVariant(candidate, "featureGrid");
  const listVariant = firstVariant(candidate, "list");
  const tableVariant = firstVariant(candidate, "table");
  const tone = accentTone(accent);
  const tableCount = countSections(candidate, "table");
  const supportingSurfaceCount =
    countSections(candidate, "list") + tableCount;
  const compatibleBaseline =
    candidate.blueprint.screenType === "dashboard" &&
    candidate.brief.screenType === "dashboard" &&
    candidate.blueprint.artDirectionProfiles.includes(
      candidate.brief.artDirection
    );

  return {
    "Authored section pacing":
      candidate.project.page.sections.length <= 3 &&
      (featureGridVariant === "cards" || featureGridVariant === "minimal"),
    "Compact operator queue": tableVariant === "compact",
    "Compatible authored baseline": compatibleBaseline,
    "Detailed follow-up notes": listVariant === "detailed",
    "Headline-led summary cards": featureGridVariant === "cards",
    "High-contrast summary cards": featureGridVariant === "cards",
    "Measured follow-up surface":
      supportingSurfaceCount <= 2 &&
      (listVariant === "simple" || tableVariant === "comfortable"),
    "Minimal summary band": featureGridVariant === "minimal",
    "One main queue": tableCount === 1,
    "One supporting queue": supportingSurfaceCount === 1,
    "Quiet supporting copy": listVariant === "simple" || listVariant === null,
    "Sharpened control-room chrome": radiusMd <= 8 && tone === "cool",
    "Soft chrome and rounded surfaces":
      radiusMd >= 12 && spacingStep >= 34 && (tone === "teal" || tone === "unknown"),
    "Spacious typography cadence": headlineScale >= 38 && spacingStep >= 40,
    "Urgent blue accent posture": tone === "cool",
    "Warm briefing palette": tone === "warm"
  };
}

export function getDashboardReferencePack(
  profile: DashboardArtDirectionProfile
): DashboardReferencePack {
  return dashboardReferencePacks[profile];
}

export function summarizeDashboardVisualCompare(
  candidate: GeneratedCandidate
): DashboardVisualCompareSummary | null {
  if (
    candidate.brief.screenType !== "dashboard" ||
    candidate.blueprint.screenType !== "dashboard"
  ) {
    return null;
  }

  const referencePack = getDashboardReferencePack(candidate.brief.artDirection);
  const signalMap = buildSignalMap(candidate);
  const allSignals = referencePack.references.flatMap((reference) => reference.signals);
  const matchedSignals = allSignals.filter((signal) => signalMap[signal] === true);
  const missingSignals = allSignals.filter((signal) => signalMap[signal] !== true);
  const score = matchedSignals.length / allSignals.length;

  let label = "Drifting from the reference canon";
  let scoreLabel = "Low fit";
  let status: DashboardVisualCompareSummary["status"] = "drifting";
  let summary =
    "The rendered posture still misses several signals from the active reference canon.";

  if (score >= 0.75) {
    label = "Strong reference fit";
    scoreLabel = "High fit";
    status = "strong";
    summary =
      "The candidate matches most of the active reference signals and reads close to the chosen canon.";
  } else if (score >= 0.45) {
    label = "Mixed reference fit";
    scoreLabel = "Partial fit";
    status = "mixed";
    summary =
      "The candidate carries some of the target direction, but a few key cues are still missing.";
  }

  return {
    label,
    matchedSignals,
    missingSignals,
    scoreLabel,
    status,
    summary
  };
}
