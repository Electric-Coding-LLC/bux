import type {
  BreakpointName,
  PlaygroundProject,
  SectionNode,
  StressCopyMode,
  StressDocument
} from "@bux/core-model";
import type { CSSProperties, ReactNode } from "react";
import {
  clampResponsiveColumns,
  resolveInlineFieldColumns,
  resolvePreviewLayout
} from "./layout";

export interface PlaygroundPreviewProps {
  project: PlaygroundProject;
  activeBreakpoint?: BreakpointName;
}

function tokenCssVariables(
  project: PlaygroundProject,
  activeBreakpoint?: BreakpointName
): CSSProperties {
  const accent = project.tokens.colors.roles["accent.primary"] ?? "#0F766E";
  const textPrimary = project.tokens.colors.roles["text.primary"] ?? "#111827";
  const textSecondary =
    project.tokens.colors.roles["text.secondary"] ?? "#4B5563";
  const borderSubtle = project.tokens.colors.roles["border.subtle"] ?? "#D1D5DB";
  const surfaceDefault =
    project.tokens.colors.roles["surface.default"] ?? "#FFFFFF";
  const surfaceMuted = project.tokens.colors.roles["surface.muted"] ?? "#F6F7F8";

  const scale = project.tokens.typography.scale;
  const spacingScale = project.tokens.spacing.scale;
  const densityFactor =
    project.tokens.spacing.density[project.stress.densityMode] ?? 1;
  const scaledSpace = (index: number, fallback: number): string =>
    `${Math.round((spacingScale[index] ?? fallback) * densityFactor)}px`;
  const layout = resolvePreviewLayout(project, activeBreakpoint);

  return {
    "--token-accent-primary": accent,
    "--token-text-primary": textPrimary,
    "--token-text-secondary": textSecondary,
    "--token-border-subtle": borderSubtle,
    "--token-surface-default": surfaceDefault,
    "--token-surface-muted": surfaceMuted,
    "--token-font-sans": project.tokens.typography.families.sans,
    "--token-font-size-body": `${scale[2] ?? 16}px`,
    "--token-font-size-title": `${scale[5] ?? 32}px`,
    "--token-font-size-subtitle": `${scale[4] ?? 24}px`,
    "--token-space-2": scaledSpace(1, 8),
    "--token-space-3": scaledSpace(2, 12),
    "--token-space-4": scaledSpace(3, 16),
    "--token-space-6": scaledSpace(5, 32),
    "--token-radius-md": `${project.tokens.radii.md}px`,
    "--preview-container-width": `${layout.containerWidth}px`,
    "--preview-gutter": `${layout.gutter}px`
  } as CSSProperties;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function applyCopyStress(text: string, copyMode: StressCopyMode): string {
  if (copyMode === "short") {
    return text;
  }

  return `${text} This extended content is intentionally long to stress wrapping, hierarchy, and reading rhythm.`;
}

function renderStateBanner(stress: StressDocument): ReactNode {
  if (stress.stateMode === "default") {
    return null;
  }

  const label =
    stress.stateMode === "empty"
      ? "Empty state active"
      : stress.stateMode === "loading"
        ? "Loading state active"
        : "Error state active";

  return <p className={`preview-state-banner state-${stress.stateMode}`}>{label}</p>;
}

function renderHero(
  section: SectionNode,
  stress: StressDocument,
  activeBreakpointLayout: ReturnType<typeof resolvePreviewLayout>
): ReactNode {
  const isLoading = stress.stateMode === "loading";
  const isEmpty = stress.stateMode === "empty";
  const heading = isLoading
    ? "Loading hero..."
    : isEmpty
      ? "No hero content"
      : applyCopyStress(asString(section.slots.heading, "Hero heading"), stress.copyMode);
  const body = isLoading
    ? "Fetching hero content..."
    : isEmpty
      ? "No content available for this section in empty mode."
      : applyCopyStress(asString(section.slots.body, ""), stress.copyMode);
  const eyebrow = isLoading
    ? "Loading"
    : isEmpty
      ? ""
      : applyCopyStress(asString(section.slots.eyebrow, ""), stress.copyMode);
  const primaryCta = asString(section.slots.primaryCta, "Primary");
  const secondaryCta = asString(section.slots.secondaryCta, "Secondary");
  const ctaCount = asNumber(section.props.ctaCount, 1);
  const hasMedia = !isEmpty && Boolean(section.props.hasMedia);
  const heroClassName = activeBreakpointLayout.isCompact
    ? "preview-section preview-hero preview-hero-stacked"
    : "preview-section preview-hero";

  return (
    <section className={heroClassName} data-section-id={section.id}>
      {renderStateBanner(stress)}
      <div className="preview-hero-content">
        {eyebrow.length > 0 ? <p className="preview-eyebrow">{eyebrow}</p> : null}
        <h1>{heading}</h1>
        {body.length > 0 ? <p className="preview-body">{body}</p> : null}
        <div className="preview-cta-row">
          {ctaCount >= 1 ? (
            <button className="btn-primary" disabled={isLoading}>
              {primaryCta}
            </button>
          ) : null}
          {ctaCount >= 2 ? (
            <button className="btn-secondary" disabled={isLoading}>
              {secondaryCta}
            </button>
          ) : null}
        </div>
      </div>
      {hasMedia ? (
        <div className="preview-hero-media" aria-hidden>
          <div className="preview-hero-media-box">Media Slot</div>
        </div>
      ) : null}
    </section>
  );
}

function renderFeatureGrid(
  section: SectionNode,
  stress: StressDocument,
  activeBreakpointLayout: ReturnType<typeof resolvePreviewLayout>
): ReactNode {
  const isLoading = stress.stateMode === "loading";
  const isEmpty = stress.stateMode === "empty";
  const heading = applyCopyStress(asString(section.slots.heading, "Features"), stress.copyMode);
  const columns = clampResponsiveColumns(
    Math.max(1, Math.min(4, asNumber(section.props.columns, 3))),
    activeBreakpointLayout,
    { compact: 1, medium: 2, wide: 4 }
  );
  const baseItems = asArray<{ title?: string; body?: string }>(section.slots.items);

  const items = isLoading
    ? Array.from({ length: columns * 2 }, (_, index) => ({
        title: `Loading item ${index + 1}`,
        body: "Retrieving content..."
      }))
    : isEmpty
      ? []
      : baseItems;

  return (
    <section className="preview-section preview-feature-grid" data-section-id={section.id}>
      {renderStateBanner(stress)}
      <h2>{heading}</h2>
      {isEmpty ? <p className="preview-empty-copy">No items to display.</p> : null}
      <div
        className="preview-feature-grid-cards"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {items.map((item, index) => (
          <article
            className={`preview-card${isLoading ? " preview-card-loading" : ""}`}
            key={`${section.id}-${index}`}
          >
            <h3>{applyCopyStress(asString(item.title, `Item ${index + 1}`), stress.copyMode)}</h3>
            <p>{applyCopyStress(asString(item.body, ""), stress.copyMode)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function renderForm(
  section: SectionNode,
  stress: StressDocument,
  activeBreakpointLayout: ReturnType<typeof resolvePreviewLayout>
): ReactNode {
  const isLoading = stress.stateMode === "loading";
  const isEmpty = stress.stateMode === "empty";
  const heading = applyCopyStress(asString(section.slots.heading, "Form"), stress.copyMode);
  const fields = isEmpty
    ? []
    : asArray<string>(section.slots.fields).map((field) =>
        applyCopyStress(asString(field, "Field"), stress.copyMode)
      );
  const submitLabel = asString(section.slots.submitLabel, "Submit");
  const layout = asString(section.props.layout, "stacked");
  const inlineColumns =
    layout === "inline" ? resolveInlineFieldColumns(activeBreakpointLayout) : 1;

  return (
    <section className="preview-section preview-form" data-section-id={section.id}>
      {renderStateBanner(stress)}
      <h2>{heading}</h2>
      {isEmpty ? <p className="preview-empty-copy">No form fields configured.</p> : null}
      <form
        className={`preview-form-fields layout-${layout}`}
        style={{
          gridTemplateColumns:
            layout === "inline"
              ? `repeat(${inlineColumns}, minmax(0, 1fr))`
              : undefined
        }}
      >
        {isLoading
          ? ["Loading field 1", "Loading field 2", "Loading field 3"].map((label) => (
              <label key={label} className="preview-form-field">
                <span>{label}</span>
                <input disabled value="Loading..." readOnly />
              </label>
            ))
          : fields.map((label, index) => (
              <label key={`${section.id}-field-${index}`} className="preview-form-field">
                <span>{label}</span>
                <input
                  disabled={stress.stateMode === "error"}
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
              </label>
            ))}
        <button className="btn-primary" disabled={isLoading || stress.stateMode === "error"}>
          {submitLabel}
        </button>
      </form>
    </section>
  );
}

function renderList(section: SectionNode, stress: StressDocument): ReactNode {
  const isLoading = stress.stateMode === "loading";
  const isEmpty = stress.stateMode === "empty";
  const heading = applyCopyStress(asString(section.slots.heading, "List"), stress.copyMode);
  const items = isLoading
    ? Array.from({ length: 6 }, (_, index) => `Loading item ${index + 1}`)
    : isEmpty
      ? []
      : asArray<string>(section.slots.items).map((item) =>
          applyCopyStress(asString(item, "List item"), stress.copyMode)
        );

  return (
    <section className="preview-section preview-list" data-section-id={section.id}>
      {renderStateBanner(stress)}
      <h2>{heading}</h2>
      {items.length === 0 ? <p className="preview-empty-copy">No list items available.</p> : null}
      <ul className="preview-list-items">
        {items.map((item, index) => (
          <li
            key={`${section.id}-item-${index}`}
            className={isLoading ? "preview-card-loading" : ""}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function renderTable(
  section: SectionNode,
  stress: StressDocument,
  activeBreakpointLayout: ReturnType<typeof resolvePreviewLayout>
): ReactNode {
  const isLoading = stress.stateMode === "loading";
  const isEmpty = stress.stateMode === "empty";
  const heading = applyCopyStress(asString(section.slots.heading, "Table"), stress.copyMode);
  const columns = clampResponsiveColumns(
    Math.max(1, Math.min(12, asNumber(section.props.columns, 4))),
    activeBreakpointLayout,
    {
      compact: 4,
      medium: 8,
      wide: 12
    }
  );
  const headers = asArray<string>(section.slots.headers).slice(0, columns);
  const rows = asArray<string[]>(section.slots.rows);

  const fallbackHeaders = Array.from({ length: columns }, (_, index) => `Column ${index + 1}`);
  const safeHeaders = headers.length > 0 ? headers : fallbackHeaders;
  const safeRows = isLoading
    ? Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: columns }, (_, col) => `Loading ${row + 1}-${col + 1}`)
      )
    : isEmpty
      ? []
      : rows;

  return (
    <section className="preview-section preview-table-wrap" data-section-id={section.id}>
      {renderStateBanner(stress)}
      <h2>{heading}</h2>
      {safeRows.length === 0 ? <p className="preview-empty-copy">No rows to show.</p> : null}
      <div className="preview-table-scroll">
        <table className="preview-table">
          <thead>
            <tr>
              {safeHeaders.map((header, index) => (
                <th key={`${section.id}-header-${index}`}>
                  {applyCopyStress(asString(header, `Column ${index + 1}`), stress.copyMode)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeRows.map((row, rowIndex) => (
              <tr
                key={`${section.id}-row-${rowIndex}`}
                className={isLoading ? "preview-card-loading" : ""}
              >
                {row.slice(0, safeHeaders.length).map((cell, cellIndex) => (
                  <td key={`${section.id}-cell-${rowIndex}-${cellIndex}`}>
                    {applyCopyStress(asString(cell, ""), stress.copyMode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function renderSettings(
  section: SectionNode,
  stress: StressDocument,
  activeBreakpointLayout: ReturnType<typeof resolvePreviewLayout>
): ReactNode {
  const isLoading = stress.stateMode === "loading";
  const isEmpty = stress.stateMode === "empty";
  const heading = applyCopyStress(asString(section.slots.heading, "Settings"), stress.copyMode);
  const description = isLoading
    ? "Loading settings description..."
    : isEmpty
      ? ""
      : applyCopyStress(asString(section.slots.description, ""), stress.copyMode);
  const note = isLoading
    ? "Loading note..."
    : isEmpty
      ? ""
      : applyCopyStress(asString(section.slots.note, ""), stress.copyMode);
  const actionLabel = isLoading
    ? "Saving..."
    : applyCopyStress(asString(section.slots.actionLabel, ""), stress.copyMode);
  const actionTone = asString(section.props.actionTone, "neutral");
  const layoutStyle = asString(section.props.layoutStyle, "balanced");
  const emphasizedIndex = asNumber(section.props.emphasizedIndex, 0);
  const groupDescriptions = isLoading
    ? ["Loading details...", "Loading details...", "Loading details..."]
    : isEmpty
      ? []
      : asArray<string>(section.slots.groupDescriptions).map((entry) =>
          applyCopyStress(asString(entry, ""), stress.copyMode)
        );
  const groups = isLoading
    ? ["Loading group A", "Loading group B", "Loading group C"]
    : isEmpty
      ? []
      : asArray<string>(section.slots.groups).map((group) =>
          applyCopyStress(asString(group, "Group"), stress.copyMode)
        );
  const railTitle = isLoading
    ? "Loading guidance"
    : applyCopyStress(asString(section.slots.railTitle, ""), stress.copyMode);
  const railItems = isLoading
    ? ["Loading guidance item", "Loading guidance item"]
    : isEmpty
      ? []
      : asArray<string>(section.slots.railItems).map((entry) =>
          applyCopyStress(asString(entry, ""), stress.copyMode)
        );
  const groupedColumns = clampResponsiveColumns(
    Math.max(1, asNumber(section.props.groupCount, groups.length || 1)),
    activeBreakpointLayout,
    layoutStyle === "dense"
      ? { compact: 1, medium: 1, wide: 1 }
      : layoutStyle === "calm"
        ? { compact: 1, medium: 1, wide: 2 }
        : { compact: 1, medium: 2, wide: 4 }
  );
  const featuredGroup =
    groups.length > 0 ? groups[Math.min(emphasizedIndex, groups.length - 1)] : null;
  const featuredDescription =
    groupDescriptions[Math.min(emphasizedIndex, Math.max(0, groupDescriptions.length - 1))] ??
    "";
  const remainingGroups = groups.filter((_, index) => index !== emphasizedIndex);
  const remainingDescriptions = groupDescriptions.filter((_, index) => index !== emphasizedIndex);
  const shellClassName = [
    "preview-settings-shell",
    `layout-${layoutStyle}`,
    activeBreakpointLayout.isCompact ? "layout-compact" : ""
  ]
    .filter((value) => value.length > 0)
    .join(" ");

  return (
    <section className="preview-section preview-settings" data-section-id={section.id}>
      {renderStateBanner(stress)}
      <div className={shellClassName}>
        <div className="preview-settings-main">
          <div className="preview-settings-header">
            <div>
              <h2>{heading}</h2>
              {description.length > 0 ? (
                <p className="preview-settings-description">{description}</p>
              ) : null}
            </div>
            {actionLabel.length > 0 ? (
              <button
                className={actionTone === "accent" ? "btn-primary" : "btn-secondary"}
                disabled={isLoading || stress.stateMode === "error"}
              >
                {actionLabel}
              </button>
            ) : null}
          </div>

          {note.length > 0 ? <p className="preview-settings-note">{note}</p> : null}
          {groups.length === 0 ? <p className="preview-empty-copy">No settings groups.</p> : null}

          {layoutStyle === "spotlight" && featuredGroup ? (
            <article
              className={`preview-settings-group preview-settings-featured${
                isLoading ? " preview-card-loading" : ""
              }`}
            >
              <h3>{featuredGroup}</h3>
              {featuredDescription.length > 0 ? <p>{featuredDescription}</p> : null}
              <label>
                <span>Enabled</span>
                <input type="checkbox" disabled checked readOnly />
              </label>
            </article>
          ) : null}

          <div
            className={`preview-settings-groups layout-${layoutStyle}`}
            style={{
              gridTemplateColumns: `repeat(${groupedColumns}, minmax(0, 1fr))`
            }}
          >
            {(layoutStyle === "spotlight" ? remainingGroups : groups).map((group, index) => {
              const descriptionIndex =
                layoutStyle === "spotlight" ? index : index;
              const detail =
                layoutStyle === "spotlight"
                  ? remainingDescriptions[index] ?? ""
                  : groupDescriptions[index] ?? "";

              return (
                <article
                  key={`${section.id}-group-${index}`}
                  className={`preview-settings-group preview-settings-group-${layoutStyle}${
                    isLoading ? " preview-card-loading" : ""
                  }`}
                >
                  <h3>{group}</h3>
                  {detail.length > 0 ? <p>{detail}</p> : null}
                  <label>
                    <span>{descriptionIndex % 2 === 0 ? "Enabled" : "Default"}</span>
                    <input
                      type="checkbox"
                      disabled
                      checked={descriptionIndex % 2 === 0}
                      readOnly
                    />
                  </label>
                </article>
              );
            })}
          </div>
        </div>

        {layoutStyle === "rail" && railItems.length > 0 ? (
          <aside className="preview-settings-rail">
            {railTitle.length > 0 ? <h3>{railTitle}</h3> : null}
            <ul>
              {railItems.map((item, index) => (
                <li key={`${section.id}-rail-${index}`}>{item}</li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function renderSection(
  section: SectionNode,
  stress: StressDocument,
  activeBreakpointLayout: ReturnType<typeof resolvePreviewLayout>
): ReactNode {
  switch (section.type) {
    case "hero":
      return renderHero(section, stress, activeBreakpointLayout);
    case "featureGrid":
      return renderFeatureGrid(section, stress, activeBreakpointLayout);
    case "form":
      return renderForm(section, stress, activeBreakpointLayout);
    case "list":
      return renderList(section, stress);
    case "table":
      return renderTable(section, stress, activeBreakpointLayout);
    case "settings":
      return renderSettings(section, stress, activeBreakpointLayout);
    default:
      return (
        <section className="preview-section" data-section-id={section.id}>
          {renderStateBanner(stress)}
          <h2>{section.type}</h2>
          <p>This section renderer is not implemented in v1 shell.</p>
        </section>
      );
  }
}

export function PlaygroundPreview({
  project,
  activeBreakpoint
}: PlaygroundPreviewProps): ReactNode {
  const layout = resolvePreviewLayout(project, activeBreakpoint);

  return (
    <div
      className="preview-root"
      data-breakpoint={layout.breakpoint}
      style={tokenCssVariables(project, activeBreakpoint)}
    >
      <div className="preview-page">
        {project.page.sections.map((section) => (
          <div key={section.id}>{renderSection(section, project.stress, layout)}</div>
        ))}
      </div>
    </div>
  );
}
