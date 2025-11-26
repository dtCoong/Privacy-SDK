#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1-}" ]; then
  echo "Usage: ./scripts/release.sh <version> (e.g. 1.0.0)" >&2
  exit 1
fi

VER=$1
echo "Preparing release $VER"

# Update package.json version (simple jq-free approach)
node -e "let p=require('../../package.json'); p.version='$VER'; require('fs').writeFileSync('package.json', JSON.stringify(p,null,2)); console.log('Updated package.json to $VER')"

git add package.json CHANGELOG.md RELEASE_NOTES.md
git commit -m "chore(release): v$VER"
git tag -a "v$VER" -m "Release v$VER"
git push origin main --follow-tags

echo "Release $VER created and pushed."
