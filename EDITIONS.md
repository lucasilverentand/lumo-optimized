# Lumo Optimized - Performance Profiles

This modpack provides 7 performance profiles optimized for different hardware configurations.

## Available Editions

| Edition | Target Hardware | Shaders | LOD Distance | Battery Optimized |
|---------|-----------------|---------|--------------|-------------------|
| **Standard** | Desktop PCs | ✅ Enabled | 256 | ❌ |
| **Steam Deck** | Valve Steam Deck | ❌ Disabled | 128 | ✅ |
| **MacBook** | Apple Silicon laptops | ✅ Mac Metal* | 192 | ✅ |
| **Mac Studio** | Apple Silicon desktop | ✅ Mac Metal* | 512 | ❌ |
| **Low-End** | Integrated GPU, <8GB RAM | ❌ Disabled | 64 | ✅ |
| **Medium** | Mid-range GPU, 8-16GB RAM | ✅ Enabled | 256 | ❌ |
| **High-End** | RTX 3070+, 16GB+ RAM | ✅ Max Quality | 512 | ❌ |

*Mac editions use Photon shader with Apple Metal compatibility settings (`SH_SKYLIGHT=false`, `COLORED_SHADOWS=false`)

## Detailed Comparison

### Standard Edition
**Target:** General desktop PCs and laptops
- **Shaders:** Enabled (Photon)
- **LOD Distance:** 256 blocks
- **Quality Settings:** Default
- **FPS Cap:** Uncapped
- **Best For:** Users who want good visuals with reasonable performance

### Steam Deck Edition
**Target:** Valve Steam Deck handheld
- **Shaders:** Disabled (better battery life)
- **LOD Distance:** 128 blocks
- **Quality Settings:** Fast
- **FPS Cap:** 60
- **Controller:** Pre-configured with Controlify
- **Dynamic FPS:** Aggressive power saving when unfocused
- **Best For:** Steam Deck users prioritizing battery life and handheld comfort

### MacBook Edition
**Target:** MacBook Pro/Air with Apple Silicon
- **Shaders:** Enabled (Mac Metal compatible)
- **LOD Distance:** 192 blocks
- **Quality Settings:** Default
- **CPU Render Ahead:** 2 (reduced from 3)
- **Dynamic FPS:** Battery-aware throttling
- **Special:** `reduce_resolution_on_mac=true`, adaptive sync enabled
- **Best For:** MacBook users who want shaders while maintaining battery life

### Mac Studio Edition
**Target:** Mac Studio, Mac Mini, iMac
- **Shaders:** Enabled (Mac Metal compatible, high quality)
- **LOD Distance:** 512 blocks (maximum)
- **Quality Settings:** Maximum
- **Shadow Distance:** 32 chunks
- **SSGI:** Enabled
- **VL Samples:** 16 (high quality volumetric lighting)
- **Best For:** Desktop Mac users who want the best visuals

### Low-End Edition
**Target:** Integrated graphics, older hardware, <8GB RAM
- **Shaders:** Disabled
- **LOD Distance:** 64 blocks (minimal)
- **Quality Settings:** Fast
- **Particles:** Reduced (rain splash disabled)
- **Animations:** Minimal (portal, block animations disabled)
- **Culling Distance:** 64 blocks (aggressive)
- **FPS Cap:** Uncapped (to show max performance)
- **Best For:** Older PCs, integrated graphics, maximizing FPS on weak hardware

### Medium Edition
**Target:** Mid-range gaming PCs (GTX 1660, RX 580, etc.)
- **Shaders:** Enabled (balanced quality)
- **LOD Distance:** 256 blocks
- **Quality Settings:** Default
- **Shadow Resolution:** 1536 (medium)
- **Shadow Distance:** 24 chunks
- **VL Samples:** 8 (moderate volumetric lighting)
- **Best For:** Users with mid-range GPUs who want shaders without performance issues

### High-End Edition
**Target:** High-end gaming PCs (RTX 3070+, RX 6800+)
- **Shaders:** Enabled (maximum quality)
- **LOD Distance:** 512 blocks (maximum)
- **Quality Settings:** Maximum
- **Shadow Resolution:** 2048 (ultra)
- **Shadow Distance:** 32 chunks
- **Shadow VPS:** Enabled (variable penumbra size)
- **Colored Shadows:** Enabled
- **SSGI:** Enabled with 6 samples
- **GTAO:** 4 slices, 5 steps (maximum quality)
- **VL Samples:** 24 (maximum volumetric lighting)
- **Reflections:** 3 samples
- **Animate All Textures:** true (no culling optimization)
- **Best For:** High-end systems that can handle maximum settings

## Mac-Specific Shader Settings

Mac editions (MacBook and Mac Studio) include special Photon shader configuration for Apple Metal compatibility:

```
SH_SKYLIGHT=false          # Required for Metal
COLORED_SHADOWS=false      # Required for Metal
```

These settings are **mandatory** for Photon to work on macOS. Without them, shaders will not render correctly on Mac systems.

## How to Choose

**If your Static FPS is:**
- < 30 FPS → Use **Low-End** edition
- 30-60 FPS → Use **Medium** edition (or disable shaders)
- 60-90 FPS → Use **Standard** or **Medium** edition
- 90+ FPS → Use **High-End** edition

**For laptops on battery:**
- MacBook → Use **MacBook** edition
- Others → Use **Low-End** or **Medium** edition

**For handheld devices:**
- Steam Deck → Use **Steam Deck** edition

**For desktop Macs:**
- Mac Studio/Mini/iMac → Use **Mac Studio** edition

## Building Editions

```bash
# Build a specific edition
make macbook
make high-end

# Build all editions
make all-editions

# Build standard edition
make all
```

## Benchmarking

To find the best edition for your hardware:

```bash
# View benchmarking guide
make benchmark

# Trigger automated CI benchmark
make benchmark-ci
```

In-game testing:
```
/spark profiler start
[play for 60 seconds]
/spark profiler stop
```

Test locations (seed: 8675309):
- Spawn: 0, 100, 0 (open plains)
- Forest: 500, 80, 500 (tree rendering)
- Village: -200, 70, 300 (entity stress)

## Technical Details

### Settings Modified by Edition

| Setting | Standard | Steam Deck | MacBook | Mac Studio | Low-End | Medium | High-End |
|---------|----------|------------|---------|------------|---------|--------|----------|
| Shaders | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| LOD Distance | 256 | 128 | 192 | 512 | 64 | 256 | 512 |
| Weather Quality | Default | Fast | Default | Default | Fast | Default | Default |
| Leaves Quality | Default | Fast | Default | Default | Fast | Default | Default |
| CPU Render Ahead | 3 | 2 | 2 | 3 | 2 | 3 | 3 |
| Shadow Resolution | 1024 | - | 1024 | 2048 | - | 1536 | 2048 |
| Shadow Distance | 32 | - | 16 | 32 | - | 24 | 32 |
| Culling Distance | 128 | 128 | 96 | 128 | 64 | 96 | 128 |
| Rain Splash | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Vignette | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |

### Shader Quality Comparison

| Feature | MacBook | Mac Studio | Medium | High-End |
|---------|---------|------------|--------|----------|
| Shadow PCF | ✅ | ✅ | ✅ | ✅ |
| Shadow VPS | ❌ | ✅ | ❌ | ✅ |
| Colored Shadows | ❌ (Metal) | ❌ (Metal) | ❌ | ✅ |
| SH Skylight | ❌ (Metal) | ❌ (Metal) | ✅ | ✅ |
| SSGI | ❌ | ✅ | ❌ | ✅ |
| GTAO Slices | 2 | 3 | 2 | 4 |
| VL Samples | 8 | 16 | 8 | 24 |
| Reflection Samples | 1 | 2 | 1 | 3 |
| Cloud Thickness | 1500 | 2000 | 1500 | 2500 |

## Release Process

When ready to release:

```bash
# Tag a new version
git tag -a v1.1.0 -m "Release 1.1.0 with 7 editions"
git push origin v1.1.0
```

This will trigger GitHub Actions to:
1. Build all 7 editions
2. Create `.mrpack` and `-curseforge.zip` for each
3. Create a GitHub release with all 14 files
4. Run automated benchmarks
5. Generate benchmark comparison report

## Files

```
lumo-optimized-v1.1.0.mrpack                    # Standard edition
lumo-optimized-steam-deck-v1.1.0.mrpack         # Steam Deck edition
lumo-optimized-macbook-v1.1.0.mrpack            # MacBook edition
lumo-optimized-mac-studio-v1.1.0.mrpack         # Mac Studio edition
lumo-optimized-low-end-v1.1.0.mrpack            # Low-End edition
lumo-optimized-medium-v1.1.0.mrpack             # Medium edition
lumo-optimized-high-end-v1.1.0.mrpack           # High-End edition

# Plus -curseforge.zip variants of each
```
