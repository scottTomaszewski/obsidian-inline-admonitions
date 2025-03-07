import {App, Modal, setIcon, Setting} from "obsidian";
import {InlineAdmonition} from "../InlineAdmonitions/inlineAdmonition";
import {PrefixInlineAdmonition} from "../InlineAdmonitions/prefixInlineAdmonition";
import {InlineAdmonitionType, TypeTooltipModal} from "../InlineAdmonitions/inlineAdmonitionType";
import {IconSelectionModal} from "./IconSelectionModal";

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
		const {contentEl} = this;

		contentEl.createEl("br");

		const submitSetting = new Setting(contentEl)
			.addButton((btn) => btn
				.setButtonText("Submit")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.result);
				}))

		this.sample = submitSetting.nameEl.createEl("code", {attr: {"style": `margin: 0.5em;`}});
		this.updateSample();

		new Setting(contentEl)
			.setName("Background color")
			.setDesc("Color of the background of the inline admonition")
			.addColorPicker(cp => cp
				.setValue(this.result.backgroundColor)
				.onChange(val => {
					this.result.backgroundColor = val;
					this.updateSample();
				})
			);
		new Setting(contentEl)
			.setName("Background opacity (0% - 100%)")
			.setDesc("Percentage of opacity to apply to the background color. 0% is fully transparent.")
			.addSlider(s => s
				.setLimits(0, 100, 1)
				.setValue(this.result.bgColorOpacityPercent)
				.onChange(val => {
					this.result.bgColorOpacityPercent = val;
					this.updateSample();
				}));
		new Setting(contentEl)
			.setName("Text color")
			.setDesc("Color of the text of the inline admonition")
			.addColorPicker(cp => cp
				.setValue(this.result.color)
				.onChange(val => {
					this.result.color = val;
					this.updateSample();
				})
			);
		new Setting(contentEl)
			.setName("Text color opacity (0% - 100%)")
			.setDesc("Percentage of opacity to apply to the text color. 0% is fully transparent.")
			.addSlider(s => s
				.setLimits(0, 100, 1)
				.setValue(this.result.colorOpacityPercent)
				.onChange(val => {
					this.result.colorOpacityPercent = val;
					this.updateSample();
				}));
		new Setting(contentEl)
			.setName("Prefix Icon")
			.setDesc("Select an icon to include at the beginning of the inline admonition")
			.addButton(btn => {
					if (this.result.prefixIcon) {
						btn.setIcon(this.result.prefixIcon);
					} else {
						btn.setButtonText("Icon...");
					}
					return btn
						.onClick(() => {
							new IconSelectionModal(this.app, this.result.prefixIcon, async (selectedIcon: string) => {
								if (selectedIcon !== "") {
									this.result.prefixIcon = selectedIcon;
									btn.setIcon(selectedIcon);
									this.updateSample();
								} else {
									this.result.prefixIcon = undefined;
									btn.setButtonText("Icon...")
									this.updateSample();
								}

							}).open();
						});
				}
			);
		new Setting(contentEl)
			.setName("Suffix Icon")
			.setDesc("Select an icon to include at the end of the inline admonition")
			.addButton(btn => {
					if (this.result.suffixIcon) {
						btn.setIcon(this.result.suffixIcon);
					} else {
						btn.setButtonText("Icon...");
					}
					return btn
						.onClick(() => {
							new IconSelectionModal(this.app, this.result.suffixIcon, async (selectedIcon: string) => {
								if (selectedIcon !== "") {
									this.result.suffixIcon = selectedIcon;
									btn.setIcon(selectedIcon);
									this.updateSample();
								} else {
									this.result.suffixIcon = undefined;
									btn.setButtonText("Icon...")
									this.updateSample();
								}

							}).open();
						});
				}
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
					const old = this.result;
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
		this.result.process(this.sample);

		// at this point the css has not saved, so need to manually set a few things...
		this.sample.setAttr("style", `
			background-color: ${this.result.backgroundColor}; 
			color: ${this.result.color};`);
	}

	private clearTypeSettings() {
		this.typeSettings.forEach(value => value.settingEl.remove());
	}

	private appendTypeSettings(contentEl: HTMLElement) {
		this.typeSettings = this.result.buildSettings(contentEl, () => this.updateSample());
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
