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
		contentEl.createEl("h2", {text: "Select a Font"});

		const searchContainer = contentEl.createDiv({cls: "font-search-container"});
		const searchInput = searchContainer.createEl("input", {
			type: "text",
			placeholder: "Search fonts...",
			cls: "font-search-input",
		});

		contentEl.createEl("button", {text: "Default (no custom font)"})
			.addEventListener("click", () => {
				this.onSelect("");
				this.close();
			});

		const fontList = contentEl.createDiv({cls: "font-list"});

		const systemFonts = await this.getSystemFonts();
		const allFonts = [...GENERIC_FAMILIES, ...systemFonts];

		const fontButtons: Map<string, HTMLElement> = new Map();
		for (const fontName of allFonts) {
			const fontButton = fontList.createEl("button", {cls: "font-button"});
			fontButton.createSpan({
				text: fontName,
				attr: {style: `font-family: ${fontName};`},
			});

			fontButton.addEventListener("click", () => {
				this.onSelect(fontName);
				this.close();
			});

			fontButtons.set(fontName, fontButton);
		}

		searchInput.addEventListener("input", () => {
			const query = searchInput.value.toLowerCase().trim();
			fontButtons.forEach((button, name) => {
				button.style.display = name.toLowerCase().includes(query) ? "" : "none";
			});
		});

		searchInput.focus();

		const style = document.createElement("style");
		style.textContent = `
			.font-search-container {
				margin-bottom: 10px;
			}
			.font-search-input {
				width: 100%;
				padding: 8px;
				border: 1px solid var(--background-modifier-border);
				border-radius: 4px;
				background: var(--background-primary);
				color: var(--text-normal);
				font-size: 14px;
			}
			.font-list {
				display: flex;
				flex-direction: column;
				gap: 2px;
				margin-top: 10px;
				max-height: 400px;
				overflow-y: auto;
			}
			.font-button {
				display: block;
				text-align: left;
				background: none;
				border: none;
				padding: 6px 10px;
				cursor: pointer;
				font-size: 14px;
				border-radius: 4px;
			}
			.font-button:hover {
				background-color: var(--background-modifier-hover);
			}
		`;
		contentEl.appendChild(style);
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}

	private async getSystemFonts(): Promise<string[]> {
		try {
			// @ts-ignore - queryLocalFonts is available in Electron/Chromium
			const fonts: FontData[] = await window.queryLocalFonts();
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
