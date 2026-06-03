import {App, FuzzyMatch, FuzzySuggestModal, getIconIds, setIcon} from "obsidian";

// Sentinel item representing "no icon"; selecting it clears the icon (empty string),
// preserving the contract the edit modal relies on.
const NO_ICON = "";

export class IconSelectionModal extends FuzzySuggestModal<string> {
	onSelect: (icon: string) => void;

	constructor(app: App, currentIcon: string, onSelect: (icon: string) => void) {
		super(app);
		this.onSelect = onSelect;
		this.setPlaceholder("Search icons…");
	}

	getItems(): string[] {
		const icons = getIconIds()
			.filter(id => id.startsWith("lucide-"))
			.map(id => id.slice("lucide-".length));
		return [NO_ICON, ...icons];
	}

	getItemText(item: string): string {
		return item === NO_ICON ? "No icon" : item;
	}

	renderSuggestion(match: FuzzyMatch<string>, el: HTMLElement) {
		const id = match.item;
		if (id !== NO_ICON) {
			setIcon(el.createSpan({cls: "iad-suggest-icon"}), id);
		}
		el.createSpan({text: this.getItemText(id)});
	}

	onChooseItem(item: string) {
		this.onSelect(item);
	}
}
