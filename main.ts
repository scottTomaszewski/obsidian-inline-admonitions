import {MarkdownView, Plugin} from 'obsidian';
import {InlineAdmonitionSettingTab} from "./src/settings/inlineAdmonitionSettingTab";
import {InlineAdmonitionSettings, InlineAdmonitionSettingsIO} from "./src/settings/inlineAdmonitionSettings";
import {InlineAdmonitionsPostProcessor} from "./src/InlineAdmonitions/inlineAdmonitionsPostProcessor";
import {inlineAdmonitionPlugin} from "./src/InlineAdmonitions/InlineAdmonitionExtension";
import {_setCssForClass, getCssForClass} from "./src/io/inlineAdmonitionCss";

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
		console.log(await getCssForClass(this.app, "iad"));
		console.log("----")
		console.log(_setCssForClass("iad", "color:blue;", ".iad { background: pink; }"));
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
	}

	async saveSettings() {
		const settingData = InlineAdmonitionSettingsIO.marshal(this.settings);
		await this.saveData(settingData);
		this.rerenderMarkdownViews();
	}

	private rerenderMarkdownViews() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		view?.previewMode.rerender(true);
	}
}

