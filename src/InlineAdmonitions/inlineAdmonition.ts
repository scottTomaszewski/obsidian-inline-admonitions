import {InlineAdmonitionType} from "./inlineAdmonitionType";
import {Setting} from "obsidian";
import {v4 as uuidv4} from "uuid";
import {SyntaxNodeRef} from "@lezer/common";
import {Decoration} from "@codemirror/view";
import {RangeSetBuilder} from "@codemirror/state";
import {appendOpacityToHexColor} from "../utils";

export abstract class InlineAdmonition {
	backgroundColor: string;
	bgColorOpacityPercent: number;
	color: string;
	colorOpacityPercent: number;
	type: InlineAdmonitionType;
	slug: string;
	prefixIcon: string;

	protected constructor(
		backgroundColor: string,
		bgColorOpacityPercent: number,
		color: string,
		colorOpacityPercent: number,
		slug: string,
		icon: string) {
		this.backgroundColor = backgroundColor;
		this.bgColorOpacityPercent = bgColorOpacityPercent;
		this.color = color;
		this.colorOpacityPercent = colorOpacityPercent;
		this.slug = slug;
		this.prefixIcon = icon;
	}

	public abstract process(codeElement: HTMLElement): void;

	public abstract applyTo(node: SyntaxNodeRef, content: string, builder: RangeSetBuilder<Decoration>): void;

	abstract sampleText(): string;

	abstract buildSettings(contentEl: HTMLElement, updateSampleFunction: () => void): Array<Setting>;

	public cssClasses(): string[] {
		return ["iad"];
	}

	public simpleStyle() {
		return `background-color: ${this.evalBackgroundColor()}; color: ${this.evalColor()};`;
	}

	copySettingsTo(other: InlineAdmonition) {
		other.backgroundColor = this.backgroundColor;
		other.bgColorOpacityPercent = this.bgColorOpacityPercent;
		other.color = this.color;
		other.colorOpacityPercent = this.colorOpacityPercent;
		other.prefixIcon = this.prefixIcon
	}

	public toString = (): string => {
		return "InlineAdmonition(" + this.evalBackgroundColor() + ", " + this.type + ")"
	}

	private evalBackgroundColor() {
		return appendOpacityToHexColor(this.backgroundColor, this.bgColorOpacityPercent);
	}

	private evalColor() {
		return appendOpacityToHexColor(this.color, this.colorOpacityPercent);
	}

	static generateSlug(): string {
		return uuidv4();
	}
}
