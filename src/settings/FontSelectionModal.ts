import {App, Modal} from "obsidian";

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

export class FontSelectionModal extends Modal {
	currentFont: string;
	onSelect: (font: string) => void;

	constructor(app: App, currentFont: string, onSelect: (font: string) => void) {
		super(app);
		this.currentFont = currentFont;
		this.onSelect = onSelect;
	}

	async onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl("h2", {text: "Select a font"});

		const searchContainer = contentEl.createDiv({cls: "iad-search-container"});
		const searchInput = searchContainer.createEl("input", {
			type: "text",
			placeholder: "Search fonts...",
			cls: "iad-search-input",
		});

		contentEl.createEl("button", {text: "Default (no custom font)"})
			.addEventListener("click", () => {
				this.onSelect("");
				this.close();
			});

		const fontList = contentEl.createDiv({cls: "iad-font-list"});

		const systemFonts = await this.getSystemFonts();
		const allFonts = [...GENERIC_FAMILIES, ...systemFonts];

		const fontButtons: Map<string, HTMLElement> = new Map();
		for (const fontName of allFonts) {
			const fontButton = fontList.createEl("button", {cls: "iad-font-button"});
			const label = fontButton.createSpan({text: fontName});
			label.style.setProperty("font-family", fontName);

			fontButton.addEventListener("click", () => {
				this.onSelect(fontName);
				this.close();
			});

			fontButtons.set(fontName, fontButton);
		}

		searchInput.addEventListener("input", () => {
			const query = searchInput.value.toLowerCase().trim();
			fontButtons.forEach((button, name) => {
				button.toggleClass("iad-hidden", !name.toLowerCase().includes(query));
			});
		});

		searchInput.focus();
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}

	private async getSystemFonts(): Promise<string[]> {
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
