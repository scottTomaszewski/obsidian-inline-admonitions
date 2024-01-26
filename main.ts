import {
	App,
	MarkdownView,
	Modal,
	Plugin,
	PluginSettingTab,
	Setting
} from 'obsidian';

// Remember to rename these classes and interfaces!

interface InlineAdmonitionSettings {
	mySetting: string;
	inlineAdmonitions: Map<string, InlineAdmonition>;
}

class InlineAdmonition {
	prefix: string;
	backgroundColor: string;
	color: string;

	static create() {
		return new InlineAdmonition("", "#f1f1f1", "#000000");
	}

	constructor(prefix, backgroundColor, color) {
		this.prefix = prefix;
		this.backgroundColor = backgroundColor;
		this.color = color;
	}
}

const DEFAULT_SETTINGS: InlineAdmonitionSettings = {
	mySetting: 'default',
	inlineAdmonitions: new Map<string, InlineAdmonition>()
}

export default class InlineAdmonitionPlugin extends Plugin {
	settings: InlineAdmonitionSettings;

	async onload() {
		await this.loadSettings();

		// Actual processor to render the inline admonitions
		this.registerMarkdownPostProcessor((element, context) => {
			const codeblocks = element.findAll("code");

			for (let codeblock of codeblocks) {
				this.settings.inlineAdmonitions.forEach((iad, identifier) => {
					if (codeblock.innerText.startsWith(iad.prefix)) {
						codeblock.classList.add("iad");
						codeblock.classList.add("iad-" + slugify(iad.prefix));
						codeblock.setAttribute(
							"style",
							`background-color: ${iad.backgroundColor};color: ${iad.color}`);
					}
				});

			}
		});

		this.addSettingTab(new InlineAdmonitionSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		let settingData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, settingData);

		let iads = new Map<string, InlineAdmonition>();
		for (const identifier in settingData?.inlineAdmonitions) {
			let iad = settingData.inlineAdmonitions[identifier]
			iads.set(identifier, {prefix: iad.prefix, backgroundColor: iad.backgroundColor, color: iad.color})
		}
		this.settings.inlineAdmonitions = iads;
	}

	async saveSettings() {
		let settingData = Object.assign({}, DEFAULT_SETTINGS, this.settings);
		settingData.inlineAdmonitions = Object.fromEntries(this.settings.inlineAdmonitions.entries());
		await this.saveData(settingData);
		this.rerenderMarkdownViews();
	}

	private rerenderMarkdownViews() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		view?.previewMode.rerender(true);
	}
}

// Settings
class InlineAdmonitionSettingTab extends PluginSettingTab {
	plugin: InlineAdmonitionPlugin;

	constructor(app: App, plugin: InlineAdmonitionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		// Create Inline Admonition Button
		new Setting(containerEl)
			.addButton(b => b
				.setButtonText("Create New Inline Admonition")
				.onClick(async evt => {
					EditInlineAdmonitionModal.new(this.app, async result => {
						this.plugin.settings.inlineAdmonitions.set(result.prefix, result);
						await this.plugin.saveSettings();
						this.rebuildSettingRows(containerEl);
					}).open();
				}));

		this.rebuildSettingRows(containerEl);
	}

	// Renders the "samples" with options in the main settings view
	private rebuildSettingRows(containerEl: HTMLElement) {
		containerEl.findAll(".iad-setting-row").forEach(e => e.remove());
		new Map([...this.plugin.settings.inlineAdmonitions].sort()).forEach((iad, identifier) => {
			this.displaySampleIAD(containerEl, iad, identifier);
		});
	}

	// Renders a single Inline Admonition "sample" with options
	private displaySampleIAD(containerEl: HTMLElement, iad: InlineAdmonition, identifier: string) {
		let row: HTMLElement = containerEl.createDiv();
		row.addClass("iad-setting-row")

		row.createEl("code", {
			text: iad.prefix + " sample text",
			cls: "iad iad-sample iad-" + iad.prefix,
			parent: row,
			attr: {"style": `background-color: ${iad.backgroundColor}; color: ${iad.color}; margin: 0.5em;`}
		});

		let editButton = row.createEl("button", {text: "Edit"})
		editButton.addEventListener("click", evt => {
			EditInlineAdmonitionModal.edit(this.app, iad, async result => {
				// if the iad prefix changed, we need to kill the original
				this.plugin.settings.inlineAdmonitions.delete(identifier);
				this.plugin.settings.inlineAdmonitions.set(result.prefix, result);
				await this.plugin.saveSettings();
				this.rebuildSettingRows(containerEl);
			}).open();
		});

		let deleteButton = row.createEl("button", {text: "Delete"})
		deleteButton.addEventListener("click", async evt => {
			this.plugin.settings.inlineAdmonitions.delete(identifier);
			await this.plugin.saveSettings();
			row.remove();
		});
	}
}

// Model to edit a single Inline Admonition's settings
export class EditInlineAdmonitionModal extends Modal {
	result: InlineAdmonition;
	onSubmit: (result: InlineAdmonition) => void;
	sample: HTMLElement;

	static edit(app: App, toEdit: InlineAdmonition, onSubmit: (result: InlineAdmonition) => void) {
		return new EditInlineAdmonitionModal(app, toEdit, onSubmit);
	}

	static new(app: App, onSubmit: (result: InlineAdmonition) => void) {
		return new EditInlineAdmonitionModal(app, InlineAdmonition.create(), onSubmit);
	}

	constructor(app: App, toEdit: InlineAdmonition, onSubmit: (result: InlineAdmonition) => void) {
		super(app);
		this.result = toEdit ? toEdit : new InlineAdmonition();
		this.onSubmit = onSubmit;
	}

	onOpen() {
		let {contentEl} = this;

		contentEl.createEl("br");
		this.sample = contentEl.createEl("code", {
			text: this.result.prefix + " sample text",
			cls: "iad iad-sample iad-sample-editor iad-" + this.result.prefix,
			attr: {"style": `background-color: ${this.result.backgroundColor}; color: ${this.result.color};`}
		});

		new Setting(contentEl)
			.setName("Prefix")
			.setDesc("Inline codeblock prefix to trigger this formatting")
			.addText((text) => text
				.setPlaceholder("Enter prefix")
				.setValue(this.result.prefix)
				.onChange((value) => {
					this.result.prefix = value;
					this.updateSample();
				})
			);
		new Setting(contentEl)
			.setName("Background Color")
			.setDesc("Color of the background of the inline admonition")
			.addColorPicker(cp => cp
				.setValue(this.result.backgroundColor)
				.onChange(val => {
					this.result.backgroundColor = val;
					this.updateSample();
				})
			);
		new Setting(contentEl)
			.setName("Text Color")
			.setDesc("Color of the text of the inline admonition")
			.addColorPicker(cp => cp
				.setValue(this.result.color)
				.onChange(val => {
					this.result.color = val;
					this.updateSample();
				})
			);

		new Setting(contentEl)
			.addButton((btn) => btn
				.setButtonText("Submit")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.result);
				}));
	}

	private updateSample() {
		this.sample.setText(this.result.prefix + " sample text");
		this.sample.setAttr("style", `background-color: ${this.result.backgroundColor}; color: ${this.result.color}; margin: 0.5em;`);
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}

function slugify(str) {
	return String(str)
		.normalize('NFKD') // split accented characters into their base characters and diacritical marks
		.replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
		.trim() // trim leading or trailing whitespace
		.toLowerCase() // convert to lowercase
		.replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
		.replace(/\s+/g, '-') // replace spaces with hyphens
		.replace(/-+/g, '-'); // remove consecutive hyphens
}
