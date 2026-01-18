# Lumo Optimized

[![Build Status](https://github.com/lucasilverentand/lumo-optimized/workflows/Build%20Modpack/badge.svg)](https://github.com/lucasilverentand/lumo-optimized/actions)
[![Latest Release](https://img.shields.io/github/v/release/lucasilverentand/lumo-optimized)](https://github.com/lucasilverentand/lumo-optimized/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/lucasilverentand/lumo-optimized/total)](https://github.com/lucasilverentand/lumo-optimized/releases)
[![License](https://img.shields.io/github/license/lucasilverentand/lumo-optimized)](LICENSE)
[![Minecraft](https://img.shields.io/badge/Minecraft-1.21.3--1.21.8-brightgreen)](https://www.minecraft.net/)
[![Fabric](https://img.shields.io/badge/Mod%20Loader-Fabric-dbd0b4)](https://fabricmc.net/)

A performance-focused Fabric modpack optimized for low-end devices, integrated graphics, and older hardware. Maximum performance with carefully selected mods.

**Available for Minecraft 1.20.x, 1.21.3-1.21.7, and 1.21.8** - See [version support](EDITIONS.md)

**[View Full Documentation](https://lucasilverentand.github.io/lumo-optimized/)**

## Features

- **Optimized for Low-End Hardware**: Integrated GPU, <8GB RAM
- **Maximum Performance**: Shaders disabled, aggressive culling, minimal particles
- **Low LOD Distance**: 64 blocks for best performance
- **Essential QoL Mods**: Minimap, inventory sorting, and more

## Installation

### Prism Launcher (Recommended)

1. Download the latest `.mrpack` file from [Releases](../../releases)
2. Open Prism Launcher
3. Click **Add Instance** → **Import from zip**
4. Select the downloaded `.mrpack` file
5. Click **OK** to install

### Modrinth App

1. Download the latest `.mrpack` file from [Releases](../../releases)
2. Open Modrinth App
3. Drag and drop the `.mrpack` file into the app
4. OR click **Create Profile** → **From File** and select the `.mrpack`

### CurseForge Launcher

1. Download the latest `-curseforge.zip` file from [Releases](../../releases)
2. Open CurseForge launcher
3. Go to **Create Custom Profile**
4. Click **Import** and select the downloaded zip file

## Building from Source

Requires [packwiz](https://packwiz.infra.link/) to be installed.

```bash
# Export for Modrinth/Prism (.mrpack)
make modrinth

# Export for CurseForge (.zip)
make curseforge

# Export all formats
make all

# Update all mods to latest versions
make update

# List all mods
make list
```

## Mod List

### Performance

- Sodium - Modern rendering engine
- Lithium - Game logic optimizations
- FerriteCore - Memory usage optimizations
- ImmediatelyFast - Immediate mode rendering optimizations
- Entity Culling - Skip rendering entities that aren't visible
- More Culling - Additional culling optimizations
- Dynamic FPS - Reduce FPS when game is in background

### Visual Enhancements

- Iris Shaders - Shader support (includes Photon Shaders)
- Voxy - See farther with LODs (up to 10x faster than alternatives)
- Continuity - Connected textures
- BetterGrassify - Better grass rendering
- Animatica - Animated textures support
- Fresh Animations - Mob animation overhaul
- Fresh Moves - Player animation improvements
- Better Leaves - Improved leaf textures
- Fancy Door Animations - Animated doors
- Entity Model/Texture Features - Custom entity models

### Quality of Life

- Mod Menu - In-game mod configuration
- Sodium Extra - Additional Sodium options
- Reese's Sodium Options - Better options menu
- Jade - Block/entity information overlay
- Xaero's Minimap - In-game minimap
- Xaero's World Map - Full world map
- AppleSkin - Food/saturation visualization
- Inventory Profiles Next - Inventory sorting
- Nature's Compass - Find biomes easily
- Controlify - Controller support
- Zoomify - Zoom functionality

### Utility

- Simple Voice Chat - Proximity voice chat
- Traveler's Backpack - Extra storage
- WorldEdit CUI - WorldEdit visualization
- No Chat Reports - Disable chat reporting
- Crash Assistant - Better crash reports
- spark - Performance profiler

### Resource Packs (Included)

- Fresh Animations
- Fresh Moves
- Better Leaves
- Low On Fire

### Shaders (Included)

- Photon Shaders

## Requirements

- Minecraft 1.21.3-1.21.8
- Java 21 or higher
- Minimum: 2GB allocated RAM (4GB recommended)

## License

This modpack configuration is provided as-is. Individual mods retain their own licenses.
