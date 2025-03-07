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

		// TODO - add search
		// TODO - add button to clear icon (no icon)

		contentEl.createEl('button', {text: "No Icon"})
			.addEventListener('click', () => {
				this.onSelect("");
				this.close();
			});

		const iconList = this.getAvailableIcons();

		const iconGrid = contentEl.createDiv({cls: 'icon-grid'});

		iconList.forEach((iconName) => {
			const iconButton = iconGrid.createEl('button', {cls: 'icon-button'});
			iconButton.setAttr('aria-label', iconName);

			const iconEl = iconButton.createDiv({cls: 'icon'});
			setIcon(iconEl, iconName);

			iconButton.addEventListener('click', () => {
				this.onSelect(iconName);
				this.close();
			});
		});

		// Add custom styles for the icon grid
		const style = document.createElement('style');
		style.textContent = `
      .icon-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
        gap: 10px;
        margin-top: 20px;
      }
      .icon-button {
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
        margin: 0 auto;
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
