set shell := ["bash", "-c"]

# List available recipes.
default:
	@just --list

# Cut a release: bump the version, build, commit, push, and publish a GitHub
# release with the plugin assets attached.
# Usage: devbox run release 1.0.1   (or: just release 1.0.1)
release version:
	#!/usr/bin/env bash
	set -euo pipefail

	# Obsidian versions/tags carry no leading "v".
	version="{{version}}"
	version="${version#v}"
	if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
		echo "Refusing to release: '$version' is not a semver version (e.g. 1.0.1)."
		exit 1
	fi

	if [[ -n "$(git status --porcelain)" ]]; then
		echo "Cannot release: working tree is not clean. Commit or stash changes first."
		exit 1
	fi

	if git rev-parse "$version" >/dev/null 2>&1; then
		echo "Cannot release: tag '$version' already exists."
		exit 1
	fi

	# Keep manifest.json, package.json, and versions.json in lockstep. The new
	# version maps to the current minAppVersion in versions.json.
	min_app_version="$(jq -r '.minAppVersion' manifest.json)"
	jq --arg v "$version" '.version = $v' manifest.json > manifest.tmp && mv manifest.tmp manifest.json
	jq --arg v "$version" '.version = $v' package.json > package.tmp && mv package.tmp package.json
	jq --arg v "$version" --arg m "$min_app_version" '.[$v] = $m' versions.json > versions.tmp && mv versions.tmp versions.json

	# Promote the changelog's "Unreleased" section to this version (if present),
	# then use that version's section body as the GitHub release notes.
	if [[ -f CHANGELOG.md ]] && grep -q '^## Unreleased$' CHANGELOG.md; then
		sed -i "s/^## Unreleased$/## $version/" CHANGELOG.md
	fi
	notes="$(awk -v ver="## $version" '$0==ver{g=1;next} /^## /&&g{exit} g' CHANGELOG.md 2>/dev/null | sed '/^$/d')"
	[[ -z "$notes" ]] && notes="Release $version"

	# Produce the release artifact (bundle to main.js).
	npm run build-no-check

	git add manifest.json package.json versions.json CHANGELOG.md
	git commit --allow-empty -m "Release $version"
	git push -u origin HEAD

	token="$(just _gh-token)"
	if [[ -n "$token" ]]; then export GH_TOKEN="$token"; fi

	# Tag at the just-pushed commit and attach the assets Obsidian expects.
	gh release create "$version" \
		--title "$version" \
		--target "$(git rev-parse --abbrev-ref HEAD)" \
		--notes "$notes" \
		main.js manifest.json styles.css

# Echo a GitHub token for `gh`. devbox bundles its own gh (nixpkgs) that can't
# read the host keyring where `gh auth login` stored the token, so fall back to
# the host gh. Prints nothing if no token is found (gh then uses its own auth).
_gh-token:
	@if [[ -n "${GH_TOKEN:-}" ]]; then echo "${GH_TOKEN}"; elif [[ -x /usr/bin/gh ]]; then /usr/bin/gh auth token 2>/dev/null || true; fi
