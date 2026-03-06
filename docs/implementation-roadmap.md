# Implementation Roadmap

This roadmap reflects the current product direction in `docs/product-direction.md`.

## Phase 1: Critic Foundation

Goal:
Add a design critic for one screen type and surface findings in the workbench.

### Scope

- Add brief and critic report types to `@bux/core-model`.
- Add `@bux/critic-core` for scoring and report aggregation.
- Add `@bux/critic-rules` for explicit heuristic checks.
- Add brief editing and critic findings UI to `apps/playground`.

### Acceptance Criteria

- A `settings` screen can be evaluated against a structured brief.
- The critic returns a score, verdict, and findings list.
- The playground displays those findings live.
- Tests cover the scoring pipeline and several rule failures.

### Out of Scope

- multi-candidate generation
- repair actions
- additional screen types
- adapter/code generation work

## Phase 2: Blueprint Library

Goal:
Replace neutral section drafting with authored, opinionated screen blueprints.

### Scope

- Add `@bux/blueprint-library`.
- Author 5 `settings` blueprints.
- Define blueprint metadata:
  - hierarchy intent
  - density envelope
  - CTA strategy
  - allowed sections and variants
  - anti-pattern notes

### Acceptance Criteria

- The workbench can create a candidate from a chosen blueprint.
- Generated candidates are materially different in structure and hierarchy.
- Blueprints are deterministic and test-covered.

## Phase 3: Candidate Generation

Goal:
Generate multiple constrained candidates from one brief and compare them.

### Scope

- Produce 2 to 4 candidates for the same `settings` brief.
- Score each candidate with the critic.
- Sort and surface the strongest candidate first.

### Acceptance Criteria

- The workbench shows multiple candidates side by side or as a ranked list.
- Each candidate includes rationale and critic output.
- Weak candidates are visibly rejected.

## Phase 4: Repair Loop

Goal:
Suggest concrete structural fixes for critic findings.

### Scope

- Add structured repair suggestions.
- Attach repair actions to high-value findings.
- Apply repairs through deterministic engine actions.

### Acceptance Criteria

- At least 3 to 5 common failures have one-click repair suggestions.
- Repair suggestions update the candidate and rerun the critic.
- The workbench shows score deltas after a repair.

## Phase 5: Expand Screen Coverage

Goal:
Prove the system generalizes beyond `settings`.

### Candidate next screen types

- `marketingLanding`
- `dashboard`
- `onboarding`

### Rule for expansion

Do not add a second screen type until:

- the first screen type has useful critic coverage
- blueprints feel authored rather than generic
- the repair loop produces meaningful score improvements

## Current Chunk Order

1. Add critic model types and critic packages. Completed on 2026-03-05.
2. Implement first `settings` rules and score aggregation. Completed on 2026-03-05.
3. Add brief editor and critic panel to the playground. Completed on 2026-03-06.
   - Added a structured `settings` brief editor in `apps/playground`.
   - Wired live `evaluateSettingsScreen()` scoring into the current playground candidate.
   - Added a live critic panel showing score, verdict, and findings.
   - Persisted the active brief as `brief.json` alongside the existing portable project bundle.
   - Seeded the playground with a settings-focused starter candidate while keeping section editing explicit.
4. Add 5 authored `settings` blueprints. Completed on 2026-03-06.
   - Added `@bux/blueprint-library` with 5 deterministic `settings` blueprints and explicit metadata.
   - Replaced the neutral settings starter with a blueprint-backed starter candidate.
   - Added blueprint selection and apply flow to `apps/playground`.
   - Extended the settings preview renderer so blueprint hierarchy differences are visible in the workbench.
   - Added test coverage for blueprint validity, determinism, and critic outcomes.
5. Generate multiple candidates from one brief. Completed on 2026-03-06.
   - Added deterministic candidate generation from the current brief plus blueprint library.
   - Ranked generated `settings` candidates by critic output and surfaced them as a live list in `apps/playground`.
   - Allowed loading any ranked candidate into the editor while keeping generated candidates ephemeral and out of the portable project model.
   - Added tests covering candidate determinism, density-aware blueprint selection, and ranking behavior.
6. Add repair suggestions for top critic findings. Completed on 2026-03-06.
   - Added structured suggested fixes to critic findings in the shared critic report model.
   - Attached one-click deterministic repairs for high-value `settings` failures:
     move settings to the top, merge fragmented settings panels, remove decorative drift,
     normalize mixed variants, and restore missing semantic grouping.
   - Wired repair application into `apps/playground` and reran the critic immediately after each repair.
   - Added score delta feedback in the workbench so repair impact is visible.
   - Added tests covering fix attachment, deterministic repair actions, and post-repair score improvement.

## Working Method

- Keep decisions in repo docs, not only in chat.
- Work one chunk at a time.
- Update this roadmap after every completed chunk.
- Prefer shipping small vertical slices with tests over broad speculative refactors.
