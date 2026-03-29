import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, copyFileSync, realpathSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  buildLsclawReviewBundle,
  buildLsclawTaskRunPayload,
  validateSliceContract,
  validateTargetManifest,
  type BuildLsclawReviewBundleOptions,
  type BuildLsclawTaskRunPayloadOptions,
  type LsclawSliceContract,
  type LsclawTargetManifest,
} from '../../lsclaw-target-contract/dist/index.js';

type ParsedArgs = {
  command: string | null;
  flags: Record<string, string | boolean | string[]>;
  positionals: string[];
};

function parseArgs(argv: string[]): ParsedArgs {
  const flags: Record<string, string | boolean | string[]> = {};
  const positionals: string[] = [];
  let command: string | null = null;
  for (let index = 0; index < argv.length; index += 1) {
    const token = String(argv[index] ?? '').trim();
    if (!token) continue;
    if (!command && !token.startsWith('-')) {
      command = token;
      continue;
    }
    if (!token.startsWith('-')) {
      positionals.push(token);
      continue;
    }
    const key = token.replace(/^-+/, '');
    const next = String(argv[index + 1] ?? '').trim();
    const takesValue = next && !next.startsWith('-');
    if (!takesValue) {
      flags[key] = true;
      continue;
    }
    index += 1;
    if (key in flags) {
      const current = flags[key];
      if (Array.isArray(current)) {
        current.push(next);
        flags[key] = current;
      } else {
        flags[key] = [String(current), next];
      }
    } else {
      flags[key] = next;
    }
  }
  return { command, flags, positionals };
}

function getStringFlag(flags: ParsedArgs['flags'], ...keys: string[]): string {
  for (const key of keys) {
    const value = flags[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function getBooleanFlag(flags: ParsedArgs['flags'], ...keys: string[]): boolean {
  return keys.some((key) => flags[key] === true);
}

function getStringListFlag(flags: ParsedArgs['flags'], ...keys: string[]): string[] {
  const values: string[] = [];
  for (const key of keys) {
    const value = flags[key];
    if (Array.isArray(value)) {
      values.push(...value.map((item) => String(item).trim()).filter(Boolean));
    } else if (typeof value === 'string' && value.trim()) {
      values.push(value.trim());
    }
  }
  return values;
}

function readJsonFile<T>(path: string, label: string): T {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`${label}_not_found:${path}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`${label}_invalid_json:${path}`);
    }
    throw error;
  }
}

function timestampToken(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
}

function canonicalizePath(path: string): string {
  const resolvedPath = resolve(path);
  if (existsSync(resolvedPath)) {
    return realpathSync(resolvedPath);
  }
  let parentPath = dirname(resolvedPath);
  while (parentPath !== dirname(parentPath) && !existsSync(parentPath)) {
    parentPath = dirname(parentPath);
  }
  const canonicalParent = existsSync(parentPath) ? realpathSync(parentPath) : parentPath;
  const suffix = relative(parentPath, resolvedPath);
  return suffix ? resolve(canonicalParent, suffix) : canonicalParent;
}

function isPathInside(rootPath: string, candidatePath: string): boolean {
  const rel = relative(canonicalizePath(rootPath), canonicalizePath(candidatePath));
  return rel === '' || (!rel.startsWith('..') && !rel.includes(`..${process.platform === 'win32' ? '\\' : '/'}`));
}

function assertPathInsideRepo(repoRoot: string, path: string, allowOutsideRepo: boolean) {
  if (!allowOutsideRepo && !isPathInside(repoRoot, path)) {
    throw new Error(`output_outside_repo_blocked:${path}`);
  }
}

function writeJsonAtomic(path: string, payload: unknown, options: { force: boolean; dryRun: boolean }) {
  const targetPath = resolve(path);
  if (options.dryRun) {
    return { outputPath: targetPath, backupPath: null, wrote: false };
  }
  mkdirSync(dirname(targetPath), { recursive: true });
  const exists = existsSync(targetPath);
  if (exists && !options.force) {
    throw new Error(`target_exists:${targetPath}`);
  }
  const backupPath = exists ? `${targetPath}.bak-${timestampToken()}` : null;
  if (backupPath) {
    copyFileSync(targetPath, backupPath);
  }
  const tempPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
  try {
    writeFileSync(tempPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
    renameSync(tempPath, targetPath);
  } catch (error) {
    rmSync(tempPath, { force: true });
    throw error;
  }
  return { outputPath: targetPath, backupPath, wrote: true };
}

function summarizeCommandOutput(output: string): string {
  const normalized = String(output ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (normalized.length === 0) {
    return '';
  }
  return normalized.join(' ').slice(0, 280);
}

function sanitizeSliceId(rawValue: string): string {
  return String(rawValue ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadManifestAndSlice(flags: ParsedArgs['flags'], repoRoot: string) {
  const manifestPath = resolve(getStringFlag(flags, 'manifest') || resolve(repoRoot, '.aigluetoolset/lsclaw-target.json'));
  const slicePath = resolve(getStringFlag(flags, 'slice') || resolve(repoRoot, '.aigluetoolset/slices/text-block-v0.json'));
  const manifest = readJsonFile<LsclawTargetManifest>(manifestPath, 'manifest');
  const slice = readJsonFile<LsclawSliceContract>(slicePath, 'slice');
  const manifestIssues = validateTargetManifest(manifest);
  const sliceIssues = validateSliceContract(slice);
  if (manifestIssues.length > 0 || sliceIssues.length > 0) {
    throw new Error(
      JSON.stringify({
        manifestIssues,
        sliceIssues,
      })
    );
  }
  return { manifestPath, slicePath, manifest, slice };
}

function printUsage() {
  console.log(`Usage: aiglue-lsclaw-target <command> [options]

Commands:
  init            scaffold .aigluetoolset target files inside a repo
  freeze-slice    scaffold a new slice file and register it in the manifest
  task-run        build a bounded /api/tasks/run payload from manifest + slice
  review-bundle   build a compact review bundle from a slice
  verify          run slice verify commands inside the target repo

Common safety rules:
  - writes are repo-local by default
  - existing files are not overwritten unless --force is used
  - use --dry-run to preview writes
  - use --allow-outside-repo only when you intentionally want output outside the repo root
`);
}

function resolveTemplateRoot(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return resolve(thisDir, '../../../docs/templates');
}

function runInit(flags: ParsedArgs['flags']) {
  const repoRoot = resolve(getStringFlag(flags, 'repo-root') || process.cwd());
  const allowOutsideRepo = getBooleanFlag(flags, 'allow-outside-repo');
  const force = getBooleanFlag(flags, 'force');
  const dryRun = getBooleanFlag(flags, 'dry-run');
  const templateRoot = resolveTemplateRoot();
  const manifestTemplatePath = resolve(getStringFlag(flags, 'manifest-template') || resolve(templateRoot, 'lsclaw-target-manifest.json'));
  const sliceTemplatePath = resolve(getStringFlag(flags, 'slice-template') || resolve(templateRoot, 'lsclaw-slice-contract.json'));
  const manifestOutputPath = resolve(getStringFlag(flags, 'manifest-path') || resolve(repoRoot, '.aigluetoolset/lsclaw-target.json'));
  const sliceOutputPath = resolve(getStringFlag(flags, 'slice-path') || resolve(repoRoot, '.aigluetoolset/slices/text-block-v0.json'));

  assertPathInsideRepo(repoRoot, manifestOutputPath, allowOutsideRepo);
  assertPathInsideRepo(repoRoot, sliceOutputPath, allowOutsideRepo);

  const manifest = readJsonFile<LsclawTargetManifest>(manifestTemplatePath, 'manifest_template');
  const slice = readJsonFile<LsclawSliceContract>(sliceTemplatePath, 'slice_template');
  const repoId = basename(repoRoot);
  manifest.repoId = repoId;
  manifest.targetProjectPath = repoRoot;
  if (manifest.slices?.['text-block-v0']) {
    manifest.slices['text-block-v0'].path = relative(repoRoot, sliceOutputPath);
  }
  slice.repoId = repoId;
  slice.targetProjectPath = repoRoot;

  const manifestWrite = writeJsonAtomic(manifestOutputPath, manifest, { force, dryRun });
  const sliceWrite = writeJsonAtomic(sliceOutputPath, slice, { force, dryRun });
  console.log(
    JSON.stringify(
      {
        ok: true,
        command: 'init',
        repoRoot,
        dryRun,
        files: [manifestWrite, sliceWrite],
      },
      null,
      2
    )
  );
}

function runFreezeSlice(flags: ParsedArgs['flags']) {
  const repoRoot = resolve(getStringFlag(flags, 'repo-root') || process.cwd());
  const allowOutsideRepo = getBooleanFlag(flags, 'allow-outside-repo');
  const force = getBooleanFlag(flags, 'force');
  const dryRun = getBooleanFlag(flags, 'dry-run');
  const templateRoot = resolveTemplateRoot();
  const sliceTemplatePath = resolve(getStringFlag(flags, 'slice-template') || resolve(templateRoot, 'lsclaw-slice-contract.json'));
  const manifestPath = resolve(getStringFlag(flags, 'manifest') || resolve(repoRoot, '.aigluetoolset/lsclaw-target.json'));
  const sliceId = sanitizeSliceId(getStringFlag(flags, 'slice-id') || getStringFlag(flags, 'id'));
  if (!sliceId) {
    throw new Error('slice_id_required');
  }
  const title = getStringFlag(flags, 'title') || sliceId;
  const objective = getStringFlag(flags, 'objective') || `Implement the frozen ${sliceId} contract without widening scope.`;
  const sliceOutputPath = resolve(getStringFlag(flags, 'slice-path') || resolve(repoRoot, `.aigluetoolset/slices/${sliceId}.json`));

  assertPathInsideRepo(repoRoot, manifestPath, allowOutsideRepo);
  assertPathInsideRepo(repoRoot, sliceOutputPath, allowOutsideRepo);

  const manifest = readJsonFile<LsclawTargetManifest>(manifestPath, 'manifest');
  const manifestIssues = validateTargetManifest(manifest);
  if (manifestIssues.length > 0) {
    throw new Error(JSON.stringify({ manifestIssues }));
  }
  const slice = readJsonFile<LsclawSliceContract>(sliceTemplatePath, 'slice_template');
  slice.sliceId = sliceId;
  slice.repoId = manifest.repoId || basename(repoRoot);
  slice.title = title;
  slice.objective = objective;
  slice.targetProjectPath = String(manifest.targetProjectPath ?? repoRoot).trim() || repoRoot;
  const allowedScope = getStringListFlag(flags, 'allowed-scope');
  const verifyCommands = getStringListFlag(flags, 'verify-command');
  const nonGoals = getStringListFlag(flags, 'non-goal');
  const stopConditions = getStringListFlag(flags, 'stop-condition');
  if (allowedScope.length > 0) {
    slice.allowedScope = allowedScope;
  }
  if (verifyCommands.length > 0) {
    slice.verifyCommands = verifyCommands;
  } else if (Array.isArray(manifest.verify?.defaultCommands) && manifest.verify.defaultCommands.length > 0) {
    slice.verifyCommands = manifest.verify.defaultCommands;
  }
  if (nonGoals.length > 0) {
    slice.nonGoals = nonGoals;
  }
  if (stopConditions.length > 0) {
    slice.stopConditions = stopConditions;
  }

  const sliceIssues = validateSliceContract(slice);
  if (sliceIssues.length > 0) {
    throw new Error(JSON.stringify({ sliceIssues }));
  }

  const existingSlices = manifest.slices ?? {};
  manifest.slices = {
    ...existingSlices,
    [sliceId]: {
      title: slice.title ?? title,
      path: relative(repoRoot, sliceOutputPath),
      allowedScope: slice.allowedScope,
      verifyCommands: slice.verifyCommands,
    },
  };

  const sliceWrite = writeJsonAtomic(sliceOutputPath, slice, { force, dryRun });
  const manifestWrite = writeJsonAtomic(manifestPath, manifest, { force: true, dryRun });
  console.log(
    JSON.stringify(
      {
        ok: true,
        command: 'freeze-slice',
        repoRoot,
        dryRun,
        sliceId,
        files: [sliceWrite, manifestWrite],
      },
      null,
      2
    )
  );
}

function runTaskRun(flags: ParsedArgs['flags']) {
  const repoRoot = resolve(getStringFlag(flags, 'repo-root') || process.cwd());
  const allowOutsideRepo = getBooleanFlag(flags, 'allow-outside-repo');
  const force = getBooleanFlag(flags, 'force');
  const dryRun = getBooleanFlag(flags, 'dry-run');
  const outputPath = getStringFlag(flags, 'output');
  const { manifest, slice } = loadManifestAndSlice(flags, repoRoot);
  const payload = buildLsclawTaskRunPayload({
    manifest,
    slice,
    task: getStringFlag(flags, 'task'),
    tenantId: getStringFlag(flags, 'tenant-id') || null,
    sessionId: getStringFlag(flags, 'session-id') || null,
    traceId: getStringFlag(flags, 'trace-id') || null,
    parentTaskId: getStringFlag(flags, 'parent-task-id') || null,
    dispatchMode: (getStringFlag(flags, 'dispatch-mode') as BuildLsclawTaskRunPayloadOptions['dispatchMode']) || undefined,
    taskMode: (getStringFlag(flags, 'task-mode') as BuildLsclawTaskRunPayloadOptions['taskMode']) || undefined,
    agentName: getStringFlag(flags, 'agent-name') || null,
    planPath: getStringFlag(flags, 'plan-path') || null,
  });

  if (!outputPath) {
    console.log(JSON.stringify({ ok: true, command: 'task-run', dryRun, payload }, null, 2));
    return;
  }
  const resolvedOutput = resolve(outputPath);
  assertPathInsideRepo(repoRoot, resolvedOutput, allowOutsideRepo);
  const writeResult = writeJsonAtomic(resolvedOutput, payload, { force, dryRun });
  console.log(JSON.stringify({ ok: true, command: 'task-run', dryRun, payload, writeResult }, null, 2));
}

function runReviewBundle(flags: ParsedArgs['flags']) {
  const repoRoot = resolve(getStringFlag(flags, 'repo-root') || process.cwd());
  const allowOutsideRepo = getBooleanFlag(flags, 'allow-outside-repo');
  const force = getBooleanFlag(flags, 'force');
  const dryRun = getBooleanFlag(flags, 'dry-run');
  const outputPath = getStringFlag(flags, 'output');
  const verifyResultsPath = getStringFlag(flags, 'verify-results');
  const findingsPath = getStringFlag(flags, 'findings');
  const notesPath = getStringFlag(flags, 'notes');
  const { slice } = loadManifestAndSlice(flags, repoRoot);
  const verifyResults =
    verifyResultsPath ? readJsonFile<BuildLsclawReviewBundleOptions['verifyResults']>(resolve(verifyResultsPath), 'verify_results') : [];
  const findings = findingsPath ? readJsonFile<string[]>(resolve(findingsPath), 'findings') : [];
  const notes = notesPath ? readJsonFile<string[]>(resolve(notesPath), 'notes') : [];
  const bundle = buildLsclawReviewBundle({
    slice,
    changedFiles: getStringListFlag(flags, 'changed-file'),
    verifyResults,
    findings,
    notes,
  });

  if (!outputPath) {
    console.log(JSON.stringify({ ok: true, command: 'review-bundle', dryRun, bundle }, null, 2));
    return;
  }
  const resolvedOutput = resolve(outputPath);
  assertPathInsideRepo(repoRoot, resolvedOutput, allowOutsideRepo);
  const writeResult = writeJsonAtomic(resolvedOutput, bundle, { force, dryRun });
  console.log(JSON.stringify({ ok: true, command: 'review-bundle', dryRun, bundle, writeResult }, null, 2));
}

function runVerify(flags: ParsedArgs['flags']) {
  const repoRoot = resolve(getStringFlag(flags, 'repo-root') || process.cwd());
  const allowOutsideRepo = getBooleanFlag(flags, 'allow-outside-repo');
  const force = getBooleanFlag(flags, 'force');
  const dryRun = getBooleanFlag(flags, 'dry-run');
  const outputPath = getStringFlag(flags, 'output');
  const failFast = getBooleanFlag(flags, 'fail-fast');
  const shellPath = getStringFlag(flags, 'shell') || '/bin/bash';
  const extraCommands = getStringListFlag(flags, 'command', 'verify-command');
  const { manifest, slice } = loadManifestAndSlice(flags, repoRoot);

  const targetProjectPath = resolve(String(slice.targetProjectPath ?? manifest.targetProjectPath ?? repoRoot).trim() || repoRoot);
  assertPathInsideRepo(repoRoot, targetProjectPath, allowOutsideRepo);
  if (!existsSync(targetProjectPath)) {
    throw new Error(`target_project_path_not_found:${targetProjectPath}`);
  }

  const commands = extraCommands.length > 0 ? extraCommands : (slice.verifyCommands.length > 0 ? slice.verifyCommands : manifest.verify.defaultCommands);
  if (commands.length === 0) {
    throw new Error('verify_commands_missing');
  }

  const verifyResults: NonNullable<BuildLsclawReviewBundleOptions['verifyResults']> = [];
  for (const command of commands) {
    if (dryRun) {
      verifyResults.push({
        command,
        status: 'skipped',
        summary: `dry-run: would execute in ${targetProjectPath}`,
      });
      continue;
    }
    const result = spawnSync(shellPath, ['-lc', command], {
      cwd: targetProjectPath,
      encoding: 'utf-8',
    });
    const combined = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    const summary = summarizeCommandOutput(combined) || `exit ${result.status ?? 1}`;
    if (result.status === 0) {
      verifyResults.push({ command, status: 'passed', summary });
      continue;
    }
    verifyResults.push({ command, status: 'failed', summary });
    if (failFast) {
      break;
    }
  }

  const failed = verifyResults.some((item) => item.status === 'failed');
  const payload = {
    ok: !failed,
    command: 'verify',
    dryRun,
    targetProjectPath,
    verifyResults,
  };

  if (!outputPath) {
    console.log(JSON.stringify(payload, null, 2));
    if (failed) {
      process.exitCode = 1;
    }
    return;
  }
  const resolvedOutput = resolve(outputPath);
  assertPathInsideRepo(repoRoot, resolvedOutput, allowOutsideRepo);
  const writeResult = writeJsonAtomic(resolvedOutput, payload, { force, dryRun });
  console.log(JSON.stringify({ ...payload, writeResult }, null, 2));
  if (failed) {
    process.exitCode = 1;
  }
}

export function runLsclawTargetCli(argv: string[]) {
  const parsed = parseArgs(argv);
  if (!parsed.command || getBooleanFlag(parsed.flags, 'help', 'h')) {
    printUsage();
    return;
  }
  if (parsed.command === 'init') {
    runInit(parsed.flags);
    return;
  }
  if (parsed.command === 'freeze-slice') {
    runFreezeSlice(parsed.flags);
    return;
  }
  if (parsed.command === 'task-run') {
    runTaskRun(parsed.flags);
    return;
  }
  if (parsed.command === 'review-bundle') {
    runReviewBundle(parsed.flags);
    return;
  }
  if (parsed.command === 'verify') {
    runVerify(parsed.flags);
    return;
  }
  throw new Error(`unknown_command:${parsed.command}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runLsclawTargetCli(process.argv.slice(2));
  } catch (error) {
    console.error(`[aiglue-lsclaw-target] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
