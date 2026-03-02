# Build Checklist

Execution tracker for the first implementation cycle.

## Now
- [x] Scaffold Bun workspace (root config, workspace packages, app shell).
- [x] Define initial model schemas for `tokens`, `page`, `constraints`, and `summary`.
- [x] Add deterministic JSON serializer and export bundle writer.
- [x] Add canonical sample fixture and deterministic export tests.

## Next
- [x] Add schema validation runtime (Ajv) at export boundary.
- [x] Implement `core-engine` state transitions for token and section edits.
- [x] Create minimal playground app shell (tokens panel + preview pane).
- [x] Render first two sections (`hero`, `featureGrid`) from model.

## Later
- [x] Add full v1 section set (`form`, `list`, `table`, `settings`).
- [x] Add stress modes in preview and export metadata.
- [x] Add optional snapshot export with fixed viewport/seed.
- [x] Define adapter contract and stub Next.js/Webstir adapters.
- [x] Add MCP server wrapper over core-engine/exporter.

## Completed (Post-Next)
- [x] Add section-level semantic validation rules in `@bux/section-kit`.
- [x] Surface section validation issues in playground sidebar.
- [x] Enforce section semantic validation at exporter boundary.

## Hardening (Current Cycle)
- [x] Add CI gate for deterministic fixture export diff checks.
- [x] Write MCP wrapper contract doc for request/response and error semantics.
- [x] Lock snapshot baseline rules (viewport/seed/environment/wait strategy).
