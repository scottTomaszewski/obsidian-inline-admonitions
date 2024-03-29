import {slugify} from "../utils";
import {InlineAdmonition} from "./inlineAdmonition";
import {Setting} from "obsidian";
import {InlineAdmonitionType} from "./inlineAdmonitionType";

export class SuffixInlineAdmonition extends InlineAdmonition {
	suffix: string;
	hideTriggerString: boolean;
	type = InlineAdmonitionType.Suffix;

	// TODO - I dont like this...
	static create() {
		return new SuffixInlineAdmonition(
			"",
			false,
			"#f1f1f1",
			"#000000",
			InlineAdmonition.generateSlug());
	}

	static unmarshal(data: any): SuffixInlineAdmonition {
		if (data.type != InlineAdmonitionType.Suffix) {
			throw new Error("Cannot unmarshal data into SuffixInlineAdmonition: Wrong type: " + data.type);
		}
		return new SuffixInlineAdmonition(
			data.suffix,
			data.hideTriggerString,
			data.backgroundColor,
			data.color,
			data.slug);
	}

	constructor(suffix, hideTriggerString, backgroundColor, color, slug) {
		super(backgroundColor, color, slug);
		this.suffix = suffix;
		this.hideTriggerString = hideTriggerString;
	}

	process(codeElement: HTMLElement) {
		if (codeElement.innerText.endsWith(this.suffix)) {
			codeElement.classList.add("iad");
			codeElement.classList.add("iad-suffix-" + slugify(this.suffix));
			codeElement.setAttribute("style", `background-color: ${this.backgroundColor}; color: ${this.color};`);
			if (this.hideTriggerString) {
				codeElement.setText(codeElement.getText().replace(new RegExp(this.suffix + "$"), ""));
			}
		}
	}

	sampleText() {
		if (this.hideTriggerString) {
			return "sample text";
		}
		return "sample text " + this.suffix;
	}

	buildSettings(contentEl: HTMLElement, updateSampleFunction): Setting[] {
		let results = new Array<Setting>();

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

		return results;
	}

	public toString = (): string => {
		return "SuffixInlineAdmonition(" + this.suffix + ", hidePrefix: " + this.hideTriggerString + ")";
	}
}
