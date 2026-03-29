import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const packageRoot = resolve(import.meta.dirname, '..');
const cliPath = resolve(packageRoot, 'dist/cli.js');
const repoPrefix = join(tmpdir(), 'aigluetoolset-cli-test-');

function createRepo() {
  const repoRoot = mkdtempSync(repoPrefix);
  return {
    repoRoot,
    cleanup() {
      rmSync(repoRoot, { recursive: true, force: true });
    },
  };
}

function runCli(repoRoot, args, options = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf-8',
    ...options,
  });
}

function parseJsonOutput(result) {
  assert.equal(result.status, 0, `expected success, got stderr: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

test('init --dry-run previews files without writing them', () => {
  const repo = createRepo();
  try {
    const result = runCli(repo.repoRoot, ['init', '--dry-run']);
    const payload = parseJsonOutput(result);
    assert.equal(payload.ok, true);
    assert.equal(payload.command, 'init');
    assert.equal(payload.dryRun, true);
    assert.equal(existsSync(join(repo.repoRoot, '.aigluetoolset', 'lsclaw-target.json')), false);
    assert.equal(existsSync(join(repo.repoRoot, '.aigluetoolset', 'slices', 'text-block-v0.json')), false);
  } finally {
    repo.cleanup();
  }
});

test('freeze-slice scaffolds manifest and slice and task-run blocks writes outside repo by default', () => {
  const repo = createRepo();
  try {
    mkdirSync(join(repo.repoRoot, 'src'), { recursive: true });
    const initResult = runCli(repo.repoRoot, ['init']);
    parseJsonOutput(initResult);

    const freezeResult = runCli(repo.repoRoot, [
      'freeze-slice',
      '--slice-id',
      'providers-budget',
      '--title',
      'Providers budget surface',
      '--objective',
      'Fix providers budget loading and failure truth.',
      '--allowed-scope',
      'src/providers.ts',
      '--verify-command',
      'pnpm typecheck',
    ]);
    const freezePayload = parseJsonOutput(freezeResult);
    assert.equal(freezePayload.sliceId, 'providers-budget');

    const slicePath = join(repo.repoRoot, '.aigluetoolset', 'slices', 'providers-budget.json');
    const manifestPath = join(repo.repoRoot, '.aigluetoolset', 'lsclaw-target.json');
    assert.equal(existsSync(slicePath), true);
    assert.equal(existsSync(manifestPath), true);

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    assert.equal(manifest.slices['providers-budget'].path, '.aigluetoolset/slices/providers-budget.json');

    const outsidePath = join(tmpdir(), `outside-${Date.now()}.json`);
    const blocked = runCli(repo.repoRoot, ['task-run', '--slice', slicePath, '--output', outsidePath]);
    assert.notEqual(blocked.status, 0);
    assert.match(blocked.stderr, /output_outside_repo_blocked/);
    assert.equal(existsSync(outsidePath), false);
  } finally {
    repo.cleanup();
  }
});

test('verify writes failing results and sets non-zero exit code', () => {
  const repo = createRepo();
  try {
    parseJsonOutput(runCli(repo.repoRoot, ['init']));
    const slicePath = join(repo.repoRoot, '.aigluetoolset', 'slices', 'text-block-v0.json');
    const slice = JSON.parse(readFileSync(slicePath, 'utf-8'));
    slice.verifyCommands = ['printf fail >&2; exit 7'];
    writeFileSync(slicePath, `${JSON.stringify(slice, null, 2)}\n`, 'utf-8');
    const outputPath = join(repo.repoRoot, '.aigluetoolset', 'verify-output.json');
    const result = runCli(repo.repoRoot, ['verify', '--output', outputPath]);

    assert.equal(result.status, 1);
    assert.equal(existsSync(outputPath), true);

    const payload = JSON.parse(readFileSync(outputPath, 'utf-8'));
    assert.equal(payload.ok, false);
    assert.equal(payload.command, 'verify');
    assert.equal(payload.verifyResults.length, 1);
    assert.equal(payload.verifyResults[0].status, 'failed');
    assert.match(payload.verifyResults[0].summary, /fail/);
  } finally {
    repo.cleanup();
  }
});
