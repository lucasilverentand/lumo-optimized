#!/bin/bash
# Build all editions of Lumo Optimized modpack
# This script builds all 7 hardware editions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# All available editions
EDITIONS=(
    "steam-deck"
    "macbook"
    "mac-studio"
    "low-end"
    "medium"
    "high-end"
)

# Optional: Build standard edition as well
BUILD_STANDARD="${BUILD_STANDARD:-false}"

VERSION=$(grep '^version' "$PROJECT_ROOT/pack.toml" | cut -d'"' -f2)

echo "========================================"
echo "Building Lumo Optimized v${VERSION}"
echo "All Hardware Editions"
echo "========================================"
echo ""

FAILED_BUILDS=()
SUCCESSFUL_BUILDS=()

# Build each edition
for EDITION in "${EDITIONS[@]}"; do
    echo "----------------------------------------"
    echo "Building $EDITION edition..."
    echo "----------------------------------------"

    if "$SCRIPT_DIR/build-edition.sh" "$EDITION"; then
        SUCCESSFUL_BUILDS+=("$EDITION")
        echo "✅ $EDITION edition built successfully"
    else
        FAILED_BUILDS+=("$EDITION")
        echo "❌ $EDITION edition build failed"
    fi

    echo ""
done

# Build standard edition if requested
if [ "$BUILD_STANDARD" = "true" ]; then
    echo "----------------------------------------"
    echo "Building standard edition..."
    echo "----------------------------------------"

    # Create temporary edition directory for standard build
    STANDARD_DIR="$PROJECT_ROOT/.build/standard-temp"
    mkdir -p "$STANDARD_DIR"

    # Copy base pack.toml
    cp "$PROJECT_ROOT/pack.toml" "$STANDARD_DIR/pack.toml"

    if "$SCRIPT_DIR/build-edition.sh" "standard"; then
        SUCCESSFUL_BUILDS+=("standard")
        echo "✅ Standard edition built successfully"
    else
        FAILED_BUILDS+=("standard")
        echo "❌ Standard edition build failed"
    fi

    # Cleanup
    rm -rf "$STANDARD_DIR"
    echo ""
fi

# Print summary
echo "========================================"
echo "Build Summary"
echo "========================================"
echo ""
echo "Successful builds: ${#SUCCESSFUL_BUILDS[@]}"
for edition in "${SUCCESSFUL_BUILDS[@]}"; do
    echo "  ✅ $edition"
done

if [ ${#FAILED_BUILDS[@]} -gt 0 ]; then
    echo ""
    echo "Failed builds: ${#FAILED_BUILDS[@]}"
    for edition in "${FAILED_BUILDS[@]}"; do
        echo "  ❌ $edition"
    done
    echo ""
    echo "Build completed with errors!"
    exit 1
else
    echo ""
    echo "All builds completed successfully!"
    echo ""
    echo "Output directory: $PROJECT_ROOT/dist"
    exit 0
fi
