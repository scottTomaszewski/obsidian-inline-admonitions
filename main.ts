import {MarkdownView, Plugin} from 'obsidian';
import {InlineAdmonitionSettingTab} from "./src/settings/inlineAdmonitionSettingTab";
import {InlineAdmonitionSettings, InlineAdmonitionSettingsIO} from "./src/settings/inlineAdmonitionSettings";
import {InlineAdmonitionsPostProcessor} from "./src/InlineAdmonitions/inlineAdmonitionsPostProcessor";
import {inlineAdmonitionPlugin} from "./src/InlineAdmonitions/InlineAdmonitionExtension";
import {setCssForClass, wipeCss} from "./src/io/inlineAdmonitionCss";

export default class InlineAdmonitionPlugin extends Plugin {
	settings: InlineAdmonitionSettings;

	async onload() {
		console.log("Loading Inline Admonitions.")
		await this.loadSettings();

		this.registerMarkdownPostProcessor((element, context) => {
			new InlineAdmonitionsPostProcessor(this.settings).postProcess(element, context);
		});
		// TODO - this fails on first created iad?
		this.registerEditorExtension(inlineAdmonitionPlugin(Array.from(this.settings.inlineAdmonitions.values())));

		this.addSettingTab(new InlineAdmonitionSettingTab(this.app, this));
	}

	onunload() {
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
	}

	async refreshCss() {
		await wipeCss(this.app);
		for (const iad of this.settings.inlineAdmonitions.values()) {
			// console.log("setting " + iad.cssClasses().last() + " to " + iad.simpleStyle());
			await setCssForClass(this.app, iad.cssClasses().last(), iad.simpleStyle());
		}
	}

	private rerenderMarkdownViews() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		view?.previewMode.rerender(true);
	}
}

