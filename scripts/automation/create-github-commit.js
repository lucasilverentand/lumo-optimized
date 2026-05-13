#!/usr/bin/env node

import fs from 'fs/promises';
import { spawn } from 'child_process';
import { Octokit } from '@octokit/rest';

const RELEASE_PATHS = [
  'config',
  'index.toml',
  'mods',
  'overrides',
  'pack.toml',
  'resourcepacks',
  'shaderpacks'
];

async function main() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const releaseBranch = process.env.RELEASE_BRANCH || 'automation/release-candidate';
  const commitMessageFile = process.env.COMMIT_MESSAGE_FILE;

  if (!token) {
    throw new Error('GITHUB_TOKEN or GH_TOKEN is required to create the release candidate commit.');
  }

  if (!repository) {
    throw new Error('GITHUB_REPOSITORY is required to create the release candidate commit.');
  }

  if (!commitMessageFile) {
    throw new Error('COMMIT_MESSAGE_FILE is required to create the release candidate commit.');
  }

  const [owner, repo] = repository.split('/');
  const octokit = new Octokit({ auth: token });

  await git(['add', '-A', '--', ...RELEASE_PATHS]);

  if (await gitSucceeds(['diff', '--cached', '--quiet', '--', ...RELEASE_PATHS])) {
    await writeOutputs({ has_changes: 'false' });
    console.log('No release candidate changes to commit.');
    return;
  }

  const parentSha = (await git(['rev-parse', 'HEAD'])).trim();
  const parent = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: parentSha
  });

  const changes = await getStagedChanges();
  const tree = await Promise.all(
    changes.map(change => buildTreeEntry(octokit, owner, repo, change))
  );

  const createdTree = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: parent.data.tree.sha,
    tree
  });

  const message = await fs.readFile(commitMessageFile, 'utf8');
  const commit = await octokit.rest.git.createCommit({
    owner,
    repo,
    message,
    tree: createdTree.data.sha,
    parents: [parentSha]
  });

  await upsertRef(octokit, owner, repo, releaseBranch, commit.data.sha);

  await writeOutputs({
    has_changes: 'true',
    commit_sha: commit.data.sha
  });

  console.log(`Created release candidate commit ${commit.data.sha} on ${releaseBranch}.`);
}

async function getStagedChanges() {
  const output = await git(['diff', '--cached', '--name-status', '-z', '--', ...RELEASE_PATHS]);
  const parts = output.split('\0').filter(Boolean);
  const changes = [];

  for (let index = 0; index < parts.length;) {
    const status = parts[index++];

    if (status.startsWith('R') || status.startsWith('C')) {
      const oldPath = parts[index++];
      const newPath = parts[index++];

      if (status.startsWith('R')) {
        changes.push({ status: 'D', path: oldPath });
      }

      changes.push({ status: status[0], path: newPath });
      continue;
    }

    changes.push({ status, path: parts[index++] });
  }

  return changes;
}

async function buildTreeEntry(octokit, owner, repo, change) {
  if (change.status.startsWith('D')) {
    return {
      path: change.path,
      mode: '100644',
      type: 'blob',
      sha: null
    };
  }

  const content = await fs.readFile(change.path);
  const blob = await octokit.rest.git.createBlob({
    owner,
    repo,
    content: content.toString('base64'),
    encoding: 'base64'
  });

  return {
    path: change.path,
    mode: await getFileMode(change.path),
    type: 'blob',
    sha: blob.data.sha
  };
}

async function getFileMode(filePath) {
  const output = await git(['ls-files', '-s', '--', filePath]);
  const [mode] = output.trim().split(/\s+/);
  return mode || '100644';
}

async function upsertRef(octokit, owner, repo, branch, sha) {
  const ref = `heads/${branch}`;

  try {
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref,
      sha,
      force: true
    });
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }

    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/${ref}`,
      sha
    });
  }
}

async function writeOutputs(outputs) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`);
  await fs.appendFile(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
}

async function git(args) {
  return run('git', args);
}

function gitSucceeds(args) {
  return new Promise(resolve => {
    const child = spawn('git', args, {
      cwd: process.cwd(),
      stdio: 'ignore'
    });

    child.on('error', () => resolve(false));
    child.on('exit', code => resolve(code === 0));
  });
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'inherit']
    });

    let stdout = '';

    child.stdout.on('data', chunk => {
      stdout += chunk;
    });

    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
      }
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}
