import {slugify} from "../utils";
import {InlineAdmonition} from "./inlineAdmonition";
import {Setting} from "obsidian";
import {InlineAdmonitionType} from "./inlineAdmonitionType";

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

	constructor(prefix, hideTriggerString, backgroundColor, color, slug) {
		super(backgroundColor, color, slug);
		this.prefix = prefix;
		this.hideTriggerString = hideTriggerString;
	}

	process(codeElement: HTMLElement) {
		if (codeElement.innerText.startsWith(this.prefix)) {
			codeElement.classList.add("iad");
			codeElement.classList.add("iad-prefix-" + slugify(this.prefix));
			codeElement.setAttribute("style", `background-color: ${this.backgroundColor}; color: ${this.color};`);
			if (this.hideTriggerString) {
				codeElement.setText(codeElement.getText().replace(this.prefix, ""));
			}
		}
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
