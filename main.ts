import {MarkdownView, Plugin} from 'obsidian';
import {InlineAdmonitionSettingTab} from "./src/inlineAdmonitionSettingTab";
import {InlineAdmonitionsPostProcessor} from "./src/inlineAdmonitionsPostProcessor";
import {InlineAdmonitionSettings, DEFAULT_SETTINGS} from "./src/inlineAdmonitionSettings";
import {InlineAdmonition} from "./src/InlineAdmonitions/inlineAdmonition";
import {InlineAdmonitionType} from "./src/InlineAdmonitions/inlineAdmonitionType";

export default class InlineAdmonitionPlugin extends Plugin {
	settings: InlineAdmonitionSettings;

	async onload() {
		console.log("Loading Inline Admonitions.")
		await this.loadSettings();

		this.registerMarkdownPostProcessor((element, context) => {
			new InlineAdmonitionsPostProcessor(this.settings).postProcess(element, context);
		});

		this.addSettingTab(new InlineAdmonitionSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		let settingData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, settingData);

		await this.migrateData();

		let iads = new Map<string, InlineAdmonition>();
		for (const identifier in this.settings?.inlineAdmonitions) {
			let iad = this.settings.inlineAdmonitions[identifier]
			let typedIAD = InlineAdmonitionType.unmarshal(iad);
			console.log(identifier + ": " + typedIAD)
			iads.set(typedIAD.slug, typedIAD);
		}
		this.settings.inlineAdmonitions = iads;
	}

	async saveSettings() {
		let settingData = Object.assign({}, DEFAULT_SETTINGS, this.settings);
		settingData.inlineAdmonitions = Object.fromEntries(this.settings.inlineAdmonitions.entries());
		await this.saveData(settingData);
		this.rerenderMarkdownViews();
	}

	private rerenderMarkdownViews() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		view?.previewMode.rerender(true);
	}

	private async migrateData() {
		// Migrate to version 1
		if (this.settings.version == undefined || this.settings.version === 0) {
			console.log("[Inline Admonitions] Migrating settings from version 0 to 1");
			let iads = new Map<string, InlineAdmonition>();
			for (const identifier in this.settings?.inlineAdmonitions) {
				let iad = this.settings.inlineAdmonitions[identifier]
				console.log("hello");
				console.log(identifier + ": " + JSON.stringify(iad))
				if (iad.type === undefined) {
					console.log(" Setting InlineAdmonition " + identifier + " to Prefix type")
					iad.type = InlineAdmonitionType.Prefix;
				}
				if (iad.slug === undefined) {
					iad.slug = InlineAdmonition.generateSlug();
				}

				let ia = InlineAdmonitionType.unmarshal(iad);
				iads.set(ia.slug, ia);
			}
			this.settings.inlineAdmonitions = iads;
			this.settings.version = 1;
			this.settings["mySetting"] = undefined;
			console.log("saving...")
			await this.saveSettings();
		}
	}
}

