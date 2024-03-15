import {InlineAdmonitionType} from "./inlineAdmonitionType";
import {Setting} from "obsidian";
import {v4 as uuidv4} from "uuid";
import {SyntaxNodeRef} from "@lezer/common";
import {EditorView} from "@codemirror/view";

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

	public abstract appliesTo(node: SyntaxNodeRef, content: string): boolean;

	abstract sampleText(): string;

	abstract buildSettings(contentEl: HTMLElement, updateSampleFunction): Array<Setting>;

	public cssClasses(): string {
		return "iad";
	}

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
