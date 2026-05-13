#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import TOML from 'toml';

const OUTPUT_DIR = '.release-candidate';
const SUMMARY_FILE = path.join(OUTPUT_DIR, 'summary.md');
const PR_BODY_FILE = path.join(OUTPUT_DIR, 'pr-body.md');
const COMMIT_MESSAGE_FILE = path.join(OUTPUT_DIR, 'commit-message.txt');

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  console.log('Preparing release candidate...');

  await run('bun', ['run', 'scripts/automation/check-updates.js']);

  const updates = await readJson('updates.json');
  const totalUpdates = updates.mods.length + (updates.fabricLoader ? 1 : 0);

  if (totalUpdates === 0) {
    const summary = [
      '# Release Candidate',
      '',
      'No mod or Fabric loader updates were found.',
      ''
    ].join('\n');

    await writeOutputs({
      has_updates: 'false',
      summary_file: SUMMARY_FILE,
      pr_body_file: PR_BODY_FILE,
      commit_message_file: COMMIT_MESSAGE_FILE
    });

    await fs.writeFile(SUMMARY_FILE, summary);
    await fs.writeFile(PR_BODY_FILE, summary);
    await fs.writeFile(COMMIT_MESSAGE_FILE, 'chore: no modpack updates\n');
    console.log('No updates found.');
    return;
  }

  await run('bun', ['run', 'scripts/automation/apply-updates.js']);
  await removeLegacyGeneratedFiles();
  await run('bun', ['run', 'scripts/automation/validate-compatibility.js']);
  await run(getPackwizCommand(), ['refresh']);

  await run('make', ['clean']);
  await run('make', ['all']);

  const pack = await readPackMetadata();
  const artifacts = [
    `dist/lumo-optimized-${pack.version}.mrpack`,
    `dist/lumo-optimized-${pack.version}-curseforge.zip`
  ];

  for (const artifact of artifacts) {
    await assertFileExists(artifact);
    await run('unzip', ['-t', artifact]);
  }

  const commitMessage = buildCommitMessage(updates);
  const prBody = buildPrBody(updates, pack, artifacts);
  const summary = buildSummary(updates, pack, artifacts);

  await fs.writeFile(COMMIT_MESSAGE_FILE, commitMessage);
  await fs.writeFile(PR_BODY_FILE, prBody);
  await fs.writeFile(SUMMARY_FILE, summary);

  await writeOutputs({
    has_updates: 'true',
    update_count: String(totalUpdates),
    mod_update_count: String(updates.mods.length),
    has_loader_update: updates.fabricLoader ? 'true' : 'false',
    summary_file: SUMMARY_FILE,
    pr_body_file: PR_BODY_FILE,
    commit_message_file: COMMIT_MESSAGE_FILE
  });

  console.log(`Release candidate prepared with ${totalUpdates} update(s).`);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function readPackMetadata() {
  const pack = TOML.parse(await fs.readFile('pack.toml', 'utf8'));

  return {
    name: pack.name,
    version: pack.version,
    minecraft: pack.versions?.minecraft,
    fabric: pack.versions?.fabric
  };
}

async function assertFileExists(filePath) {
  const stat = await fs.stat(filePath);

  if (!stat.isFile() || stat.size === 0) {
    throw new Error(`${filePath} was not created or is empty`);
  }
}

function buildCommitMessage(updates) {
  const title = updates.fabricLoader
    ? 'fix(deps): update modpack dependencies and loader'
    : 'fix(deps): update modpack dependencies';

  const lines = [title, ''];

  if (updates.mods.length > 0) {
    lines.push('Mod updates:');
    for (const mod of updates.mods) {
      lines.push(`- ${mod.name}: ${mod.currentVersion} -> ${mod.latestVersion}`);
    }
    lines.push('');
  }

  if (updates.fabricLoader) {
    lines.push('Fabric loader update:');
    lines.push(`- ${updates.fabricLoader.currentVersion} -> ${updates.fabricLoader.latestVersion}`);
    lines.push('');
  }

  lines.push('Validation:');
  lines.push('- bun run scripts/automation/validate-compatibility.js');
  lines.push('- make all');
  lines.push('- unzip -t dist/*.mrpack dist/*.zip');

  return `${lines.join('\n')}\n`;
}

function buildPrBody(updates, pack, artifacts) {
  const lines = [
    '## Release Candidate',
    '',
    `Pack version: \`${pack.version}\``,
    `Minecraft: \`${pack.minecraft}\``,
    `Fabric Loader: \`${pack.fabric}\``,
    '',
    '## Updates',
    ''
  ];

  if (updates.mods.length > 0) {
    lines.push('| Mod | Current | New |');
    lines.push('| --- | --- | --- |');
    for (const mod of updates.mods) {
      lines.push(`| ${mod.name} | \`${mod.currentVersion}\` | \`${mod.latestVersion}\` |`);
    }
    lines.push('');
  } else {
    lines.push('No mod updates.');
    lines.push('');
  }

  if (updates.fabricLoader) {
    lines.push('## Fabric Loader');
    lines.push('');
    lines.push(`\`${updates.fabricLoader.currentVersion}\` -> \`${updates.fabricLoader.latestVersion}\``);
    lines.push('');
  }

  lines.push('## Validation');
  lines.push('');
  lines.push('- [x] Compatibility metadata validated');
  lines.push('- [x] Packwiz index refreshed');
  lines.push('- [x] Modrinth export built');
  lines.push('- [x] CurseForge export built');
  lines.push('- [x] Exported archives passed `unzip -t`');
  lines.push('');
  lines.push('## Built Artifacts');
  lines.push('');
  for (const artifact of artifacts) {
    lines.push(`- \`${artifact}\``);
  }
  lines.push('');
  lines.push('## Release Flow');
  lines.push('');
  lines.push('After this PR merges, Release Please updates the release PR. Merging the Release Please PR creates the GitHub release and uploads the Modrinth and CurseForge exports.');
  lines.push('');

  return lines.join('\n');
}

function buildSummary(updates, pack, artifacts) {
  return [
    '# Release Candidate Summary',
    '',
    `Pack version: ${pack.version}`,
    `Minecraft: ${pack.minecraft}`,
    `Fabric Loader: ${pack.fabric}`,
    `Mod updates: ${updates.mods.length}`,
    `Loader update: ${updates.fabricLoader ? 'yes' : 'no'}`,
    '',
    'Artifacts:',
    ...artifacts.map(artifact => `- ${artifact}`),
    ''
  ].join('\n');
}

async function writeOutputs(outputs) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`);
  await fs.appendFile(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`$ ${command} ${args.join(' ')}`);

    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit'
    });

    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
      }
    });
  });
}

function getPackwizCommand() {
  return process.env.PACKWIZ || 'packwiz';
}

async function removeLegacyGeneratedFiles() {
  await fs.rm('.commit-message.txt', { force: true });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}
