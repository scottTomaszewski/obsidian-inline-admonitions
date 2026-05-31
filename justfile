set shell := ["bash", "-c"]

release version:
	#!/usr/bin/env bash
	set -euo pipefail
	if [[ `git status --porcelain` ]]; then
		echo "Cannot release: 'git status' is not clean.  Commit/push or stash changes first"
		exit 0
	fi
	jq '.version = "{{version}}"' manifest.json > tmp && mv tmp manifest.json
	jq '.version = "{{version}}"' package.json > tmp && mv tmp package.json
	npm run build-no-check
	git add .
	git commit --allow-empty -am "Prepares for release '{{version}}'"
	git push
	token="$(just _gh-token)"
	if [[ -n "$token" ]]; then export GH_TOKEN="$token"; fi
	gh release create "{{version}}" --title "{{version}}" --notes "" main.js manifest.json styles.css

# Echo a GitHub token for `gh`. devbox bundles its own gh (nixpkgs) that can't
# read the host keyring where `gh auth login` stored the token, so fall back to
# the host gh. Prints nothing if no token is found (gh then uses its own auth).
_gh-token:
	@if [[ -n "${GH_TOKEN:-}" ]]; then echo "${GH_TOKEN}"; elif [[ -x /usr/bin/gh ]]; then /usr/bin/gh auth token 2>/dev/null || true; fi
