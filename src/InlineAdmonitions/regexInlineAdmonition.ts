import {sanitizeClassName} from "../utils";
import {InlineAdmonition} from "./inlineAdmonition";
import {removeIcon, setIcon, Setting} from "obsidian";
import {InlineAdmonitionType} from "./inlineAdmonitionType";
import {SyntaxNodeRef} from "@lezer/common";
import {RangeSetBuilder} from "@codemirror/state";
import {Decoration} from "@codemirror/view";

export class RegexInlineAdmonition extends InlineAdmonition {
	regex: string;
	sampleInput: string;
	type = InlineAdmonitionType.Regex;

	// TODO - I dont like this...
	static create() {
		return new RegexInlineAdmonition(
			"",
			"",
			"#f1f1f1",
			100,
			"#000000",
			100,
			InlineAdmonition.generateSlug(),
			"",
			"");
	}

	static unmarshal(data: any): RegexInlineAdmonition {
		if (data.type != InlineAdmonitionType.Regex) {
			throw new Error("Cannot unmarshal data into RegexInlineAdmonition: Wrong type: " + data.type);
		}
		return new RegexInlineAdmonition(
			data.regex,
			data.sampleInput,
			data.backgroundColor,
			data.bgColorOpacityPercent,
			data.color,
			data.colorOpacityPercent,
			data.slug,
			data.prefixIcon,
			data.suffixIcon);
	}

	constructor(regex: string,
				sampleInput: string,
				backgroundColor: string,
				bgColorOpacityPercent: number,
				color: string,
				colorOpacityPercent: number,
				slug: string,
				prefixIcon: string,
				suffixIcon: string) {
		super(backgroundColor, bgColorOpacityPercent, color, colorOpacityPercent, slug, prefixIcon, suffixIcon);
		this.regex = regex;
		this.sampleInput = sampleInput;
	}

	process(codeElement: HTMLElement) {
		try {
			const regex = new RegExp(this.regex);
			if (regex.test(codeElement.innerText)) {
				this.cssClasses().forEach(c => codeElement.classList.add(c));
				// codeElement.setAttribute("style", this.simpleStyle());

				// TODO - margin on left vs right
				if (this.prefixIcon) {
					const iconElement = document.createElement("span");
					iconElement.classList.add("admonition-icon-left");
					setIcon(iconElement, this.prefixIcon);
					codeElement.prepend(iconElement);
				}
				if (this.suffixIcon) {
					const iconElement = document.createElement("span");
					iconElement.classList.add("admonition-icon-right");
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
} 
