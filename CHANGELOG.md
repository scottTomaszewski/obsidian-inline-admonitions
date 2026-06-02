# Changelog

## 1.12.0

- Maintenance: resolved community plugin-scan findings
  - Replaced the `css` dependency with `@adobe/css-tools` to drop a bundled
    `require("fs")` (the scanner's "direct filesystem access" flag); all file I/O still
    goes through the Obsidian vault API
  - Replaced the `builtin-modules` build dependency with Node's built-in
    `module.builtinModules` in the esbuild config

## 1.11.0

- Maintenance: brought the plugin up to current Obsidian community standards
  - Migrated to ESLint flat config with `eslint-plugin-obsidianmd` (`npm run lint`)
  - Type-safety cleanup (typed settings serialization; removed `any` usage)
  - Removed dead code and replaced direct DOM/style manipulation with Obsidian helpers and `styles.css`
  - Raised `minAppVersion` to `1.1.0` to match the APIs actually used
  - Housekeeping pass: removed the unused `getCssForClass` snippet helpers, enabled `esModuleInterop` (clears the ts-jest warning), excluded the generated `data.json` from linting, and verified the remaining ESLint carve-outs are still required
- Fix: Suffix "hide suffix text" no longer hides text when the suffix does not match in Live Preview
- See [FOLLOWUPS.md](FOLLOWUPS.md) for remaining work

## 1.10.0

- Adds support for hiding the background (including spacing)
- Shows the admonition trigger in the settings

## 1.9.0

- Adds font selection support

## 1.8.0

- Adds search/filter to the icon picker
- Improves icon centering in the icon picker

## 1.7.0

- Adds support for Regex Inline Admonitions

## 1.6.1

- Corrects an issue with a background color appearing on inline-admonitions in live preview

## 1.6.0

- Adds mobile support (beta)
  - I dont have an apple device to test on, so please let me know if it works or not
    - Does anyone actually read the changelog?

## 1.5.2

- Corrects hide-trigger rending bug in settings preview
- Corrects prefix icon rendering bug in settings preview

## 1.5.1

- Corrects opacity rendering bug in settings preview

## 1.5.0

- Adds support for Prefix Icons and Suffix Icons
- Corrects some rendering issues

## 1.4.6

- Attempts to fix Inline-Admonitions failing in Live Preview on first install

## 1.4.5 

- [BUGFIX] Correctly triggers inline admonitions in Live Preview

## 1.4.4

- [BUGFIX] Avoids crash when css file is missing on first startup

## 1.4.2

- [BUGFIX] Avoids css class names resolving to the same value

## 1.4.1

- Adds support for changing opacity of background and text colors
  - Note: there is a bit of a performance impact of this feature. Will address in a patch

Known Issues:

- Multiple non-alphanumeric trigger text inline admonitions are overloading themselves.
  - Update: fixed in 1.4.2

## 1.3.2 

- [BUGFIX] Correctly enables css on plugin load

## 1.3.1 

- Enables the custom css file, although there is a known issue with the css snippet being enabled, but not picked up

## 1.3.0

- Adds support for Live Preview
- [BUGFIX] Removes debug logging

## 1.2.0

- Adds support for hiding the trigger string for prefix and suffix types
- Overhauls settings and codebase to better support future features

## 1.1.4

- Initial Release!
