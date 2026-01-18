# Lumo Optimized Modpack - Build Scripts
# Exports modpack to various launcher formats

PACKWIZ := $(shell command -v packwiz 2>/dev/null || echo "$(HOME)/.local/share/mise/installs/go/1.25.3/bin/packwiz")
DIST_DIR := dist
PACK_NAME := lumo-optimized
VERSION := $(shell grep '^version' pack.toml | cut -d'"' -f2)

.PHONY: all clean modrinth curseforge refresh list help update check-updates apply-updates validate build-all-editions check-mc-versions

all: modrinth curseforge

help:
	@echo "Lumo Optimized Modpack Build System"
	@echo ""
	@echo "Usage:"
	@echo "  make modrinth      - Export .mrpack for Modrinth/Prism Launcher"
	@echo "  make curseforge    - Export .zip for CurseForge"
	@echo "  make all           - Export all formats"
	@echo ""
	@echo "Utilities:"
	@echo "  make refresh       - Refresh packwiz index"
	@echo "  make list          - List all mods in the pack"
	@echo "  make update        - Update all mods to latest versions"
	@echo "  make clean         - Remove dist and build directories"
	@echo ""
	@echo "Automation:"
	@echo "  make check-updates        - Check for available mod updates"
	@echo "  make apply-updates        - Apply detected updates"
	@echo "  make validate             - Validate mod compatibility"
	@echo "  make check-mc-versions    - Check for new Minecraft versions"
	@echo "  make build-all-editions   - Build all 7 hardware editions"
	@echo ""
	@echo "Current version: $(VERSION)"

$(DIST_DIR):
	mkdir -p $(DIST_DIR)

refresh:
	$(PACKWIZ) refresh

list:
	$(PACKWIZ) list

update:
	$(PACKWIZ) update --all

# Export to Modrinth format (.mrpack)
# Compatible with: Modrinth Launcher, Prism Launcher, ATLauncher, MultiMC
modrinth: $(DIST_DIR) refresh
	$(PACKWIZ) modrinth export -o $(DIST_DIR)/$(PACK_NAME)-$(VERSION).mrpack
	@echo "Exported: $(DIST_DIR)/$(PACK_NAME)-$(VERSION).mrpack"

# Export to CurseForge format (.zip)
# Compatible with: CurseForge Launcher, GDLauncher
curseforge: $(DIST_DIR) refresh
	$(PACKWIZ) curseforge export -o $(DIST_DIR)/$(PACK_NAME)-$(VERSION)-curseforge.zip
	@echo "Exported: $(DIST_DIR)/$(PACK_NAME)-$(VERSION)-curseforge.zip"

clean:
	rm -rf $(DIST_DIR)
	rm -rf .build

# Automation targets
check-updates:
	@echo "🔍 Checking for mod updates..."
	@bun run scripts/automation/check-updates.js

apply-updates:
	@echo "🔧 Applying updates..."
	@bun run scripts/automation/apply-updates.js

validate:
	@echo "🔍 Validating compatibility..."
	@bun run scripts/automation/validate-compatibility.js

check-mc-versions:
	@echo "🎮 Checking Minecraft versions..."
	@bun run scripts/automation/check-minecraft-versions.js

build-all-editions:
	@echo "🔨 Building all editions..."
	@./scripts/build-all-editions.sh
