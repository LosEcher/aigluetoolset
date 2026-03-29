import {
  composeCommands,
  filterCommands,
  sortCommandsByUsage,
  recordCommandUsage,
} from '../../packages/palette-core/dist/index.js';
import {
  deriveListKeyIntent,
  moveSelectedIndex,
} from '../../packages/list-interaction-core/dist/index.js';

const commands = composeCommands([
  {
    sourceId: 'builtin',
    items: [
      { id: 'open-settings', name: 'Open Settings', tags: ['admin'], pinned: true },
      { id: 'open-status', name: 'Open Status Board', tags: ['status'] },
    ],
  },
  {
    sourceId: 'workflow',
    items: [
      { id: 'run-sync', name: 'Run Sync Workflow', tags: ['sync', 'workflow'] },
    ],
  },
]);

const usage = recordCommandUsage(
  recordCommandUsage({}, 'run-sync', Date.now() - 60_000),
  'run-sync',
  Date.now()
);

const visible = sortCommandsByUsage(filterCommands(commands, 'o'), usage, 'o');
const keyIntent = deriveListKeyIntent('ArrowDown');
const nextIndex =
  keyIntent.kind === 'navigate'
    ? moveSelectedIndex(0, visible.length, keyIntent.action)
    : 0;

console.log(
  JSON.stringify(
    {
      commands,
      visible: visible.map((item) => item.id),
      keyIntent,
      nextIndex,
    },
    null,
    2
  )
);
