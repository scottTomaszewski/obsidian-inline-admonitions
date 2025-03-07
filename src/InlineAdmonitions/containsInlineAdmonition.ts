import {sanitizeClassName, slugify} from "../utils";
import {InlineAdmonition} from "./inlineAdmonition";
import {Setting} from "obsidian";
import {InlineAdmonitionType} from "./inlineAdmonitionType";
import {SyntaxNodeRef} from "@lezer/common";
import {RangeSetBuilder} from "@codemirror/state";
import {Decoration} from "@codemirror/view";

export class ContainsInlineAdmonition extends InlineAdmonition {
	contains: string;
	prefixIcon: string; // New property for icon
	type = InlineAdmonitionType.Contains;

	// TODO - I dont like this...
	static create() {
		return new ContainsInlineAdmonition(
			"",
			"",
			"#f1f1f1",
			100,
			"#000000",
			100,
			InlineAdmonition.generateSlug());
	}

	static unmarshal(data: any): ContainsInlineAdmonition {
		if (data.type != InlineAdmonitionType.Contains) {
			throw new Error("Cannot unmarshal data into ContainsInlineAdmonition: Wrong type: " + data.type);
		}
		return new ContainsInlineAdmonition(
			data.contains,
			data.icon,
			data.backgroundColor,
			data.bgColorOpacityPercent,
			data.color,
			data.colorOpacityPercent,
			data.slug);
	}

	constructor(contains: string,
				icon: string,
				backgroundColor: string,
				bgColorOpacityPercent: number,
				color: string,
				colorOpacityPercent: number,
				slug: string) {
		super(backgroundColor, bgColorOpacityPercent, color, colorOpacityPercent, slug);
		this.contains = contains;
		this.prefixIcon = icon;
	}

	process(codeElement: HTMLElement) {
		if (codeElement.innerText.contains(this.contains)) {
			this.cssClasses().forEach(c => codeElement.classList.add(c));
			// codeElement.setAttribute("style", this.simpleStyle());
			if (this.prefixIcon) {
				const iconElement = document.createElement("span");
				iconElement.classList.add("admonition-icon");
				iconElement.innerText = this.prefixIcon;
				codeElement.prepend(iconElement);
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
		return "ContainsInlineAdmonition(" + this.contains + ")"
	}
}
