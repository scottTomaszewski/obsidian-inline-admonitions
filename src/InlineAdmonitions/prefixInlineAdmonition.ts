import {sanitizeClassName} from "../utils";
import {InlineAdmonition, SerializedInlineAdmonition, SharedAdmonitionFields, defaultSharedFields, sharedFieldsFromData} from "./inlineAdmonition";
import {setIcon, Setting} from "obsidian";
import {InlineAdmonitionType} from "./inlineAdmonitionType";
import {SyntaxNodeRef} from "@lezer/common";
import {RangeSetBuilder} from "@codemirror/state";
import {Decoration} from "@codemirror/view";

export class PrefixInlineAdmonition extends InlineAdmonition {
	prefix: string;
	hideTriggerString: boolean;
	type = InlineAdmonitionType.Prefix;

	static create() {
		return new PrefixInlineAdmonition("", false, defaultSharedFields());
	}

	static unmarshal(data: SerializedInlineAdmonition): PrefixInlineAdmonition {
		if (data.type != InlineAdmonitionType.Prefix) {
			throw new Error("Cannot unmarshal data into PrefixInlineAdmonition: Wrong type: " + data.type);
		}
		return new PrefixInlineAdmonition(data.prefix ?? "", data.hideTriggerString ?? false, sharedFieldsFromData(data));
	}

	constructor(prefix: string, hideTriggerString: boolean, fields: SharedAdmonitionFields) {
		super(fields);
		this.prefix = prefix;
		this.hideTriggerString = hideTriggerString;
	}

	process(codeElement: HTMLElement) {
		if (codeElement.innerText.startsWith(this.prefix)) {
			this.cssClasses().forEach(c => codeElement.classList.add(c));
			// codeElement.setAttribute("style", this.simpleStyle());
			if (this.hideTriggerString) {
				codeElement.setText(codeElement.getText().replace(this.prefix, ""));
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
		if (content.startsWith(this.prefix)) {
			builder.add(
				node.from,
				node.to,
				Decoration.mark({
					inclusive: true,
					attributes: {class: this.cssClasses().join(" ")},
					tagName: "span",
				})
			);

			// Hide the prefix if necessary
			if (this.hideTriggerString) {
				builder.add(
					node.from,
					node.from + this.prefix.length,
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
		classes.push("iad-prefix")
		classes.push("iad-prefix-" + sanitizeClassName(this.prefix));
		return classes;
	}

	sampleText() {
		//  Need to include the trigger so the process method actually triggers
		// if (this.hideTriggerString) {
		// 	return "sample text";
		// }
		return this.prefix + " sample text";
	}

	buildSettings(contentEl: HTMLElement, updateSampleFunction: () => void): Setting[] {
		const results = new Array<Setting>();

		results.push(new Setting(contentEl)
			.setName("Prefix")
			.setDesc("Text the code span must start with to match.")
			.addText((text) => text
				.setPlaceholder("Enter prefix")
				.setValue(this.prefix)
				.onChange((value) => {
					this.prefix = value;
					updateSampleFunction();
				})
			));

		results.push(new Setting(contentEl)
			.setName("Hide prefix text")
			.setDesc("Remove the prefix from the displayed admonition.")
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
		return "PrefixInlineAdmonition(" + this.prefix + ", hidePrefix: " + this.hideTriggerString + ")";
	}

	public asTitle() {
		return "Prefix type (trigger: " + this.prefix + ")"
	}
}
