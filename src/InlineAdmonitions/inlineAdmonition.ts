import {InlineAdmonitionType} from "./inlineAdmonitionType";
import {Setting} from "obsidian";
import {v4 as uuidv4} from "uuid";

export abstract class InlineAdmonition {
	backgroundColor: string;
	color: string;
	type: InlineAdmonitionType;
	slug: string;

	protected constructor(backgroundColor, color, slug) {
		this.backgroundColor = backgroundColor;
		this.color = color;
		this.slug = slug;
	}

	public abstract process(codeElement: HTMLElement);

	abstract sampleText(): string;

	abstract buildSettings(contentEl: HTMLElement, updateSampleFunction): Array<Setting>;

	copySettingsTo(other: InlineAdmonition) {
		other.backgroundColor = this.backgroundColor;
		other.color = this.color;
	}

	public toString = (): string => {
		return "InlineAdmonition(" + this.backgroundColor + ", " + this.type + ")"
	}

	static generateSlug(): string {
		return uuidv4();
	}
}
