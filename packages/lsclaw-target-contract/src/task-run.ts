import type {
  BuildLsclawTaskRunPayloadOptions,
  LsclawTaskRunPayload,
  LsclawTargetManifest,
  LsclawSliceContract,
} from './types.js';

function flatten(items: string[] | undefined): string[] {
  return Array.isArray(items) ? items.map((item) => String(item ?? '').trim()).filter(Boolean) : [];
}

function buildFrozenSliceTaskText(manifest: LsclawTargetManifest, slice: LsclawSliceContract, task: string | null): string {
  const lines: string[] = [
    `[target_repo] ${manifest.repoId}`,
    `[slice] ${slice.sliceId}`,
    `[objective] ${slice.objective}`,
  ];
  if (task && task.trim()) {
    lines.push(`[requested_task] ${task.trim()}`);
  }
  lines.push(
    '',
    '[rules]',
    '- Only work inside the declared slice.',
    '- Do not widen into sibling packages or unrelated repo setup.',
    '- Use the declared verify commands before claiming completion.',
    '- If review findings remain local to the slice, keep the fix loop inside the same slice.',
    '[/rules]',
    '',
    '[allowed_scope]',
    ...flatten(slice.allowedScope).map((item) => `- ${item}`),
    '[/allowed_scope]',
    '',
    '[verify_commands]',
    ...flatten(slice.verifyCommands).map((item) => `- ${item}`),
    '[/verify_commands]',
  );
  const expectedArtifacts = flatten(slice.expectedArtifacts);
  if (expectedArtifacts.length > 0) {
    lines.push('', '[expected_artifacts]', ...expectedArtifacts.map((item) => `- ${item}`), '[/expected_artifacts]');
  }
  const nonGoals = flatten(slice.nonGoals);
  if (nonGoals.length > 0) {
    lines.push('', '[non_goals]', ...nonGoals.map((item) => `- ${item}`), '[/non_goals]');
  }
  const stopConditions = flatten(slice.stopConditions);
  if (stopConditions.length > 0) {
    lines.push('', '[stop_conditions]', ...stopConditions.map((item) => `- ${item}`), '[/stop_conditions]');
  }
  return lines.join('\n');
}

export function buildLsclawTaskRunPayload(options: BuildLsclawTaskRunPayloadOptions): LsclawTaskRunPayload {
  const manifest = options.manifest;
  const slice = options.slice;
  const targetProjectPath = String(
    options.slice.targetProjectPath ?? options.manifest.targetProjectPath ?? ''
  ).trim();
  if (!targetProjectPath) {
    throw new Error('targetProjectPath is required on slice or manifest');
  }
  const payload: LsclawTaskRunPayload = {
    mode: options.taskMode ?? manifest.defaultTaskMode ?? 'team',
    dispatchMode: options.dispatchMode ?? manifest.defaultDispatchMode ?? 'queue',
    ownerRepo: slice.repoId || manifest.repoId,
    targetProjectPath,
    task: buildFrozenSliceTaskText(manifest, slice, options.task ?? null),
    verifyCommands: flatten(slice.verifyCommands),
  };
  const agentName = String(options.agentName ?? manifest.defaultAgentName ?? '').trim();
  const planPath = String(options.planPath ?? manifest.planPath ?? '').trim();
  const tenantId = String(options.tenantId ?? '').trim();
  const sessionId = String(options.sessionId ?? '').trim();
  const traceId = String(options.traceId ?? '').trim();
  const parentTaskId = String(options.parentTaskId ?? '').trim();
  if (agentName) payload.agentName = agentName;
  if (planPath) payload.planPath = planPath;
  if (tenantId) payload.tenantId = tenantId;
  if (sessionId) payload.sessionId = sessionId;
  if (traceId) payload.traceId = traceId;
  if (parentTaskId) payload.parentTaskId = parentTaskId;
  return payload;
}
