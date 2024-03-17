import {slugify} from "../utils";
import {InlineAdmonition} from "./inlineAdmonition";
import {Setting} from "obsidian";
import {InlineAdmonitionType} from "./inlineAdmonitionType";
import {SyntaxNodeRef} from "@lezer/common";
import {RangeSetBuilder} from "@codemirror/state";
import {Decoration} from "@codemirror/view";

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
			"#000000",
			InlineAdmonition.generateSlug());
	}

	static unmarshal(data: any): PrefixInlineAdmonition {
		if (data.type != InlineAdmonitionType.Prefix) {
			throw new Error("Cannot unmarshal data into PrefixInlineAdmonition: Wrong type: " + data.type);
		}
		return new PrefixInlineAdmonition(
			data.prefix,
			data.hideTriggerString,
			data.backgroundColor,
			data.color,
			data.slug);
	}

	constructor(prefix: string, hideTriggerString: boolean, backgroundColor: string, color: string, slug: string) {
		super(backgroundColor, color, slug);
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
					tagName: "span"
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
		classes.push("iad-prefix-" + slugify(this.prefix));
		return classes;
	}

	sampleText() {
		if (this.hideTriggerString) {
			return "sample text";
		}
		return this.prefix + " sample text";
	}

	buildSettings(contentEl: HTMLElement, updateSampleFunction): Setting[] {
		let results = new Array<Setting>();

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
