import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
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

function isPathInside(rootPath: string, candidatePath: string): boolean {
  const rel = relative(resolve(rootPath), resolve(candidatePath));
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

function printUsage() {
  console.log(`Usage: aiglue-lsclaw-target <command> [options]

Commands:
  init            scaffold .aigluetoolset target files inside a repo
  task-run        build a bounded /api/tasks/run payload from manifest + slice
  review-bundle   build a compact review bundle from a slice

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

function runTaskRun(flags: ParsedArgs['flags']) {
  const repoRoot = resolve(getStringFlag(flags, 'repo-root') || process.cwd());
  const allowOutsideRepo = getBooleanFlag(flags, 'allow-outside-repo');
  const force = getBooleanFlag(flags, 'force');
  const dryRun = getBooleanFlag(flags, 'dry-run');
  const manifestPath = resolve(getStringFlag(flags, 'manifest') || resolve(repoRoot, '.aigluetoolset/lsclaw-target.json'));
  const slicePath = resolve(getStringFlag(flags, 'slice') || resolve(repoRoot, '.aigluetoolset/slices/text-block-v0.json'));
  const outputPath = getStringFlag(flags, 'output');

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
  const slicePath = resolve(getStringFlag(flags, 'slice') || resolve(repoRoot, '.aigluetoolset/slices/text-block-v0.json'));
  const outputPath = getStringFlag(flags, 'output');
  const verifyResultsPath = getStringFlag(flags, 'verify-results');
  const findingsPath = getStringFlag(flags, 'findings');
  const notesPath = getStringFlag(flags, 'notes');

  const slice = readJsonFile<LsclawSliceContract>(slicePath, 'slice');
  const sliceIssues = validateSliceContract(slice);
  if (sliceIssues.length > 0) {
    throw new Error(JSON.stringify({ sliceIssues }));
  }
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
  if (parsed.command === 'task-run') {
    runTaskRun(parsed.flags);
    return;
  }
  if (parsed.command === 'review-bundle') {
    runReviewBundle(parsed.flags);
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
