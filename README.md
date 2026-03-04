# bux
A UX and UI design tool

## Planning
- [Initial planning doc](./docs/initial-planning.md)
- [Build checklist](./docs/build-checklist.md)
- [MCP contract (draft)](./docs/mcp-contract.md)
- [Snapshot baseline rules](./docs/snapshot-baseline.md)

## Local Development
- Install dependencies: `bun install`
- Run checks: `bun run check`
- Run determinism fixture diff check: `bun run check:determinism`
- Run snapshot determinism check: `bun run check:snapshot`
- Start playground: `bun run --cwd ./apps/playground dev`
- Start MCP wrapper server (stdio): `bun run --cwd ./apps/mcp-server start`
