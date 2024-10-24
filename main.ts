import { MarkdownView, Plugin } from 'obsidian';
import { Compartment } from '@codemirror/state';
import { InlineAdmonitionSettingTab } from "./src/settings/inlineAdmonitionSettingTab";
import { InlineAdmonitionSettings, InlineAdmonitionSettingsIO } from "./src/settings/inlineAdmonitionSettings";
import { InlineAdmonitionsPostProcessor } from "./src/InlineAdmonitions/inlineAdmonitionsPostProcessor";
import { inlineAdmonitionPlugin } from "./src/InlineAdmonitions/InlineAdmonitionExtension";
import { setCssForClass, wipeCss } from "./src/io/inlineAdmonitionCss";
import {MarkdownRendererSingleton} from "./src/io/MarkdownRenderer";

export default class InlineAdmonitionPlugin extends Plugin {
	settings: InlineAdmonitionSettings;
	private inlineAdmonitionCompartment: Compartment;

	async onload() {
		console.log("Loading Inline Admonitions.");
		this.inlineAdmonitionCompartment = new Compartment();
		await this.loadSettings();

		// Initialize for embedded markdown rendering
		MarkdownRendererSingleton.getInstance().initialize(this);

		// Register Extensions for Live Preview
		const extension = this.inlineAdmonitionCompartment.of(
			inlineAdmonitionPlugin(Array.from(this.settings.inlineAdmonitions.values()))
		);
		this.registerEditorExtension(extension);

		// Register MarkdownProcessors for normal rendering
		this.registerMarkdownPostProcessor((element, context) => {
			new InlineAdmonitionsPostProcessor(this.settings).postProcess(element, context);
		});

		this.addSettingTab(new InlineAdmonitionSettingTab(this.app, this));
	}

	onunload() {
		// Unload any resources if necessary
	}

	async loadSettings() {
		const settingData = await this.loadData();
		const [settings, dataMigrated] = InlineAdmonitionSettingsIO.unmarshalAndMigrate(settingData);
		this.settings = settings;
		if (dataMigrated) {
			await this.saveSettings();
		}
		await this.refreshCss();
	}

	async saveSettings() {
		const settingData = InlineAdmonitionSettingsIO.marshal(this.settings);
		await this.saveData(settingData);
		await this.refreshCss();
		this.rerenderMarkdownViews();
		this.updateEditorExtensions();
	}

	async refreshCss() {
		await wipeCss(this.app);
		for (const iad of this.settings.inlineAdmonitions.values()) {
			await setCssForClass(this.app, iad.cssClasses().last(), iad.simpleStyle());
		}
	}

	private rerenderMarkdownViews() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		view?.previewMode.rerender(true);
	}

	private updateEditorExtensions() {
		const newExtension = inlineAdmonitionPlugin(Array.from(this.settings.inlineAdmonitions.values()));
		this.app.workspace.iterateAllLeaves(leaf => {
			if (leaf.view instanceof MarkdownView && leaf.view.editor) {
				const editor = leaf.view.editor;
				const cm = editor.cm;

				cm.dispatch({
					effects: this.inlineAdmonitionCompartment.reconfigure(newExtension)
				});
			}
		});
	}
}
