import type { LsclawSliceContract, LsclawTargetManifest, ValidationIssue } from './types.js';
import { LSCLAW_SLICE_CONTRACT_SCHEMA, LSCLAW_TARGET_MANIFEST_SCHEMA } from './types.js';

function pushRequiredText(issues: ValidationIssue[], path: string, value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    issues.push({ path, message: 'required non-empty string' });
  }
}

function pushRequiredList(issues: ValidationIssue[], path: string, value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push({ path, message: 'required non-empty array' });
  }
}

export function validateTargetManifest(manifest: LsclawTargetManifest): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (manifest?.schema !== LSCLAW_TARGET_MANIFEST_SCHEMA) {
    issues.push({ path: 'schema', message: `expected ${LSCLAW_TARGET_MANIFEST_SCHEMA}` });
  }
  pushRequiredText(issues, 'repoId', manifest?.repoId);
  pushRequiredText(issues, 'defaultPlanId', manifest?.defaultPlanId);
  pushRequiredList(issues, 'verify.defaultCommands', manifest?.verify?.defaultCommands);
  return issues;
}

export function validateSliceContract(slice: LsclawSliceContract): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (slice?.schema !== LSCLAW_SLICE_CONTRACT_SCHEMA) {
    issues.push({ path: 'schema', message: `expected ${LSCLAW_SLICE_CONTRACT_SCHEMA}` });
  }
  pushRequiredText(issues, 'sliceId', slice?.sliceId);
  pushRequiredText(issues, 'repoId', slice?.repoId);
  pushRequiredText(issues, 'objective', slice?.objective);
  pushRequiredList(issues, 'allowedScope', slice?.allowedScope);
  pushRequiredList(issues, 'verifyCommands', slice?.verifyCommands);
  return issues;
}
