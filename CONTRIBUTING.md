# Contributing to Lumo Optimized

Thank you for your interest in contributing to Lumo Optimized! This document provides guidelines for contributing to the modpack.

## How to Contribute

### Suggesting Mods

If you'd like to suggest a mod to be added or removed:

1. Check if there's already an issue for the mod
2. Create a new [Feature Request](https://github.com/lucasilverentand/lumo-optimized/issues/new/choose)
3. Provide the following information:
   - Mod name and link (Modrinth/CurseForge)
   - Why it should be added/removed
   - How it aligns with the modpack's focus (performance + quality-of-life)
   - Compatibility information

### Reporting Bugs

If you encounter a bug:

1. Check if the bug has already been reported
2. Create a new [Bug Report](https://github.com/lucasilverentand/lumo-optimized/issues/new/choose)
3. Include:
   - Modpack version
   - Minecraft version
   - Launcher used
   - Steps to reproduce
   - Crash logs or latest.log (use https://mclo.gs/)
   - Whether you've modified the modpack

### Submitting Pull Requests

We welcome pull requests! Here's how to contribute code:

1. Fork the repository
2. Create a new branch for your changes (`git checkout -b feature/your-feature-name`)
3. Make your changes following our guidelines below
4. Test your changes thoroughly
5. Commit with clear, descriptive messages
6. Push to your fork
7. Open a Pull Request

## Development Setup

### Prerequisites

- [Git](https://git-scm.com/)
- [packwiz](https://packwiz.infra.link/) - For managing the modpack
- A Minecraft launcher (Prism Launcher recommended for testing)

### Building the Modpack

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/lumo-optimized.git
cd lumo-optimized

# Build Modrinth pack (.mrpack)
make modrinth

# Build CurseForge pack (.zip)
make curseforge

# Build both formats
make all
```

### Testing Changes

Before submitting a PR:

1. Build the modpack: `make all`
2. Install and test in Prism Launcher
3. Verify the game launches without crashes
4. Test any specific changes (new mods, config changes, etc.)
5. Check for mod conflicts or compatibility issues

## Modpack Guidelines

### Mod Selection Criteria

Mods should meet at least one of these criteria:

1. **Performance**: Improves FPS, reduces lag, or optimizes memory
2. **Quality of Life**: Enhances user experience without changing core gameplay
3. **Visual Enhancement**: Improves aesthetics while maintaining good performance
4. **Utility**: Provides useful tools (voice chat, backpacks, etc.)

### Mods to Avoid

- Mods that drastically change vanilla gameplay
- Mods with known compatibility issues
- Mods that significantly hurt performance
- Mods with restrictive licenses
- Forge-only mods (we're Fabric-only)

### Configuration Changes

When modifying configs:

- Document why the change is needed
- Ensure changes align with the modpack's performance focus
- Test thoroughly to avoid breaking existing functionality
- Don't include user-specific files (see `.gitignore`)

## Using Packwiz

### Adding a Mod

```bash
# Add from Modrinth (recommended)
packwiz modrinth add <mod-slug>

# Add from CurseForge
packwiz curseforge add <mod-slug>

# Refresh index after adding
packwiz refresh
```

### Removing a Mod

```bash
packwiz remove <mod-name>
packwiz refresh
```

### Updating Mods

```bash
# Update specific mod
packwiz update <mod-name>

# Update all mods
packwiz update --all

# Refresh index
packwiz refresh
```

## Code Style

### Commit Messages

Follow conventional commit format:

- `feat: Add Sodium Extra mod`
- `fix: Resolve crash with Distant Horizons`
- `config: Adjust Jade tooltip settings`
- `docs: Update installation instructions`
- `chore: Update dependencies`

### File Organization

- Mods: `mods/*.pw.toml`
- Resource packs: `resourcepacks/*.pw.toml`
- Shader packs: `shaderpacks/*.pw.toml`
- Configs: `config/`
- Overrides: `overrides/`

## Community

- Be respectful and constructive
- Help others when possible
- Follow GitHub's [Community Guidelines](https://docs.github.com/en/site-policy/github-terms/github-community-guidelines)

## Questions?

If you have questions about contributing:

- Check existing issues and PRs
- Create a discussion thread
- Reach out in Discord (if you have a Discord server)

Thank you for contributing to Lumo Optimized! 🎮✨
