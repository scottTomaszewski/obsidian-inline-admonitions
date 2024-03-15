import {InlineAdmonition} from "./inlineAdmonition";
import {InlineAdmonitionSettings} from "../settings/inlineAdmonitionSettings";

export class InlineAdmonitionsPostProcessor {
	settings: InlineAdmonitionSettings;

	constructor(settings) {
		this.settings = settings;
	}

	postProcess(element, context) {
		element.findAll("code").forEach(codeblock => {
			this.settings.inlineAdmonitions.forEach((iad: InlineAdmonition) => iad.process(codeblock));
		});
	}
}
