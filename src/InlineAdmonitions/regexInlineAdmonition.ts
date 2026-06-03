import {sanitizeClassName} from "../utils";
import {InlineAdmonition, SerializedInlineAdmonition, SharedAdmonitionFields, defaultSharedFields, sharedFieldsFromData} from "./inlineAdmonition";
import {setIcon, Setting} from "obsidian";
import {InlineAdmonitionType} from "./inlineAdmonitionType";
import {SyntaxNodeRef} from "@lezer/common";
import {RangeSetBuilder} from "@codemirror/state";
import {Decoration} from "@codemirror/view";

export class RegexInlineAdmonition extends InlineAdmonition {
	regex: string;
	sampleInput: string;
	type = InlineAdmonitionType.Regex;

	static create() {
		return new RegexInlineAdmonition("", "", defaultSharedFields());
	}

	static unmarshal(data: SerializedInlineAdmonition): RegexInlineAdmonition {
		if (data.type != InlineAdmonitionType.Regex) {
			throw new Error("Cannot unmarshal data into RegexInlineAdmonition: Wrong type: " + data.type);
		}
		return new RegexInlineAdmonition(data.regex ?? "", data.sampleInput ?? "", sharedFieldsFromData(data));
	}

	constructor(regex: string, sampleInput: string, fields: SharedAdmonitionFields) {
		super(fields);
		this.regex = regex;
		this.sampleInput = sampleInput;
	}

	process(codeElement: HTMLElement) {
		try {
			const regex = new RegExp(this.regex);
			if (regex.test(codeElement.innerText)) {
				this.cssClasses().forEach(c => codeElement.classList.add(c));
				// codeElement.setAttribute("style", this.simpleStyle());

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
		} catch (e) {
			console.error("Error processing regex admonition: ", e);
		}
	}

	applyTo(node: SyntaxNodeRef, content: string, builder: RangeSetBuilder<Decoration>) {
		try {
			const regex = new RegExp(this.regex);
			if (regex.test(content)) {
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
		} catch (e) {
			console.error("Error applying regex admonition: ", e);
		}
	}

	cssClasses(): string[] {
		const classes = super.cssClasses();
		classes.push("iad-regex");
		classes.push("iad-regex-" + sanitizeClassName(this.regex));
		return classes;
	}

	sampleText() {
		return "sample " + this.sampleInput + " match";
	}

	buildSettings(contentEl: HTMLElement, updateSampleFunction: () => void): Setting[] {
		let iconButton: import('obsidian').ButtonComponent;
		const results = new Array<Setting>();
		results.push(new Setting(contentEl)
			.setName("Regex")
			.setDesc("Inline codeblock matches this regex to trigger this formatting")
			.addText((text) => text
				.setPlaceholder("Enter regex")
				.setValue(this.regex)
				.onChange((value) => {
					this.regex = value;
					updateSampleFunction();
				})
			));
		results.push(new Setting(contentEl)
			.setName("Sample input")
			.setDesc("Use this for testing your regex and for assisting the sample display")
			.addText((text) => text
				.setPlaceholder("Text match for regex")
				.setValue(this.sampleInput)
				.onChange((value) => {
					this.sampleInput = value;
					const regex = new RegExp(this.regex);
					const ok = regex.test(value);
					iconButton.setIcon(ok ? 'checkmark' : 'alert-triangle')
					updateSampleFunction();
				}))
			.addButton((btn) => {
				iconButton = btn
					.setIcon(new RegExp(this.regex).test(this.sampleInput) ? 'checkmark' : 'alert-triangle')
					.setTooltip('Regex match');
				// no onClick needed, it’s purely for status
			}));
		return results;
	}

	public toString = (): string => {
		return "RegexInlineAdmonition(/" + this.regex + "/)";
	}

	public asTitle() {
		return "Regex type (trigger: /" + this.regex + "/)"
	}
} 
