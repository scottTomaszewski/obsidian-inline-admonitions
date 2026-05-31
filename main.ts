import { MarkdownView, Plugin } from 'obsidian';
import { Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { InlineAdmonitionSettingTab } from "./src/settings/inlineAdmonitionSettingTab";
import { InlineAdmonitionSettings, InlineAdmonitionSettingsIO } from "./src/settings/inlineAdmonitionSettings";
import { InlineAdmonitionsPostProcessor } from "./src/InlineAdmonitions/inlineAdmonitionsPostProcessor";
import { inlineAdmonitionPlugin } from "./src/InlineAdmonitions/InlineAdmonitionExtension";
import { setCssForClass, wipeCss } from "./src/io/inlineAdmonitionCss";

export default class InlineAdmonitionPlugin extends Plugin {
	settings: InlineAdmonitionSettings;
	private inlineAdmonitionCompartment: Compartment;

	async onload() {
		this.inlineAdmonitionCompartment = new Compartment();
		await this.loadSettings();

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
		const settingData: unknown = await this.loadData();
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
			const classes = iad.cssClasses();
			await setCssForClass(this.app, classes[classes.length - 1], iad.simpleStyle());
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
				const cm = (leaf.view.editor as unknown as { cm: EditorView }).cm;
				cm.dispatch({
					effects: this.inlineAdmonitionCompartment.reconfigure(newExtension)
				});
			}
		});
	}
}
