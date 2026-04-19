# Build script for rs CLI - cross-compiles for all platforms
# Usage: cd CLI && .\build.ps1

$VERSION = "1.0"
$MODULE = "github.com/Diffusity/repoSphere/cmd"
$LDFLAGS = "-s -w -X ${MODULE}.Version=v${VERSION}"
$DIST = "dist"

# Clean
if (Test-Path $DIST) { Remove-Item -Recurse -Force $DIST }
New-Item -ItemType Directory -Path $DIST | Out-Null

$targets = @(
    @{ GOOS="windows"; GOARCH="amd64"; EXT=".exe" },
    @{ GOOS="windows"; GOARCH="arm64"; EXT=".exe" },
    @{ GOOS="linux";   GOARCH="amd64"; EXT="" },
    @{ GOOS="linux";   GOARCH="arm64"; EXT="" },
    @{ GOOS="darwin";  GOARCH="amd64"; EXT="" },
    @{ GOOS="darwin";  GOARCH="arm64"; EXT="" }
)

foreach ($t in $targets) {
    $outName = "rs_v${VERSION}_$($t.GOOS)_$($t.GOARCH)"
    $binName = "rs$($t.EXT)"
    $outDir  = "$DIST/$outName"

    Write-Host "Building $outName..." -ForegroundColor Cyan

    $env:GOOS   = $t.GOOS
    $env:GOARCH = $t.GOARCH
    $env:CGO_ENABLED = "0"

    New-Item -ItemType Directory -Path $outDir | Out-Null
    go build -ldflags $LDFLAGS -o "$outDir/$binName" .

    # Archive
    if ($t.GOOS -eq "windows") {
        Compress-Archive -Path "$outDir/$binName" -DestinationPath "$DIST/$outName.zip"
    } else {
        tar -czf "$DIST/$outName.tar.gz" -C $outDir $binName
    }

    Write-Host "  -> $DIST/$outName done" -ForegroundColor Green
}

# Reset env vars to current platform
$env:GOOS   = "windows"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = ""

# Checksums
Write-Host "`nGenerating checksums..." -ForegroundColor Cyan
$checksums = Get-ChildItem "$DIST/*.zip","$DIST/*.tar.gz" | ForEach-Object {
    $hash = (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower()
    "$hash  $($_.Name)"
}
$checksums | Out-File -Encoding UTF8 "$DIST/checksums.txt"

Write-Host "`n✅ All builds complete! Files in $DIST/:" -ForegroundColor Green
Get-ChildItem $DIST -File | ForEach-Object { Write-Host "   $($_.Name)" }
Write-Host "`nNext: Create a GitHub Release at https://github.com/Diffusity/repoSphere/releases/new"
Write-Host "      Tag: v$VERSION  |  Attach all files from $DIST/" -ForegroundColor Yellow
