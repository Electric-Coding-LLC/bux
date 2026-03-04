# UI System Playground - Initial Planning (v1)

## Document Purpose
Capture the initial product, architecture, and implementation plan so future contexts can align on the same goals and constraints.

## Product Intent
Build a local-first "UI System Playground" for rapidly iterating on layout, typography, spacing, and component fundamentals, with deterministic export for downstream code generation.

This is not a mockup tool. It is a constrained, system-level UI composer.

## Core Product Principles
- Real DOM preview only (no vector canvas).
- Responsive behavior must be authentic (flex/grid).
- Structured and versionable model (plain JSON files, no hidden DB).
- Constrained section composition (parametric sections, no freeform styling).
- Deterministic outputs suitable for machine consumption.
- Framework-agnostic model layer with target adapters.
- Cross-platform model semantics (web/desktop/mobile targets from same source model).

## v1 Goals
- Edit global design tokens and see instant propagation.
- Compose pages from a small library of section primitives.
- Stress test content and state without leaving the system.
- Export deterministic artifacts:
  - `tokens.json`
  - `page.json`
  - `constraints.json`
  - optional `snapshot.png`
  - machine-friendly summary (`summary.json`)

## v1 Non-Goals
- Pixel-perfect visual design tooling.
- Freeform element-level styling.
- Multi-user/cloud collaboration.
- Full production code generation (adapter groundwork only).

## Section Library (v1)
- `hero`
- `featureGrid`
- `form`
- `list`
- `table`
- `settings`

Each section is configured through constrained props and variants (not arbitrary CSS input).

## Stress Modes (v1)
- Copy length: `short` | `long`
- UI/data state: `default` | `empty` | `loading` | `error`
- Density: `comfortable` | `compact`

## Architecture

### 1) Core Model (framework-agnostic)
Responsibilities:
- Type definitions + JSON schemas for tokens/page/constraints/stress/summary
- Schema versioning support
- Stable ID rules
- Canonical serialization guarantees

Key rule:
- One source of truth model used by preview, validation, adapters, and export.

### 2) Core Engine
Responsibilities:
- Apply editing actions deterministically
- Resolve stress-mode fixtures from seeded generators
- Produce `ResolvedPageModel` for rendering and export

### 3) Section Kit
Responsibilities:
- Section registry and schemas
- Defaults, constraints, and validation
- Render contract input shape for preview/adapters

### 4) Preview Runtime
Responsibilities:
- Real DOM rendering with CSS variables + flex/grid
- Breakpoint-aware rendering from constraints model
- No business logic (render-only)

### 5) Editor Shell (local app)
Responsibilities:
- Token panel
- Section tree + section prop controls
- Stress toggles
- Validation/errors panel
- Local project file lifecycle (new/open/save/export)

### 6) Export Pipeline
Responsibilities:
- Deterministic export bundle generation
- Optional snapshot generation from fixed viewport + fixed seed
- Machine-friendly summary output

### 7) Adapter Layer
Responsibilities:
- Shared adapter contract:
  - `validate(model)`
  - `emitLayoutSpec(model)`
  - later: `emitCode(model)`
- Targets planned:
  - Next.js (React)
  - Webstir

Adapters must not mutate core model.

### 8) MCP Layer (planned, optional for v1)
MCP should wrap core engine/export functions (no duplicated logic).

Potential tool surface:
- `project.create/open/save`
- `tokens.get/set/reset`
- `page.sections.list/add/update/reorder/remove`
- `stress.set`
- `validate.run`
- `export.bundle`
- `adapter.emit`

## Recommended Tech Stack
- Runtime/tooling: Bun (package manager + scripts + workspace)
- Language: TypeScript
- Editor app: React + Vite (browser-first local app on localhost)
- Validation: Zod (authoring/types) + Ajv (JSON schema/runtime validation boundary)
- Snapshot: Playwright
- Optional desktop packaging later: Tauri

## App Form Factor
- v1: browser-first local app
- Storage: local files only (JSON model)
- Backend: none required for core workflow
- Desktop wrapper later when distribution/native FS workflow needs increase

## Cross-Platform Strategy
- The visual playground in v1 is a web renderer used for fast iteration.
- The domain model is platform-neutral and must avoid web-only primitives.
- Adapters map the same model to target runtime semantics.
- Web is a first target, not the only target.

### Model Rules for Platform Neutrality
- Prefer semantic layout primitives (`stack`, `grid`, `container`, `flow`) over raw CSS declarations.
- Prefer role-based tokens (`text.primary`, `surface.default`, `border.subtle`) over hardcoded color values in sections.
- Keep interaction/state semantics abstract (`loading`, `error`, `disabled`, `empty`) and let adapters map platform behavior.
- Keep typography as role + scale metadata, not platform-specific font APIs.
- Encode spacing/radii/sizing as token references, not inline numeric overrides per element.

### Target Adapters (planned)
- Web:
  - Next.js (React)
  - Webstir
- Desktop:
  - Electron/Tauri-hosted web UIs
  - potential native adapters later if needed
- Mobile:
  - React Native
  - SwiftUI
  - Jetpack Compose

### Capability Matrix (initial planning)
- Layout primitives:
  - Web: full support
  - Desktop web-shell: full support
  - Mobile native: mapped subset (adapter translation required)
- Typography roles/scales:
  - Web: full support
  - Desktop web-shell: full support
  - Mobile native: full support with platform font mapping
- Color roles/states:
  - Web: full support
  - Desktop web-shell: full support
  - Mobile native: full support
- Complex tables:
  - Web: full support
  - Desktop web-shell: full support
  - Mobile native: partial support (adapter-specific pattern conversion)
- Breakpoint constraints:
  - Web: full support
  - Desktop web-shell: full support
  - Mobile native: mapped to size classes/window metrics

### Cross-Platform Risk Controls
- Define and enforce a "portable core" subset in schema validation.
- Mark platform-specific section props as adapter extensions, not core model fields.
- Add adapter contract tests per target with known fixtures and expected degradations.
- Export capability report describing unsupported fields per target.

## Determinism Contract (must hold)
- Stable section IDs and ordering semantics
- Canonical JSON key ordering on export
- Seeded fixture/content generation for stress modes
- Fixed snapshot viewport + seed + rendering conditions
- Byte-identical output for identical model input

## Versioning & Migration
- Include `schemaVersion` in each exported model file
- Provide migration pipeline for loading older projects
- Keep migration test fixtures for backwards compatibility

## Quality Gates
- Schema validation passes for all exports
- Determinism tests (golden export fixtures)
- Adapter contract tests for each target
- Basic accessibility checks (semantics, heading order, states)
- Performance budget checks at defined section/density thresholds

## Repo Shape (planned)
- `apps/playground`
- `apps/mcp-server` (later)
- `packages/core-model`
- `packages/core-engine`
- `packages/section-kit`
- `packages/preview-runtime`
- `packages/exporter`
- `packages/adapter-contract`
- `packages/adapters-next`
- `packages/adapters-webstir`
- `docs/`

## Proposed Milestones
1. Core model + schemas + canonical serializer + fixtures
2. Preview runtime + token propagation
3. Section kit + editor controls
4. Stress modes + validation UX
5. Export pipeline + snapshot
6. Adapter contract + initial target adapters
7. Hardening (tests, docs, determinism CI)

## Open Decisions to Resolve Early
- Exact token depth (especially color role granularity) for v1
- Summary schema shape (`summary.json` fields)
- Initial presets included in v1
- When to introduce MCP transport (v1 vs post-v1)
- Scope of v1 "portable core" and first non-web adapter priority

## Resolved Decisions (2026-03-02)
- Snapshot baseline policy documented in `docs/snapshot-baseline.md`
- MCP tool contract documented in `docs/mcp-contract.md`
- Optional snapshot export implemented in `@bux/exporter` (`snapshot.png` + `snapshot.meta.json`)
- MCP wrapper implemented in `apps/mcp-server` over core engine/exporter/adapter packages

## Immediate Next Steps
1. Approve this planning baseline.
2. Draft JSON schemas for `tokens/page/constraints/summary`.
3. Scaffold Bun workspace + package boundaries.
4. Implement deterministic serializer + first golden tests.

## Pre-build Checklist
- Define a concrete v1 success demo and acceptance criteria.
- Define milestone-level "definition of done" (feature + tests + docs per milestone).
- Create ADR entries for major architecture/tooling decisions.
- Draft initial JSON schemas and a canonical sample project fixture.
- Lock deterministic export contract (IDs, key ordering, seed rules, snapshot settings).
- Define adapter capability and fallback policy per target platform.
- Define validation/error model and export-blocking behavior.
- Define schema migration policy and compatibility guarantees.
- Set non-functional budgets (preview performance, export time, max section complexity).
- Set accessibility baseline requirements for section primitives.
- Define local project file lifecycle and recovery behavior.
- Maintain an explicit "not in v1" scope guard list.
