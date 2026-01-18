#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PackwizParser } from './utils/packwiz-parser.js';

const execAsync = promisify(exec);

/**
 * Main update application script
 * Applies updates from updates.json using packwiz
 */
async function main() {
  console.log('🔧 Applying updates...\n');

  try {
    // Load updates.json
    const updatesPath = path.join(process.cwd(), 'updates.json');
    const updatesData = await fs.readFile(updatesPath, 'utf-8');
    const updates = JSON.parse(updatesData);

    const parser = new PackwizParser();

    // Check if there are any updates
    const totalUpdates = updates.mods.length + (updates.fabricLoader ? 1 : 0);

    if (totalUpdates === 0) {
      console.log('✓ No updates to apply');
      process.exit(0);
    }

    console.log(`📦 Applying ${totalUpdates} update(s)...\n`);

    // Apply mod updates
    if (updates.mods.length > 0) {
      console.log(`🔄 Updating ${updates.mods.length} mod(s)...\n`);

      for (const mod of updates.mods) {
        console.log(`Updating ${mod.name}...`);
        console.log(`  Current: ${mod.currentVersion}`);
        console.log(`  New: ${mod.latestVersion}`);

        try {
          // Use packwiz to update the mod to the specific version
          const { stdout, stderr } = await execAsync(
            `packwiz modrinth add --project-id ${mod.projectId} --version-id ${mod.latestVersionId} -y`,
            { cwd: process.cwd() }
          );

          if (stdout) console.log(`  ${stdout.trim()}`);
          if (stderr) console.error(`  ${stderr.trim()}`);

          console.log(`  ✅ Updated ${mod.name}\n`);
        } catch (error) {
          console.error(`  ❌ Failed to update ${mod.name}:`, error.message);

          // Add to skip list with 48-hour cooldown
          const until = new Date();
          until.setHours(until.getHours() + 48);

          await parser.addToSkipList(
            mod.projectId,
            `Update failed: ${error.message}`,
            until.toISOString()
          );
        }
      }
    }

    // Apply Fabric Loader update
    if (updates.fabricLoader) {
      console.log('🧵 Updating Fabric Loader...');
      console.log(`  Current: ${updates.fabricLoader.currentVersion}`);
      console.log(`  New: ${updates.fabricLoader.latestVersion}`);

      try {
        await parser.updatePackMetadata({
          fabricVersion: updates.fabricLoader.latestVersion
        });

        console.log('  ✅ Updated Fabric Loader\n');
      } catch (error) {
        console.error('  ❌ Failed to update Fabric Loader:', error.message);
      }
    }

    // Run packwiz refresh to update hashes
    console.log('♻️  Refreshing packwiz index...');
    try {
      const { stdout } = await execAsync('packwiz refresh', { cwd: process.cwd() });
      console.log(stdout);
      console.log('✅ Packwiz index refreshed\n');
    } catch (error) {
      console.error('❌ Failed to refresh packwiz index:', error.message);
    }

    // Generate commit message
    const commitMessage = generateCommitMessage(updates);
    console.log('📝 Suggested commit message:');
    console.log('─'.repeat(50));
    console.log(commitMessage);
    console.log('─'.repeat(50));

    // Save commit message to file for GitHub Actions
    const commitMsgPath = path.join(process.cwd(), '.commit-message.txt');
    await fs.writeFile(commitMsgPath, commitMessage);

    console.log('\n✨ Updates applied successfully!');

  } catch (error) {
    console.error('❌ Error applying updates:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Generate conventional commit message from updates
 */
function generateCommitMessage(updates) {
  const lines = [];

  // Title
  if (updates.mods.length > 0 && updates.fabricLoader) {
    lines.push('chore: update mods and Fabric loader');
  } else if (updates.mods.length > 0) {
    lines.push(`chore: update ${updates.mods.length} mod(s)`);
  } else if (updates.fabricLoader) {
    lines.push('chore: update Fabric loader');
  }

  lines.push('');

  // Body - Mod updates
  if (updates.mods.length > 0) {
    lines.push('## Mod Updates');
    lines.push('');
    updates.mods.forEach(mod => {
      lines.push(`- ${mod.name}: ${mod.currentVersion} → ${mod.latestVersion}`);
    });
    lines.push('');
  }

  // Body - Fabric loader update
  if (updates.fabricLoader) {
    lines.push('## Fabric Loader Update');
    lines.push('');
    lines.push(`- ${updates.fabricLoader.currentVersion} → ${updates.fabricLoader.latestVersion}`);
    lines.push('');
  }

  // Footer
  lines.push('Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>');

  return lines.join('\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
