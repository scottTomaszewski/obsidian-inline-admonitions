# Follow-up Work

Remaining work after the May 2026 standards pass (ESLint flat-config migration,
type-safety cleanup, correctness fixes). Build, lint (`eslint-plugin-obsidianmd`),
type-check, and the jest suite all pass. The items below are intentionally
deferred or could not be verified in this pass.

## High priority

### 1. Manual in-vault smoke test (NOT done)

The standards pass verified that the code compiles, type-checks, lints clean, and
passes the unit tests — but the plugin was **not** loaded in a live Obsidian vault.
Nothing here confirms actual rendering behavior. Before any release, manually
verify in a real vault:

- All four trigger types render: Prefix, Suffix, Contains, Regex.
- Reading mode **and** Live Preview both apply styling.
- "Hide prefix text" / "Hide suffix text" toggles hide the trigger correctly.
  - Note: the Suffix `applyTo` hide-decoration was buggy (applied unconditionally)
    and was fixed in this pass — this path specifically needs eyes on it in Live
    Preview. See `src/InlineAdmonitions/suffixInlineAdmonition.ts`.
- Prefix/suffix icons appear in Reading mode.
- Background opacity, text opacity, hide-background, and font selection all apply.
- Settings preview sample updates live as you edit.

### 2. Rework the CSS-snippet architecture (deliberately left as-is)

This was scoped out of the standards pass ("leave it for now") but is the largest
piece of technical debt. Current approach in `src/io/inlineAdmonitionCss.ts`:

- Writes a generated CSS file into the vault's snippets directory
  (`<configDir>/snippets/inlineAdmonitionsPluginReadOnly.css`).
- Toggles and reloads it through Obsidian's **private** `app.customCss` API
  (`setCssEnabledStatus` / `readSnippets` / `requestLoadSnippets`). This API is not
  in the public typings; it is accessed via the `CustomCssApp` cast interface added
  in this pass. It can break on any Obsidian update.

Why it matters: relying on a private API plus writing files into the user's vault
is fragile and was flagged by the obsidianmd ruleset's intent (the `no-unsupported-api`
checks). A cleaner design would generate styles without the snippet file — e.g.
inject a managed `<style>` element's rules dynamically, or push per-admonition CSS
through the existing CodeMirror decoration path so the editor extension and the
reading-mode post-processor are the single source of truth. This would also remove
the `css` npm dependency used to parse/stringify the snippet file.

## Medium priority

### 3. Dead/unused public function

`getCssForClass` (and its helper `_getCssForClass`) in
`src/io/inlineAdmonitionCss.ts` are exported but never called anywhere in the
codebase. ESLint doesn't flag them because they're exported (assumed public API).
Confirm they're not intended as a public surface, then delete both — they only add
maintenance weight to the snippet code that item #2 wants to remove anyway.

### 4. Known Live Preview issues (pre-existing, carried over)

Documented in the README but unresolved:

- Newly created inline admonitions may not render in Live Preview until the app is
  reloaded.
- Prefix/suffix icons are intentionally **not** rendered in Live Preview because
  they caused cursor-navigation issues. If item #2 reworks rendering, revisit
  whether icons can be supported there.

## Low priority / housekeeping

### 5. ESLint config carve-outs to revisit

`eslint.config.mjs` disables a few rules with rationale comments. Revisit if the
underlying code changes:

- `@typescript-eslint/no-misused-promises` has `checksVoidReturn.arguments: false`
  so async Obsidian callbacks (`onClick`/`onChange`) don't get flagged. If those
  handlers are ever refactored, consider tightening this back.
- The `**/*.json` override disables four type-aware `obsidianmd/*` rules because
  JSON files have no type information under `projectService`. Harmless, but if the
  obsidianmd plugin gains JSON-aware handling this can be dropped.
- `depend/ban-dependencies` is off for `package.json` (the `builtin-modules` entry
  is a build-time esbuild external marker, not a runtime dep).

### 6. `minAppVersion` is now `1.1.0`

Bumped from `0.15.0` because the settings UI uses `ColorComponent` (1.0.0) and
`ButtonComponent.setIcon` / `.setTooltip` (1.1.0). If you ever need to support older
Obsidian, those API usages would have to be replaced. Otherwise leave as-is.

### 7. Tooling versions

`typescript` was bumped 4.7.4 → 5.4.x and ESLint to v9 (flat config). `ts-jest`
emits a warning suggesting `esModuleInterop: true` in `tsconfig.json` — harmless
today (tests pass), but worth setting if import-interop issues ever appear.
