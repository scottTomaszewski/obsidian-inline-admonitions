# Architecture

The "don't re-scan the tree" orientation doc. Read this before diving into `src/`.

## Mental model

An **Inline Admonition** is a user-defined rule that restyles an Obsidian
[inline code span](https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax#Inline+code)
when its text matches a trigger. There are four trigger types — **Prefix**,
**Suffix**, **Contains**, **Regex** — each a subclass of the abstract
`InlineAdmonition`. A rule carries styling (background/text color + opacity, font,
hide-background, border color/width/style, corner radius, bold/italic/underline,
prefix/suffix icon) plus its trigger-specific fields. The shared styling fields are
passed to constructors as a single `SharedAdmonitionFields` object
(`defaultSharedFields()` / `sharedFieldsFromData()` build it).

Obsidian renders notes in two completely separate engines, so every admonition must
know how to style itself **twice** — once for each engine. That duality is the single
most important thing to understand here; see [docs/rendering-paths.md](docs/rendering-paths.md).

1. **Reading mode** — Obsidian hands us finished HTML; we add CSS classes / mutate the
   DOM via `InlineAdmonition.process(codeElement)`.
2. **Live Preview** — a CodeMirror 6 editor; we add decorations via
   `InlineAdmonition.applyTo(node, content, builder)`.

The actual colors/fonts are **not** applied inline. Each admonition gets a generated
CSS class (`iad iad-prefix iad-prefix-<sanitized-trigger>`), and the plugin writes a
CSS file with rules for those classes. How that CSS gets injected is the funkiest part
of the codebase — see [docs/css-rendering.md](docs/css-rendering.md).

## Core data flow 1 — load & render

```
data.json (per-slug serialized rules)
  → main.loadSettings()
      → InlineAdmonitionSettingsIO.unmarshalAndMigrate()   # v0→v4 migration chain
          → Map<slug, InlineAdmonition>  (settings.inlineAdmonitions)
      → main.refreshCss()                                   # writes the CSS snippet file
  → onload registers BOTH render paths:
      → registerMarkdownPostProcessor → InlineAdmonitionsPostProcessor (reading mode)
      → registerEditorExtension       → inlineAdmonitionPlugin (Live Preview, CodeMirror)
```

When a note renders, each path walks every inline-code element/node and asks each
admonition to style matches. Visible color comes from the generated CSS classes.

## Core data flow 2 — edit a rule in settings

```
Settings tab (InlineAdmonitionSettingTab)
  → "Create new" / "Edit"  → EditInlineAdmonitionModal
      → user picks type + styling (IconSelectionModal / FontSelectionModal)
  → settings.inlineAdmonitions.set(slug, rule)
  → main.saveSettings()
      → saveData(marshal(settings))   # back to data.json, keyed by slug
      → refreshCss()                  # regenerate the snippet file
      → rerenderMarkdownViews()       # force reading-mode re-render
      → updateEditorExtensions()      # Compartment.reconfigure() → live editors pick up new rules
```

`updateEditorExtensions` uses a CodeMirror `Compartment` so already-open editors get
the new rule set without reloading the app.

## Module map

| Path | Responsibility |
|------|----------------|
| `main.ts` | Plugin entry. Lifecycle, wires both render paths + settings tab, owns `loadSettings`/`saveSettings`/`refreshCss`. |
| `src/InlineAdmonitions/inlineAdmonition.ts` | Abstract base class + `SerializedInlineAdmonition` (the data.json shape). Defines `process()`/`applyTo()` contract, `cssClasses()`, `simpleStyle()`. |
| `src/InlineAdmonitions/inlineAdmonitionType.ts` | `InlineAdmonitionType` enum + namespace: factory (`create`), `unmarshal` dispatch, type tooltip. |
| `src/InlineAdmonitions/{prefix,suffix,contains,regex}InlineAdmonition.ts` | The four trigger types. Each implements `process()` (reading mode) **and** `applyTo()` (Live Preview), plus its settings UI. |
| `src/InlineAdmonitions/inlineAdmonitionsPostProcessor.ts` | Reading-mode post-processor: finds `code` elements, calls `process()` on each rule. |
| `src/InlineAdmonitions/InlineAdmonitionExtension.ts` | Live Preview CodeMirror `ViewPlugin`: iterates the syntax tree for `inline-code` nodes, calls `applyTo()`. |
| `src/settings/inlineAdmonitionSettings.ts` | Settings shape + `InlineAdmonitionSettingsIO` marshal/unmarshal + the v0→v4 migration chain. |
| `src/settings/inlineAdmonitionSettingTab.ts` | The settings screen (list of rules with live samples, create/edit/delete). |
| `src/settings/editInlineAdmonitionModal.ts` | Create/edit modal; swaps in per-type settings + live sample preview. |
| `src/settings/{Icon,Font}SelectionModal.ts` | Icon picker (Obsidian Lucide icons) and system-font picker. |
| `src/io/inlineAdmonitionCss.ts` | Generates per-class CSS and injects it via Obsidian's **private** `customCss` API. The fragile part — see [docs/css-rendering.md](docs/css-rendering.md). |
| `src/io/snippets.ts` | Vault snippet-file helpers (read/write/exists). Vendored from obsidian-css-editor (MIT). |
| `src/utils.ts` | `sanitizeClassName`/`encodeChar` (trigger text → valid CSS class), hex+opacity helpers. The only unit-tested module. |
| `tests/` | Jest. `utils.test.ts` + settings-migration fixtures in `tests/resources/`. |

## Build & runtime artifacts (not source)

- `main.js` — esbuild bundle output. Gitignored; uploaded to GitHub releases instead.
- `data.json` — settings written by Obsidian at runtime. Gitignored; excluded from lint.
- `styles.css` — static plugin CSS (the `.iad` base style rides on Obsidian's
  `--tag-*` variables). Distinct from the *generated* per-rule CSS snippet.
