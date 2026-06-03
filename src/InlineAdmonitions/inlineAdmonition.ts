import {InlineAdmonitionType} from "./inlineAdmonitionType";
import {Setting} from "obsidian";
import {v4 as uuidv4} from "uuid";
import {SyntaxNodeRef} from "@lezer/common";
import {Decoration} from "@codemirror/view";
import {RangeSetBuilder} from "@codemirror/state";
import {appendOpacityToHexColor, borderCss, textStyleCss} from "../utils";

// The shape of an InlineAdmonition as persisted in data.json. All
// type-specific fields are optional since they only exist for some types,
// and older versions may be missing fields that migrations backfill.
export interface SerializedInlineAdmonition {
	type: InlineAdmonitionType;
	slug?: string;
	backgroundColor: string;
	bgColorOpacityPercent: number;
	color: string;
	colorOpacityPercent: number;
	prefixIcon: string;
	suffixIcon: string;
	fontFamily?: string;
	hideBackground?: boolean;
	hideTriggerString?: boolean;
	prefix?: string;
	suffix?: string;
	contains?: string;
	regex?: string;
	sampleInput?: string;
	borderColor?: string;
	borderWidth?: number;
	borderStyle?: string;
	borderRadius?: number;
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
}

// The shared (non-trigger-specific) fields every InlineAdmonition carries. Passing
// these as one object keeps the subclass constructors readable as the field count
// grows (they were previously ~11 positional args).
export interface SharedAdmonitionFields {
	slug: string;
	backgroundColor: string;
	bgColorOpacityPercent: number;
	color: string;
	colorOpacityPercent: number;
	prefixIcon: string;
	suffixIcon: string;
	fontFamily: string;
	hideBackground: boolean;
	borderColor: string;
	borderWidth: number;
	borderStyle: string;
	borderRadius: number;
	bold: boolean;
	italic: boolean;
	underline: boolean;
}

// Defaults for a brand-new rule. Border defaults to "" (inherit theme border) and
// radius 0 (inherit theme radius) so a fresh rule looks identical to pre-feature rules.
export function defaultSharedFields(): SharedAdmonitionFields {
	return {
		slug: InlineAdmonition.generateSlug(),
		backgroundColor: "#f1f1f1",
		bgColorOpacityPercent: 100,
		color: "#000000",
		colorOpacityPercent: 100,
		prefixIcon: "",
		suffixIcon: "",
		fontFamily: "",
		hideBackground: false,
		borderColor: "#000000",
		borderWidth: 1,
		borderStyle: "",
		borderRadius: 0,
		bold: false,
		italic: false,
		underline: false,
	};
}

// Reads shared fields out of persisted data, backfilling any missing field. Older
// data.json files (pre-migration) may omit the newer fields.
export function sharedFieldsFromData(data: SerializedInlineAdmonition): SharedAdmonitionFields {
	return {
		slug: data.slug ?? InlineAdmonition.generateSlug(),
		backgroundColor: data.backgroundColor,
		bgColorOpacityPercent: data.bgColorOpacityPercent,
		color: data.color,
		colorOpacityPercent: data.colorOpacityPercent,
		prefixIcon: data.prefixIcon,
		suffixIcon: data.suffixIcon,
		fontFamily: data.fontFamily || "",
		hideBackground: data.hideBackground || false,
		borderColor: data.borderColor ?? "#000000",
		borderWidth: data.borderWidth ?? 1,
		borderStyle: data.borderStyle ?? "",
		borderRadius: data.borderRadius ?? 0,
		bold: data.bold ?? false,
		italic: data.italic ?? false,
		underline: data.underline ?? false,
	};
}

export abstract class InlineAdmonition {
	backgroundColor: string;
	bgColorOpacityPercent: number;
	color: string;
	colorOpacityPercent: number;
	type: InlineAdmonitionType;
	slug: string;
	prefixIcon: string;
	suffixIcon: string;
	fontFamily: string;
	hideBackground: boolean;
	borderColor: string;
	borderWidth: number;
	borderStyle: string;
	borderRadius: number;
	bold: boolean;
	italic: boolean;
	underline: boolean;

	protected constructor(fields: SharedAdmonitionFields) {
		this.slug = fields.slug;
		this.backgroundColor = fields.backgroundColor;
		this.bgColorOpacityPercent = fields.bgColorOpacityPercent;
		this.color = fields.color;
		this.colorOpacityPercent = fields.colorOpacityPercent;
		this.prefixIcon = fields.prefixIcon;
		this.suffixIcon = fields.suffixIcon;
		this.fontFamily = fields.fontFamily;
		this.hideBackground = fields.hideBackground;
		this.borderColor = fields.borderColor;
		this.borderWidth = fields.borderWidth;
		this.borderStyle = fields.borderStyle;
		this.borderRadius = fields.borderRadius;
		this.bold = fields.bold;
		this.italic = fields.italic;
		this.underline = fields.underline;
	}

	public abstract process(codeElement: HTMLElement): void;

	public abstract applyTo(node: SyntaxNodeRef, content: string, builder: RangeSetBuilder<Decoration>): void;

	abstract sampleText(): string;

	abstract buildSettings(contentEl: HTMLElement, updateSampleFunction: () => void): Array<Setting>;

	public abstract asTitle(): string;

	public cssClasses(): string[] {
		return ["iad"];
	}

	public simpleStyle() {
		let style = "";
		if (this.hideBackground) {
			style += "background-color: transparent; border: none; padding: 0; border-radius: 0;";
		} else {
			style += `background-color: ${this.evalBackgroundColor()};`;
			style += borderCss(this.borderStyle, this.borderWidth, this.borderColor, this.borderRadius);
		}
		style += ` color: ${this.evalColor()};`;
		if (this.fontFamily) {
			style += ` font-family: ${this.fontFamily};`;
		}
		style += textStyleCss(this.bold, this.italic, this.underline);
		return style;
	}

	copySettingsTo(other: InlineAdmonition) {
		other.backgroundColor = this.backgroundColor;
		other.bgColorOpacityPercent = this.bgColorOpacityPercent;
		other.color = this.color;
		other.colorOpacityPercent = this.colorOpacityPercent;
		other.prefixIcon = this.prefixIcon;
		other.suffixIcon = this.suffixIcon;
		other.fontFamily = this.fontFamily;
		other.hideBackground = this.hideBackground;
		other.borderColor = this.borderColor;
		other.borderWidth = this.borderWidth;
		other.borderStyle = this.borderStyle;
		other.borderRadius = this.borderRadius;
		other.bold = this.bold;
		other.italic = this.italic;
		other.underline = this.underline;
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
