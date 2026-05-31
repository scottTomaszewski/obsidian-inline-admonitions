import {App, getIconIds, Modal, setIcon} from "obsidian";

export class IconSelectionModal extends Modal {
	currentIcon: string;
	onSelect: (icon: string) => void;

	constructor(app: App, currentIcon: string, onSelect: (icon: string) => void) {
		super(app);
		this.currentIcon = currentIcon;
		this.onSelect = onSelect;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.createEl('h2', {text: 'Select an icon'});

		const searchContainer = contentEl.createDiv({cls: 'iad-search-container'});
		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search icons...',
			cls: 'iad-search-input',
		});

		contentEl.createEl('button', {text: "No icon"})
			.addEventListener('click', () => {
				this.onSelect("");
				this.close();
			});

		const iconList = this.getAvailableIcons();

		const iconGrid = contentEl.createDiv({cls: 'iad-icon-grid'});

		const iconButtons: Map<string, HTMLElement> = new Map();
		iconList.forEach((iconName) => {
			const iconButton = iconGrid.createEl('button', {cls: 'iad-icon-button'});
			iconButton.setAttr('aria-label', iconName);

			const iconEl = iconButton.createDiv({cls: 'iad-icon'});
			setIcon(iconEl, iconName);

			iconButton.addEventListener('click', () => {
				this.onSelect(iconName);
				this.close();
			});

			iconButtons.set(iconName, iconButton);
		});

		searchInput.addEventListener('input', () => {
			const query = searchInput.value.toLowerCase().trim();
			iconButtons.forEach((button, name) => {
				button.toggleClass('iad-hidden', !name.toLowerCase().includes(query));
			});
		});

		// Focus the search input when the modal opens
		searchInput.focus();
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}

	getAvailableIcons(): string[] {
		return getIconIds()
			.filter(id => id.startsWith("lucide-"))
			.map(id => id.slice(7));
	}
}
