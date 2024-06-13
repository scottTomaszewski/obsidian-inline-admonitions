# Readme - Settings Migration

- `setting_v*.json` - these files are samples of the data.json file at a specific version.  Do not edit these
- `migrated_settings_v*_to_v*.json` - these are expected outputs of the data.json file after its migrated from one version to another

Usage: 

1. Copy one of the `setting_v*.json` files to `data.json`
2. Reload/open obsidian and the migration should run on startup
3. Compare the (updated) `data.json` file to the appropriate `migrated_settings_v*_to_v*.json` and ensure the data is consistent
