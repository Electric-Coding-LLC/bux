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
7. Harden the `settings` repair loop workbench flow. Completed on 2026-03-06.
   - Added explicit repair applicability state in `apps/playground` so findings now show actionable repairs, unavailable automated repairs, and stale/no-op repair states instead of silently omitting buttons.
   - Added lightweight in-memory repair history for the current active candidate, including score deltas, verdict transitions, and remaining finding counts after each applied repair.
   - Improved post-repair visibility in the critic panel so the latest repair outcome and recent repair sequence stay visible while the candidate remains active in the workbench.
   - Added playground-facing tests covering actionable repair application, non-actionable findings with no automated fix, and stale/no-op repair disablement.
8. Gate export on `settings` candidate approval. Completed on 2026-03-06.
   - Added explicit export-readiness evaluation in `apps/playground` that combines critic verdict and export validation state into a single approved-or-blocked decision for the active candidate.
   - Updated the project toolbar to show approval status, a concise approval summary, and concrete blocking reasons when the candidate is not ready to export.
   - Disabled export for candidates that have not cleared the critic bar or still fail export validation, and guarded the export action itself with the same rule.
   - Added tests covering clean approval, critic-only blocking, validation-only blocking, and combined blocking states.
9. Add export-readiness triage to generated `settings` candidates. Completed on 2026-03-06.
   - Extended generated candidate metadata in `apps/playground` so each ranked candidate now includes the same export-readiness decision used by the active workbench candidate.
   - Updated the candidate list to show export-ready versus blocked status directly in the ranked cards, along with concise blocking summaries before a candidate is loaded into the editor.
   - Adjusted load-button copy so the workbench clearly distinguishes approved candidates from candidates that still need repair work.
   - Added tests covering candidate-level export-readiness metadata, including the current mix of approved and blocked generated `settings` candidates.
10. Separate “best overall” from “best export-ready” in generated candidate triage. Completed on 2026-03-06.
   - Added explicit candidate lead summarization in `apps/playground` so the workbench can identify the top-ranked candidate independently from the strongest currently exportable candidate.
   - Updated the candidate list header and cards to show those lead roles directly, including per-card badges when a candidate leads one or both tracks.
   - Kept the existing score-based ranking intact so blocked but high-scoring candidates remain visible while no longer competing ambiguously with approved candidates.
   - Added tests covering best-overall selection, best-export-ready selection, and the fully blocked candidate case.
11. Show blocked-candidate repair gaps against the best export-ready reference. Completed on 2026-03-06.
   - Added explicit blocked-candidate gap summarization in `apps/playground` so the active candidate can be compared against the current strongest export-ready reference without manual card-by-card inspection.
   - Updated the critic panel to show a repair target card with the reference candidate, score gap, finding gap, and current blocking reasons whenever the active candidate is still blocked.
   - Kept the comparison lightweight and in-memory only, with no new persistence or ranking changes.
   - Added tests covering blocked-gap summaries, already-approved candidates, and the no-reference-available case.
12. Prioritize repairs that most directly close the export blocker gap. Completed on 2026-03-06.
   - Added explicit repair-targeting logic in `apps/playground` to rank actionable repairs by whether they clear export blocking outright, then by how much they close the current score and findings gap to the best export-ready reference.
   - Updated the critic panel to show a dedicated `Priority Repairs` section ahead of the raw findings list, giving the shortest repair path back to exportable state.
   - Kept the raw findings list intact so the full critic output is still visible after the targeted recommendations.
   - Added tests covering export-clearing repair priority, gap-closing priority, and the no-blocked-reference case.
13. Show whether applied repairs actually reduce the blocker gap. Completed on 2026-03-06.
   - Added blocked-gap progress summarization in `apps/playground` so a repair can be evaluated against the previously identified export-ready reference gap, not only against raw score deltas.
   - Updated repair application flow to compute the post-repair blocker gap immediately and store the resulting gap-progress summary in in-memory repair history.
   - Surfaced that gap-progress summary in the latest repair outcome and repair history UI so the workbench now shows whether a chosen repair actually moved the candidate toward exportable state.
   - Added tests covering full blocker-gap clearance, partial gap reduction, and repairs that do not reduce the current gap.
14. Promote repairs that make the candidate export-ready now. Completed on 2026-03-06.
   - Extended blocked-gap progress state in `apps/playground` to mark the exact case where a repair clears the blocker gap completely and leaves no remaining repair target.
   - Updated repair feedback in the playground to show an explicit `Export-ready now` state in the latest repair banner, repair history, and repair notice copy instead of relying on users to infer it from separate workbench panels.
   - Kept the rest of the repair history model and export gating intact.
   - Added tests covering the new explicit export-ready-now repair outcome state.
15. Shift the critic panel into approval mode after a successful repair. Completed on 2026-03-06.
   - Added explicit critic-panel state logic in `apps/playground` so approval-mode UI only appears when the latest repair actually completed the transition to export-ready state and blocker-specific guidance is gone.
   - Updated the critic panel to show an `Approved Candidate` card once a repair moves the candidate out of repair mode, making the handoff from repair to export explicit in the same panel.
   - Kept blocker-specific repair guidance hidden once approval-mode conditions are met.
   - Added tests covering when the critic panel should and should not switch into approval mode.
16. Consolidate overlapping repair and approval messaging in the critic panel. Completed on 2026-03-06.
   - Simplified the critic panel so the latest repair is shown once and the repair history now only shows earlier repairs instead of repeating the most recent outcome.
   - Removed the redundant generic `No findings` success state when the panel is already in explicit approval mode after a successful repair.
   - Kept the underlying repair and approval data intact while reducing panel duplication.
17. Show where the active workbench candidate stands against the generated field. Completed on 2026-03-06.
   - Added explicit workbench-standing triage in `apps/playground` so the active edited candidate is compared against both the best overall and best export-ready generated references.
   - Updated the candidate panel to surface that standing directly, including whether the current candidate is strongest overall, strongest export-ready, still blocked despite leading on score, or still chasing the field.
   - Kept generated candidate ranking unchanged while making the active-candidate handoff from repair to export clearer.
   - Added tests covering leading-approved, leading-but-blocked, strongest-export-ready, and no-export-ready-reference states.
18. Recommend the strongest export-ready candidate when the workbench trails. Completed on 2026-03-06.
   - Added explicit recommendation triage in `apps/playground` so the workbench can identify the strongest currently exportable generated candidate whenever the active candidate is blocked or is approved but not the best approved option.
   - Updated the candidate panel to show a focused recommendation card with the approved reference candidate and a direct load action instead of forcing users to infer the next step from ranked badges alone.
   - Kept generated ranking and export gating unchanged while making the handoff from candidate comparison to candidate adoption explicit.
   - Added tests covering blocked-candidate fallback recommendations, stronger-approved-candidate recommendations, and the already-best-approved case.
19. Show whether the active candidate still matches its blueprint baseline. Completed on 2026-03-06.
   - Added explicit active-blueprint status triage in `apps/playground` so the workbench can tell whether the current editor state still matches the loaded blueprint baseline or has drifted away under the current brief.
   - Updated the candidate panel to show an `Active Blueprint` status card that distinguishes unchanged approved baselines, unchanged blocked baselines, and customized/drifted candidates after edits.
   - Kept candidate ranking, recommendation logic, and export gating unchanged while making post-load editing state visible.
   - Added tests covering matching approved baselines, drifted blocked candidates, and customized candidates that improve past a blocked blueprint baseline.
20. Restore the loaded blueprint baseline after candidate drift. Completed on 2026-03-06.
   - Extended active-blueprint status triage in `apps/playground` so the workbench can explicitly tell when restoring the current blueprint baseline is a valid recovery action.
   - Updated the candidate panel to show a direct `Restore blueprint baseline` action whenever the active candidate has diverged from its loaded blueprint source.
   - Reused the existing candidate load flow so restoring the baseline also resets repair history and re-establishes the blueprint-backed editor state without changing ranking or export rules.
   - Added tests covering when baseline restore should and should not be offered from active-blueprint status.
21. Persist blueprint provenance across save and open. Completed on 2026-03-06.
   - Extended the playground workbench document in `apps/playground` so `brief.json` now persists the current active blueprint id alongside the structured settings brief.
   - Updated project open/save flow to restore that active blueprint provenance into app state, preserving baseline status and restore-baseline behavior after reload.
   - Included blueprint provenance in the project fingerprint so unsaved provenance changes are tracked consistently in the workbench.
   - Added tests covering provenance serialization, backward compatibility with older `brief.json` files, and fingerprint changes when provenance differs.
22. Add a baseline compare view for the active blueprint source. Completed on 2026-03-06.
   - Extended active-blueprint status triage in `apps/playground` with structured compare data so the workbench can show current-versus-baseline score, findings, and export status directly.
   - Updated the active blueprint panel to render a compact compare block under the status summary, keeping the decision to keep edits or restore baseline in the same surface.
   - Kept ranking, repair flow, and export gating unchanged while making baseline tradeoffs more legible.
   - Added tests covering compare values for matching baselines, regressed drift, and improvements over a blocked baseline.
23. Add first non-settings screen coverage with onboarding. Completed on 2026-03-06.
   - Extended the core brief model, schemas, blueprint library, and critic routing so the workbench can now handle both `settings` and `onboarding` screen types without forking the product loop.
   - Added 4 authored `onboarding` blueprints with deterministic page construction, plus onboarding-specific critic rules for intro placement, activation-surface presence, guidance density, CTA focus, and fragmented flow.
   - Updated `apps/playground` to switch screen types from the brief editor, generate and rank candidates for the active screen, persist either brief shape in `brief.json`, and keep export gating, repair application, and candidate triage working across both tracks.
   - Added tests covering onboarding blueprints, onboarding critic behavior, and onboarding candidate generation while keeping the existing settings suite intact.
24. Add marketing landing as the second expanded screen type. Completed on 2026-03-06.
   - Extended the shared brief model and workbench persistence again so `marketingLanding` now routes through the same multi-screen candidate, approval, and export loop as `settings` and `onboarding`.
   - Added 4 authored `marketingLanding` blueprints built from the existing hero, proof, and conversion section set, with densities for editorial, focused, and launch-oriented landing pages.
   - Added landing-page critic rules for primary-pitch placement, dashboard drift, fragmented narrative, missing proof, and weak conversion hierarchy, plus deterministic fixes for hero reorder, operational-surface removal, CTA simplification, and narrative trimming.
   - Added tests covering marketing blueprints, marketing critic behavior, marketing candidate generation, and `brief.json` round-tripping for the new brief shape.

## Working Method

- Keep decisions in repo docs, not only in chat.
- Work one chunk at a time.
- Update this roadmap after every completed chunk.
- Prefer shipping small vertical slices with tests over broad speculative refactors.
