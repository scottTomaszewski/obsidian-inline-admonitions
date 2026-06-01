# CLAUDE.md

Router for agents. Keep this tight; depth lives in the linked docs.

## What this is

**Inline Admonitions** — an Obsidian community plugin (`id: inline-admonitions`,
`minAppVersion: 1.1.0`, desktop+mobile). It restyles inline code spans whose text
matches a user-defined trigger (Prefix / Suffix / Contains / Regex) into colored
"callout" bubbles. TypeScript, bundled with esbuild.

This repo lives inside a demo vault at `…/inline-admonitions-demo/.obsidian/plugins/`,
but **the git repo root is this directory** (`obsidian-inline-admonitions/`).

## Where things live

- [ARCHITECTURE.md](ARCHITECTURE.md) — mental model, the two core data flows, full module map. **Read this first.**
- [docs/index.md](docs/index.md) — deep references & gotchas:
  - [docs/rendering-paths.md](docs/rendering-paths.md) — Reading mode vs Live Preview; `process()`/`applyTo()`; adding a trigger type.
  - [docs/css-rendering.md](docs/css-rendering.md) — generated CSS, vault snippet file, **private `customCss` API**, specificity hack.
- [README.md](README.md) — user-facing feature/usage docs (don't restate it).
- [CHANGELOG.md](CHANGELOG.md) — release history.
- [FOLLOWUPS.md](FOLLOWUPS.md) — deferred work & known issues (manual smoke test, CSS rework).
- [docs/handoffs/](docs/handoffs/) — ephemeral per-session handoffs (`creating-handoffs`).

## Commands

| Task | Command |
|------|---------|
| Install deps | `npm i` |
| Dev build + watch | `npm run dev` |
| Production build (type-check + bundle) | `npm run build` |
| Lint (`eslint-plugin-obsidianmd`) | `npm run lint` |
| Unit tests | `npm run test` (jest) |
| Release | `just release <version>` (bumps manifest+package, builds, commits, pushes, `gh release`) |

`just`/`gh`/`jq` come from devbox (`devbox.json`); `just release` reuses the host `gh`
token because devbox's bundled `gh` can't read the host keyring.

## Conventions & gotchas (don't get burned)

- **Two render paths, always both.** Every admonition implements `process()` (Reading
  mode) *and* `applyTo()` (Live Preview). Changing one without the other is the most
  common bug here. See [docs/rendering-paths.md](docs/rendering-paths.md).
- **Styling is via generated CSS classes**, injected through Obsidian's **private**
  `customCss` API + a file written into the vault's snippets dir. Fragile; see
  [docs/css-rendering.md](docs/css-rendering.md).
- **`main.js` and `data.json` are gitignored** — build output and Obsidian-written
  runtime settings, not source. `data.json` is also excluded from lint.
- Only `src/utils.ts` has unit tests; everything else is verified by build/lint and a
  manual in-vault smoke test (see [FOLLOWUPS.md](FOLLOWUPS.md) — **not yet done**).
  This repo *is* the installed plugin (it sits in the demo vault's plugins dir), so to
  smoke-test: `npm run dev` to rebuild `main.js`, then reload Obsidian (or toggle the
  plugin off/on) to pick up the new build.
- Follow Obsidian community standards (the `obsidian-plugin-development` skill): sentence-
  case UI text, `instanceof` over casts, Obsidian DOM helpers, `requestUrl` not `fetch`.

## Keeping these docs in sync (do this as part of "done")

- **New trigger type / persisted field** → update the module map in `ARCHITECTURE.md`
  and the "adding a trigger type" steps + migration note in `docs/rendering-paths.md`.
- **New deferred work or a punt** → add an entry to `FOLLOWUPS.md` (don't leave it only
  in code or your head).
- **New non-obvious workaround** → inline comment if local; a `docs/*.md` entry (and a
  row in `docs/index.md`) if cross-cutting.
- **New command / build step** → update the Commands table above.
- **User-facing behavior change** → `README.md` + `CHANGELOG.md`.
