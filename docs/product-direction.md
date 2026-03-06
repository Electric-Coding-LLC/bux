# Product Direction

## Current Reframe

`bux` is no longer just a model-driven UI playground.

The real product goal is a constrained system for producing strong, intentional UI directions without relying on prompt luck or repeated taste corrections in chat.

The problem to solve is not "how do we edit a page model faster."

The problem to solve is:

- generated UI often starts functional but clunky
- layouts accumulate redundant wrappers, repeated labels, filler chrome, and weak hierarchy
- getting to a tight professional result requires too much manual back-and-forth
- quality feels inconsistent because the taste bar is not encoded anywhere explicit

`bux` should encode that bar directly.

## Target Workflow

The target workflow is:

1. Define a screen brief.
2. Generate a small set of constrained candidates.
3. Run a critic against each candidate.
4. Reject or repair weak candidates.
5. Export only candidates that clear the bar.

This means the main product is a UI direction workbench, not a generic page editor.

## Product Principles

- Constrained composition over open-ended generation.
- Explicit design rules over vague taste prompting.
- Strong defaults over neutral defaults.
- Rejection of weak structure before human review.
- Deterministic artifacts and repeatable evaluation.
- Portable model underneath, opinionated taste layer on top.

## Anti-Principles

- Not a freeform mockup tool.
- Not a generic "AI make me a UI" prompt wrapper.
- Not a production code generator first.
- Not a canvas tool.
- Not a system that allows weak layouts to pass just because they are functional.

## What "Good" Must Mean In-System

The system should reward:

- clear focal hierarchy
- deliberate spacing rhythm
- intentional density
- authored section composition
- distinct semantic grouping
- strong CTA hierarchy

The system should punish:

- redundant containers
- duplicate labels and helper copy
- filler chrome
- repeated visual treatment without meaning
- weak grouping
- generic dashboard patterns
- over-segmentation

## Product Shape

The repo should evolve toward four major layers:

### 1. Portable model layer

Existing packages already cover most of this:

- `@bux/core-model`
- `@bux/core-engine`
- `@bux/preview-runtime`
- `@bux/exporter`

This layer stays stable and portable.

### 2. Blueprint layer

Curated screen blueprints define strong composition patterns for a given screen type.

This should live in a dedicated package such as `@bux/blueprint-library`.

### 3. Critic layer

A critic scores candidates, returns findings, and suggests structural repairs.

This should live across:

- `@bux/critic-core`
- `@bux/critic-rules`

### 4. Workbench app

The playground becomes the main workbench for:

- brief authoring
- candidate preview
- critic findings
- repair suggestions
- export of approved candidates

## First Narrow Product Bet

Start with one screen type:

- `settings`

Why:

- it exposes weak grouping and redundant UI quickly
- the heuristics are easier to define than broad marketing aesthetics
- it maps well to the existing model and preview runtime

## What Stays Useful From Current Work

The existing work is still valuable:

- structured model
- deterministic engine mutations
- export validation
- preview runtime
- file-based local workflow

That work becomes substrate for the higher-level taste system.

## Primary Success Metric

The product is succeeding when:

- generated candidates are consistently more intentional than raw chat output
- weak structure is flagged automatically before review
- the system can explain why a candidate is weak
- repairs are specific enough to improve the design without a long conversational loop

## Near-Term Goal

The next meaningful milestone is:

Build a critic for one screen type (`settings`) and make the workbench show a scored verdict against explicit rules.
