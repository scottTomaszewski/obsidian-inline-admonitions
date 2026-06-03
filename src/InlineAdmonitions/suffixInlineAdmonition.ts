import {sanitizeClassName} from "../utils";
import {InlineAdmonition, SerializedInlineAdmonition, SharedAdmonitionFields, defaultSharedFields, sharedFieldsFromData} from "./inlineAdmonition";
import {setIcon, Setting} from "obsidian";
import {InlineAdmonitionType} from "./inlineAdmonitionType";
import {SyntaxNodeRef} from "@lezer/common";
import {RangeSetBuilder} from "@codemirror/state";
import {Decoration} from "@codemirror/view";

export class SuffixInlineAdmonition extends InlineAdmonition {
	suffix: string;
	hideTriggerString: boolean;
	type = InlineAdmonitionType.Suffix;

	static create() {
		return new SuffixInlineAdmonition("", false, defaultSharedFields());
	}

	static unmarshal(data: SerializedInlineAdmonition): SuffixInlineAdmonition {
		if (data.type != InlineAdmonitionType.Suffix) {
			throw new Error("Cannot unmarshal data into SuffixInlineAdmonition: Wrong type: " + data.type);
		}
		return new SuffixInlineAdmonition(data.suffix ?? "", data.hideTriggerString ?? false, sharedFieldsFromData(data));
	}

	constructor(suffix: string, hideTriggerString: boolean, fields: SharedAdmonitionFields) {
		super(fields);
		this.suffix = suffix;
		this.hideTriggerString = hideTriggerString;
	}

	process(codeElement: HTMLElement) {
		if (codeElement.innerText.endsWith(this.suffix)) {
			this.cssClasses().forEach(c => codeElement.classList.add(c));
			// codeElement.setAttribute("style", this.simpleStyle());
			if (this.hideTriggerString) {
				codeElement.setText(codeElement.getText().replace(new RegExp(this.suffix + "$"), ""));
			}
			if (this.prefixIcon) {
				const iconElement = createSpan({cls: "admonition-icon-left"});
				setIcon(iconElement, this.prefixIcon);
				codeElement.prepend(iconElement);
			}
			if (this.suffixIcon) {
				const iconElement = createSpan({cls: "admonition-icon-right"});
				setIcon(iconElement, this.suffixIcon);
				codeElement.append(iconElement);
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

			// Hide the suffix if necessary
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
		}
	}

	cssClasses(): string[] {
		const classes = super.cssClasses();
		classes.push("iad-suffix")
		classes.push("iad-suffix-" + sanitizeClassName(this.suffix));
		return classes;
	}

	sampleText() {
		//  Need to include the trigger so the process method actually triggers
		// if (this.hideTriggerString) {
		// 	return "sample text";
		// }
		return "sample text " + this.suffix;
	}

	buildSettings(contentEl: HTMLElement, updateSampleFunction: () => void): Setting[] {
		const results = new Array<Setting>();

		results.push(new Setting(contentEl)
			.setName("Suffix")
			.setDesc("Text the code span must end with to match.")
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
			.setDesc("Remove the suffix from the displayed admonition.")
			.addToggle((toggle) => toggle
				.setValue(this.hideTriggerString)
				.onChange((val) => {
					this.hideTriggerString = val;
					updateSampleFunction();
				})
			)
		);

		return results;
	}

	public toString = (): string => {
		return "SuffixInlineAdmonition(" + this.suffix + ", hidePrefix: " + this.hideTriggerString + ")";
	}

	public asTitle() {
		return "Suffix type (trigger: " + this.suffix + ")"
	}
}
