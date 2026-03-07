# MCP Wrapper Contract (v1)

This document defines the contract for `apps/mcp-server` before implementation.

## Scope
- Wrap existing package logic from `@bux/core-engine`, `@bux/direction-engine`, `@bux/exporter`, and adapters.
- Do not duplicate core mutation, validation, or export logic in the server.
- Keep all responses deterministic for identical input.

## Transport
- Protocol: MCP tool calls over stdio transport.
- Payload format: JSON objects only (no binary payloads).
- Version marker: each response includes `contractVersion: "1.0.0"`.

## Common Types
- `Project`: `PlaygroundProject` from `@bux/core-model`.
- `ValidationIssue`: exporter issue shape from `@bux/exporter`.
- `AdapterTarget`: `"nextjs"` | `"webstir"`.
- `AdapterValidationIssue` / `AdapterLayoutSpec`: from `@bux/adapter-contract`.

## Tool Surface

### `project.open`
Input:
- `rootPath: string`

Output:
- `project: Project`

Behavior:
- Loads `tokens.json`, `page.json`, `constraints.json`, `summary.json` from `rootPath`.
- Normalizes legacy files that omit `schemaVersion` (and missing `summary.stress`) to current v1 shape in-memory before validation.
- Rejects explicit unsupported schema versions.
- Fails if any required file is missing or invalid.

### `project.save`
Input:
- `rootPath: string`
- `project: Project`

Output:
- `savedFiles: string[]`

Behavior:
- Validates with exporter boundary validation first.
- Writes canonical JSON for all required documents.

### `project.create`
Input:
- `rootPath: string`
- `overwrite?: boolean` (default `false`)

Output:
- `project: Project`
- `savedFiles: string[]`

Behavior:
- Starts from canonical fixture in `@bux/core-model`.
- Refuses to overwrite existing project files unless `overwrite` is `true`.

### `tokens.set`
Input:
- `project: Project`
- `path: string[]`
- `value: unknown`
- `generatedAt?: string`

Output:
- `project: Project`

Behavior:
- Applies `setTokenValue` via `applyAction`.
- Rebuilds summary with deterministic timestamp behavior from core engine.

### `page.sections.add`
Input:
- `project: Project`
- `section: Omit<SectionNode, "id"> & { id?: string }`
- `index?: number`
- `generatedAt?: string`

Output:
- `project: Project`

Behavior:
- Uses core engine `addSection` action for ID generation and ordering.

### `page.sections.update`
Input:
- `project: Project`
- `sectionId: string`
- `changes: { variant?: string; props?: Record<string, unknown>; slots?: Record<string, unknown> }`
- `generatedAt?: string`

Output:
- `project: Project`

### `page.sections.reorder`
Input:
- `project: Project`
- `sectionId: string`
- `toIndex: number`
- `generatedAt?: string`

Output:
- `project: Project`

### `page.sections.remove`
Input:
- `project: Project`
- `sectionId: string`
- `generatedAt?: string`

Output:
- `project: Project`

### `stress.set`
Input:
- `project: Project`
- `mode: "copyMode" | "stateMode" | "densityMode"`
- `value: "short" | "long" | "default" | "empty" | "loading" | "error" | "comfortable" | "compact"`
- `generatedAt?: string`

Output:
- `project: Project`

### `validate.run`
Input:
- `project: Project`

Output:
- `issues: ValidationIssue[]`
- `ok: boolean`

Behavior:
- Uses `collectValidationIssues` from exporter package.
- `ok` is `true` when `issues.length === 0`.

### `export.bundle`
Input:
- `project: Project`
- `outputDirectory?: string`
- `snapshot?: boolean` (default `false`)

Output:
- `files: { "tokens.json": string; "page.json": string; "constraints.json": string; "summary.json": string }`
- `writtenTo?: string`
- `snapshot?: { filePath: string; metadataPath: string; metadata: object }`

Behavior:
- Uses `createExportBundleFiles` for in-memory exports.
- If `outputDirectory` is provided, also calls `writeExportBundle`.
- If `snapshot` is `true`, `outputDirectory` is required and snapshot artifacts are written (`snapshot.png`, `snapshot.meta.json`).

### `adapter.emit`
Input:
- `project: Project`
- `target: AdapterTarget`
- `generatedAt?: string`

Output:
- `validationIssues: AdapterValidationIssue[]`
- `layoutSpec: AdapterLayoutSpec`

Behavior:
- Runs adapter `validate` before emitting layout spec.

### `direction.generate`
Input:
- `brief: { screenType: "dashboard"; title: string; density: "executive" | "operational" | "focused"; artDirection: "quietSignal" | "commandCenter" | "editorialPulse"; schemaVersion?: string }`
- `project?: Project`
- `maxCandidates?: number` (default `4`)

Output:
- `brief: object`
- `referencePack: { profile: string; profileLabel: string; title: string; summary: string; references: Array<{ id: string; label: string; summary: string; signals: string[] }> }`
- `candidates: Array<{ rank: number; blueprint: { id: string; screenType: string; name: string; description: string; hierarchyIntent: string; densityEnvelope: string[]; ctaStrategy: string; allowedVariants: string[]; antiPatternNotes: string[]; artDirectionProfiles?: string[] }; project: Project; report: CriticReport; exportReadiness: object; visualCompare: object | null }>`

Behavior:
- Dashboard-only in v1.
- Uses `@bux/direction-engine` to generate ranked candidates from the supplied brief.
- Falls back to the canonical project fixture when `project` is omitted.
- Returns JSON-safe blueprint metadata only; internal blueprint functions are not exposed through MCP.
- Includes the active dashboard reference pack and a per-candidate visual-fit summary alongside critic/export status.

## Error Model
- Structured error shape:
  - `code: string`
  - `message: string`
  - `details?: unknown`
- Reserved codes:
  - `INVALID_INPUT`
  - `NOT_FOUND`
  - `VALIDATION_FAILED`
  - `IO_ERROR`
  - `INTERNAL_ERROR`

When exporter validation fails:
- Return `code: "VALIDATION_FAILED"` and include the full issues list in `details`.

## Determinism Rules
- All model mutations must route through `applyAction` or `applyActions`.
- Exports must use `canonicalJSONStringify`.
- Any timestamp field must be caller-provided (`generatedAt`) to guarantee byte-identical replay.
- Server must never mutate input objects in place; always return new project values.

## Out Of Scope (v1)
- Networked collaboration.
- Authentication/authorization.
- Long-lived background state beyond explicit tool inputs.
