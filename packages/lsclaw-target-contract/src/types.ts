export const LSCLAW_TARGET_MANIFEST_SCHEMA = 'aigluetoolset.lsclaw-target.v1';
export const LSCLAW_SLICE_CONTRACT_SCHEMA = 'aigluetoolset.lsclaw-slice.v1';
export const LSCLAW_REVIEW_BUNDLE_SCHEMA = 'aigluetoolset.lsclaw-review-bundle.v1';

export type LsclawDispatchMode = 'queue' | 'sync';
export type LsclawTaskMode = 'team' | 'single';
export type LsclawReviewOwner = 'codex' | 'manual';

export type LsclawTargetSliceReference = {
  title?: string;
  path?: string | null;
  allowedScope?: string[];
  verifyCommands?: string[];
};

export type LsclawTargetManifest = {
  schema: typeof LSCLAW_TARGET_MANIFEST_SCHEMA;
  repoId: string;
  defaultPlanId: string;
  targetProjectPath?: string | null;
  planPath?: string | null;
  defaultDispatchMode?: LsclawDispatchMode;
  defaultTaskMode?: LsclawTaskMode;
  defaultAgentName?: string | null;
  verify: {
    defaultCommands: string[];
  };
  slices?: Record<string, LsclawTargetSliceReference>;
};

export type LsclawSliceContract = {
  schema: typeof LSCLAW_SLICE_CONTRACT_SCHEMA;
  sliceId: string;
  repoId: string;
  title?: string;
  objective: string;
  targetProjectPath?: string | null;
  allowedScope: string[];
  verifyCommands: string[];
  expectedArtifacts?: string[];
  nonGoals?: string[];
  stopConditions?: string[];
  notes?: string[];
  reviewOwner?: LsclawReviewOwner;
};

export type LsclawTaskRunPayload = {
  mode: LsclawTaskMode;
  dispatchMode: LsclawDispatchMode;
  ownerRepo: string;
  targetProjectPath: string;
  task: string;
  agentName?: string;
  planPath?: string;
  verifyCommands?: string[];
  tenantId?: string;
  sessionId?: string;
  traceId?: string;
  parentTaskId?: string;
};

export type BuildLsclawTaskRunPayloadOptions = {
  manifest: LsclawTargetManifest;
  slice: LsclawSliceContract;
  task?: string | null;
  tenantId?: string | null;
  sessionId?: string | null;
  traceId?: string | null;
  parentTaskId?: string | null;
  dispatchMode?: LsclawDispatchMode;
  taskMode?: LsclawTaskMode;
  agentName?: string | null;
  planPath?: string | null;
};

export type LsclawReviewBundle = {
  schema: typeof LSCLAW_REVIEW_BUNDLE_SCHEMA;
  repoId: string;
  sliceId: string;
  objective: string;
  reviewOwner: LsclawReviewOwner;
  allowedScope: string[];
  verifyCommands: string[];
  expectedArtifacts: string[];
  changedFiles: string[];
  verifyResults: Array<{
    command: string;
    status: 'passed' | 'failed' | 'skipped';
    summary?: string;
  }>;
  findings?: string[];
  notes?: string[];
};

export type BuildLsclawReviewBundleOptions = {
  slice: LsclawSliceContract;
  changedFiles?: string[];
  verifyResults?: LsclawReviewBundle['verifyResults'];
  findings?: string[];
  notes?: string[];
};

export type ValidationIssue = {
  path: string;
  message: string;
};
