# Critic Rules V1

This document defines the first explicit design checks for the critic system.

The goal is not to perfectly measure beauty.

The goal is to catch common structural failures that make generated UI feel clunky, redundant, or generic.

## Initial Screen Type

- `settings`

## Rule Format

Each rule should eventually map to:

- `code`
- `severity`
- `message`
- `path`
- optional `suggestedFix`

## Initial Rules

### 1. Redundant Surface Nesting

Fail when a settings screen nests multiple visual surfaces without adding meaningful grouping.

Examples:

- panel inside panel inside panel
- card wrapper around a single control group with no distinct purpose

### 2. Weak Primary Focus

Fail when the screen has no clear focal area or presents multiple equally weighted primary regions.

Examples:

- equally emphasized groups stacked without a dominant anchor
- top-of-screen area with no clear first read

### 3. CTA Hierarchy Mismatch

Fail when the primary action is visually indistinct from secondary actions or when multiple actions compete as primary.

Examples:

- multiple filled primary buttons in one section
- destructive actions styled like primary success actions

### 4. Over-Segmented Groups

Fail when settings are split into too many shallow groups, creating unnecessary cognitive overhead.

Examples:

- many one-item groups
- dividers between nearly every row

### 5. Redundant Labels Or Helper Copy

Fail when headings, labels, descriptions, or helper text repeat the same information.

Examples:

- section title and body saying the same thing
- row label repeated directly in helper text

### 6. Decorative Chrome Without Meaning

Fail when borders, cards, shadows, or icon containers appear without conveying hierarchy or semantics.

Examples:

- every row in its own boxed card
- accent badges on neutral content with no meaning

### 7. Weak Vertical Rhythm

Fail when spacing does not clearly separate major groups from minor elements.

Examples:

- same spacing between sections and rows
- dense controls with oversized decorative gaps

### 8. Density Mismatch

Fail when the selected brief asks for a compact or calm screen but the visible structure contradicts it.

Examples:

- brief says compact, layout uses oversized grouped cards
- brief says calm, layout shows a dense wall of controls

### 9. Table Misuse

Fail when a table layout is used for settings content that would be clearer as grouped controls.

Examples:

- tiny settings list forced into grid rows/columns
- table headers that add no real scanning value

### 10. Variant Drift

Fail when the selected variants produce visual inconsistency or fight the intended blueprint hierarchy.

Examples:

- mixed variants that feel like unrelated design systems
- a feature-heavy panel inserted into a minimal settings flow

### 11. Accent Overuse

Fail when accent color appears on too many competing elements.

Examples:

- multiple highlighted groups
- accent badges, accent borders, and accent buttons all competing

### 12. Missing Semantic Grouping

Fail when related controls are not visually or structurally grouped.

Examples:

- destructive actions mixed into neutral preference lists
- account/security settings mixed with presentation preferences

## V1 Notes

- Start with heuristic scoring, not ML.
- Prefer explicit false-positive-prone checks over vague "looks good" claims.
- A useful critic that occasionally over-flags is better than a weak critic that rubber-stamps mediocre work.
- Repair suggestions should be added only after the rules prove useful.
