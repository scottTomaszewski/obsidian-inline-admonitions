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
	gh release create "{{version}}" --title "{{version}}" --notes "" main.js manifest.json styles.css
