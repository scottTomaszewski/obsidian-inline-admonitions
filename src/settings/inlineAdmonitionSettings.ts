import {InlineAdmonition, SerializedInlineAdmonition} from "../InlineAdmonitions/inlineAdmonition";
import {InlineAdmonitionType} from "../InlineAdmonitions/inlineAdmonitionType";

export interface InlineAdmonitionSettings {
	version: number;
	inlineAdmonitions: Map<string, InlineAdmonition>;
}

// The shape persisted to data.json: admonitions are a plain record keyed by
// slug rather than the runtime Map.
interface PersistedInlineAdmonitionSettings {
	version: number;
	inlineAdmonitions: Record<string, SerializedInlineAdmonition>;
}

export namespace InlineAdmonitionSettingsIO {
	export function marshal(settings: InlineAdmonitionSettings): PersistedInlineAdmonitionSettings {
		const inlineAdmonitions: Record<string, SerializedInlineAdmonition> = {};
		for (const [slug, iad] of settings.inlineAdmonitions.entries()) {
			inlineAdmonitions[slug] = iad;
		}
		return {version: settings.version, inlineAdmonitions};
	}

	export function unmarshalAndMigrate(data: unknown): [InlineAdmonitionSettings, boolean] {
		const persisted: PersistedInlineAdmonitionSettings = Object.assign(
			{},
			defaultPersistedSettings(),
			(data as Partial<PersistedInlineAdmonitionSettings> | null) ?? {}
		);

		const [migrated, dataMigrated] = migrateData(persisted);

		const iads = new Map<string, InlineAdmonition>();
		for (const identifier in migrated.inlineAdmonitions) {
			const typedIAD = InlineAdmonitionType.unmarshal(migrated.inlineAdmonitions[identifier]);
			iads.set(typedIAD.slug, typedIAD);
		}
		return [{version: migrated.version, inlineAdmonitions: iads}, dataMigrated];
	}

	function migrateData(settings: PersistedInlineAdmonitionSettings): [PersistedInlineAdmonitionSettings, boolean] {
		let dataMigrated = false;

		// Migrate to version 1
		if (settings.version == undefined || settings.version === 0) {
			const iads: Record<string, SerializedInlineAdmonition> = {};
			for (const identifier in settings.inlineAdmonitions) {
				const iad = settings.inlineAdmonitions[identifier];
				if (iad.type === undefined) {
					iad.type = InlineAdmonitionType.Prefix;
				}
				if (iad.slug === undefined) {
					iad.slug = InlineAdmonition.generateSlug();
				}
				iads[iad.slug] = iad;
			}
			settings.inlineAdmonitions = iads;
			settings.version = 1;
			dataMigrated = true;
		}

		// Migrate to version 2
		// Adds hideTriggerString to prefix and suffix types, overhauls code
		if (settings.version === 1) {
			for (const identifier in settings.inlineAdmonitions) {
				const iad = settings.inlineAdmonitions[identifier];
				if ((iad.type === InlineAdmonitionType.Prefix || iad.type === InlineAdmonitionType.Suffix) && iad.hideTriggerString === undefined) {
					iad.hideTriggerString = false;
				}
			}
			settings.version = 2;
			dataMigrated = true;
		}

		// Migrate to version 3
		// Adds fontFamily to all types
		if (settings.version === 2) {
			for (const identifier in settings.inlineAdmonitions) {
				const iad = settings.inlineAdmonitions[identifier];
				if (iad.fontFamily === undefined) {
					iad.fontFamily = "";
				}
			}
			settings.version = 3;
			dataMigrated = true;
		}

		// Migrate to version 4
		// Adds hideBackground to all types
		if (settings.version === 3) {
			for (const identifier in settings.inlineAdmonitions) {
				const iad = settings.inlineAdmonitions[identifier];
				if (iad.hideBackground === undefined) {
					iad.hideBackground = false;
				}
			}
			settings.version = 4;
			dataMigrated = true;
		}

		// Migrate to version 5
		// Adds richer styling fields (border color/width/style, corner radius, and
		// bold/italic/underline) to all types. Defaults preserve the pre-feature look:
		// empty border style and 0 radius inherit the base `.iad` theme border/radius.
		if (settings.version === 4) {
			for (const identifier in settings.inlineAdmonitions) {
				const iad = settings.inlineAdmonitions[identifier];
				if (iad.borderColor === undefined) {
					iad.borderColor = "#000000";
				}
				if (iad.borderWidth === undefined) {
					iad.borderWidth = 1;
				}
				if (iad.borderStyle === undefined) {
					iad.borderStyle = "";
				}
				if (iad.borderRadius === undefined) {
					iad.borderRadius = 0;
				}
				if (iad.bold === undefined) {
					iad.bold = false;
				}
				if (iad.italic === undefined) {
					iad.italic = false;
				}
				if (iad.underline === undefined) {
					iad.underline = false;
				}
			}
			settings.version = 5;
			dataMigrated = true;
		}

		return [settings, dataMigrated];
	}

	function defaultPersistedSettings(): PersistedInlineAdmonitionSettings {
		return {version: 0, inlineAdmonitions: {}};
	}
}

export const DEFAULT_SETTINGS: InlineAdmonitionSettings = {
	version: 0,
	inlineAdmonitions: new Map<string, InlineAdmonition>()
}
