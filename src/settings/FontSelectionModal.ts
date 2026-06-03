import {App, FuzzyMatch, FuzzySuggestModal} from "obsidian";

const GENERIC_FAMILIES: string[] = [
	"serif",
	"sans-serif",
	"monospace",
	"cursive",
	"fantasy",
	"system-ui",
	"ui-serif",
	"ui-sans-serif",
	"ui-monospace",
	"ui-rounded",
];

// Sentinel item representing "no custom font"; selecting it clears the font (empty
// string) so the admonition falls back to the theme font.
const DEFAULT_FONT = "";

export class FontSelectionModal extends FuzzySuggestModal<string> {
	private items: string[];
	private onSelect: (font: string) => void;

	private constructor(app: App, items: string[], onSelect: (font: string) => void) {
		super(app);
		this.items = items;
		this.onSelect = onSelect;
		this.setPlaceholder("Search fonts…");
	}

	// System fonts are queried asynchronously, so build the item list first, then open.
	static async open(app: App, currentFont: string, onSelect: (font: string) => void) {
		const systemFonts = await FontSelectionModal.getSystemFonts();
		const items = [DEFAULT_FONT, ...GENERIC_FAMILIES, ...systemFonts];
		new FontSelectionModal(app, items, onSelect).open();
	}

	getItems(): string[] {
		return this.items;
	}

	getItemText(item: string): string {
		return item === DEFAULT_FONT ? "Default (theme font)" : item;
	}

	renderSuggestion(match: FuzzyMatch<string>, el: HTMLElement) {
		const font = match.item;
		const label = el.createSpan({text: this.getItemText(font)});
		if (font !== DEFAULT_FONT) {
			label.style.setProperty("font-family", font);
		}
	}

	onChooseItem(item: string) {
		this.onSelect(item);
	}

	private static async getSystemFonts(): Promise<string[]> {
		try {
			const queryLocalFonts = (window as unknown as {
				queryLocalFonts?: () => Promise<Array<{family: string}>>
			}).queryLocalFonts;
			if (!queryLocalFonts) {
				return [];
			}
			const fonts = await queryLocalFonts();
			const families = new Set<string>();
			for (const font of fonts) {
				families.add(font.family);
			}
			return [...families].sort((a, b) => a.localeCompare(b));
		} catch {
			return [];
		}
	}
}
