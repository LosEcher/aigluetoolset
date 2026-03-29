export type PaletteCommandSourceKind = 'builtin' | 'workflow' | 'plugin' | 'external';

export type PaletteCommandItem = {
  id: string;
  name: string;
  description?: string;
  desc?: string;
  tags?: string[];
  shortcut?: string;
  pinned?: boolean;
  workflowId?: string;
  trigger?: string;
  source?: PaletteCommandSourceKind | string;
  enabled?: boolean;
};

export type PaletteUsageStat = {
  count: number;
  lastUsed: number;
};

export type PaletteUsageMap = Record<string, PaletteUsageStat>;

export type PaletteCommandSource = {
  sourceId: string;
  items: PaletteCommandItem[];
  enabled?: boolean;
};
