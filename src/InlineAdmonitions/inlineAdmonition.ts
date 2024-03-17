import {InlineAdmonitionType} from "./inlineAdmonitionType";
import {Setting} from "obsidian";
import {v4 as uuidv4} from "uuid";
import {SyntaxNodeRef} from "@lezer/common";
import {Decoration, EditorView} from "@codemirror/view";
import {RangeSetBuilder} from "@codemirror/state";

export abstract class InlineAdmonition {
	backgroundColor: string;
	color: string;
	type: InlineAdmonitionType;
	slug: string;

	protected constructor(backgroundColor: string, color: string, slug: string) {
		this.backgroundColor = backgroundColor;
		this.color = color;
		this.slug = slug;
	}

	public abstract process(codeElement: HTMLElement);

	public abstract applyTo(node: SyntaxNodeRef, content: string, builder: RangeSetBuilder<Decoration>);

	abstract sampleText(): string;

	abstract buildSettings(contentEl: HTMLElement, updateSampleFunction): Array<Setting>;

	public cssClasses(): string[] {
		return ["iad"];
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
