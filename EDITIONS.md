# Lumo Optimized - Minecraft Version Support

This document describes the multi-version release strategy and Minecraft compatibility.

## Minecraft Versions

Lumo Optimized maintains releases for multiple Minecraft versions simultaneously through independent Git branches:

| Branch | Minecraft Version | Status | Download |
|--------|------------------|---------|----------|
| **main** | 1.21.8 (latest) | Active Development | [Latest Release](https://github.com/lucasilverentand/lumo-optimized/releases/latest) |
| **mc-1.21.x** | 1.21.3-1.21.7 | Stable Support | [mc1.21 Releases](https://github.com/lucasilverentand/lumo-optimized/releases?q=mc1.21) |
| **mc-1.20.x** | 1.20.x series | Legacy Support | [mc1.20 Releases](https://github.com/lucasilverentand/lumo-optimized/releases?q=mc1.20) |

## Single Optimized Modpack

As of v1.0.0, Lumo Optimized is a **single modpack** optimized for low-end hardware and integrated graphics. Previous multi-edition releases have been consolidated into one carefully balanced configuration.

### Why One Modpack?

The single modpack approach provides:
- **Consistent Experience**: All users get the same tested configuration
- **Better Maintenance**: Easier to update and support
- **User Customization**: Settings can be adjusted in-game for your hardware
- **Automated Updates**: Daily checks for mod updates across all Minecraft versions

### Hardware Compatibility

The single modpack works well across a range of hardware:

| Hardware Type | Performance | Recommended Settings |
|---------------|-------------|---------------------|
| **Integrated Graphics** | ✅ Excellent | Shaders optional, default settings |
| **Low-End Dedicated GPU** | ✅ Good | Enable shaders for better visuals |
| **Mid-Range GPU** | ✅ Excellent | Max settings, high render distance |
| **High-End GPU** | ✅ Overkill | Max everything, enjoy 200+ FPS |
| **Steam Deck** | ✅ Good | See [Steam Deck Guide](docs/src/content/docs/getting-started/steam-deck.mdx) |
| **MacBook** | ✅ Good | Use Metal-compatible shader settings |

## Automated Version Management

Lumo Optimized uses automated scripts to:
- **Daily update checks** for all mods on all branches
- **Automatic PR creation** for mod updates (requires manual approval)
- **Compatibility validation** before releases
- **Multi-version releases** with branch-specific tags

### Release Tags

- **main branch**: `v1.2.0`, `v1.3.0`, etc.
- **mc-1.21.x branch**: `mc1.21-v2.0.0`, `mc1.21-v2.1.0`, etc.
- **mc-1.20.x branch**: `mc1.20-v2.0.0`, `mc1.20-v2.1.0`, etc.

## Download the Right Version

Choose your Minecraft version:

- **Minecraft 1.21.8**: Download from [Latest Release](https://github.com/lucasilverentand/lumo-optimized/releases/latest) (tag: `v*`)
- **Minecraft 1.21.3-1.21.7**: Download from [mc1.21 releases](https://github.com/lucasilverentand/lumo-optimized/releases?q=mc1.21) (tag: `mc1.21-v*`)
- **Minecraft 1.20.x**: Download from [mc1.20 releases](https://github.com/lucasilverentand/lumo-optimized/releases?q=mc1.20) (tag: `mc1.20-v*`)

Each release includes:
- `.mrpack` file (for Prism Launcher, Modrinth App)
- `-curseforge.zip` file (for CurseForge Launcher)
