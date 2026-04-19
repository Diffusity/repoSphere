#!/bin/bash
# RepoSphere CLI Installer for macOS/Linux
# Usage: curl -sSfL https://raw.githubusercontent.com/Diffusity/repoSphere/master/CLI/install.sh | bash
set -e

REPO="Diffusity/repoSphere"

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
case "$ARCH" in
  x86_64)        ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "❌ Unsupported architecture: $ARCH"; exit 1 ;;
esac

echo "⬇️  Fetching latest release..."
LATEST=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST" ]; then
  echo "❌ Could not fetch latest release. Check your internet connection."
  exit 1
fi

VERSION="${LATEST#v}"

echo "📦 Downloading rs v$VERSION for $OS/$ARCH..."
URL="https://github.com/$REPO/releases/download/$LATEST/rs_v${VERSION}_${OS}_${ARCH}.tar.gz"

TMPDIR=$(mktemp -d)
HTTP_CODE=$(curl -sL -w "%{http_code}" "$URL" -o "$TMPDIR/rs.tar.gz")

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Download failed (HTTP $HTTP_CODE). No binary available for $OS/$ARCH."
  rm -rf "$TMPDIR"
  exit 1
fi

tar -xzf "$TMPDIR/rs.tar.gz" -C "$TMPDIR"

echo "🔧 Installing to /usr/local/bin/rs..."
sudo mv "$TMPDIR/rs" /usr/local/bin/rs
sudo chmod +x /usr/local/bin/rs
rm -rf "$TMPDIR"

echo ""
echo "============================================"
echo " ✅ rs v$VERSION installed successfully!"
echo "============================================"
echo ""
echo "  Verify: rs --version"
echo ""
echo "  Quick Start:"
echo "    rs login                          # Authenticate"
echo "    rs init                           # Initialize repo"
echo "    rs remote add origin owner/repo   # Set remote"
echo "    rs add .                          # Stage files"
echo "    rs commit -m \"first commit\"       # Commit"
echo "    rs push                           # Push to server"
