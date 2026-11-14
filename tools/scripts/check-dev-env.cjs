const { spawnSync } = require('node:child_process');

function isAtLeast(actual, minimum) {
  const match = actual.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return false;
  const parts = match.slice(1).map(Number);
  for (let i = 0; i < minimum.length; i++) {
    if (parts[i] !== minimum[i]) return parts[i] > minimum[i];
  }
  return true;
}

function checkEnvironment({ nodeVersion = process.versions.node, run = spawnSync, log = console.log } = {}) {
  let failures = 0;
  const report = (ok, message, guidance) => {
    log(`${ok ? 'PASS' : 'FAIL'}: ${message}`);
    if (!ok) {
      failures++;
      log(`  ${guidance}`);
    }
  };
  const command = (name, args) =>
    run(name, args, { encoding: 'utf8', shell: process.platform === 'win32' });

  report(
    isAtLeast(nodeVersion, [20, 10, 0]),
    `Node.js ${nodeVersion} (requires 20.10.0 or newer)`,
    'Install or upgrade Node.js: https://nodejs.org/'
  );

  const pnpm = command('pnpm', ['--version']);
  const pnpmVersion = (pnpm.stdout || '').trim();
  report(
    pnpm.status === 0 && isAtLeast(pnpmVersion, [9, 0, 0]),
    `pnpm ${pnpmVersion || 'not available'} (requires 9.0.0 or newer)`,
    'Install pnpm 9 or newer: https://pnpm.io/installation'
  );

  const docker = command('docker', ['--version']);
  const dockerVersion = (docker.stdout || '').trim();
  report(
    docker.status === 0 && isAtLeast(dockerVersion, [20, 10, 7]),
    `${dockerVersion || 'Docker not available'} (requires Docker 20.10.7 or newer)`,
    'Install or upgrade Docker: https://docs.docker.com/get-docker/'
  );
  if (docker.status === 0) {
    const daemon = command('docker', ['info', '--format', '{{.ServerVersion}}']);
    report(
      daemon.status === 0,
      'Docker daemon is accessible',
      'Start Docker and check access to the Docker daemon: https://docs.docker.com/engine/daemon/troubleshoot/'
    );
  }

  if (failures) {
    log(`Environment check failed: ${failures} requirement(s) need attention.`);
  } else {
    log('Environment check passed. Run pnpm bootstrap to set up the project.');
  }
  return failures === 0;
}

if (require.main === module) {
  process.exitCode = checkEnvironment() ? 0 : 1;
}

module.exports = { checkEnvironment, isAtLeast };
