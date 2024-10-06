import {Plugin, Component, MarkdownRenderer} from 'obsidian';

export class MarkdownRendererSingleton {
	private static instance: MarkdownRendererSingleton;
	private plugin: Plugin | null = null;

	private constructor() {
		// Private constructor to prevent direct instantiation.
	}

	public static getInstance(): MarkdownRendererSingleton {
		if (!MarkdownRendererSingleton.instance) {
			MarkdownRendererSingleton.instance = new MarkdownRendererSingleton();
		}
		return MarkdownRendererSingleton.instance;
	}

	public initialize(plugin: Plugin) {
		this.plugin = plugin;
	}

	/**
	 * Renders markdown into the given HTMLElement.
	 * @param markdown - The markdown string to render.
	 * @param el - The HTMLElement where the markdown will be rendered.
	 * @param sourcePath - Path to the markdown document.
	 */
	public renderMD(markdown: string, el: HTMLElement, sourcePath: string) {
		if (!this.plugin) {
			console.error("MarkdownRendererSingleton is not initialized with plugin.");
			return;
		}
		el.addClass("iad-inline-md");
		MarkdownRenderer.render(this.plugin.app, markdown, el, sourcePath, this.plugin as Component);
	}
}
