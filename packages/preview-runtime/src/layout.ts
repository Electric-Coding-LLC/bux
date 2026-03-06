import type {
  BreakpointConstraint,
  BreakpointName,
  PlaygroundProject
} from "@bux/core-model";

export interface ResolvedPreviewLayout {
  breakpoint: BreakpointName;
  columns: number;
  gutter: number;
  containerWidth: number;
  isCompact: boolean;
  isMedium: boolean;
}

function resolveConstraint(
  project: PlaygroundProject,
  activeBreakpoint?: BreakpointName
): BreakpointConstraint {
  const configuredBreakpoints = project.constraints.layout.breakpoints;

  if (activeBreakpoint) {
    const matching = configuredBreakpoints.find(
      (entry) => entry.breakpoint === activeBreakpoint
    );
    if (matching) {
      return matching;
    }
  }

  const mdConstraint = configuredBreakpoints.find((entry) => entry.breakpoint === "md");
  if (mdConstraint) {
    return mdConstraint;
  }

  const [firstConstraint] = configuredBreakpoints;
  if (firstConstraint) {
    return firstConstraint;
  }

  return {
    breakpoint: "md",
    columns: 12,
    gutterToken: 4,
    containerToken: "md"
  };
}

function resolveSpacingToken(scale: number[], token: number, fallback: number): number {
  if (token <= 0) {
    return fallback;
  }

  const oneBased = scale[token - 1];
  if (typeof oneBased === "number") {
    return oneBased;
  }

  const zeroBased = scale[token];
  if (typeof zeroBased === "number") {
    return zeroBased;
  }

  return fallback;
}

export function resolvePreviewLayout(
  project: PlaygroundProject,
  activeBreakpoint?: BreakpointName
): ResolvedPreviewLayout {
  const constraint = resolveConstraint(project, activeBreakpoint);
  const containerWidth =
    project.tokens.containers[constraint.containerToken] ??
    project.tokens.containers[constraint.breakpoint] ??
    960;
  const gutter = resolveSpacingToken(project.tokens.spacing.scale, constraint.gutterToken, 16);
  const isCompact = constraint.columns < 8 || containerWidth < 640;
  const isMedium = !isCompact && (constraint.columns < 12 || containerWidth < 1024);

  return {
    breakpoint: constraint.breakpoint,
    columns: constraint.columns,
    gutter,
    containerWidth,
    isCompact,
    isMedium
  };
}

export function clampResponsiveColumns(
  requestedColumns: number,
  layout: ResolvedPreviewLayout,
  limits: { compact: number; medium: number; wide: number }
): number {
  const ceiling = layout.isCompact
    ? limits.compact
    : layout.isMedium
      ? limits.medium
      : limits.wide;

  return Math.max(1, Math.min(requestedColumns, ceiling));
}

export function resolveInlineFieldColumns(layout: ResolvedPreviewLayout): number {
  if (layout.isCompact) {
    return 1;
  }

  if (layout.isMedium) {
    return 2;
  }

  return 3;
}
