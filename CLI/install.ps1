# RepoSphere CLI Installer for Windows
# Usage: irm https://raw.githubusercontent.com/Diffusity/repoSphere/master/CLI/install.ps1 | iex

$ErrorActionPreference = "Stop"

$REPO = "Diffusity/repoSphere"
$INSTALL_DIR = "$env:LOCALAPPDATA\rs"

# Detect architecture
$arch = if ([Environment]::Is64BitOperatingSystem) {
    if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { "arm64" } else { "amd64" }
} else { "amd64" }

# Get latest release
Write-Host "Fetching latest release..." -ForegroundColor Cyan
try {
    $release = Invoke-RestMethod "https://api.github.com/repos/$REPO/releases/latest"
} catch {
    Write-Host "ERROR: Could not fetch release info. Check your internet connection." -ForegroundColor Red
    exit 1
}

$version = $release.tag_name -replace '^v', ''
$assetName = "rs_v${version}_windows_${arch}.zip"
$asset = $release.assets | Where-Object { $_.name -eq $assetName }

if (-not $asset) {
    Write-Host "ERROR: No binary found for windows/$arch ($assetName)" -ForegroundColor Red
    Write-Host "Available assets:" -ForegroundColor Yellow
    $release.assets | ForEach-Object { Write-Host "  - $($_.name)" }
    exit 1
}

# Download
$tmpFile = "$env:TEMP\rs_download.zip"
Write-Host "Downloading rs v$version for windows/$arch..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $tmpFile

# Install
if (-not (Test-Path $INSTALL_DIR)) {
    New-Item -ItemType Directory -Path $INSTALL_DIR | Out-Null
}
Expand-Archive -Path $tmpFile -DestinationPath $INSTALL_DIR -Force
Remove-Item $tmpFile

# Add to PATH if not already there
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$INSTALL_DIR*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$INSTALL_DIR", "User")
    $env:Path = "$env:Path;$INSTALL_DIR"
    Write-Host ""
    Write-Host "Added $INSTALL_DIR to user PATH" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " rs v$version installed successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Location : $INSTALL_DIR\rs.exe"
Write-Host "  Verify   : rs --version"
Write-Host ""
Write-Host "  NOTE: Restart your terminal for PATH changes to take effect." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Quick Start:" -ForegroundColor Cyan
Write-Host "    rs login                          # Authenticate"
Write-Host "    rs init                            # Initialize repo"
Write-Host "    rs remote add origin owner/repo    # Set remote"
Write-Host "    rs add .                           # Stage files"
Write-Host "    rs commit -m `"first commit`"        # Commit"
Write-Host "    rs push                            # Push to server"
