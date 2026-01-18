#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ModrinthAPI } from './utils/modrinth-api.js';
import { PackwizParser } from './utils/packwiz-parser.js';

const execAsync = promisify(exec);

/**
 * Three-tier validation system
 * 1. API Validation: Check Modrinth metadata for compatibility
 * 2. Dependency Validation: Parse mod dependencies for conflicts
 * 3. Build Validation: Test packwiz refresh
 */
async function main() {
  console.log('🔍 Validating mod compatibility...\n');

  const results = {
    timestamp: new Date().toISOString(),
    apiValidation: { passed: false, issues: [] },
    dependencyValidation: { passed: false, issues: [] },
    buildValidation: { passed: false, issues: [] },
    overall: { passed: false }
  };

  try {
    // Load configuration
    const configPath = path.join(process.cwd(), 'config/automation/update-config.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);

    const modrinthAPI = new ModrinthAPI(config.rateLimit);
    const parser = new PackwizParser();

    await modrinthAPI.loadCache();

    // Get pack metadata
    const packMeta = await parser.getPackMetadata();
    console.log(`📦 Pack: ${packMeta.name}`);
    console.log(`🎮 Minecraft: ${packMeta.mcVersion}\n`);

    // ===== TIER 1: API VALIDATION =====
    console.log('1️⃣  API Validation: Checking Modrinth metadata...\n');

    const allMods = await parser.getAllModsMetadata();
    let apiIssues = 0;

    for (const mod of allMods) {
      try {
        const version = await modrinthAPI.getVersion(mod.currentVersionId);

        // Check if current MC version is supported
        if (!version.game_versions.includes(packMeta.mcVersion)) {
          const issue = `${mod.name}: Version ${version.version_number} does not support MC ${packMeta.mcVersion}`;
          results.apiValidation.issues.push(issue);
          console.log(`  ❌ ${issue}`);
          apiIssues++;
        }

        // Check loader compatibility
        if (!version.loaders.includes('fabric')) {
          const issue = `${mod.name}: Version ${version.version_number} does not support Fabric`;
          results.apiValidation.issues.push(issue);
          console.log(`  ❌ ${issue}`);
          apiIssues++;
        }

      } catch (error) {
        const issue = `${mod.name}: Failed to validate - ${error.message}`;
        results.apiValidation.issues.push(issue);
        console.log(`  ⚠️  ${issue}`);
      }
    }

    results.apiValidation.passed = apiIssues === 0;
    console.log(results.apiValidation.passed
      ? '\n  ✅ All mods pass API validation\n'
      : `\n  ❌ ${apiIssues} API validation issue(s) found\n`
    );

    // ===== TIER 2: DEPENDENCY VALIDATION =====
    console.log('2️⃣  Dependency Validation: Checking mod dependencies...\n');

    const dependencyMap = new Map();
    let dependencyIssues = 0;

    for (const mod of allMods) {
      try {
        const version = await modrinthAPI.getVersion(mod.currentVersionId);

        if (version.dependencies && version.dependencies.length > 0) {
          for (const dep of version.dependencies) {
            if (dep.dependency_type === 'required') {
              // Check if required dependency is present
              const depInstalled = allMods.some(m => m.projectId === dep.project_id);

              if (!depInstalled) {
                const issue = `${mod.name}: Missing required dependency ${dep.project_id}`;
                results.dependencyValidation.issues.push(issue);
                console.log(`  ❌ ${issue}`);
                dependencyIssues++;
              }
            } else if (dep.dependency_type === 'incompatible') {
              // Check if incompatible mod is present
              const incompatibleInstalled = allMods.some(m => m.projectId === dep.project_id);

              if (incompatibleInstalled) {
                const incompatibleMod = allMods.find(m => m.projectId === dep.project_id);
                const issue = `${mod.name}: Incompatible with ${incompatibleMod.name}`;
                results.dependencyValidation.issues.push(issue);
                console.log(`  ❌ ${issue}`);
                dependencyIssues++;
              }
            }
          }
        }

        dependencyMap.set(mod.projectId, version.dependencies || []);

      } catch (error) {
        console.log(`  ⚠️  ${mod.name}: Could not check dependencies - ${error.message}`);
      }
    }

    results.dependencyValidation.passed = dependencyIssues === 0;
    console.log(results.dependencyValidation.passed
      ? '\n  ✅ All dependencies validated\n'
      : `\n  ❌ ${dependencyIssues} dependency issue(s) found\n`
    );

    // ===== TIER 3: BUILD VALIDATION =====
    console.log('3️⃣  Build Validation: Testing packwiz refresh...\n');

    try {
      const { stdout, stderr } = await execAsync('packwiz refresh', { cwd: process.cwd() });

      if (stderr && !stderr.includes('Refreshing')) {
        results.buildValidation.issues.push(`Packwiz stderr: ${stderr}`);
        console.log(`  ⚠️  ${stderr}`);
      }

      results.buildValidation.passed = true;
      console.log('  ✅ Packwiz refresh successful\n');

    } catch (error) {
      const issue = `Packwiz refresh failed: ${error.message}`;
      results.buildValidation.issues.push(issue);
      console.log(`  ❌ ${issue}\n`);
      results.buildValidation.passed = false;
    }

    // ===== OVERALL RESULT =====
    results.overall.passed = results.apiValidation.passed &&
                              results.dependencyValidation.passed &&
                              results.buildValidation.passed;

    console.log('═'.repeat(50));
    console.log('📊 Validation Summary:');
    console.log('═'.repeat(50));
    console.log(`  API Validation: ${results.apiValidation.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Dependency Validation: ${results.dependencyValidation.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Build Validation: ${results.buildValidation.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('─'.repeat(50));
    console.log(`  Overall: ${results.overall.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('═'.repeat(50));

    // Save results
    const resultsPath = path.join(process.cwd(), 'validation-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Validation results saved to validation-results.json`);

    // Save cache
    await modrinthAPI.saveCache();

    // Exit with appropriate code
    process.exit(results.overall.passed ? 0 : 1);

  } catch (error) {
    console.error('❌ Error during validation:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
