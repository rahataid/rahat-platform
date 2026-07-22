#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(repoRoot, 'package.json');

const fallbackRequirements = {
  node: '>=20.10.0',
  pnpm: '>=8.14.1',
  docker: '>=20.10.7',
};

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const requirements = {
  node: packageJson.engines?.node ?? fallbackRequirements.node,
  pnpm: packageJson.config?.devEnv?.pnpm ?? fallbackRequirements.pnpm,
  docker: packageJson.config?.devEnv?.docker ?? fallbackRequirements.docker,
};

let failedChecks = 0;

function logResult(status, message, details = []) {
  console.log(`[${status}] ${message}`);

  for (const detail of details) {
    console.log(`       ${detail}`);
  }
}

function pass(message, details = []) {
  logResult('PASS', message, details);
}

function fail(message, details = []) {
  failedChecks += 1;
  logResult('FAIL', message, details);
}

function info(message, details = []) {
  logResult('INFO', message, details);
}

function parseVersion(input) {
  const match = input.match(/v?(\d+)\.(\d+)\.(\d+)/);

  if (!match) {
    return null;
  }

  return match.slice(1).map(Number);
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] > right[index]) {
      return 1;
    }

    if (left[index] < right[index]) {
      return -1;
    }
  }

  return 0;
}

function satisfiesRange(versionText, rangeText) {
  const version = parseVersion(versionText);

  if (!version) {
    return false;
  }

  const constraints = rangeText.split(/\s+/).filter(Boolean);

  for (const constraint of constraints) {
    const match = constraint.match(/^(>=|<=|>|<|=)?v?(\d+\.\d+\.\d+)$/);

    if (!match) {
      return false;
    }

    const operator = match[1] ?? '=';
    const target = parseVersion(match[2]);
    const comparison = compareVersions(version, target);

    if (operator === '>' && comparison <= 0) {
      return false;
    }

    if (operator === '>=' && comparison < 0) {
      return false;
    }

    if (operator === '<' && comparison >= 0) {
      return false;
    }

    if (operator === '<=' && comparison > 0) {
      return false;
    }

    if (operator === '=' && comparison !== 0) {
      return false;
    }
  }

  return true;
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  return {
    stdout: result.stdout?.trim() ?? '',
    stderr: result.stderr?.trim() ?? '',
    status: typeof result.status === 'number' ? result.status : 1,
    error: result.error ?? null,
  };
}

function formatInstallHint(command, docsUrl, steps = []) {
  return [
    ...steps,
    `Install or update ${command}, then rerun this check.`,
    `Docs: ${docsUrl}`,
  ];
}

function checkNode() {
  const version = process.versions.node;

  if (satisfiesRange(version, requirements.node)) {
    pass(`Node.js ${version} is installed (expected ${requirements.node}).`);
    return;
  }

  fail(`Node.js ${version} does not satisfy ${requirements.node}.`, [
    'Install a compatible Node.js release, then rerun the validator.',
    'Download: https://nodejs.org/en/download',
  ]);
}

function checkPnpm() {
  const result = runCommand('pnpm', ['--version']);

  if (result.error) {
    fail('pnpm was not found in PATH.', formatInstallHint('pnpm', 'https://pnpm.io/installation', [
      'Recommended with Node 20+:',
      'corepack enable',
      'corepack prepare pnpm@8.14.1 --activate',
    ]));
    return;
  }

  if (result.status !== 0) {
    const combinedOutput = [result.stderr, result.stdout].filter(Boolean).join('\n');

    if (/requires at least Node\.js/i.test(combinedOutput)) {
      fail('pnpm is installed, but the current Node.js version is too old to run it.', [
        combinedOutput,
        `Upgrade Node.js to ${requirements.node} or newer, then rerun the validator.`,
        'Download: https://nodejs.org/en/download',
        'Docs: https://pnpm.io/installation',
      ]);
      return;
    }

    fail('pnpm is installed but could not be executed.', [
      combinedOutput || 'No additional error output was returned.',
      'Try reinstalling pnpm or enabling Corepack again.',
      'Docs: https://pnpm.io/installation',
    ]);
    return;
  }

  const version = result.stdout;

  if (!satisfiesRange(version, requirements.pnpm)) {
    fail(`pnpm ${version} does not satisfy ${requirements.pnpm}.`, [
      'Update pnpm and rerun the validator.',
      'Recommended:',
      'corepack prepare pnpm@8.14.1 --activate',
      'Docs: https://pnpm.io/installation',
    ]);
    return;
  }

  pass(`pnpm ${version} is installed (expected ${requirements.pnpm}).`);
}

function checkDocker() {
  const versionResult = runCommand('docker', ['--version']);

  if (versionResult.error) {
    fail('Docker was not found in PATH.', formatInstallHint('Docker', 'https://docs.docker.com/get-docker/'));
    return;
  }

  if (versionResult.status !== 0) {
    fail('Docker is installed but the CLI could not be executed.', [
      versionResult.stderr || versionResult.stdout || 'No additional error output was returned.',
      'Reinstall Docker Desktop or fix the Docker CLI in PATH.',
      'Docs: https://docs.docker.com/get-docker/',
    ]);
    return;
  }

  const dockerVersion = versionResult.stdout;
  const version = dockerVersion.replace(/^Docker version\s+/i, '').split(',')[0].trim();

  if (!satisfiesRange(version, requirements.docker)) {
    fail(`Docker ${version} does not satisfy ${requirements.docker}.`, [
      'Upgrade Docker, then rerun the validator.',
      'Docs: https://docs.docker.com/get-docker/',
    ]);
    return;
  }

  pass(`Docker ${version} is installed (expected ${requirements.docker}).`);

  const infoResult = runCommand('docker', ['info']);

  if (infoResult.status !== 0) {
    fail('Docker is installed, but the daemon is not accessible.', [
      infoResult.stderr || infoResult.stdout || 'No additional error output was returned.',
      'Start Docker Desktop or the Docker daemon and ensure your user has permission to access it.',
      'Docs: https://docs.docker.com/engine/install/linux-postinstall/',
    ]);
    return;
  }

  pass('Docker daemon is running and accessible.');
}

function printSummary() {
  console.log('');

  if (failedChecks > 0) {
    logResult('FAIL', `Environment validation failed with ${failedChecks} issue${failedChecks === 1 ? '' : 's'}.`, [
      'Resolve the failed checks above, then run the validator again.',
    ]);
    process.exitCode = 1;
    return;
  }

  pass('Development environment validation passed.');

  const nodeModulesPath = path.join(repoRoot, 'node_modules');

  if (!fs.existsSync(nodeModulesPath)) {
    info('Dependencies do not appear to be installed yet.', [
      'Next steps:',
      '- pnpm install',
      '- pnpm bootstrap',
    ]);
    return;
  }

  info('Your environment is ready for bootstrap or local development.', [
    'Suggested next step: pnpm bootstrap',
  ]);
}

console.log('Rahat development environment validation');
console.log('');

checkNode();
checkPnpm();
checkDocker();
printSummary();
