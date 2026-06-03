# Follow-up Work

In-scope tangents found while working — important to fix, but they'd derail the task
at hand. Add an entry here instead of chasing them now, and **clear these before
starting a new feature.** Brand-new features and larger planned efforts go in a
`ROADMAP.md`, not here.

Current items remain from the May 2026 standards pass (ESLint flat-config migration,
type-safety cleanup, correctness fixes) and a follow-up housekeeping pass (dead-code
removal, `esModuleInterop`, ESLint carve-out verification). Build, lint
(`eslint-plugin-obsidianmd`), type-check, and the jest suite all pass. The items
below are intentionally deferred or could not be verified in this pass.

## High priority

### 1. Rework the CSS-snippet architecture (deliberately left as-is)

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
the `@adobe/css-tools` npm dependency used to parse/stringify the snippet file. (The
parser was switched from `css` to `@adobe/css-tools` to drop a bundled `require("fs")`
that the community scanner flagged — see [docs/css-rendering.md](docs/css-rendering.md).)

## Medium priority

### 2. Known Live Preview issues (pre-existing, carried over)

Documented in the README but unresolved:

- Newly created inline admonitions may not render in Live Preview until the app is
  reloaded.
- Prefix/suffix icons are intentionally **not** rendered in Live Preview because
  they caused cursor-navigation issues. If item #1 reworks rendering, revisit
  whether icons can be supported there.
