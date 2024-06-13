import {createSnippetFile, readSnippetFile, writeSnippetFile} from "./snippets";
import {App} from "obsidian";
import * as css from "css";

export const snippetName = "inlineAdmonitionsPluginReadOnly"
const snippetFilename = snippetName + ".css"
const header = `/*
WARNING: THIS FILE IS AUTOGENERATED BY THE INLINE ADMONITION PLUGIN. DO NOT MODIFY!
*/
`;

export async function getCssForClass(app: App, className: string): Promise<string> {
	return _getCssForClass(className, await cssFileContents(app))
}

export async function setCssForClass(app: App, className: string, css: string) {
	const updatedCss = _setCssForClass(className, css, await cssFileContents(app));
	//https://discord.com/channels/686053708261228577/840286264964022302/1220596234545401906
	app.customCss.setCssEnabledStatus(snippetName, true);
	await app.customCss.readSnippets();
	await app.customCss.requestLoadSnippets();
	return writeSnippetFile(app, snippetFilename, updatedCss);
}

export async function wipeCss(app: App) {
	return createSnippetFile(app, snippetFilename, header);
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
	const obj = css.parse(cssContent, {});
	const sheet = obj.stylesheet;

	for (const rule of sheet.rules) {
		if (rule.selectors.contains("." + className)) {
			let classContent = "";
			rule.declarations.forEach((dec: { property: string; value: string; }) => {
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
	const fileObj = css.parse(cssFileContent, {});
	const fileSheet = fileObj.stylesheet;

	for (const rule of fileSheet.rules) {
		if (rule.selectors && rule.selectors.contains("." + className)) {
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
	const cssString = _makeCssRuleString(className, cssDeclarations);
	return css.parse(cssString, {}).stylesheet.rules[0];
}
