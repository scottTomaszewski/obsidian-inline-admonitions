# The two rendering paths

Obsidian renders notes with two separate engines, and **every admonition must support
both**. If you add a feature to one path and forget the other, it will look correct in
one view and broken in the other — the most common class of bug in this plugin.

| | Reading mode | Live Preview |
|---|---|---|
| Engine | Rendered HTML (post-processor) | CodeMirror 6 editor |
| Entry | `InlineAdmonitionsPostProcessor.postProcess()` | `inlineAdmonitionPlugin` ViewPlugin (`InlineAdmonitionExtension.ts`) |
| Per-rule hook | `InlineAdmonition.process(codeElement)` | `InlineAdmonition.applyTo(node, content, builder)` |
| Match unit | every `<code>` element in the rendered DOM | every `inline-code` node in the CodeMirror syntax tree |
| How styling is applied | mutate the DOM: add classes, prepend/append icon spans, optionally `setText` to hide trigger | add CodeMirror `Decoration.mark` (a `class`-bearing `<span>`) over the range |

Both paths only attach **classes**; visible color/font comes from the generated CSS —
see [css-rendering.md](css-rendering.md).

## Adding a new trigger type

> First ask whether you need one at all — a "matches a pattern" requirement is usually
> just a **Regex** admonition, no new type. If you do need one, **copy the nearest
> existing subclass** (`containsInlineAdmonition.ts` for substring matching,
> `regexInlineAdmonition.ts` for pattern matching) as your template rather than writing
> from scratch; they already show the match-range + decoration mechanics. Read that file
> for the exact method signatures — this doc lists the contract, not the type details.

1. Subclass `InlineAdmonition` in `src/InlineAdmonitions/`.
2. Implement **both** `process()` and `applyTo()`, plus `cssClasses()`, `sampleText()`,
   `buildSettings()`, `asTitle()`, and static `create()`/`unmarshal()`.
3. Add the enum case in `inlineAdmonitionType.ts` (`enum`, `create`, `from`, `unmarshal`).
   Enum values are **string literals** (e.g. `"prefix"`) that must match the persisted
   `type` field in `data.json`.
4. If you add a persisted field, add it to `SerializedInlineAdmonition` **and** a new
   migration step in `inlineAdmonitionSettings.ts` (bump `version`).

## Known Live Preview limitations (intentional)

These are deliberate, not bugs to "fix" casually:

- **Prefix/suffix icons are not rendered in Live Preview.** They caused cursor-
  navigation issues in the editor, so `applyTo()` omits them while `process()` (reading
  mode) includes them. Revisit only if the CSS/rendering rework (see
  [FOLLOWUPS.md](../FOLLOWUPS.md)) changes the decoration strategy.
- **Newly created admonitions may not appear in Live Preview until the app reloads.**
  `updateEditorExtensions()` reconfigures open editors via a `Compartment`, but first-
  render-after-create has historically been flaky. Reload is the documented workaround.

## Hide-trigger text

`hideTriggerString` (Prefix/Suffix) hides the matched trigger:
- Reading mode: `process()` does `setText(text.replace(trigger, ""))`.
- Live Preview: `applyTo()` adds a second `iad-hidden` decoration over just the trigger
  range. The Suffix path's hide decoration was previously applied unconditionally (even
  on non-matches) and was fixed — it still wants a live-vault eyeball (see
  [FOLLOWUPS.md](../FOLLOWUPS.md)).
