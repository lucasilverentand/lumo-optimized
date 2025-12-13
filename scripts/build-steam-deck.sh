#!/bin/bash
# Build script for Lumo Optimized - Steam Deck Edition
# This script creates the Steam Deck variant by combining base pack with Steam Deck configs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/.build/steam-deck"
DIST_DIR="$PROJECT_ROOT/dist"
STEAM_DECK_DIR="$PROJECT_ROOT/steam-deck"

VERSION=$(grep '^version' "$PROJECT_ROOT/pack.toml" | cut -d'"' -f2)
PACK_NAME="lumo-optimized-steam-deck"

echo "Building Lumo Optimized - Steam Deck Edition v${VERSION}"

# Clean and create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
mkdir -p "$DIST_DIR"

# Copy base pack files
echo "Copying base pack files..."
cp -r "$PROJECT_ROOT/mods" "$BUILD_DIR/"
cp -r "$PROJECT_ROOT/resourcepacks" "$BUILD_DIR/"
cp -r "$PROJECT_ROOT/shaderpacks" "$BUILD_DIR/"
cp -r "$PROJECT_ROOT/config" "$BUILD_DIR/"
cp "$PROJECT_ROOT/index.toml" "$BUILD_DIR/"
cp "$PROJECT_ROOT/icon.png" "$BUILD_DIR/"

# Copy Steam Deck specific pack.toml
cp "$STEAM_DECK_DIR/pack.toml" "$BUILD_DIR/"

# Override with Steam Deck optimized configs
echo "Applying Steam Deck optimizations..."
cp -r "$STEAM_DECK_DIR/config/"* "$BUILD_DIR/config/"

# Build the pack using packwiz
echo "Building modpack..."
cd "$BUILD_DIR"

# Find packwiz
PACKWIZ=$(command -v packwiz 2>/dev/null || echo "$HOME/.local/share/mise/installs/go/1.25.3/bin/packwiz" || echo "$HOME/go/bin/packwiz")

if [ ! -x "$PACKWIZ" ]; then
    echo "Error: packwiz not found. Please install packwiz first."
    exit 1
fi

# Refresh index to update hashes
$PACKWIZ refresh

# Export to Modrinth format
$PACKWIZ modrinth export -o "$DIST_DIR/${PACK_NAME}-${VERSION}.mrpack"
echo "Exported: $DIST_DIR/${PACK_NAME}-${VERSION}.mrpack"

# Export to CurseForge format
$PACKWIZ curseforge export -o "$DIST_DIR/${PACK_NAME}-${VERSION}-curseforge.zip"
echo "Exported: $DIST_DIR/${PACK_NAME}-${VERSION}-curseforge.zip"

# Cleanup
rm -rf "$BUILD_DIR"

echo ""
echo "Steam Deck Edition build complete!"
echo "  - $DIST_DIR/${PACK_NAME}-${VERSION}.mrpack"
echo "  - $DIST_DIR/${PACK_NAME}-${VERSION}-curseforge.zip"
