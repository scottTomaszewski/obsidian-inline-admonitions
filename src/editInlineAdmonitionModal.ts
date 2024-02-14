// Model to edit a single Inline Admonition's settings
import {App, Modal, Setting} from "obsidian";
import {InlineAdmonition} from "./InlineAdmonitions/inlineAdmonition";
import {PrefixInlineAdmonition} from "./InlineAdmonitions/prefixInlineAdmonition";
import {InlineAdmonitionType, TypeTooltipModal} from "./InlineAdmonitions/inlineAdmonitionType";

export class EditInlineAdmonitionModal extends Modal {
	result: InlineAdmonition;
	onSubmit: (result: InlineAdmonition) => void;
	sample: HTMLElement;
	private typeSettings: Array<Setting> = new Array<Setting>();

	static edit(app: App, toEdit: InlineAdmonition, onSubmit: (result: InlineAdmonition) => void) {
		return new EditInlineAdmonitionModal(app, toEdit, onSubmit);
	}

	static new(app: App, onSubmit: (result: InlineAdmonition) => void) {
		return new EditInlineAdmonitionModal(app, PrefixInlineAdmonition.create(), onSubmit);
	}

	constructor(app: App, toEdit: InlineAdmonition, onSubmit: (result: InlineAdmonition) => void) {
		super(app);
		this.result = toEdit ? toEdit : PrefixInlineAdmonition.create();
		this.onSubmit = onSubmit;
	}

	onOpen() {
		let {contentEl} = this;

		contentEl.createEl("br");

		let submitSetting = new Setting(contentEl)
			.addButton((btn) => btn
				.setButtonText("Submit")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.result);
				}))

		this.sample = submitSetting.nameEl.createEl("code", {
			text: this.result.sampleText(),
			cls: "iad iad-sample iad-sample-editor iad-" + this.result.slug,
			attr: {"style": `background-color: ${this.result.backgroundColor}; color: ${this.result.color};`}
		});

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
			.setName("Type")
			.setDesc("The way the Inline Admonition is triggered")
			.setTooltip(InlineAdmonitionType.tooltip())
			.addDropdown(dc => dc
				.addOption(InlineAdmonitionType.Prefix, InlineAdmonitionType.Prefix)
				.addOption(InlineAdmonitionType.Suffix, InlineAdmonitionType.Suffix)
				.addOption(InlineAdmonitionType.Contains, InlineAdmonitionType.Contains)
				.setValue(this.result.type)
				.onChange(value => {
					this.clearTypeSettings();
					let old = this.result;
					this.result = InlineAdmonitionType.createFrom(value);
					old.copySettingsTo(this.result)
					this.appendTypeSettings(contentEl);
				}))
			.addButton(btn => btn
				.setIcon("help-circle")
				.onClick(() => {
					new TypeTooltipModal(this.app).open()
				})
			);

		this.appendTypeSettings(contentEl);
	}

	private updateSample() {
		this.sample.setText(this.result.sampleText());
		// TODO - I think this should be extracted out somewhere?
		this.sample.setAttr("style", `background-color: ${this.result.backgroundColor}; color: ${this.result.color}; margin: 0.5em;`);
	}

	private clearTypeSettings() {
		this.typeSettings.forEach(value => value.settingEl.remove());
	}

	private appendTypeSettings(contentEl) {
		this.typeSettings = this.result.buildSettings(contentEl, () => this.updateSample());
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}
