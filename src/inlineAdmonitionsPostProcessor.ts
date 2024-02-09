import {InlineAdmonitionSettings} from "./inlineAdmonitionSettings";
import {InlineAdmonition} from "./InlineAdmonitions/inlineAdmonition";

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
