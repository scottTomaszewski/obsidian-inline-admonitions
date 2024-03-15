// Source: https://github.com/Zachatoo/obsidian-css-editor/blob/main/src/obsidian/file-system-helpers.ts

// MIT License
//
// Copyright (c) 2023 Zach Young
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// 	The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// 	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// 	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import {App} from "obsidian";

export function snippetDir(app: App) {
	return `${app.vault.configDir}/snippets`;
}

export function snippetPath(app: App, filename: string) {
	return `${app.vault.configDir}/snippets/${filename}`;
}

export async function readSnippetFile(app: App, filename: string): Promise<string> {
	return await app.vault.adapter.read(`${snippetPath(app, filename)}`);
}

export async function createSnippetFile(app: App, filename: string, data = ""): Promise<void> {
	await _validatefilename(filename);
	await _createSnippetDirectoryIfNotExists(app);
	await app.vault.adapter.write(`${snippetPath(app, filename)}`, data);
}

export async function writeSnippetFile(app: App, filename: string, data: string): Promise<void> {
	await app.vault.adapter.write(`${snippetPath(app, filename)}`, data);
}

export async function deleteSnippetFile(app: App, filename: string) {
	await app.vault.adapter.remove(`${snippetPath(app, filename)}`);
}

export async function snippetExists(app: App, filename: string): Promise<boolean> {
	return app.vault.adapter.exists(`${snippetPath(app, filename)}`);
}

async function _createSnippetDirectoryIfNotExists(app: App) {
	await app.vault.adapter.exists(snippetDir(app)) || await app.vault.adapter.mkdir(snippetDir(app));
}

async function _validatefilename(value: string) {
	const errors = {exists: "", regex: "",};
	if (value.length > 0 && (await snippetExists(this.app, value))) {
		errors.exists = "File already exists.";
	}
	const regex = /^[0-9a-zA-Z\-_ ]+\.css$/;
	if (!regex.test(value)) {
		errors.regex =
			"Must end with .css and only contain alphanumeric, spaces, dashes, or underscore characters.";
	}
	if (Object.values(errors).some((x) => x !== "")) {
		const message = Object.values(errors)
			.filter((x) => x !== "")
			.reduce((acc, curr) => `${acc}\n${curr}`, "Failed to create file.");
		throw new Error(message);
	}
}
