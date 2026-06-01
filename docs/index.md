# docs/

Deep references and gotchas. One topic per file. Start at the root
[CLAUDE.md](../CLAUDE.md) router, then [ARCHITECTURE.md](../ARCHITECTURE.md) for the
mental model and module map.

| Doc | What's in it |
|-----|--------------|
| [rendering-paths.md](rendering-paths.md) | The two render engines (Reading mode vs Live Preview), the `process()`/`applyTo()` contract, how to add a trigger type, and intentional Live Preview limitations. |
| [css-rendering.md](css-rendering.md) | How styling reaches the screen: generated CSS classes, the vault snippet file, the **private `customCss` API**, the doubled-`.iad` specificity hack. The most fragile subsystem. |
| [handoffs/](handoffs/) | Ephemeral per-session handoffs (see `creating-handoffs`). Not architecture docs. |
