import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LSCLAW_REVIEW_BUNDLE_SCHEMA,
  buildLsclawReviewBundle,
  buildLsclawTaskRunPayload,
  validateSliceContract,
  validateTargetManifest,
} from '../dist/index.js';

test('validateTargetManifest reports required issues', () => {
  const issues = validateTargetManifest({
    schema: 'wrong',
    repoId: '',
    defaultPlanId: '',
    verify: { defaultCommands: [] },
  });

  assert.deepEqual(
    issues.map((issue) => issue.path),
    ['schema', 'repoId', 'defaultPlanId', 'verify.defaultCommands']
  );
});

test('buildLsclawTaskRunPayload creates bounded task text and trims optional fields', () => {
  const payload = buildLsclawTaskRunPayload({
    manifest: {
      schema: 'aigluetoolset.lsclaw-target.v1',
      repoId: 'demo-repo',
      defaultPlanId: 'plan/default',
      targetProjectPath: '/tmp/demo',
      planPath: 'docs/plan.md',
      defaultDispatchMode: 'queue',
      defaultTaskMode: 'team',
      defaultAgentName: 'kimi',
      verify: {
        defaultCommands: ['pnpm typecheck'],
      },
    },
    slice: {
      schema: 'aigluetoolset.lsclaw-slice.v1',
      sliceId: 'provider-surface',
      repoId: 'demo-repo',
      objective: 'Fix provider summary loading truth.',
      allowedScope: ['src/admin/app/pages/ProvidersPage.tsx', 'src/admin/test/providers-page-budget.test.mjs'],
      verifyCommands: ['pnpm test -- providers-page-budget'],
      expectedArtifacts: ['logs/providers-summary.json'],
      nonGoals: ['Do not widen into unrelated admin pages'],
      stopConditions: ['Stop if the fix requires route contract changes'],
    },
    task: 'Apply the bounded provider fix.',
    tenantId: ' tenant-a ',
    traceId: ' trace-1 ',
    agentName: ' codex ',
    planPath: ' docs/target-plan.md ',
  });

  assert.equal(payload.targetProjectPath, '/tmp/demo');
  assert.equal(payload.ownerRepo, 'demo-repo');
  assert.equal(payload.tenantId, 'tenant-a');
  assert.equal(payload.traceId, 'trace-1');
  assert.equal(payload.agentName, 'codex');
  assert.equal(payload.planPath, 'docs/target-plan.md');
  assert.deepEqual(payload.verifyCommands, ['pnpm test -- providers-page-budget']);
  assert.match(payload.task, /\[target_repo\] demo-repo/);
  assert.match(payload.task, /\[slice\] provider-surface/);
  assert.match(payload.task, /\[requested_task\] Apply the bounded provider fix\./);
  assert.match(payload.task, /\[allowed_scope\]/);
  assert.match(payload.task, /\[verify_commands\]/);
  assert.match(payload.task, /\[expected_artifacts\]/);
  assert.match(payload.task, /\[non_goals\]/);
  assert.match(payload.task, /\[stop_conditions\]/);
});

test('buildLsclawReviewBundle defaults owner and flattens data', () => {
  const bundle = buildLsclawReviewBundle({
    slice: {
      schema: 'aigluetoolset.lsclaw-slice.v1',
      sliceId: 'palette-core',
      repoId: 'cantool',
      objective: 'Extract headless palette helpers.',
      allowedScope: ['packages/palette-core/src'],
      verifyCommands: ['pnpm build'],
      expectedArtifacts: ['packages/palette-core/dist/index.js'],
      notes: ['keep package headless'],
    },
    changedFiles: ['packages/palette-core/src/index.ts', ''],
    findings: ['missing usage cleanup test'],
    notes: ['follow up with examples'],
  });

  assert.equal(bundle.schema, LSCLAW_REVIEW_BUNDLE_SCHEMA);
  assert.equal(bundle.reviewOwner, 'codex');
  assert.deepEqual(bundle.changedFiles, ['packages/palette-core/src/index.ts']);
  assert.deepEqual(bundle.findings, ['missing usage cleanup test']);
  assert.deepEqual(bundle.notes, ['follow up with examples', 'keep package headless']);
});

test('validateSliceContract reports missing required fields', () => {
  const issues = validateSliceContract({
    schema: 'wrong',
    sliceId: '',
    repoId: '',
    objective: '',
    allowedScope: [],
    verifyCommands: [],
  });

  assert.deepEqual(
    issues.map((issue) => issue.path),
    ['schema', 'sliceId', 'repoId', 'objective', 'allowedScope', 'verifyCommands']
  );
});
