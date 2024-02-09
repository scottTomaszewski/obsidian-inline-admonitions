import {InlineAdmonition} from "./InlineAdmonitions/inlineAdmonition";

export interface InlineAdmonitionSettings {
	version: number;
	inlineAdmonitions: Map<string, InlineAdmonition>;
}

export const DEFAULT_SETTINGS: InlineAdmonitionSettings = {
	version: 0,
	inlineAdmonitions: new Map<string, InlineAdmonition>()
}
