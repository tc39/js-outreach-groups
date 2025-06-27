export type PlatformId =
  | 'bun'
  | 'deno'
  | 'esbuild'
  | 'nodejs'
  | 'rsbuild'
  | 'rspack'
  | 'vite'
  | 'webpack';

export type PlatformType = 'bundler' | 'runtime';

export interface PlatformTypeObj<T extends PlatformType> {
  id: T;
  name: string;
}

export type PlatformTypesObj = {
  [K in PlatformType]: PlatformTypeObj<K>;
};

export const PLATFORM_TYPES: PlatformTypesObj = {
  bundler: {
    id: 'bundler',
    name: 'Bundlers',
  },
  runtime: {
    id: 'runtime',
    name: 'Runtimes',
  },
};

export type ExpectedPlatformType<T extends PlatformId> = T extends
  | 'bun'
  | 'deno'
  | 'nodejs'
  ? 'runtime'
  : 'bundler';

export interface Platform<T extends PlatformId> {
  id: T;
  name: string;
  type: PlatformType & ExpectedPlatformType<T>;
}

export type Platforms = {
  [K in PlatformId]: Platform<K>;
};

export const PLATFORMS: Platforms = {
  esbuild: {
    id: 'esbuild',
    name: 'esbuild',
    type: 'bundler',
  },
  rsbuild: {
    id: 'rsbuild',
    name: 'Rsbuild',
    type: 'bundler',
  },
  rspack: {
    id: 'rspack',
    name: 'Rspack',
    type: 'bundler',
  },
  vite: {
    id: 'vite',
    name: 'Vite',
    type: 'bundler',
  },
  webpack: {
    id: 'webpack',
    name: 'Webpack',
    type: 'bundler',
  },
  bun: {
    id: 'bun',
    name: 'Bun',
    type: 'runtime',
  },
  deno: {
    id: 'deno',
    name: 'Deno',
    type: 'runtime',
  },
  nodejs: {
    id: 'nodejs',
    name: 'Node.js',
    type: 'runtime',
  },
};

export interface SupportFlag {
  type: 'preference' | 'runtime_flag';
  name: string;
  value_to_set: string;
}

export interface SupportHistoryEntry {
  version_added: string | null | boolean;
  version_removed?: string | null | boolean;
  version_last?: string;
  partial_implementation?: boolean;
  notes?: string | string[];

  alternative_name?: string;
  prefix?: string;
  flags?: SupportFlag[];
}

export type SupportStatement = SupportHistoryEntry | SupportHistoryEntry[];

export interface Compat {
  description: string;
  support: Partial<Record<PlatformId, SupportStatement>>;
  status: {
    experimental: boolean;
    standard_track: boolean;
    deprecated: boolean;
  };
}

export interface CompatNode {
  __compat: Compat;
}

export interface CompatJson {
  [key: string]: CompatJson | undefined;
}

export function isCompatNode(node: unknown): node is CompatNode {
  if (!node || typeof node !== 'object' || !('__compat' in node)) {
    return false;
  }
  return true;
}

export function assertCompatNode(
  node: unknown,
  filename: string,
): asserts node is CompatNode {
  if (!isCompatNode(node)) {
    throw new Error('Expect __compat node for ' + filename);
  }
}
