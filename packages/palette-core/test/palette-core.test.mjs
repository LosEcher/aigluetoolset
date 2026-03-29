import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cleanupUsageStats,
  composeCommands,
  filterCommands,
  fuzzyMatch,
  recordCommandUsage,
  sortCommandsByUsage,
} from '../dist/index.js';

test('composeCommands keeps enabled sources, trims fields, and lets later sources override by id', () => {
  const commands = composeCommands([
    {
      sourceId: 'builtin',
      items: [
        {
          id: '  open-settings  ',
          name: '  Open Settings  ',
          description: '  Open app settings  ',
          tags: [' settings ', '', 'admin'],
        },
        {
          id: 'disabled-item',
          name: 'Disabled item',
          enabled: false,
        },
      ],
    },
    {
      sourceId: 'plugin',
      enabled: false,
      items: [
        {
          id: 'plugin-only',
          name: 'Should not appear',
        },
      ],
    },
    {
      sourceId: 'workflow',
      items: [
        {
          id: 'open-settings',
          name: 'Open Settings (Workflow)',
        },
      ],
    },
  ]);

  assert.deepEqual(commands, [
    {
      id: 'open-settings',
      name: 'Open Settings (Workflow)',
      description: undefined,
      desc: undefined,
      tags: undefined,
      source: 'workflow',
    },
  ]);
});

test('fuzzyMatch and filterCommands match substrings and initials', () => {
  assert.equal(fuzzyMatch('os', 'Open Settings'), true);
  assert.equal(fuzzyMatch('sett', 'Open Settings'), true);
  assert.equal(fuzzyMatch('zzz', 'Open Settings'), false);

  const commands = [
    {
      id: 'open-settings',
      name: 'Open Settings',
      description: 'Settings dialog',
      tags: ['admin'],
    },
    {
      id: 'sync-now',
      name: 'Sync Now',
      description: 'Trigger project sync',
      tags: ['network'],
    },
  ];

  assert.deepEqual(
    filterCommands(commands, 'os').map((item) => item.id),
    ['open-settings']
  );
  assert.deepEqual(
    filterCommands(commands, 'network').map((item) => item.id),
    ['sync-now']
  );
});

test('sortCommandsByUsage prefers pinned, then recent/frequent commands, and query prefix ordering', () => {
  const now = Date.now();
  const commands = [
    { id: 'sync-now', name: 'Sync Now' },
    { id: 'settings', name: 'Settings', pinned: true },
    { id: 'status', name: 'Status Overview' },
  ];

  const usage = {
    'sync-now': { count: 4, lastUsed: now - 2 * 24 * 60 * 60 * 1000 },
    status: { count: 1, lastUsed: now - 60 * 60 * 1000 },
  };

  assert.deepEqual(
    sortCommandsByUsage(commands, usage).map((item) => item.id),
    ['settings', 'status', 'sync-now']
  );
  assert.deepEqual(
    sortCommandsByUsage(commands, usage, 'st').map((item) => item.id),
    ['settings', 'status', 'sync-now']
  );
});

test('recordCommandUsage increments counts and cleanupUsageStats removes stale entries', () => {
  const start = 1_700_000_000_000;
  const usage = recordCommandUsage(
    {
      alpha: { count: 2, lastUsed: start - 1000 },
    },
    'alpha',
    start
  );

  assert.deepEqual(usage.alpha, { count: 3, lastUsed: start });
  assert.deepEqual(recordCommandUsage(usage, '   ', start), usage);

  const cleaned = cleanupUsageStats(
    {
      fresh: { count: 1, lastUsed: start },
      stale: { count: 9, lastUsed: start - 1000 * 60 * 60 * 24 * 120 },
    },
    1000 * 60 * 60 * 24 * 90,
    start
  );

  assert.deepEqual(cleaned, {
    fresh: { count: 1, lastUsed: start },
  });
});
