import {InlineAdmonition} from "../InlineAdmonitions/inlineAdmonition";
import {InlineAdmonitionType} from "../InlineAdmonitions/inlineAdmonitionType";

export interface InlineAdmonitionSettings {
	version: number;
	inlineAdmonitions: Map<string, InlineAdmonition>;
}

export namespace InlineAdmonitionSettingsIO {
	export function marshal(settings: InlineAdmonitionSettings) {
		const settingData = Object.assign({}, DEFAULT_SETTINGS, settings);
		settingData.inlineAdmonitions = Object.fromEntries(settings.inlineAdmonitions.entries());
		return settingData;
	}

	export function unmarshalAndMigrate(data: any): [InlineAdmonitionSettings, boolean] {
		let settings: InlineAdmonitionSettings = Object.assign({}, DEFAULT_SETTINGS, data);

		const [newSettings, dataMigrated] = migrateData(settings);
		settings = newSettings;

		const iads = new Map<string, InlineAdmonition>();
		for (const identifier in settings.inlineAdmonitions) {
			const iad = settings.inlineAdmonitions.get(identifier);
			const typedIAD = InlineAdmonitionType.unmarshal(iad);
			iads.set(typedIAD.slug, typedIAD);
		}
		settings.inlineAdmonitions = iads;
		return [settings, dataMigrated];
	}

	export function migrateData(settings: InlineAdmonitionSettings): [any, boolean] {
		let dataMigrated = false;

		// Migrate to version 1
		if (settings.version == undefined || settings.version === 0) {
			console.log("[Inline Admonitions] Migrating settings from version 0 to 1");
			const iads = new Map<string, InlineAdmonition>();
			for (const identifier in settings?.inlineAdmonitions) {
				const iad = settings.inlineAdmonitions.get(identifier);
				if (iad.type === undefined) {
					console.log("[Inline Admonitions] Setting InlineAdmonition " + identifier + " to Prefix type")
					iad.type = InlineAdmonitionType.Prefix;
				}
				if (iad.slug === undefined) {
					iad.slug = InlineAdmonition.generateSlug();
				}

				const ia = InlineAdmonitionType.unmarshal(iad);
				iads.set(ia.slug, ia);
			}
			settings.inlineAdmonitions = iads;
			settings['mySetting'] = undefined;
			settings.version = 1;
			dataMigrated = true;
		}

		// Migrate to version 2
		// Adds hideTiggerString to prefix and suffix types, overhauls code
		if (settings.version === 1) {
			console.log("[Inline Admonitions] Migrating settings from version 1 to 2");
			for (const identifier in settings?.inlineAdmonitions) {
				const iad = settings.inlineAdmonitions.get(identifier);
				if (iad.type === "prefix" && !iad.hasOwnProperty("hideTriggerString")) {
					iad.hideTriggerString = false;
				}
				if (iad.type === "suffix" && !iad.hasOwnProperty("hideTriggerString")) {
					iad.hideTriggerString = false;
				}
				settings.inlineAdmonitions.set(identifier, iad);
			}
			settings.version = 2;
			dataMigrated = true;
		}

		return [settings, dataMigrated];
	}
}

export const DEFAULT_SETTINGS: InlineAdmonitionSettings = {
	version: 0,
	inlineAdmonitions: new Map<string, InlineAdmonition>()
}
