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
		contentEl.createEl('h2', {text: 'Select an Icon'});

		const searchContainer = contentEl.createDiv({cls: 'icon-search-container'});
		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search icons...',
			cls: 'icon-search-input',
		});

		contentEl.createEl('button', {text: "No Icon"})
			.addEventListener('click', () => {
				this.onSelect("");
				this.close();
			});

		const iconList = this.getAvailableIcons();

		const iconGrid = contentEl.createDiv({cls: 'icon-grid'});

		const iconButtons: Map<string, HTMLElement> = new Map();
		iconList.forEach((iconName) => {
			const iconButton = iconGrid.createEl('button', {cls: 'icon-button'});
			iconButton.setAttr('aria-label', iconName);

			const iconEl = iconButton.createDiv({cls: 'icon'});
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
				button.style.display = name.toLowerCase().includes(query) ? '' : 'none';
			});
		});

		// Focus the search input when the modal opens
		searchInput.focus();

		// Add custom styles for the icon grid
		const style = document.createElement('style');
		style.textContent = `
      .icon-search-container {
        margin-bottom: 10px;
      }
      .icon-search-input {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        background: var(--background-primary);
        color: var(--text-normal);
        font-size: 14px;
      }
      .icon-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
        gap: 10px;
        margin-top: 20px;
        height: 400px;
        overflow-y: auto;
      }
      .icon-button {
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        padding: 10px;
        cursor: pointer;
      }
      .icon-button:hover {
        background-color: var(--background-modifier-hover);
      }
      .icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
		contentEl.appendChild(style);
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
