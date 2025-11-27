# Navigate to correct directory
Set-Location $PSScriptRoot

# Add Cargo to PATH
$env:Path += ";$env:USERPROFILE\.cargo\bin"

# Run setup
npm run setup
