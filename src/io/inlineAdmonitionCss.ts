import {readSnippetFile, writeSnippetFile} from "./snippets";
import {App} from "obsidian";
import * as css from "css";

const snippetFilename = "inlineAdmonitionsPluginReadOnly.css"

export async function getCssForClass(app: App, className: string): Promise<string> {
	return _getCssForClass(className, await cssFileContents(app))
}

export async function setCssForClass(app: App, className: string, css: string) {
	const updatedCss = _setCssForClass(className, css, await cssFileContents(app));
	return writeSnippetFile(app, snippetFilename, updatedCss);
}

export async function wipeCss(app: App) {
	return writeSnippetFile(app, snippetFilename, "");
}

// ==========
//  INTERNAL
// ==========

async function cssFileContents(app: App): Promise<string> {
	return readSnippetFile(app, snippetFilename);
}

// Gets the css declarations for the className in entire cssContent (css file)
function _getCssForClass(className: string, cssContent: string): string {
	// TODO - add source
	let obj = css.parse(cssContent, {});
	let sheet = obj.stylesheet;

	for (const rule of sheet.rules) {
		if (rule.selectors.contains("." + className)) {
			let classContent: string = "";
			rule.declarations.forEach(dec => {
				classContent += dec.property + ':' + dec.value + ';\n';
			});
			return classContent;
		}
	}
	return "";
}

// Sets the css declarations for the className to cssClassContent within the cssFileContent
export function _setCssForClass(className: string, cssClassDeclarations: string, cssFileContent: string): string {
	// TODO - add source
	let fileObj = css.parse(cssFileContent, {});
	let fileSheet = fileObj.stylesheet;

	for (const rule of fileSheet.rules) {
		if (rule.selectors.contains("." + className)) {
			rule.declarations = _makeCssRule(className, cssClassDeclarations).declarations
			return css.stringify(fileObj);
		}
	}
	fileSheet.rules.push(_makeCssRule(className, cssClassDeclarations));
	return css.stringify(fileObj);
}

function _makeCssRuleString(className: string, cssDeclarations: string): string {
	// TODO - The ".iad" is here to increase the precedence.  I dont like it
	return ".iad." + className + " {\n" + cssDeclarations + "\n}";
}

function _makeCssRule(className: string, cssDeclarations: string) {
	let cssString = _makeCssRuleString(className, cssDeclarations);
	return css.parse(cssString, {}).stylesheet.rules[0];
}
