import type { BuildLsclawReviewBundleOptions, LsclawReviewBundle } from './types.js';
import { LSCLAW_REVIEW_BUNDLE_SCHEMA } from './types.js';

function flatten(items: string[] | undefined): string[] {
  return Array.isArray(items) ? items.map((item) => String(item ?? '').trim()).filter(Boolean) : [];
}

export function buildLsclawReviewBundle(options: BuildLsclawReviewBundleOptions): LsclawReviewBundle {
  const slice = options.slice;
  return {
    schema: LSCLAW_REVIEW_BUNDLE_SCHEMA,
    repoId: slice.repoId,
    sliceId: slice.sliceId,
    objective: slice.objective,
    reviewOwner: slice.reviewOwner ?? 'codex',
    allowedScope: flatten(slice.allowedScope),
    verifyCommands: flatten(slice.verifyCommands),
    expectedArtifacts: flatten(slice.expectedArtifacts),
    changedFiles: flatten(options.changedFiles),
    verifyResults: Array.isArray(options.verifyResults) ? options.verifyResults : [],
    findings: flatten(options.findings),
    notes: flatten(options.notes).concat(flatten(slice.notes)),
  };
}
