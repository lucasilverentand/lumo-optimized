# Lumo Optimized

A performance-focused Fabric modpack for Minecraft 1.21.8 with quality-of-life improvements, optimized rendering, and beautiful visuals.

## Installation

### Prism Launcher / ATLauncher / MultiMC (Recommended)

1. Download the latest `.mrpack` file from [Releases](../../releases)
2. Open your launcher and go to **Add Instance** > **Import**
3. Select the downloaded `.mrpack` file
4. Click **OK** to install

### Modrinth Launcher

1. Download the latest `.mrpack` file from [Releases](../../releases)
2. Open Modrinth Launcher and click **Create Profile**
3. Select **From File** and choose the downloaded `.mrpack`
4. Click **Create** to install

### CurseForge Launcher

1. Download the latest `-curseforge.zip` file from [Releases](../../releases)
2. Open CurseForge and go to **Create Custom Profile**
3. Click **Import** and select the downloaded zip file
4. Wait for installation to complete

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
- Iris Shaders - Shader support (includes Complementary Unbound)
- Distant Horizons - See farther with LODs
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
- Complementary Unbound

## Requirements

- Minecraft 1.21.8
- Java 21 or higher
- Recommended: 4GB+ allocated RAM

## License

This modpack configuration is provided as-is. Individual mods retain their own licenses.
