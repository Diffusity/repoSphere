
#!/usr/bin/env bash

set -e

VERSION="1.0"
MODULE="github.com/Diffusity/repoSphere/cmd"
LDFLAGS="-s -w -X ${MODULE}.Version=v${VERSION}"
DIST="dist"

# Clean
rm -rf "$DIST"
mkdir -p "$DIST"

targets=(
  "windows amd64 .exe"
  "windows arm64 .exe"
  "linux amd64"
  "linux arm64"
  "darwin amd64"
  "darwin arm64"
)

for target in "${targets[@]}"; do
  read -r GOOS GOARCH EXT <<< "$target"

  OUT_NAME="rs_v${VERSION}_${GOOS}_${GOARCH}"
  BIN_NAME="rs${EXT}"
  OUT_DIR="${DIST}/${OUT_NAME}"

  echo "Building $OUT_NAME..."

  mkdir -p "$OUT_DIR"

  env GOOS=$GOOS GOARCH=$GOARCH CGO_ENABLED=0 \
    go build -ldflags="$LDFLAGS" -o "${OUT_DIR}/${BIN_NAME}" .

  # Archive
  if [ "$GOOS" = "windows" ]; then
    (cd "$OUT_DIR" && zip -q "../${OUT_NAME}.zip" "$BIN_NAME")
  else
    tar -czf "${DIST}/${OUT_NAME}.tar.gz" -C "$OUT_DIR" "$BIN_NAME"
  fi

  echo "  -> ${DIST}/${OUT_NAME} done"
done

# Checksums
echo ""
echo "Generating checksums..."

cd "$DIST"
sha256sum *.zip *.tar.gz > checksums.txt

echo ""
echo "✅ All builds complete! Files in $DIST/:"
ls -lh

echo ""
echo "Next: Create a GitHub Release:"
echo "https://github.com/Diffusity/repoSphere/releases/new"
echo "Tag: v${VERSION} | Attach all files from $DIST/"

