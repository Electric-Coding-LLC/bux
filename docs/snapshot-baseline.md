# Snapshot Baseline Rules (v1)

This document locks the deterministic baseline for future `snapshot.png` export support.

## Goal
- Ensure snapshot output is reproducible across repeated runs for the same project input.
- Keep baseline strict enough for regression detection while still practical for local development.

## Capture Profile
- Browser engine: Playwright bundled Chromium.
- Viewport: `1440x900`.
- Device scale factor: `1`.
- Color scheme: `light`.
- Locale: `en-US`.
- Timezone: `UTC`.
- Output format: PNG, file name `snapshot.png`.

## Determinism Controls
- Disable CSS/transitions/animations before capture.
- Set `prefers-reduced-motion: reduce` at context creation.
- Freeze non-deterministic sources:
  - `Date.now()` and `new Date()` through seeded test clock injection.
  - `Math.random()` through a seeded deterministic generator.
- Seed value: `424242` (export metadata must persist this when snapshot is generated).
- Wait strategy:
  - render page
  - wait for fonts to load
  - wait for two animation frames
  - then capture

## Render Inputs
- Source model: canonical exported project documents (`tokens/page/constraints/summary`).
- Stress mode must be explicit and present in summary at capture time.
- Capture must not depend on window resize history or previous sessions.

## Environment Constraints
- Use the same Chromium channel and Playwright major version in CI and local scripts.
- Do not use OS-level font fallbacks for baseline comparison; bundle and reference project fonts when snapshot testing is enabled.
- Run with a fixed process locale (`LANG=en_US.UTF-8`) in CI.

## Validation Policy
- Functional gate (required): snapshot command exits successfully and writes `snapshot.png`.
- Determinism gate (when enabled): compare SHA-256 hash across two consecutive captures in a clean temp directory.

## Resolved Decisions (2026-03-02)
- `snapshot.png` stays opt-in in `writeExportBundle` and MCP `export.bundle` calls.
- Snapshot metadata is persisted to `snapshot.meta.json` and includes the capture seed/profile.
- Determinism enforcement compares repeated captures in the same CI environment (CI-baseline equality), not cross-machine hash parity.
