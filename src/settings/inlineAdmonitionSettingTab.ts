// Settings
import {App, PluginSettingTab, Setting} from "obsidian";
import {EditInlineAdmonitionModal} from "./editInlineAdmonitionModal";
import InlineAdmonitionPlugin from "../../main";
import {InlineAdmonition} from "../InlineAdmonitions/inlineAdmonition";

export class InlineAdmonitionSettingTab extends PluginSettingTab {
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
				.setButtonText("Create new inline admonition")
				.onClick(async evt => {
					EditInlineAdmonitionModal.new(this.app, async result => {
						this.plugin.settings.inlineAdmonitions.set(result.slug, result);
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
		const row: HTMLElement = containerEl.createDiv();
		row.addClass("iad-setting-row")

		row.createSpan({
			text: iad.type + " Type",
			cls: "iad-setting-row-title"
		});

		const sample = row.createEl("code", { text: iad.sampleText(), attr: {"style": `margin: 0.5em;`}});
		iad.process(sample);

		const editButton = row.createEl("button", {text: "Edit"})
		editButton.addEventListener("click", evt => {
			EditInlineAdmonitionModal.edit(this.app, iad, async result => {
				// if the iad prefix changed, we need to kill the original
				this.plugin.settings.inlineAdmonitions.delete(identifier);
				this.plugin.settings.inlineAdmonitions.set(result.slug, result);
				await this.plugin.saveSettings();
				this.rebuildSettingRows(containerEl);
			}).open();
		});

		const deleteButton = row.createEl("button", {text: "Delete"})
		deleteButton.addEventListener("click", async evt => {
			this.plugin.settings.inlineAdmonitions.delete(identifier);
			await this.plugin.saveSettings();
			row.remove();
		});
	}
}
