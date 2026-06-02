import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";

export default tseslint.config(
	{
		ignores: [
			"main.js",
			"node_modules/**",
			// Local devbox state artifacts (git-ignored), not plugin source.
			".devbox/**",
			"esbuild.config.mjs",
			"version-bump.mjs",
			"jest.config.js",
			"eslint.config.mjs",
			"tests/**",
			"versions.json",
			"tsconfig.json",
			"manifest.json",
			"package-lock.json",
			"devbox.json",
			// Plugin runtime settings written by Obsidian, not source.
			"data.json",
		],
	},
	...obsidianmd.configs.recommended,
	{
		files: ["**/*.ts"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
			// Enum + namespace declaration merging is an intentional pattern here.
			"@typescript-eslint/no-namespace": "off",
			// Obsidian API callbacks (onClick/onChange/...) accept async handlers
			// that it fires and forgets; flagging them as misused is noise.
			"@typescript-eslint/no-misused-promises": [
				"error",
				{ checksVoidReturn: { arguments: false } },
			],
		},
	},
	{
		// Type-aware obsidianmd rules are enabled globally by the recommended
		// config; disable them for non-TS files that have no type information.
		files: ["**/*.json"],
		rules: {
			"obsidianmd/no-plugin-as-component": "off",
			"obsidianmd/no-view-references-in-plugin": "off",
			"obsidianmd/no-unsupported-api": "off",
			"obsidianmd/prefer-instanceof": "off",
		},
	},
);
