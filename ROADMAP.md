# Roadmap

New features and larger planned efforts for Inline Admonitions, tracked as numbered
`## N.` sections. Smaller in-scope tangents found mid-task go in
[FOLLOWUPS.md](FOLLOWUPS.md), not here — the two serve different lifespans.

Items are grouped loosely into four themes: **features**, **UX & polish**,
**ecosystem & reach**, and **robustness**. Mark a shipped item with
`**Status:** done`; completed items are pruned and renumbered on a periodic cleanup
pass.

Two cross-cutting dependencies to keep in mind: **icons in Live Preview** and parts of
**theme-aware colors** (item 10) ride on the CSS-architecture rework already tracked in
[FOLLOWUPS.md](FOLLOWUPS.md). Reference that work rather than re-listing it here.

<!-- Template — copy for each item, numbering sequentially:
## 1. Short title
**Status:** open
**Theme:** features | ux | ecosystem | robustness
What it is, why it matters, and a rough approach. Code blocks and links are fine. -->

## 1. Richer styling: borders, shape & text weight

**Status:** done
**Theme:** features

Add rounded corners, border color/width/style, and bold/italic/underline to the
styling options — the README's "Future work" already promises rounded corners. New
per-rule fields flow through the existing `simpleStyle()` / generated-CSS path
(`src/io/inlineAdmonitionCss.ts`) and the edit modal
(`src/settings/editInlineAdmonitionModal.ts`), with a settings migration for the new
fields.

## 2. Insert-admonition command & right-click menu

**Status:** open
**Theme:** features

A command-palette command and editor context-menu action that wraps the current
selection in an inline code span using a chosen rule's trigger, so users don't have to
memorize trigger text. New editor command registered in `main.ts` plus a rule-picker
suggester that lists existing admonitions.

## 3. Built-in preset library

**Status:** open
**Theme:** features

Ship a starter set (Important / Note / Warning / Tip / Bug) that users add with one
click instead of building each rule by hand. Presets are pre-filled
`SerializedInlineAdmonition` objects surfaced via an "Add from preset" entry in the
settings tab.

## 4. Per-admonition hover tooltip

**Status:** open
**Theme:** features

Optional hover text on a styled span — e.g. to explain what a trigger means. Applied
via `aria-label`/`title` in both render paths (`process()` for reading mode and
`applyTo()` for Live Preview), so behavior stays consistent across engines.

## 5. Enable/disable toggle per rule

**Status:** open
**Theme:** ux

A switch in the settings list to mute a rule without deleting it. Adds an `enabled`
field (with a settings migration); both render paths and CSS generation skip disabled
rules.

## 6. Rule ordering & match priority

**Status:** open
**Theme:** ux

Drag-to-reorder the rule list and make "which rule wins when several match the same
span" explicit and user-controlled. Today ordering is undefined `Map`-insertion order
and multi-match conflicts are unspecified; this makes both deterministic.

## 7. Search/filter the rules list

**Status:** open
**Theme:** ux

A filter box atop the settings tab to find a rule by trigger or type as the list grows.
Mirrors the search already implemented in the icon picker
(`src/settings/IconSelectionModal.ts`).

## 8. Rule grouping / labels

**Status:** open
**Theme:** ux

Optional grouping or labels so a large rule collection stays organized in settings.
Builds on item 6's reordering work and likely shares the same persisted ordering/group
metadata.

## 9. Import / export rule sets

**Status:** open
**Theme:** ecosystem

Export selected or all admonitions to JSON and re-import them, so users can share, back
up, and version configurations. Reuses the existing marshal/unmarshal IO in
`src/settings/inlineAdmonitionSettings.ts` (`InlineAdmonitionSettingsIO`).

## 10. Theme-aware colors

**Status:** open
**Theme:** ecosystem

Let a rule reference Obsidian theme CSS variables or define separate light/dark
variants, so admonitions look right in both modes instead of a single hardcoded hex.
Partly depends on the CSS-architecture rework tracked in
[FOLLOWUPS.md](FOLLOWUPS.md).

## 11. Localization (i18n) scaffolding

**Status:** open
**Theme:** ecosystem

Externalize UI strings so the community can contribute translations — table stakes for
broader reach. Establishes a string catalog the settings tab, modals, and pickers draw
from instead of inline literals.

## 12. Expand test coverage beyond `utils.ts`

**Status:** open
**Theme:** robustness

Add unit/integration tests for settings migration (`InlineAdmonitionSettingsIO`
v0→v4 chain) and trigger matching for all four types — only `src/utils.ts` is covered
today. This is the safety net the feature work above relies on.
