import {sanitizeClassName, slugify} from "../utils";
import {InlineAdmonition} from "./inlineAdmonition";
import {Setting} from "obsidian";
import {InlineAdmonitionType} from "./inlineAdmonitionType";
import {SyntaxNodeRef} from "@lezer/common";
import {RangeSetBuilder} from "@codemirror/state";
import {Decoration} from "@codemirror/view";

export class SuffixInlineAdmonition extends InlineAdmonition {
	suffix: string;
	hideTriggerString: boolean;
	prefixIcon: string; // New property for icon
	type = InlineAdmonitionType.Suffix;

	// TODO - I dont like this...
	static create() {
		return new SuffixInlineAdmonition(
			"",
			false,
			 "",
			"#f1f1f1",
			100,
			"#000000",
			100,
			InlineAdmonition.generateSlug());
	}

	static unmarshal(data: any): SuffixInlineAdmonition {
		if (data.type != InlineAdmonitionType.Suffix) {
			throw new Error("Cannot unmarshal data into SuffixInlineAdmonition: Wrong type: " + data.type);
		}
		return new SuffixInlineAdmonition(
			data.suffix,
			data.hideTriggerString,
			data.icon,
			data.backgroundColor,
			data.bgColorOpacityPercent,
			data.color,
			data.colorOpacityPercent,
			data.slug);
	}

	constructor(suffix: string,
				hideTriggerString: boolean,
				icon: string,
				backgroundColor: string,
				bgColorOpacityPercent: number,
				color: string,
				colorOpacityPercent: number,
				slug: string) {
		super(backgroundColor, bgColorOpacityPercent, color, colorOpacityPercent, slug);
		this.suffix = suffix;
		this.hideTriggerString = hideTriggerString;
		this.prefixIcon = icon;
	}

	process(codeElement: HTMLElement) {
		if (codeElement.innerText.endsWith(this.suffix)) {
			this.cssClasses().forEach(c => codeElement.classList.add(c));
			// codeElement.setAttribute("style", this.simpleStyle());
			if (this.hideTriggerString) {
				codeElement.setText(codeElement.getText().replace(new RegExp(this.suffix + "$"), ""));
			}
			if (this.prefixIcon) {
				const iconElement = document.createElement("span");
				iconElement.classList.add("admonition-icon");
				iconElement.innerText = this.prefixIcon;
				codeElement.prepend(iconElement);
			}
		}
	}

	applyTo(node: SyntaxNodeRef, content: string, builder: RangeSetBuilder<Decoration>) {
		if (content.endsWith(this.suffix)) {
			builder.add(
				node.from,
				node.to,
				Decoration.mark({
					inclusive: true,
					attributes: {class: this.cssClasses().join(" ")},
					tagName: "span"
				})
			);
		}
		// Hide the prefix if necessary
		if (this.hideTriggerString) {
			builder.add(
				node.to - this.suffix.length,
				node.to,
				Decoration.mark({
					inclusive: true,
					attributes: {class: "iad-hidden"},
					tagName: "span"
				})
			);
		}
		// Add the icon if necessary
		if (this.prefixIcon) {
			builder.add(
				node.from,
				node.from,
				Decoration.widget({
					widget: {
						toDOM: () => {
							const iconElement = document.createElement("span");
							iconElement.classList.add("admonition-icon");
							iconElement.innerText = this.prefixIcon;
							return iconElement;
						}
					}
				})
			);
		}
	}

	cssClasses(): string[] {
		const classes = super.cssClasses();
		classes.push("iad-suffix")
		classes.push("iad-suffix-" + sanitizeClassName(this.suffix));
		return classes;
	}

	sampleText() {
		if (this.hideTriggerString) {
			return "sample text";
		}
		return "sample text " + this.suffix;
	}

	buildSettings(contentEl: HTMLElement, updateSampleFunction: () => void): Setting[] {
		const results = new Array<Setting>();

		results.push(new Setting(contentEl)
			.setName("Suffix")
			.setDesc("Inline codeblock suffix to trigger this formatting")
			.addText((text) => text
				.setPlaceholder("Enter suffix")
				.setValue(this.suffix)
				.onChange((value) => {
					this.suffix = value;
					updateSampleFunction();
				})
			));

		results.push(new Setting(contentEl)
			.setName("Hide suffix text")
			.setDesc("If enabled, the 'suffix' text will not show in resulting Inline Admonition")
			.addToggle((toggle) => toggle
				.setValue(this.hideTriggerString)
				.onChange((val) => {
					this.hideTriggerString = val;
					updateSampleFunction();
				})
			)
		);

		results.push(new Setting(contentEl)
			.setName("Icon")
			.setDesc("Select an icon to include at the beginning of the inline admonition")
			.addText(text => text
				.setPlaceholder("Enter icon name")
				.setValue(this.prefixIcon || "")
				.onChange(value => {
					this.prefixIcon = value;
					updateSampleFunction();
				})
			));

		return results;
	}

	public toString = (): string => {
		return "SuffixInlineAdmonition(" + this.suffix + ", hidePrefix: " + this.hideTriggerString + ")";
	}
}
