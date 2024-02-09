import {slugify} from "../utils";
import {InlineAdmonition} from "./inlineAdmonition";
import {Setting} from "obsidian";
import {InlineAdmonitionType} from "./inlineAdmonitionType";

export class SuffixInlineAdmonition extends InlineAdmonition {
	suffix: string;
	type = InlineAdmonitionType.Suffix;

	// TODO - I dont like this...
	static create() {
		return new SuffixInlineAdmonition("", "#f1f1f1", "#000000", InlineAdmonition.generateSlug());
	}

	static unmarshal(data: any): SuffixInlineAdmonition {
		if (data.type != InlineAdmonitionType.Suffix) {
			throw new Error("Cannot unmarshal data into SuffixInlineAdmonition: Wrong type: " + data.type);
		}
		return new SuffixInlineAdmonition(data.suffix, data.backgroundColor, data.color, data.slug);
	}

	constructor(suffix, backgroundColor, color, slug) {
		super(backgroundColor, color, slug);
		this.suffix = suffix;
	}

	process(codeElement: HTMLElement) {
		if (codeElement.innerText.endsWith(this.suffix)) {
			codeElement.classList.add("iad");
			codeElement.classList.add("iad-suffix-" + slugify(this.suffix));
			codeElement.setAttribute(
				"style",
				`background-color: ${this.backgroundColor};color: ${this.color}`);
		}
	}

	sampleText() {
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
		return results;
	}

	public toString = (): string => {
		return "SuffixInlineAdmonition(" + this.suffix + ")"
	}
}
