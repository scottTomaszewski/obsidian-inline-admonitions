import {PrefixInlineAdmonition} from "./prefixInlineAdmonition";
import {SuffixInlineAdmonition} from "./suffixInlineAdmonition";
import {InlineAdmonition} from "./inlineAdmonition";
import {ContainsInlineAdmonition} from "./containsInlineAdmonition";
import {Modal} from "obsidian";
import { RegexInlineAdmonition } from "./regexInlineAdmonition";

export enum InlineAdmonitionType {
	Prefix = "prefix",
	Suffix = "suffix",
	Contains = "contains",
	Regex = "regex"
}

export namespace InlineAdmonitionType {
	export function create(type: InlineAdmonitionType): InlineAdmonition {
		switch (type) {
			case InlineAdmonitionType.Prefix:
				return PrefixInlineAdmonition.create();
			case InlineAdmonitionType.Suffix:
				return SuffixInlineAdmonition.create();
			case InlineAdmonitionType.Contains:
				return ContainsInlineAdmonition.create();
			case InlineAdmonitionType.Regex:
				return RegexInlineAdmonition.create();
			default:
				throw new Error("Cannot create, invalid Inline Admonition type")
		}
	}

	export function from(type: string): InlineAdmonitionType {
		switch (type) {
			case InlineAdmonitionType.Prefix:
				return InlineAdmonitionType.Prefix
			case InlineAdmonitionType.Suffix:
				return InlineAdmonitionType.Suffix
			case InlineAdmonitionType.Contains:
				return InlineAdmonitionType.Contains
			case InlineAdmonitionType.Regex:
				return InlineAdmonitionType.Regex
			default:
				throw new Error("Invalid Inline Admonition type: " + type)
		}
	}

	// for convenience...
	export function createFrom(type: string): InlineAdmonition {
		return create(from(type));
	}

	export function unmarshal(data: any) {
		const type = from(data.type)
		switch (type) {
			case InlineAdmonitionType.Prefix:
				return PrefixInlineAdmonition.unmarshal(data);
			case InlineAdmonitionType.Suffix:
				return SuffixInlineAdmonition.unmarshal(data);
			case InlineAdmonitionType.Contains:
				return ContainsInlineAdmonition.unmarshal(data);
			case InlineAdmonitionType.Regex:
				return RegexInlineAdmonition.unmarshal(data);
			default:
				throw new Error("Cannot Unmarshal, invalid Inline Admonition type: " + type)
		}
	}

	export function tooltip(): string {
		return `
The "type" defines what triggers an Inline Admonition
		
 - Prefix: Triggered if a codeblock starts with the string.
 - Suffix: Triggered if a codeblock ends with the string.
 - Contains: Triggered if a codeblock contains the string anywhere within it.
 - Regex: Triggered if a codeblock matches the regular expression.
 `
	}
}

export class TypeTooltipModal extends Modal {
	onOpen() {
		super.onOpen();
		const {contentEl} = this;
		contentEl.createDiv({
			text: InlineAdmonitionType.tooltip(),
			attr: {"style": "white-space: pre-wrap;"}
		});
	}
}
