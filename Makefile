# Lumo Optimized Modpack - Build Scripts
# Exports modpack to various launcher formats

PACKWIZ := $(shell command -v packwiz 2>/dev/null || echo "$(HOME)/.local/share/mise/installs/go/1.25.3/bin/packwiz")
DIST_DIR := dist
PACK_NAME := lumo-optimized
VERSION := $(shell grep '^version' pack.toml | cut -d'"' -f2)

# All available editions
EDITIONS := steam-deck macbook mac-studio low-end medium high-end

.PHONY: all clean modrinth curseforge refresh list help steam-deck macbook mac-studio low-end medium high-end all-editions benchmark benchmark-ci

all: modrinth curseforge

all-editions: all $(EDITIONS)

help:
	@echo "Lumo Optimized Modpack Build System"
	@echo ""
	@echo "Usage:"
	@echo "  make modrinth      - Export .mrpack for Modrinth/Prism Launcher"
	@echo "  make curseforge    - Export .zip for CurseForge"
	@echo "  make all           - Export all formats (standard edition)"
	@echo ""
	@echo "Edition builds:"
	@echo "  make steam-deck    - Build Steam Deck optimized edition"
	@echo "  make macbook       - Build MacBook optimized edition"
	@echo "  make mac-studio    - Build Mac Studio optimized edition"
	@echo "  make low-end       - Build Low-End PC edition"
	@echo "  make medium        - Build Medium PC edition"
	@echo "  make high-end      - Build High-End PC edition"
	@echo "  make all-editions  - Build all editions"
	@echo ""
	@echo "Utilities:"
	@echo "  make refresh       - Refresh packwiz index"
	@echo "  make list          - List all mods in the pack"
	@echo "  make update        - Update all mods to latest versions"
	@echo "  make clean         - Remove dist and build directories"
	@echo "  make benchmark     - Show benchmarking instructions"
	@echo ""
	@echo "Current version: $(VERSION)"
	@echo "Available editions: standard $(EDITIONS)"

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

# Build Steam Deck optimized edition
steam-deck: $(DIST_DIR)
	@./scripts/build-edition.sh steam-deck

# Build MacBook optimized edition
macbook: $(DIST_DIR)
	@./scripts/build-edition.sh macbook

# Build Mac Studio optimized edition
mac-studio: $(DIST_DIR)
	@./scripts/build-edition.sh mac-studio

# Build Low-End PC edition
low-end: $(DIST_DIR)
	@./scripts/build-edition.sh low-end

# Build Medium PC edition
medium: $(DIST_DIR)
	@./scripts/build-edition.sh medium

# Build High-End PC edition
high-end: $(DIST_DIR)
	@./scripts/build-edition.sh high-end

# Show benchmarking instructions
benchmark:
	@./scripts/benchmark.sh

# Trigger CI benchmark (requires gh CLI)
benchmark-ci:
	@echo "Triggering CI benchmark workflow..."
	@gh workflow run benchmark.yml --ref $(shell git branch --show-current)
	@echo ""
	@echo "Benchmark started! View progress at:"
	@echo "  https://github.com/$$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions"
