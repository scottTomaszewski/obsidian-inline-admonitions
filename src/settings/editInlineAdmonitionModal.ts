import {App, Modal, Setting} from "obsidian";
import {InlineAdmonition} from "../InlineAdmonitions/inlineAdmonition";
import {PrefixInlineAdmonition} from "../InlineAdmonitions/prefixInlineAdmonition";
import {InlineAdmonitionType, TypeTooltipModal} from "../InlineAdmonitions/inlineAdmonitionType";
import {IconSelectionModal} from "./IconSelectionModal";
import {FontSelectionModal} from "./FontSelectionModal";

export class EditInlineAdmonitionModal extends Modal {
	result: InlineAdmonition;
	onSubmit: (result: InlineAdmonition) => void;
	sample: HTMLElement;
	private body: HTMLElement;
	private triggerBody: HTMLElement;
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
		this.modalEl.addClass("iad-edit-modal");

		// Fixed header (outside the scroll area) keeps the live sample and Submit
		// visible while only the body below it scrolls.
		const header = contentEl.createDiv({cls: "iad-modal-header"});
		const submitSetting = new Setting(header)
			.addButton((btn) => btn
				.setButtonText("Submit")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.result);
				}))

		this.sample = submitSetting.nameEl.createEl("code", {cls: "iad-sample"});
		this.updateSample();

		this.body = contentEl.createDiv({cls: "iad-modal-body"});

		// --- Trigger ---
		const trigger = this.section("Trigger", true);
		new Setting(trigger)
			.setName("Trigger type")
			.setDesc("What text turns an inline code span into this admonition.")
			.setTooltip(InlineAdmonitionType.tooltip())
			.addDropdown(dc => dc
				.addOption(InlineAdmonitionType.Prefix, InlineAdmonitionType.Prefix)
				.addOption(InlineAdmonitionType.Suffix, InlineAdmonitionType.Suffix)
				.addOption(InlineAdmonitionType.Contains, InlineAdmonitionType.Contains)
				.addOption(InlineAdmonitionType.Regex, InlineAdmonitionType.Regex)
				.setValue(this.result.type)
				.onChange(value => {
					this.clearTypeSettings();
					const old = this.result;
					this.result = InlineAdmonitionType.createFrom(value);
					old.copySettingsTo(this.result)
					this.appendTypeSettings();
				}))
			.addButton(btn => btn
				.setIcon("help-circle")
				.onClick(() => {
					new TypeTooltipModal(this.app).open()
				})
			);
		this.triggerBody = trigger;
		this.appendTypeSettings();

		// --- Background ---
		const background = this.section("Background");
		new Setting(background)
			.setName("Background color")
			.setDesc("Fill color behind the text.")
			.addColorPicker(cp => cp
				.setValue(this.result.backgroundColor)
				.onChange(val => {
					this.result.backgroundColor = val;
					this.updateSample();
				})
			);
		new Setting(background)
			.setName("Background opacity")
			.setDesc("How opaque the fill is. 0% is fully transparent.")
			.addSlider(s => s
				.setLimits(0, 100, 1)
				.setValue(this.result.bgColorOpacityPercent)
				.setDynamicTooltip()
				.onChange(val => {
					this.result.bgColorOpacityPercent = val;
					this.updateSample();
				}));
		new Setting(background)
			.setName("Blend into text")
			.setDesc("Drop the fill, padding, and rounded corners so it flows inline with surrounding text.")
			.addToggle(toggle => toggle
				.setValue(this.result.hideBackground)
				.onChange(val => {
					this.result.hideBackground = val;
					this.updateSample();
				})
			);

		// --- Text & font ---
		const text = this.section("Text & font");
		new Setting(text)
			.setName("Text color")
			.setDesc("Color of the admonition text.")
			.addColorPicker(cp => cp
				.setValue(this.result.color)
				.onChange(val => {
					this.result.color = val;
					this.updateSample();
				})
			);
		new Setting(text)
			.setName("Text opacity")
			.setDesc("How opaque the text is. 0% is fully transparent.")
			.addSlider(s => s
				.setLimits(0, 100, 1)
				.setValue(this.result.colorOpacityPercent)
				.setDynamicTooltip()
				.onChange(val => {
					this.result.colorOpacityPercent = val;
					this.updateSample();
				}));
		new Setting(text)
			.setName("Font")
			.setDesc("Font for the admonition text.")
			.addButton(btn => {
				btn.setButtonText(this.result.fontFamily || "Font…");
				return btn
					.onClick(async () => {
						await FontSelectionModal.open(this.app, this.result.fontFamily, (selectedFont: string) => {
							this.result.fontFamily = selectedFont;
							btn.setButtonText(selectedFont || "Font…");
							this.updateSample();
						});
					});
			});
		new Setting(text)
			.setName("Bold")
			.setDesc("Bold the text.")
			.addToggle(toggle => toggle
				.setValue(this.result.bold)
				.onChange(val => {
					this.result.bold = val;
					this.updateSample();
				}));
		new Setting(text)
			.setName("Italic")
			.setDesc("Italicize the text.")
			.addToggle(toggle => toggle
				.setValue(this.result.italic)
				.onChange(val => {
					this.result.italic = val;
					this.updateSample();
				}));
		new Setting(text)
			.setName("Underline")
			.setDesc("Underline the text.")
			.addToggle(toggle => toggle
				.setValue(this.result.underline)
				.onChange(val => {
					this.result.underline = val;
					this.updateSample();
				}));

		// --- Border ---
		const border = this.section("Border");
		new Setting(border)
			.setName("Border style")
			.setDesc("Line style for the border.")
			.addDropdown(dc => dc
				.addOption("", "Default (theme)")
				.addOption("none", "None")
				.addOption("solid", "Solid")
				.addOption("dashed", "Dashed")
				.addOption("dotted", "Dotted")
				.setValue(this.result.borderStyle)
				.onChange(val => {
					this.result.borderStyle = val;
					this.updateSample();
				}));
		new Setting(border)
			.setName("Border width")
			.setDesc("Border thickness in pixels (when a style is set).")
			.addSlider(s => s
				.setLimits(0, 10, 1)
				.setValue(this.result.borderWidth)
				.setDynamicTooltip()
				.onChange(val => {
					this.result.borderWidth = val;
					this.updateSample();
				}));
		new Setting(border)
			.setName("Border color")
			.setDesc("Color of the border.")
			.addColorPicker(cp => cp
				.setValue(this.result.borderColor)
				.onChange(val => {
					this.result.borderColor = val;
					this.updateSample();
				}));
		new Setting(border)
			.setName("Corner radius")
			.setDesc("Roundness of the corners, in pixels.")
			.addSlider(s => s
				.setLimits(0, 20, 1)
				.setValue(this.result.borderRadius)
				.setDynamicTooltip()
				.onChange(val => {
					this.result.borderRadius = val;
					this.updateSample();
				}));

		// --- Icons ---
		const icons = this.section("Icons");
		this.addIconSetting(icons, "Leading icon", "Icon shown before the text.",
			() => this.result.prefixIcon, val => this.result.prefixIcon = val);
		this.addIconSetting(icons, "Trailing icon", "Icon shown after the text.",
			() => this.result.suffixIcon, val => this.result.suffixIcon = val);
	}

	// Builds a collapsible <details> section and returns its body element for rows.
	private section(title: string, open = false): HTMLElement {
		const details = this.body.createEl("details", {cls: "iad-section"});
		if (open) details.setAttr("open", "");
		const summary = details.createEl("summary", {cls: "iad-section-title"});
		summary.createSpan({cls: "iad-section-label", text: title});
		return details.createDiv({cls: "iad-section-body"});
	}

	// A row whose button opens the icon picker; get/set read and write the chosen icon.
	private addIconSetting(parent: HTMLElement, name: string, desc: string,
						   get: () => string, set: (val: string) => void) {
		new Setting(parent)
			.setName(name)
			.setDesc(desc)
			.addButton(btn => {
				const render = () => {
					if (get()) {
						btn.setIcon(get());
					} else {
						btn.setButtonText("Icon…");
					}
				};
				render();
				return btn.onClick(() => {
					new IconSelectionModal(this.app, get(), (selectedIcon: string) => {
						set(selectedIcon);
						render();
						this.updateSample();
					}).open();
				});
			});
	}

	private updateSample() {
		this.sample.setText(this.result.sampleText());
		this.result.process(this.sample);

		// at this point the css has not saved, so need to manually set a few things...
		this.sample.setAttr("style", `
			background-color: ${this.result.backgroundColor};
			color: ${this.result.color};
			${this.result.simpleStyle()}`);
	}

	private clearTypeSettings() {
		this.typeSettings.forEach(value => value.settingEl.remove());
	}

	private appendTypeSettings() {
		this.typeSettings = this.result.buildSettings(this.triggerBody, () => this.updateSample());
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
