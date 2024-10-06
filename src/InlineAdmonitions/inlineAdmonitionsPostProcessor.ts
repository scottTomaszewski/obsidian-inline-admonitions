import {InlineAdmonition} from "./inlineAdmonition";
import {InlineAdmonitionSettings} from "../settings/inlineAdmonitionSettings";
import { MarkdownPostProcessorContext } from "obsidian";

export class InlineAdmonitionsPostProcessor {
	settings: InlineAdmonitionSettings;

	constructor(settings: InlineAdmonitionSettings) {
		this.settings = settings;
	}

	postProcess(element: HTMLElement, context: MarkdownPostProcessorContext) {
		element.findAll("code").forEach(codeblock => {
			this.settings.inlineAdmonitions.forEach((iad: InlineAdmonition) => iad.process(codeblock, context.sourcePath));
		});
	}
}
