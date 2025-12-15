#!/bin/bash
# Build script for Lumo Optimized - All Editions
# Usage: ./scripts/build-edition.sh <edition-name>
# Example: ./scripts/build-edition.sh macbook

set -e

EDITION="$1"

if [ -z "$EDITION" ]; then
    echo "Usage: $0 <edition-name>"
    echo "Available editions: steam-deck, macbook, mac-studio, low-end, medium, high-end"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/.build/$EDITION"
DIST_DIR="$PROJECT_ROOT/dist"

# Determine edition source directory
if [ "$EDITION" = "steam-deck" ]; then
    EDITION_DIR="$PROJECT_ROOT/steam-deck"
else
    EDITION_DIR="$PROJECT_ROOT/editions/$EDITION"
fi

# Validate edition exists
if [ ! -d "$EDITION_DIR" ]; then
    echo "Error: Edition '$EDITION' not found at $EDITION_DIR"
    exit 1
fi

VERSION=$(grep '^version' "$PROJECT_ROOT/pack.toml" | cut -d'"' -f2)
PACK_NAME="lumo-optimized-$EDITION"

echo "========================================"
echo "Building Lumo Optimized - ${EDITION} Edition v${VERSION}"
echo "========================================"

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
mkdir -p "$DIST_DIR"

# Copy base pack files
echo "[1/5] Copying base pack files..."
cp -r "$PROJECT_ROOT/mods" "$BUILD_DIR/"
cp -r "$PROJECT_ROOT/resourcepacks" "$BUILD_DIR/"
cp -r "$PROJECT_ROOT/shaderpacks" "$BUILD_DIR/"
cp -r "$PROJECT_ROOT/config" "$BUILD_DIR/"
cp "$PROJECT_ROOT/index.toml" "$BUILD_DIR/"
cp "$PROJECT_ROOT/icon.png" "$BUILD_DIR/"

# Copy edition-specific pack.toml
echo "[2/5] Applying edition metadata..."
cp "$EDITION_DIR/pack.toml" "$BUILD_DIR/"

# Override with edition-specific configs
echo "[3/5] Applying edition-specific configurations..."
if [ -d "$EDITION_DIR/config" ]; then
    cp -r "$EDITION_DIR/config/"* "$BUILD_DIR/config/"
fi

# Override with edition-specific shader settings
if [ -d "$EDITION_DIR/shaderpacks" ]; then
    cp -r "$EDITION_DIR/shaderpacks/"* "$BUILD_DIR/shaderpacks/"
fi

# Build the pack using packwiz
echo "[4/5] Building modpack with packwiz..."
cd "$BUILD_DIR"

# Find packwiz - check multiple possible locations
PACKWIZ=""
for candidate in \
    "$(command -v packwiz 2>/dev/null)" \
    "$HOME/.local/share/mise/installs/go/1.25.3/bin/packwiz" \
    "$HOME/.local/share/mise/installs/go/latest/bin/packwiz" \
    "$HOME/go/bin/packwiz" \
    "/usr/local/bin/packwiz"; do
    if [ -x "$candidate" ]; then
        PACKWIZ="$candidate"
        break
    fi
done

if [ -z "$PACKWIZ" ]; then
    echo "Error: packwiz not found. Please install packwiz first."
    echo "  go install github.com/packwiz/packwiz@latest"
    exit 1
fi

echo "Using packwiz: $PACKWIZ"

# Refresh index to update hashes
$PACKWIZ refresh

# Export to Modrinth format
$PACKWIZ modrinth export -o "$DIST_DIR/${PACK_NAME}-${VERSION}.mrpack"

# Export to CurseForge format
$PACKWIZ curseforge export -o "$DIST_DIR/${PACK_NAME}-${VERSION}-curseforge.zip"

# Cleanup
echo "[5/5] Cleaning up build directory..."
rm -rf "$BUILD_DIR"

echo ""
echo "========================================"
echo "${EDITION} Edition build complete!"
echo "========================================"
echo "  Modrinth:   $DIST_DIR/${PACK_NAME}-${VERSION}.mrpack"
echo "  CurseForge: $DIST_DIR/${PACK_NAME}-${VERSION}-curseforge.zip"
echo ""
