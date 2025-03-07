import {sanitizeClassName, slugify} from "../utils";
import {InlineAdmonition} from "./inlineAdmonition";
import {setIcon, Setting} from "obsidian";
import {InlineAdmonitionType} from "./inlineAdmonitionType";
import {SyntaxNodeRef} from "@lezer/common";
import {RangeSetBuilder} from "@codemirror/state";
import {Decoration} from "@codemirror/view";
import {MarkdownRendererSingleton} from "../io/MarkdownRenderer";

export class PrefixInlineAdmonition extends InlineAdmonition {
	prefix: string;
	hideTriggerString: boolean;
	type = InlineAdmonitionType.Prefix;

	// TODO - I dont like this...
	static create() {
		return new PrefixInlineAdmonition(
			"",
			false,
			"#f1f1f1",
			100,
			"#000000",
			100,
			InlineAdmonition.generateSlug(),
			"");
	}

	static unmarshal(data: any): PrefixInlineAdmonition {
		if (data.type != InlineAdmonitionType.Prefix) {
			throw new Error("Cannot unmarshal data into PrefixInlineAdmonition: Wrong type: " + data.type);
		}
		return new PrefixInlineAdmonition(
			data.prefix,
			data.hideTriggerString,
			data.backgroundColor,
			data.bgColorOpacityPercent,
			data.color,
			data.colorOpacityPercent,
			data.slug,
			data.icon);
	}

	constructor(prefix: string,
				hideTriggerString: boolean,
				backgroundColor: string,
				bgColorOpacityPercent: number,
				color: string,
				colorOpacityPercent: number,
				slug: string,
				prefixIcon: string) {
		super(backgroundColor, bgColorOpacityPercent, color, colorOpacityPercent, slug, prefixIcon);
		this.prefix = prefix;
		this.hideTriggerString = hideTriggerString;
		this.prefixIcon = prefixIcon;
	}

	process(codeElement: HTMLElement, sourcePath: string) {
		if (codeElement.innerText.startsWith(this.prefix)) {
			this.cssClasses().forEach(c => codeElement.classList.add(c));
			// codeElement.setAttribute("style", this.simpleStyle());
			if (this.hideTriggerString) {
				codeElement.setText(codeElement.getText().replace(this.prefix, ""));
			}

			if (this.prefixIcon) {
				const iconElement = document.createElement("span");
				iconElement.classList.add("admonition-icon");
				setIcon(iconElement, this.prefixIcon);
				codeElement.prepend(iconElement);

				// let contents = codeElement.getText();
				// codeElement.empty();
				// contents = ":" + this.prefixIcon + ": " + contents;
				// MarkdownRendererSingleton.getInstance().renderMD(contents, codeElement, sourcePath);
			}
		}
	}

	applyTo(node: SyntaxNodeRef, content: string, builder: RangeSetBuilder<Decoration>) {
		if (content.startsWith(this.prefix)) {
			builder.add(
				node.from,
				node.to,
				Decoration.replace({
					inclusive: true,
					widget: {
						// This method will replace the entire range [node.from, node.to]
						// with a <span> that includes both icon and text
						toDOM: () => {
							const outerSpan = document.createElement("span");
							outerSpan.classList.add(...this.cssClasses());

							// Add icon if we have one
							if (this.prefixIcon) {
								const iconSpan = document.createElement("span");
								iconSpan.classList.add("admonition-icon");
								setIcon(iconSpan, this.prefixIcon);
								outerSpan.appendChild(iconSpan);
							}

							// If hideTriggerString is on, skip over the prefix in the displayed text
							let textToShow = content;
							if (this.hideTriggerString) {
								textToShow = textToShow.slice(this.prefix.length);
							}
							outerSpan.appendChild(document.createTextNode(textToShow));

							return outerSpan;
						}
					}
				})
			);
		}
	}

	cssClasses(): string[] {
		const classes = super.cssClasses();
		classes.push("iad-prefix")
		classes.push("iad-prefix-" + sanitizeClassName(this.prefix));
		return classes;
	}

	sampleText() {
		if (this.hideTriggerString) {
			return "sample text";
		}
		return this.prefix + " sample text";
	}

	buildSettings(contentEl: HTMLElement, updateSampleFunction: () => void): Setting[] {
		const results = new Array<Setting>();

		results.push(new Setting(contentEl)
			.setName("Prefix")
			.setDesc("Inline codeblock prefix to trigger this formatting")
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
			.setDesc("If enabled, the 'prefix' text will not show in resulting Inline Admonition")
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
}
