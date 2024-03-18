import {MarkdownView, Plugin} from 'obsidian';
import {InlineAdmonitionSettingTab} from "./src/settings/inlineAdmonitionSettingTab";
import {InlineAdmonitionSettings, InlineAdmonitionSettingsIO} from "./src/settings/inlineAdmonitionSettings";
import {InlineAdmonitionsPostProcessor} from "./src/InlineAdmonitions/inlineAdmonitionsPostProcessor";
import {inlineAdmonitionPlugin} from "./src/InlineAdmonitions/InlineAdmonitionExtension";
import {_setCssForClass, cssFileContents, getCssForClass, setCssForClass, wipeCss} from "./src/io/inlineAdmonitionCss";

export default class InlineAdmonitionPlugin extends Plugin {
	settings: InlineAdmonitionSettings;

	async onload() {
		console.log("Loading Inline Admonitions.")
		await this.loadSettings();

		this.registerMarkdownPostProcessor((element, context) => {
			new InlineAdmonitionsPostProcessor(this.settings).postProcess(element, context);
		});
		this.registerEditorExtension(inlineAdmonitionPlugin(Array.from(this.settings.inlineAdmonitions.values())));

		this.addSettingTab(new InlineAdmonitionSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		let settingData = await this.loadData();
		let [settings, dataMigrated] = InlineAdmonitionSettingsIO.unmarshalAndMigrate(settingData);
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
		// TODO - are we okay with this?
		// TODO - if so, I need to add a "DO NOT MODIFY" warning to the top of the css file
		await wipeCss(this.app);
		for (let iad of this.settings.inlineAdmonitions.values()) {
			// console.log("setting " + iad.cssClasses().last() + " to " + iad.simpleStyle());
			await setCssForClass(this.app, iad.cssClasses().last(), iad.simpleStyle());
		}
	}

	private rerenderMarkdownViews() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		view?.previewMode.rerender(true);
	}
}

