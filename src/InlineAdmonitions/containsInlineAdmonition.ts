import {sanitizeClassName, slugify} from "../utils";
import {InlineAdmonition} from "./inlineAdmonition";
import {setIcon, Setting} from "obsidian";
import {InlineAdmonitionType} from "./inlineAdmonitionType";
import {SyntaxNodeRef} from "@lezer/common";
import {RangeSetBuilder} from "@codemirror/state";
import {Decoration} from "@codemirror/view";

export class ContainsInlineAdmonition extends InlineAdmonition {
	contains: string;
	type = InlineAdmonitionType.Contains;

	// TODO - I dont like this...
	static create() {
		return new ContainsInlineAdmonition(
			"",
			"#f1f1f1",
			100,
			"#000000",
			100,
			InlineAdmonition.generateSlug(),
			"",
			"");
	}

	static unmarshal(data: any): ContainsInlineAdmonition {
		if (data.type != InlineAdmonitionType.Contains) {
			throw new Error("Cannot unmarshal data into ContainsInlineAdmonition: Wrong type: " + data.type);
		}
		return new ContainsInlineAdmonition(
			data.contains,
			data.backgroundColor,
			data.bgColorOpacityPercent,
			data.color,
			data.colorOpacityPercent,
			data.slug,
			data.prefixIcon,
			data.suffixIcon);
	}

	constructor(contains: string,
				backgroundColor: string,
				bgColorOpacityPercent: number,
				color: string,
				colorOpacityPercent: number,
				slug: string,
				prefixIcon: string,
				suffixIcon: string) {
		super(backgroundColor, bgColorOpacityPercent, color, colorOpacityPercent, slug, prefixIcon, suffixIcon);
		this.contains = contains;
	}

	process(codeElement: HTMLElement) {
		if (codeElement.innerText.contains(this.contains)) {
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
	}

	applyTo(node: SyntaxNodeRef, content: string, builder: RangeSetBuilder<Decoration>) {
		if (content.contains(this.contains)) {
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
	}

	cssClasses(): string[] {
		const classes = super.cssClasses();
		classes.push("iad-contains")
		classes.push("iad-contains-" + sanitizeClassName(this.contains));
		return classes;
	}

	sampleText() {
		return "sample " + this.contains + " text";
	}

	buildSettings(contentEl: HTMLElement, updateSampleFunction: () => void): Setting[] {
		const results = new Array<Setting>();
		results.push(new Setting(contentEl)
			.setName("Contains")
			.setDesc("Inline codeblock contains this string to trigger this formatting")
			.addText((text) => text
				.setPlaceholder("Enter contains")
				.setValue(this.contains)
				.onChange((value) => {
					this.contains = value;
					updateSampleFunction();
				})
			));
		return results;
	}

	public toString = (): string => {
		return "ContainsInlineAdmonition(" + this.contains + ")"
	}
}
