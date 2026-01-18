#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { ModrinthAPI } from './utils/modrinth-api.js';
import { FabricMetaAPI } from './utils/fabric-meta-api.js';
import { PackwizParser } from './utils/packwiz-parser.js';

/**
 * Main update checker script
 * Detects available mod and loader updates and outputs updates.json
 */
async function main() {
  console.log('🔍 Checking for mod and loader updates...\n');

  try {
    // Load configuration
    const configPath = path.join(process.cwd(), 'config/automation/update-config.json');
    const skipListPath = path.join(process.cwd(), 'config/automation/mod-skip-list.json');

    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);

    const skipListData = await fs.readFile(skipListPath, 'utf-8');
    const skipList = JSON.parse(skipListData);

    // Initialize APIs
    const modrinthAPI = new ModrinthAPI(config.rateLimit);
    const fabricAPI = new FabricMetaAPI({ cacheTtlHours: config.rateLimit.cacheTtlHours });
    const parser = new PackwizParser();

    // Load caches
    await modrinthAPI.loadCache();
    await fabricAPI.loadCache();

    // Get pack metadata
    const packMeta = await parser.getPackMetadata();
    console.log(`📦 Pack: ${packMeta.name}`);
    console.log(`🎮 Minecraft: ${packMeta.mcVersion}`);
    console.log(`🧵 Fabric Loader: ${packMeta.fabricVersion}\n`);

    // Get all mods metadata
    console.log('📋 Scanning mods directory...');
    const allMods = await parser.getAllModsMetadata();
    console.log(`Found ${allMods.length} mods\n`);

    // Filter out skipped mods
    const modsToCheck = allMods.filter(mod => {
      const skipped = parser.isModSkipped(mod.projectId, skipList);
      if (skipped) {
        console.log(`⏭️  Skipping ${mod.name} (in skip list)`);
      }
      return !skipped;
    });

    console.log(`\n🔎 Checking updates for ${modsToCheck.length} mods...\n`);

    // Check mod updates
    const modUpdates = await modrinthAPI.batchGetLatestVersions(
      modsToCheck.map(mod => ({
        name: mod.name,
        projectId: mod.projectId,
        currentVersionId: mod.currentVersionId,
        gameVersions: [packMeta.mcVersion]
      }))
    );

    // Filter to mods with updates
    const modsWithUpdates = modUpdates.filter(m => m.hasUpdate);

    console.log(`✅ Found ${modsWithUpdates.length} mod updates available\n`);

    if (modsWithUpdates.length > 0) {
      console.log('Mod updates:');
      modsWithUpdates.forEach(mod => {
        console.log(`  • ${mod.modName}: ${mod.currentVersion.version_number} → ${mod.latestVersion.version_number}`);
      });
      console.log('');
    }

    // Check Fabric Loader update
    console.log('🧵 Checking Fabric Loader updates...');
    const loaderUpdate = await fabricAPI.checkLoaderUpdate(
      packMeta.fabricVersion,
      packMeta.mcVersion
    );

    if (loaderUpdate.hasUpdate) {
      console.log(`✅ Fabric Loader update available: ${loaderUpdate.currentVersion} → ${loaderUpdate.latestVersion}\n`);
    } else {
      console.log(`✓ Fabric Loader is up to date (${loaderUpdate.currentVersion})\n`);
    }

    // Save caches
    await modrinthAPI.saveCache();
    await fabricAPI.saveCache();

    // Prepare updates data
    const updates = {
      timestamp: new Date().toISOString(),
      minecraftVersion: packMeta.mcVersion,
      mods: modsWithUpdates.map(mod => ({
        name: mod.modName,
        projectId: mod.projectId,
        currentVersion: mod.currentVersion.version_number,
        currentVersionId: mod.currentVersion.id,
        latestVersion: mod.latestVersion.version_number,
        latestVersionId: mod.latestVersion.id,
        changelog: mod.latestVersion.changelog,
        updateUrl: mod.updateUrl
      })),
      fabricLoader: loaderUpdate.hasUpdate ? {
        currentVersion: loaderUpdate.currentVersion,
        latestVersion: loaderUpdate.latestVersion,
        changelogUrl: loaderUpdate.changelogUrl
      } : null
    };

    // Save updates.json
    const outputPath = path.join(process.cwd(), 'updates.json');
    await fs.writeFile(outputPath, JSON.stringify(updates, null, 2));

    console.log(`💾 Saved update data to updates.json`);

    // Print summary
    console.log('\n📊 Summary:');
    console.log(`  • Mod updates: ${modsWithUpdates.length}`);
    console.log(`  • Loader update: ${loaderUpdate.hasUpdate ? 'Yes' : 'No'}`);
    console.log(`  • Total updates: ${modsWithUpdates.length + (loaderUpdate.hasUpdate ? 1 : 0)}`);

    // Exit code based on updates available
    if (modsWithUpdates.length > 0 || loaderUpdate.hasUpdate) {
      console.log('\n✨ Updates available!');
      process.exit(0);
    } else {
      console.log('\n✓ Everything is up to date!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error checking updates:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
