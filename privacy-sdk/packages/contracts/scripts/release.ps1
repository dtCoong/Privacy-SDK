param([string]$version)
if (-not $version) {
  Write-Host "Usage: .\scripts\release.ps1 <version>"
  exit 1
}

# Update package.json version
$pkg = Get-Content ..\..\package.json | Out-String | ConvertFrom-Json
$pkg.version = $version
$pkg | ConvertTo-Json -Depth 10 | Set-Content ..\..\package.json

git add package.json CHANGELOG.md RELEASE_NOTES.md
git commit -m "chore(release): v$version"
git tag -a "v$version" -m "Release v$version"
git push origin main --follow-tags

Write-Host "Release $version created and pushed."
