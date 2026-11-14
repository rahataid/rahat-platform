const assert = require('node:assert/strict');
const { test } = require('node:test');
const { checkEnvironment, isAtLeast } = require('./check-dev-env.cjs');

function check(results, nodeVersion = '20.10.0') {
  const output = [];
  const calls = [];
  const ok = checkEnvironment({
    nodeVersion,
    log: (line) => output.push(line),
    run: (name, args) => {
      calls.push([name, ...args]);
      return results.shift();
    },
  });
  return { ok, output: output.join('\n'), calls };
}

test('compares all version components and rejects invalid versions', () => {
  assert.equal(isAtLeast('v20.9.9', [20, 10, 0]), false);
  assert.equal(isAtLeast('v20.10.0', [20, 10, 0]), true);
  assert.equal(isAtLeast('Docker version 29.0.0, build abc', [20, 10, 7]), true);
  assert.equal(isAtLeast('unknown', [20, 10, 0]), false);
});

test('passes when tools and Docker daemon meet requirements', () => {
  const result = check([
    { status: 0, stdout: '9.15.2\n' },
    { status: 0, stdout: 'Docker version 20.10.7, build abc\n' },
    { status: 0, stdout: '20.10.7\n' },
  ]);
  assert.equal(result.ok, true);
  assert.match(result.output, /Environment check passed/);
  assert.deepEqual(result.calls[2], ['docker', 'info', '--format', '{{.ServerVersion}}']);
});

test('reports outdated Node and pnpm and missing Docker', () => {
  const result = check([
    { status: 0, stdout: '8.15.0\n' },
    { status: null, error: new Error('not found') },
  ], '20.9.0');
  assert.equal(result.ok, false);
  assert.match(result.output, /Node\.js 20\.9\.0/);
  assert.match(result.output, /pnpm 8\.15\.0/);
  assert.match(result.output, /Docker not available/);
  assert.match(result.output, /3 requirement\(s\)/);
  assert.equal(result.calls.length, 2);
});

test('reports Docker daemon failure independently of installed CLI', () => {
  const result = check([
    { status: 0, stdout: '9.0.0\n' },
    { status: 0, stdout: 'Docker version 25.0.0\n' },
    { status: 1, stderr: 'daemon unavailable' },
  ]);
  assert.equal(result.ok, false);
  assert.match(result.output, /FAIL: Docker daemon is accessible/);
});
