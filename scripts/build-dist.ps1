# Stage the publishable site into dist/.
#
# Netlify publishes dist/, not the repo root, because the root also holds
# CLAUDE.md, .claude/ and screenshots/ -- internal files that should not be
# served. This script is the allowlist: anything not copied here does not ship.
#
#   pwsh scripts/build-dist.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root 'dist'

if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
New-Item -ItemType Directory $dist -Force | Out-Null
New-Item -ItemType Directory (Join-Path $dist 'uploads') -Force | Out-Null

Copy-Item (Join-Path $root '*.dc.html') $dist
Copy-Item (Join-Path $root 'support.js') $dist
Copy-Item (Join-Path $root 'uploads\vantage-icon.png') (Join-Path $dist 'uploads')
Copy-Item (Join-Path $root 'uploads\vantage-logo-dark.png') (Join-Path $dist 'uploads')

# index.html and robots.txt are checked in under static/ because they exist only
# for the deployed site, not for opening screens locally as files.
Copy-Item (Join-Path $root 'static\index.html') $dist
Copy-Item (Join-Path $root 'static\robots.txt') $dist

$count = (Get-ChildItem $dist -Recurse -File).Count
Write-Host "staged $count files into dist/"
