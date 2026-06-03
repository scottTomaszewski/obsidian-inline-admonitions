# Richer Styling: Borders, Shape & Text Weight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-rule border (color/width/style), rounded corners, and bold/italic/underline text styling to Inline Admonitions, flowing through the generated-CSS path, the edit modal, and a v4→v5 settings migration.

**Architecture:** Seven new fields are added to the shared `InlineAdmonition` base. Because the four trigger subclasses currently pass ~11 shared fields *positionally* through `create()`/`unmarshal()`/constructor, this plan first refactors those shared fields into a single `SharedAdmonitionFields` options object (with `defaultSharedFields()` / `sharedFieldsFromData()` helpers) so adding fields is a one-line change per subclass. The actual CSS-string generation lives in two pure, unit-tested helpers in `src/utils.ts` (mirroring `appendOpacityToHexColor`), called from `InlineAdmonition.simpleStyle()`.

**Tech Stack:** TypeScript, esbuild, Jest (ts-jest, node env), Obsidian plugin API.

**Key constraint discovered during planning:** the `obsidian` npm package ships **types only** (`package.json` `"main": ""`). Any module that imports values from `obsidian` (e.g. `Setting`, `setIcon`) cannot be loaded in the Jest node environment — this is why only `src/utils.ts` is unit-tested today. Therefore: the pure CSS helpers go in `utils.ts` and get real TDD; migration is verified via a new `tests/resources` fixture pair + manual in-vault smoke test (the repo's existing convention, see `tests/resources/README.md`); `simpleStyle()` and the modal are verified by build/lint + smoke test.

**Design decisions (locked):**
- Field set (7): `borderColor` (hex), `borderWidth` (px number), `borderStyle` (string), `borderRadius` (px number), `bold`/`italic`/`underline` (boolean).
- `borderStyle` values: `""` = "Default (theme)" → emit **no** border declaration (inherit base `.iad` border); `"none"` → `border: none`; `"solid"`/`"dashed"`/`"dotted"` → full border. Default for new/migrated rules: `""`.
- `borderRadius`: `0` means "theme default" → emit **no** `border-radius` (inherits `var(--tag-radius)`); `>0` → `border-radius: Npx`. An explicit square (0px) corner is intentionally not expressible; this is documented.
- Border + radius apply only when the background is shown. When `hideBackground` is on, the existing `border: none; border-radius: 0` reset wins (blend-inline behavior is preserved). **Text** styles (bold/italic/underline) apply regardless of `hideBackground`.
- Migration v4→v5 backfills all seven fields with the defaults above.

---

## File structure

| File | Change |
|------|--------|
| `src/utils.ts` | **Add** two pure functions: `borderCss(...)`, `textStyleCss(...)`. |
| `tests/utils.test.ts` | **Add** `describe` blocks covering the two new helpers. |
| `src/InlineAdmonitions/inlineAdmonition.ts` | **Add** 7 instance fields, 7 fields to `SerializedInlineAdmonition`, new `SharedAdmonitionFields` interface + `defaultSharedFields()`/`sharedFieldsFromData()` helpers, refactor base constructor to take `SharedAdmonitionFields`, extend `copySettingsTo`, wire `simpleStyle()` to the new helpers. |
| `src/InlineAdmonitions/prefixInlineAdmonition.ts` | Refactor `create()`/`unmarshal()`/constructor to the options-object form. |
| `src/InlineAdmonitions/suffixInlineAdmonition.ts` | Same refactor. |
| `src/InlineAdmonitions/containsInlineAdmonition.ts` | Same refactor. |
| `src/InlineAdmonitions/regexInlineAdmonition.ts` | Same refactor. |
| `src/settings/inlineAdmonitionSettings.ts` | **Add** v4→v5 migration block. |
| `tests/resources/settings_v4.json` | **New** fixture (a v4 `data.json` sample). |
| `tests/resources/migrated_settings_v4_to_v5.json` | **New** fixture (expected v5 output). |
| `src/settings/editInlineAdmonitionModal.ts` | **Add** 7 settings controls (border style/width/color, corner radius, bold/italic/underline). |
| `README.md`, `CHANGELOG.md`, `ARCHITECTURE.md`, `docs/rendering-paths.md` | Doc updates ("done" criteria from `CLAUDE.md`). |

---

## Task 1: Pure CSS helper functions (TDD)

**Files:**
- Modify: `src/utils.ts`
- Test: `tests/utils.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/utils.test.ts`. Also update the existing import line at the top of the file to include the two new functions:

```typescript
// Change the first line of tests/utils.test.ts from:
//   import {appendOpacityToHexColor, convertAlphaToHex, encodeChar, sanitizeClassName} from "../src/utils";
// to:
import {appendOpacityToHexColor, borderCss, convertAlphaToHex, encodeChar, sanitizeClassName, textStyleCss} from "../src/utils";
```

```typescript
describe('testing borderCss', () => {
	test('default (theme) style emits no border', () => {
		expect(borderCss("", 1, "#000000", 0)).toBe("");
	});
	test('none style emits border: none', () => {
		expect(borderCss("none", 1, "#000000", 0)).toBe(" border: none;");
	});
	test('solid style emits full border', () => {
		expect(borderCss("solid", 2, "#ff0000", 0)).toBe(" border: 2px solid #ff0000;");
	});
	test('dashed style with radius emits border and radius', () => {
		expect(borderCss("dashed", 1, "#000000", 5)).toBe(" border: 1px dashed #000000; border-radius: 5px;");
	});
	test('radius alone (default border) emits only radius', () => {
		expect(borderCss("", 0, "#000000", 8)).toBe(" border-radius: 8px;");
	});
	test('zero radius emits no radius', () => {
		expect(borderCss("dotted", 3, "#123456", 0)).toBe(" border: 3px dotted #123456;");
	});
});

describe('testing textStyleCss', () => {
	test('all false emits nothing', () => {
		expect(textStyleCss(false, false, false)).toBe("");
	});
	test('bold only', () => {
		expect(textStyleCss(true, false, false)).toBe(" font-weight: bold;");
	});
	test('italic only', () => {
		expect(textStyleCss(false, true, false)).toBe(" font-style: italic;");
	});
	test('underline only', () => {
		expect(textStyleCss(false, false, true)).toBe(" text-decoration: underline;");
	});
	test('all three combine in order', () => {
		expect(textStyleCss(true, true, true)).toBe(" font-weight: bold; font-style: italic; text-decoration: underline;");
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — `borderCss`/`textStyleCss` are not exported (TypeScript/Jest error: no exported member).

- [ ] **Step 3: Implement the helpers**

Append to `src/utils.ts`:

```typescript
/**
 * Builds the border + corner-radius CSS declarations for an admonition.
 * - borderStyle "" (default) emits no border declaration, so the rule inherits
 *   the base `.iad` theme border.
 * - borderStyle "none" emits `border: none`.
 * - borderStyle solid/dashed/dotted emits a full `border` shorthand.
 * - borderRadius > 0 emits `border-radius`; 0 inherits the theme default.
 * Returns a string of declarations, each prefixed with a leading space.
 */
export function borderCss(borderStyle: string, borderWidth: number, borderColor: string, borderRadius: number): string {
	let css = "";
	if (borderStyle === "none") {
		css += " border: none;";
	} else if (borderStyle === "solid" || borderStyle === "dashed" || borderStyle === "dotted") {
		css += ` border: ${borderWidth}px ${borderStyle} ${borderColor};`;
	}
	if (borderRadius > 0) {
		css += ` border-radius: ${borderRadius}px;`;
	}
	return css;
}

/**
 * Builds the text weight/style/decoration declarations for an admonition.
 * Each enabled option appends one declaration prefixed with a leading space.
 */
export function textStyleCss(bold: boolean, italic: boolean, underline: boolean): string {
	let css = "";
	if (bold) {
		css += " font-weight: bold;";
	}
	if (italic) {
		css += " font-style: italic;";
	}
	if (underline) {
		css += " text-decoration: underline;";
	}
	return css;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS — all `borderCss` and `textStyleCss` tests green, plus the pre-existing `utils` tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils.ts tests/utils.test.ts
git commit -m "feat: add pure borderCss/textStyleCss helpers with tests"
```

---

## Task 2: Data model — shared-fields options object + 7 new fields

This task is **atomic**: changing the base constructor signature breaks all four subclasses until they are updated, so the whole task lands in one commit. `simpleStyle()` is intentionally **not** wired to the new fields yet (Task 3) — the fields are stored but not rendered, and the build stays green.

**Files:**
- Modify: `src/InlineAdmonitions/inlineAdmonition.ts`
- Modify: `src/InlineAdmonitions/prefixInlineAdmonition.ts`
- Modify: `src/InlineAdmonitions/suffixInlineAdmonition.ts`
- Modify: `src/InlineAdmonitions/containsInlineAdmonition.ts`
- Modify: `src/InlineAdmonitions/regexInlineAdmonition.ts`

- [ ] **Step 1: Extend `SerializedInlineAdmonition`**

In `src/InlineAdmonitions/inlineAdmonition.ts`, add the seven optional fields to the interface (they are optional because older `data.json` files predate them; the migration backfills them):

```typescript
export interface SerializedInlineAdmonition {
	type: InlineAdmonitionType;
	slug?: string;
	backgroundColor: string;
	bgColorOpacityPercent: number;
	color: string;
	colorOpacityPercent: number;
	prefixIcon: string;
	suffixIcon: string;
	fontFamily?: string;
	hideBackground?: boolean;
	hideTriggerString?: boolean;
	prefix?: string;
	suffix?: string;
	contains?: string;
	regex?: string;
	sampleInput?: string;
	borderColor?: string;
	borderWidth?: number;
	borderStyle?: string;
	borderRadius?: number;
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
}
```

- [ ] **Step 2: Add the `SharedAdmonitionFields` interface and default/from-data helpers**

In `src/InlineAdmonitions/inlineAdmonition.ts`, immediately after the `SerializedInlineAdmonition` interface, add:

```typescript
// The shared (non-trigger-specific) fields every InlineAdmonition carries. Passing
// these as one object keeps the subclass constructors readable as the field count
// grows (they were previously ~11 positional args).
export interface SharedAdmonitionFields {
	slug: string;
	backgroundColor: string;
	bgColorOpacityPercent: number;
	color: string;
	colorOpacityPercent: number;
	prefixIcon: string;
	suffixIcon: string;
	fontFamily: string;
	hideBackground: boolean;
	borderColor: string;
	borderWidth: number;
	borderStyle: string;
	borderRadius: number;
	bold: boolean;
	italic: boolean;
	underline: boolean;
}

// Defaults for a brand-new rule. Border defaults to "" (inherit theme border) and
// radius 0 (inherit theme radius) so a fresh rule looks identical to pre-feature rules.
export function defaultSharedFields(): SharedAdmonitionFields {
	return {
		slug: InlineAdmonition.generateSlug(),
		backgroundColor: "#f1f1f1",
		bgColorOpacityPercent: 100,
		color: "#000000",
		colorOpacityPercent: 100,
		prefixIcon: "",
		suffixIcon: "",
		fontFamily: "",
		hideBackground: false,
		borderColor: "#000000",
		borderWidth: 1,
		borderStyle: "",
		borderRadius: 0,
		bold: false,
		italic: false,
		underline: false,
	};
}

// Reads shared fields out of persisted data, backfilling any missing field. Older
// data.json files (pre-migration) may omit the newer fields.
export function sharedFieldsFromData(data: SerializedInlineAdmonition): SharedAdmonitionFields {
	return {
		slug: data.slug ?? InlineAdmonition.generateSlug(),
		backgroundColor: data.backgroundColor,
		bgColorOpacityPercent: data.bgColorOpacityPercent,
		color: data.color,
		colorOpacityPercent: data.colorOpacityPercent,
		prefixIcon: data.prefixIcon,
		suffixIcon: data.suffixIcon,
		fontFamily: data.fontFamily || "",
		hideBackground: data.hideBackground || false,
		borderColor: data.borderColor ?? "#000000",
		borderWidth: data.borderWidth ?? 1,
		borderStyle: data.borderStyle ?? "",
		borderRadius: data.borderRadius ?? 0,
		bold: data.bold ?? false,
		italic: data.italic ?? false,
		underline: data.underline ?? false,
	};
}
```

- [ ] **Step 3: Add the 7 instance fields and refactor the base constructor**

In `src/InlineAdmonitions/inlineAdmonition.ts`, replace the field declarations + constructor (the block from `backgroundColor: string;` through the end of the `protected constructor(...) { ... }`) with:

```typescript
	backgroundColor: string;
	bgColorOpacityPercent: number;
	color: string;
	colorOpacityPercent: number;
	type: InlineAdmonitionType;
	slug: string;
	prefixIcon: string;
	suffixIcon: string;
	fontFamily: string;
	hideBackground: boolean;
	borderColor: string;
	borderWidth: number;
	borderStyle: string;
	borderRadius: number;
	bold: boolean;
	italic: boolean;
	underline: boolean;

	protected constructor(fields: SharedAdmonitionFields) {
		this.slug = fields.slug;
		this.backgroundColor = fields.backgroundColor;
		this.bgColorOpacityPercent = fields.bgColorOpacityPercent;
		this.color = fields.color;
		this.colorOpacityPercent = fields.colorOpacityPercent;
		this.prefixIcon = fields.prefixIcon;
		this.suffixIcon = fields.suffixIcon;
		this.fontFamily = fields.fontFamily;
		this.hideBackground = fields.hideBackground;
		this.borderColor = fields.borderColor;
		this.borderWidth = fields.borderWidth;
		this.borderStyle = fields.borderStyle;
		this.borderRadius = fields.borderRadius;
		this.bold = fields.bold;
		this.italic = fields.italic;
		this.underline = fields.underline;
	}
```

- [ ] **Step 4: Extend `copySettingsTo`**

In `src/InlineAdmonitions/inlineAdmonition.ts`, replace the `copySettingsTo` body with (adds the 7 new copies; this is what preserves styling when the user changes a rule's *type* in the modal):

```typescript
	copySettingsTo(other: InlineAdmonition) {
		other.backgroundColor = this.backgroundColor;
		other.bgColorOpacityPercent = this.bgColorOpacityPercent;
		other.color = this.color;
		other.colorOpacityPercent = this.colorOpacityPercent;
		other.prefixIcon = this.prefixIcon;
		other.suffixIcon = this.suffixIcon;
		other.fontFamily = this.fontFamily;
		other.hideBackground = this.hideBackground;
		other.borderColor = this.borderColor;
		other.borderWidth = this.borderWidth;
		other.borderStyle = this.borderStyle;
		other.borderRadius = this.borderRadius;
		other.bold = this.bold;
		other.italic = this.italic;
		other.underline = this.underline;
	}
```

- [ ] **Step 5: Refactor `PrefixInlineAdmonition` to the options-object form**

In `src/InlineAdmonitions/prefixInlineAdmonition.ts`, update the import and replace `create()`, `unmarshal()`, and the constructor:

```typescript
// Update the import of inlineAdmonition to add the two helpers:
import {InlineAdmonition, SerializedInlineAdmonition, SharedAdmonitionFields, defaultSharedFields, sharedFieldsFromData} from "./inlineAdmonition";
```

```typescript
	static create() {
		return new PrefixInlineAdmonition("", false, defaultSharedFields());
	}

	static unmarshal(data: SerializedInlineAdmonition): PrefixInlineAdmonition {
		if (data.type != InlineAdmonitionType.Prefix) {
			throw new Error("Cannot unmarshal data into PrefixInlineAdmonition: Wrong type: " + data.type);
		}
		return new PrefixInlineAdmonition(data.prefix ?? "", data.hideTriggerString ?? false, sharedFieldsFromData(data));
	}

	constructor(prefix: string, hideTriggerString: boolean, fields: SharedAdmonitionFields) {
		super(fields);
		this.prefix = prefix;
		this.hideTriggerString = hideTriggerString;
	}
```

- [ ] **Step 6: Refactor `SuffixInlineAdmonition`**

In `src/InlineAdmonitions/suffixInlineAdmonition.ts`, update the import the same way, then replace `create()`, `unmarshal()`, and the constructor:

```typescript
import {InlineAdmonition, SerializedInlineAdmonition, SharedAdmonitionFields, defaultSharedFields, sharedFieldsFromData} from "./inlineAdmonition";
```

```typescript
	static create() {
		return new SuffixInlineAdmonition("", false, defaultSharedFields());
	}

	static unmarshal(data: SerializedInlineAdmonition): SuffixInlineAdmonition {
		if (data.type != InlineAdmonitionType.Suffix) {
			throw new Error("Cannot unmarshal data into SuffixInlineAdmonition: Wrong type: " + data.type);
		}
		return new SuffixInlineAdmonition(data.suffix ?? "", data.hideTriggerString ?? false, sharedFieldsFromData(data));
	}

	constructor(suffix: string, hideTriggerString: boolean, fields: SharedAdmonitionFields) {
		super(fields);
		this.suffix = suffix;
		this.hideTriggerString = hideTriggerString;
	}
```

- [ ] **Step 7: Refactor `ContainsInlineAdmonition`**

In `src/InlineAdmonitions/containsInlineAdmonition.ts`, update the import, then replace `create()`, `unmarshal()`, and the constructor (note: contains has no `hideTriggerString`):

```typescript
import {InlineAdmonition, SerializedInlineAdmonition, SharedAdmonitionFields, defaultSharedFields, sharedFieldsFromData} from "./inlineAdmonition";
```

```typescript
	static create() {
		return new ContainsInlineAdmonition("", defaultSharedFields());
	}

	static unmarshal(data: SerializedInlineAdmonition): ContainsInlineAdmonition {
		if (data.type != InlineAdmonitionType.Contains) {
			throw new Error("Cannot unmarshal data into ContainsInlineAdmonition: Wrong type: " + data.type);
		}
		return new ContainsInlineAdmonition(data.contains ?? "", sharedFieldsFromData(data));
	}

	constructor(contains: string, fields: SharedAdmonitionFields) {
		super(fields);
		this.contains = contains;
	}
```

- [ ] **Step 8: Refactor `RegexInlineAdmonition`**

In `src/InlineAdmonitions/regexInlineAdmonition.ts`, update the import, then replace `create()`, `unmarshal()`, and the constructor (note: regex has `sampleInput`, no `hideTriggerString`):

```typescript
import {InlineAdmonition, SerializedInlineAdmonition, SharedAdmonitionFields, defaultSharedFields, sharedFieldsFromData} from "./inlineAdmonition";
```

```typescript
	static create() {
		return new RegexInlineAdmonition("", "", defaultSharedFields());
	}

	static unmarshal(data: SerializedInlineAdmonition): RegexInlineAdmonition {
		if (data.type != InlineAdmonitionType.Regex) {
			throw new Error("Cannot unmarshal data into RegexInlineAdmonition: Wrong type: " + data.type);
		}
		return new RegexInlineAdmonition(data.regex ?? "", data.sampleInput ?? "", sharedFieldsFromData(data));
	}

	constructor(regex: string, sampleInput: string, fields: SharedAdmonitionFields) {
		super(fields);
		this.regex = regex;
		this.sampleInput = sampleInput;
	}
```

- [ ] **Step 9: Verify the build type-checks and tests still pass**

Run: `npm run build`
Expected: PASS — no TypeScript errors (all four subclasses now match the new base constructor; `SharedAdmonitionFields` requires every field so the compiler guarantees none were forgotten).

Run: `npm run test`
Expected: PASS — existing tests unaffected.

- [ ] **Step 10: Commit**

```bash
git add src/InlineAdmonitions/
git commit -m "refactor: pass shared admonition fields as an options object; add border/text-style fields"
```

---

## Task 3: Render the new styling in `simpleStyle()`

**Files:**
- Modify: `src/InlineAdmonitions/inlineAdmonition.ts`

- [ ] **Step 1: Import the helpers**

In `src/InlineAdmonitions/inlineAdmonition.ts`, update the utils import to add the two new functions:

```typescript
// Change:
//   import {appendOpacityToHexColor} from "../utils";
// to:
import {appendOpacityToHexColor, borderCss, textStyleCss} from "../utils";
```

- [ ] **Step 2: Wire `simpleStyle()`**

Replace the existing `simpleStyle()` method with:

```typescript
	public simpleStyle() {
		let style = "";
		if (this.hideBackground) {
			style += "background-color: transparent; border: none; padding: 0; border-radius: 0;";
		} else {
			style += `background-color: ${this.evalBackgroundColor()};`;
			style += borderCss(this.borderStyle, this.borderWidth, this.borderColor, this.borderRadius);
		}
		style += ` color: ${this.evalColor()};`;
		if (this.fontFamily) {
			style += ` font-family: ${this.fontFamily};`;
		}
		style += textStyleCss(this.bold, this.italic, this.underline);
		return style;
	}
```

(Border + radius are inside the `else` so they only apply when the background is shown; text styles apply unconditionally.)

- [ ] **Step 3: Verify the build type-checks**

Run: `npm run build`
Expected: PASS — no TypeScript errors.

Run: `npm run test`
Expected: PASS — existing tests unaffected.

- [ ] **Step 4: Commit**

```bash
git add src/InlineAdmonitions/inlineAdmonition.ts
git commit -m "feat: emit border, corner-radius, and text-style CSS from simpleStyle"
```

---

## Task 4: Settings migration v4 → v5

**Files:**
- Modify: `src/settings/inlineAdmonitionSettings.ts`
- Create: `tests/resources/settings_v4.json`
- Create: `tests/resources/migrated_settings_v4_to_v5.json`

- [ ] **Step 1: Add the v4→v5 migration block**

In `src/settings/inlineAdmonitionSettings.ts`, inside `migrateData`, immediately **after** the "Migrate to version 4" block and **before** `return [settings, dataMigrated];`, insert:

```typescript
		// Migrate to version 5
		// Adds richer styling fields (border color/width/style, corner radius, and
		// bold/italic/underline) to all types. Defaults preserve the pre-feature look:
		// empty border style and 0 radius inherit the base `.iad` theme border/radius.
		if (settings.version === 4) {
			for (const identifier in settings.inlineAdmonitions) {
				const iad = settings.inlineAdmonitions[identifier];
				if (iad.borderColor === undefined) {
					iad.borderColor = "#000000";
				}
				if (iad.borderWidth === undefined) {
					iad.borderWidth = 1;
				}
				if (iad.borderStyle === undefined) {
					iad.borderStyle = "";
				}
				if (iad.borderRadius === undefined) {
					iad.borderRadius = 0;
				}
				if (iad.bold === undefined) {
					iad.bold = false;
				}
				if (iad.italic === undefined) {
					iad.italic = false;
				}
				if (iad.underline === undefined) {
					iad.underline = false;
				}
			}
			settings.version = 5;
			dataMigrated = true;
		}
```

- [ ] **Step 2: Create the v4 input fixture**

Create `tests/resources/settings_v4.json`:

```json
{
  "version": 4,
  "inlineAdmonitions": {
    "814452b0-694a-462a-94d9-b00832807908": {
      "type": "prefix",
      "slug": "814452b0-694a-462a-94d9-b00832807908",
      "backgroundColor": "#002bad",
      "bgColorOpacityPercent": 100,
      "color": "#ffffff",
      "colorOpacityPercent": 100,
      "prefixIcon": "",
      "suffixIcon": "",
      "fontFamily": "",
      "hideBackground": false,
      "prefix": "DC",
      "hideTriggerString": false
    },
    "05671b61-ce27-4570-8263-6916bb388a36": {
      "type": "contains",
      "slug": "05671b61-ce27-4570-8263-6916bb388a36",
      "backgroundColor": "#eb0000",
      "bgColorOpacityPercent": 100,
      "color": "#ffffff",
      "colorOpacityPercent": 100,
      "prefixIcon": "",
      "suffixIcon": "",
      "fontFamily": "",
      "hideBackground": false,
      "contains": "sky"
    }
  }
}
```

- [ ] **Step 3: Create the expected v5 output fixture**

Create `tests/resources/migrated_settings_v4_to_v5.json` (same rules, `version: 5`, each rule gains the 7 new fields at their defaults). Field ordering in the real `data.json` follows instance-field declaration order; this reference file is for human value-comparison, matching the existing `migrated_settings_v1_to_v2.json` convention:

```json
{
  "version": 5,
  "inlineAdmonitions": {
    "814452b0-694a-462a-94d9-b00832807908": {
      "type": "prefix",
      "slug": "814452b0-694a-462a-94d9-b00832807908",
      "backgroundColor": "#002bad",
      "bgColorOpacityPercent": 100,
      "color": "#ffffff",
      "colorOpacityPercent": 100,
      "prefixIcon": "",
      "suffixIcon": "",
      "fontFamily": "",
      "hideBackground": false,
      "borderColor": "#000000",
      "borderWidth": 1,
      "borderStyle": "",
      "borderRadius": 0,
      "bold": false,
      "italic": false,
      "underline": false,
      "prefix": "DC",
      "hideTriggerString": false
    },
    "05671b61-ce27-4570-8263-6916bb388a36": {
      "type": "contains",
      "slug": "05671b61-ce27-4570-8263-6916bb388a36",
      "backgroundColor": "#eb0000",
      "bgColorOpacityPercent": 100,
      "color": "#ffffff",
      "colorOpacityPercent": 100,
      "prefixIcon": "",
      "suffixIcon": "",
      "fontFamily": "",
      "hideBackground": false,
      "borderColor": "#000000",
      "borderWidth": 1,
      "borderStyle": "",
      "borderRadius": 0,
      "bold": false,
      "italic": false,
      "underline": false,
      "contains": "sky"
    }
  }
}
```

- [ ] **Step 4: Verify the build type-checks**

Run: `npm run build`
Expected: PASS — no TypeScript errors (the migration mutates `SerializedInlineAdmonition` fields, all now declared).

- [ ] **Step 5: Commit**

```bash
git add src/settings/inlineAdmonitionSettings.ts tests/resources/settings_v4.json tests/resources/migrated_settings_v4_to_v5.json
git commit -m "feat: migrate settings v4->v5, backfilling richer-styling fields"
```

---

## Task 5: Edit-modal controls

**Files:**
- Modify: `src/settings/editInlineAdmonitionModal.ts`

The seven controls are added to the shared section, inserted **between** the existing "Font family" setting block and the "Type" setting block (after the `.open(); }); });` that closes the Font family `addButton`, and before `new Setting(contentEl).setName("Type")`). `updateSample()` already calls `this.result.simpleStyle()`, so the live sample reflects these immediately — no change to `updateSample` is required.

- [ ] **Step 1: Add the border, corner-radius, and text-style settings**

In `src/settings/editInlineAdmonitionModal.ts`, insert the following blocks immediately before the `new Setting(contentEl).setName("Type")` block:

```typescript
		new Setting(contentEl)
			.setName("Border style")
			.setDesc("Border line style. 'Default' keeps the theme's border; 'None' removes it.")
			.addDropdown(dc => dc
				.addOption("", "Default (theme)")
				.addOption("none", "None")
				.addOption("solid", "Solid")
				.addOption("dashed", "Dashed")
				.addOption("dotted", "Dotted")
				.setValue(this.result.borderStyle)
				.onChange(val => {
					this.result.borderStyle = val;
					this.updateSample();
				}));
		new Setting(contentEl)
			.setName("Border width")
			.setDesc("Width of the border in pixels. Applies when a border style is selected.")
			.addSlider(s => s
				.setLimits(0, 10, 1)
				.setValue(this.result.borderWidth)
				.onChange(val => {
					this.result.borderWidth = val;
					this.updateSample();
				}));
		new Setting(contentEl)
			.setName("Border color")
			.setDesc("Color of the border")
			.addColorPicker(cp => cp
				.setValue(this.result.borderColor)
				.onChange(val => {
					this.result.borderColor = val;
					this.updateSample();
				}));
		new Setting(contentEl)
			.setName("Corner radius")
			.setDesc("Rounded corner radius in pixels. 0 keeps the theme default.")
			.addSlider(s => s
				.setLimits(0, 20, 1)
				.setValue(this.result.borderRadius)
				.onChange(val => {
					this.result.borderRadius = val;
					this.updateSample();
				}));
		new Setting(contentEl)
			.setName("Bold")
			.setDesc("Display the admonition text in bold")
			.addToggle(toggle => toggle
				.setValue(this.result.bold)
				.onChange(val => {
					this.result.bold = val;
					this.updateSample();
				}));
		new Setting(contentEl)
			.setName("Italic")
			.setDesc("Display the admonition text in italics")
			.addToggle(toggle => toggle
				.setValue(this.result.italic)
				.onChange(val => {
					this.result.italic = val;
					this.updateSample();
				}));
		new Setting(contentEl)
			.setName("Underline")
			.setDesc("Underline the admonition text")
			.addToggle(toggle => toggle
				.setValue(this.result.underline)
				.onChange(val => {
					this.result.underline = val;
					this.updateSample();
				}));
```

- [ ] **Step 2: Verify the build type-checks and lint passes**

Run: `npm run build`
Expected: PASS — no TypeScript errors.

Run: `npm run lint`
Expected: PASS — no new `eslint-plugin-obsidianmd` violations (UI text is sentence-case; controls use Obsidian `Setting` helpers).

- [ ] **Step 3: Commit**

```bash
git add src/settings/editInlineAdmonitionModal.ts
git commit -m "feat: add border, corner-radius, and text-style controls to the edit modal"
```

---

## Task 6: Documentation updates

These satisfy the "done" criteria in `CLAUDE.md` ("Keeping these docs in sync").

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `ARCHITECTURE.md`
- Modify: `docs/rendering-paths.md`

- [ ] **Step 1: README — document the new common settings**

In `README.md`, in the "Common settings:" list (currently ending at `- **Font** allows selection of the font`), add after the Font line:

```markdown
- **Border style** chooses the border line: Default (theme), None, Solid, Dashed, or Dotted
- **Border width** sets the border thickness in pixels (applies when a border style is selected)
- **Border color** sets the border color
- **Corner radius** rounds the bubble corners (in pixels; 0 keeps the theme default — an explicit square 0px corner is not configurable)
- **Bold**, **Italic**, **Underline** toggle the text weight, slant, and underline
```

- [ ] **Step 2: README — clear the "rounded corners" future-work promise**

In `README.md` under "## Future work", replace the line:

```markdown
- Additional admonitions styles (rounded corners, etc)
```

with:

```markdown
- Additional admonition styles
```

- [ ] **Step 3: CHANGELOG — add an entry**

In `CHANGELOG.md`, add a new section at the top (below the `# Changelog` heading, above `## 1.12.0`):

```markdown
## Unreleased

- Feature: richer per-rule styling — border color/width/style, rounded corners, and
  bold/italic/underline text. Existing rules are migrated (settings v4→v5) with
  theme-default border and corners, so they look unchanged until edited.

```

- [ ] **Step 4: ARCHITECTURE.md — update the styling-fields description**

In `ARCHITECTURE.md`, in the "Mental model" section, replace:

```markdown
`InlineAdmonition`. A rule carries styling (background/text color + opacity, font,
hide-background, prefix/suffix icon) plus its trigger-specific fields.
```

with:

```markdown
`InlineAdmonition`. A rule carries styling (background/text color + opacity, font,
hide-background, border color/width/style, corner radius, bold/italic/underline,
prefix/suffix icon) plus its trigger-specific fields. The shared styling fields are
passed to constructors as a single `SharedAdmonitionFields` object
(`defaultSharedFields()` / `sharedFieldsFromData()` build it).
```

- [ ] **Step 5: docs/rendering-paths.md — update the migration note**

In `docs/rendering-paths.md`, the "adding a trigger type" step 4 currently reads:

```markdown
4. If you add a persisted field, add it to `SerializedInlineAdmonition` **and** a new
   migration step in `inlineAdmonitionSettings.ts` (bump `version`).
```

Replace it with:

```markdown
4. If you add a persisted field, add it to `SerializedInlineAdmonition` **and**
   `SharedAdmonitionFields` (+ `defaultSharedFields()` / `sharedFieldsFromData()`) if it
   is a shared styling field, **and** a new migration step in
   `inlineAdmonitionSettings.ts` (bump `version`). The current schema version is **5**
   (v5 added border color/width/style, corner radius, and bold/italic/underline).
```

- [ ] **Step 6: Commit**

```bash
git add README.md CHANGELOG.md ARCHITECTURE.md docs/rendering-paths.md
git commit -m "docs: document richer styling options and v5 migration"
```

---

## Task 7: Full verification & manual smoke test

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated suite**

Run: `npm run build && npm run lint && npm run test`
Expected: all three PASS — type-check + bundle succeed, no lint violations, all Jest tests green.

- [ ] **Step 2: Build for in-vault testing**

Run: `npm run dev` (leave running, or Ctrl-C after the first build completes)
Expected: `main.js` rebuilt with no errors.

- [ ] **Step 3: Manual smoke test in Obsidian**

Reload Obsidian (or toggle the plugin off/on) to pick up the new `main.js`, then:
1. Open the plugin settings → create or edit a rule.
2. Set Border style = Solid, Border width = 2, Border color = a visible color, Corner radius = 8, and toggle Bold/Italic/Underline. Confirm the live **sample** in the modal updates for each control.
3. Submit, then in a note (both **Reading mode** and **Live Preview**) confirm a matching inline-code span shows the border, rounded corners, and text styling.
4. Toggle "Hide background" on and confirm the border and corners disappear while bold/italic/underline remain.
5. Reload the app and confirm the styling persists (it round-tripped through `data.json` → migration → render).

- [ ] **Step 4: Verify the migration fixture (optional but recommended)**

Per `tests/resources/README.md`: back up the current `data.json`, copy `tests/resources/settings_v4.json` to `data.json`, reload Obsidian, then compare the rewritten `data.json` values against `tests/resources/migrated_settings_v4_to_v5.json` (version is 5 and each rule has the 7 new fields at defaults). Restore your original `data.json` afterward.

- [ ] **Step 5: Final confirmation**

Confirm there are no uncommitted source changes (`git status` clean aside from gitignored `main.js`/`data.json`). The feature is complete.

After this, use `superpowers:finishing-a-development-branch` to decide how to integrate the work, and mark ROADMAP item #1 `**Status:** done`.

---

## Self-review

**Spec coverage** (ROADMAP item #1: "rounded corners, border color/width/style, and bold/italic/underline … New per-rule fields flow through the existing `simpleStyle()` / generated-CSS path (`src/io/inlineAdmonitionCss.ts`) and the edit modal (`src/settings/editInlineAdmonitionModal.ts`), with a settings migration for the new fields"):
- Rounded corners → `borderRadius` (Tasks 1–5). ✓
- Border color/width/style → `borderColor`/`borderWidth`/`borderStyle` (Tasks 1–5). ✓
- Bold/italic/underline → `bold`/`italic`/`underline` (Tasks 1–5). ✓
- Flows through `simpleStyle()` → Task 3. The generated-CSS path (`inlineAdmonitionCss.ts`) consumes `simpleStyle()` output unchanged via `main.refreshCss()`, so no edit to that file is needed — the new declarations ride the existing pipeline. ✓
- Edit modal → Task 5. ✓
- Settings migration → Task 4 (v4→v5). ✓

**Placeholder scan:** No TBD/TODO/"add error handling"/"similar to Task N" — every code step shows complete code. ✓

**Type consistency:** `SharedAdmonitionFields` field names (`borderColor`, `borderWidth`, `borderStyle`, `borderRadius`, `bold`, `italic`, `underline`) are identical across the interface, `defaultSharedFields()`, `sharedFieldsFromData()`, base instance fields, `copySettingsTo`, the migration block, `SerializedInlineAdmonition`, and the modal (`this.result.<field>`). Helper signatures `borderCss(borderStyle, borderWidth, borderColor, borderRadius)` and `textStyleCss(bold, italic, underline)` match their call site in `simpleStyle()`. Subclass constructors keep trigger fields positional + `fields: SharedAdmonitionFields` last, matching each `create()`/`unmarshal()` call. ✓
