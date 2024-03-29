import {slugify} from "../utils";
import {InlineAdmonition} from "./inlineAdmonition";
import {Setting} from "obsidian";
import {InlineAdmonitionType} from "./inlineAdmonitionType";

export class ContainsInlineAdmonition extends InlineAdmonition {
	contains: string;
	type = InlineAdmonitionType.Contains;

	// TODO - I dont like this...
	static create() {
		return new ContainsInlineAdmonition("", "#f1f1f1", "#000000", InlineAdmonition.generateSlug());
	}

	static unmarshal(data: any): ContainsInlineAdmonition {
		if (data.type != InlineAdmonitionType.Contains) {
			throw new Error("Cannot unmarshal data into ContainsInlineAdmonition: Wrong type: " + data.type);
		}
		return new ContainsInlineAdmonition(data.contains, data.backgroundColor, data.color, data.slug);
	}

	constructor(contains, backgroundColor, color, slug) {
		super(backgroundColor, color, slug);
		this.contains = contains;
	}

	process(codeElement: HTMLElement) {
		if (codeElement.innerText.contains(this.contains)) {
			codeElement.classList.add("iad");
			codeElement.classList.add("iad-contains-" + slugify(this.contains));
			codeElement.setAttribute(
				"style",
				`background-color: ${this.backgroundColor};color: ${this.color}`);
		}
	}

	sampleText() {
		return "sample " + this.contains + " text";
	}

	buildSettings(contentEl: HTMLElement, updateSampleFunction): Setting[] {
		let results = new Array<Setting>();
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
