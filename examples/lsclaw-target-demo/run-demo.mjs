import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const repoRoot = resolve(import.meta.dirname, '../..');
const cliPath = resolve(repoRoot, 'packages/lsclaw-target-cli/dist/cli.js');
const demoRepo = mkdtempSync(join(tmpdir(), 'aigluetoolset-lsclaw-demo-'));

function runCli(args) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: demoRepo,
    encoding: 'utf-8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `command failed: ${args.join(' ')}`);
  }
  return JSON.parse(result.stdout);
}

try {
  const init = runCli(['init']);
  const freeze = runCli([
    'freeze-slice',
    '--slice-id',
    'providers-summary',
    '--title',
    'Providers summary truth',
    '--objective',
    'Fix providers summary loading and runtime truth without widening scope.',
    '--allowed-scope',
    'src/admin/app/pages/ProvidersPage.tsx',
    '--allowed-scope',
    'src/admin/test/providers-page-budget.test.mjs',
    '--verify-command',
    'pnpm typecheck',
  ]);
  const slicePath = join(demoRepo, '.aigluetoolset', 'slices', 'providers-summary.json');
  const taskRun = runCli([
    'task-run',
    '--slice',
    slicePath,
    '--task',
    'Apply the bounded providers summary fix.',
  ]);

  const slice = JSON.parse(readFileSync(slicePath, 'utf-8'));
  slice.verifyCommands = ['printf demo-verify-pass'];
  writeFileSync(slicePath, `${JSON.stringify(slice, null, 2)}\n`, 'utf-8');

  const verify = runCli(['verify', '--slice', slicePath]);

  console.log(
    JSON.stringify(
      {
        repoRoot: demoRepo,
        init: init.files.map((entry) => entry.outputPath),
        freezeSliceId: freeze.sliceId,
        taskPreview: taskRun.payload.task.split('\n').slice(0, 8),
        verifyResults: verify.verifyResults,
      },
      null,
      2
    )
  );
} finally {
  rmSync(demoRepo, { recursive: true, force: true });
}
