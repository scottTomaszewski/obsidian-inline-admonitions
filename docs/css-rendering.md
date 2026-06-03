# CSS generation & injection (the fragile part)

This is the highest-risk, least-obvious subsystem. Read before touching
`src/io/inlineAdmonitionCss.ts` or `src/io/snippets.ts`.

## How styling actually reaches the screen

Admonitions are **not** styled inline. Instead:

1. Each rule computes CSS classes via `cssClasses()` — e.g. a Prefix rule with trigger
   `IMPORTANT` → `["iad", "iad-prefix", "iad-prefix-IMPORTANT"]`. The render paths
   attach these classes to the matched element/decoration.
2. `main.refreshCss()` (called on load and on every save) writes a CSS rule for the
   **last** (most specific) class of each rule into a generated stylesheet, using
   `iad.simpleStyle()` for the declarations.
3. That stylesheet is loaded as an **Obsidian CSS snippet** so the classes resolve to
   real colors/fonts.

## Gotcha 1 — it writes a file into the user's vault

`src/io/inlineAdmonitionCss.ts` + `snippets.ts` write a generated file to
`<vault>/<configDir>/snippets/inlineAdmonitionsPluginReadOnly.css` and rewrite it on
every settings save. The file header warns users not to edit it. `snippets.ts` is
vendored (MIT) from
[obsidian-css-editor](https://github.com/Zachatoo/obsidian-css-editor).

## Gotcha 2 — it uses Obsidian's PRIVATE `customCss` API

To enable/reload the snippet, the code casts `App` to a local `CustomCssApp` interface
and calls `setCssEnabledStatus` / `readSnippets` / `requestLoadSnippets`. **None of
these are in Obsidian's public typings** — they can break on any Obsidian update.
Reference: a [Discord thread](https://discord.com/channels/686053708261228577/840286264964022302/1220596234545401906)
linked in the source. This is exactly what the `obsidianmd/no-unsupported-api` lint
rule warns against; it is knowingly accepted for now.

> This is the #1 item in [FOLLOWUPS.md](../FOLLOWUPS.md): replace the snippet-file +
> private-API approach with a managed `<style>` element or push styling through the
> CodeMirror decoration path so the editor extension and reading-mode post-processor
> are a single source of truth. Doing so would also drop the `@adobe/css-tools` npm
> dependency used to parse/stringify the snippet file.

> **Note:** the snippet file is parsed/stringified with **`@adobe/css-tools`** (`parse`
> / `stringify`, narrowing rules via `CssTypes.rule`). It used to be the `css` package,
> but that bundled `require("fs")`/`require("path")` via its source-map support, which
> tripped the community scanner's "direct filesystem access" check. `@adobe/css-tools`
> is a maintained, API-compatible fork with no source-map/`fs` dependency.

## Gotcha 3 — the doubled `.iad.<class>` selector for specificity

`_makeCssRuleString` emits `.iad.<className> { ... }` — the leading `.iad` is repeated
deliberately to raise CSS specificity so the rule wins over Obsidian's tag styling.
The base `.iad` style in the static `styles.css` intentionally **rides on Obsidian's
`--tag-*` CSS variables** (background, border, padding), so admonitions inherit
the theme's tag look. The author flagged both as cleanup-worthy
(`// I dont like it`) — they work, but are not the intended long-term design.

**Exception — corner radius is no longer inherited.** `simpleStyle()` (via
`borderCss()` in `utils.ts`) **always** emits a literal `border-radius: Npx`, so the
per-rule value overrides the base `var(--tag-radius)` whenever the background is shown.
`N` is the rule's `borderRadius` field: `0` = square, higher = rounder (default `4`).
This is deliberate — an earlier "`0` = inherit theme radius" sentinel made the settings
slider non-monotonic (`0` rounded, `1px` square), so the plugin now owns radius outright.

## Gotcha 4 — `hideBackground` produces different declarations

`simpleStyle()` branches: when `hideBackground` is set it emits
`background-color: transparent; border: none; padding: 0; border-radius: 0;` instead of
the colored background. Keep this in mind when changing the style string format.

## Gotcha 5 — the Live Preview `:has()` rule is deliberate (and why it can't be removed)

In Live Preview our mark decoration nests the `.iad` span **inside** Obsidian's
`.cm-inline-code` span (verified DOM: `.cm-inline-code > .iad`). The code span's own
background then leaks around the bubble, so `styles.css` neutralizes it with:

```css
.cm-s-obsidian .cm-inline-code:has(> .iad) { background-color: transparent; }
```

The community scanner flags **all** `:has()`, but this is the *cheap* variant — a
direct-child test scoped to `.cm-inline-code`, re-evaluated only when an inline-code
span's children change — not the broad ancestor `:has()` the perf guidance targets.

It was kept after the alternatives were shown not to work:

- **Flip the nesting so `.iad` is the parent**, then use `.iad > .cm-inline-code`. The
  nesting is set by CodeMirror decoration *rank*, and Obsidian forces `.cm-inline-code`
  to be the outer element regardless of our precedence — wrapping the `ViewPlugin` in
  `Prec.lowest`/`Prec.highest` does **not** flip it (confirmed in a live vault).
- **Tag the parent `.cm-inline-code` from JS** (add a class, drop the `:has`). CodeMirror's
  `DOMObserver` watches `attributes: true` on `contentDOM`, so the added class is treated
  as an external mutation and reverted/churned.

The real fix is the larger rework in [FOLLOWUPS.md](../FOLLOWUPS.md) #2 (push styling
through the decoration path so we stop fighting `.cm-inline-code`).
