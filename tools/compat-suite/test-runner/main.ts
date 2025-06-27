import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { glob } from 'node:fs/promises';

import { BunTestCaseExecutor } from './bun/executor.ts';
import { DenoTestCaseExecutor } from './deno/executor.ts';
import { NodejsTestCaseExecutor } from './nodejs/executor.ts';
import { EsbuildTestCaseExecutor } from './esbuild/executor.ts';
import type {
  ExecutorOptions,
  TestCaseExecutor,
  TestSuiteResult,
} from './executor.ts';
import { WebpackTestCaseExecutor } from './webpack/executor.ts';
import { ViteTestCaseExecutor } from './vite/executor.ts';
import { RspackTestCaseExecutor } from './rspack/executor.ts';
import { RsbuildTestCaseExecutor } from './rsbuild/executor.ts';
import { PLATFORMS, type PlatformId } from './compat_data_schema.ts';
import { CompatData, CompatDataDiskSource } from './compat_data.ts';
import { ensureExpectBundle } from './expect_bundle.ts';

// Directory, relative to the compat-suite root, where the compat data is stored.
const COMPAT_DATA_DIR = '../compat';

async function getTestSuites(
  globs: string[],
  { cwd, platformId }: { cwd: string; platformId: PlatformId },
): Promise<string[]> {
  const suites = new Set<string>();
  const platformSuffix = `~${platformId}.test.js`;

  const matches = await glob(globs, {
    cwd,
  });
  for await (const match of matches) {
    if (/~\w+\.test\./.test(match)) {
      continue;
    }
    const platformMatch = match.replace(/\.test\.js$/, platformSuffix);
    try {
      await stat(join(cwd, platformMatch));
      suites.add(platformMatch);
      continue;
    } catch (e) {
      if ((e as any).code !== 'ENOENT') {
        throw e;
      }
    }
    suites.add(match);
  }

  return [...suites];
}

const EXECUTORS: {
  [K in PlatformId]: { new (): TestCaseExecutor<K> };
} = {
  bun: BunTestCaseExecutor,
  deno: DenoTestCaseExecutor,
  esbuild: EsbuildTestCaseExecutor,
  nodejs: NodejsTestCaseExecutor,
  rsbuild: RsbuildTestCaseExecutor,
  rspack: RspackTestCaseExecutor,
  vite: ViteTestCaseExecutor,
  webpack: WebpackTestCaseExecutor,
};

function createExecutor(platformId: PlatformId) {
  const Executor = EXECUTORS[platformId];

  if (!Executor) {
    throw new Error(`No executor for '${platformId}'`);
  }

  return new Executor();
}

async function runForPlatformId(
  platformId: PlatformId,
  globs: string[],
  options: ExecutorOptions,
): Promise<Map<string, TestSuiteResult<PlatformId>>> {
  const executor = createExecutor(platformId);

  const testSuites = await getTestSuites(globs, {
    cwd: options.cwd,
    platformId,
  });

  if (options.isDebug && testSuites.length > 1) {
    throw new Error(`Cannot use --debug with more than one test suite at once`);
  }

  const results = await executor.run(testSuites, options);

  return results;
}

function castPlatformId(id: string): PlatformId {
  if (PLATFORMS.hasOwnProperty(id)) {
    return id as PlatformId;
  }
  throw new Error(`Unrecognized platform id '${id}'`);
}

type PlatformSpec = [PlatformId, string | null];

const DEFAULT_PLATFORM_SPECS: PlatformSpec[] = [['nodejs', null]];

function parsePlatformFilter(platformFilter: string[]): PlatformSpec[] {
  if (platformFilter.length === 0) {
    return DEFAULT_PLATFORM_SPECS;
  }

  const allPlatforms: PlatformId[] = Array.from(
    Object.values(PLATFORMS),
    (p) => p.id,
  );

  const specStrings: string[] = platformFilter.flatMap((filter) => {
    if (filter === '*') {
      return allPlatforms;
    } else if (filter === 'bundler' || filter === 'runtime') {
      return allPlatforms.filter((id: PlatformId) => {
        return PLATFORMS[id].type === filter;
      });
    }
    return filter.split(',');
  });

  const platformSpecs: PlatformSpec[] = specStrings.map((spec) => {
    const [id, version = null] = spec.split('@');
    return [castPlatformId(id), version];
  });
  return platformSpecs;
}

async function main(argv: string[]) {
  const {
    values: { platform: platformFilter, update: isUpdate, debug: isDebug },
    positionals: globs,
  } = parseArgs({
    args: argv,
    options: {
      platform: {
        type: 'string',
        multiple: true,
        default: [],
      },
      update: {
        type: 'boolean',
        default: false,
      },
      debug: {
        type: 'boolean',
        default: false,
      },
    },
    allowPositionals: true,
  });

  if (globs.length === 0) {
    throw new Error('Expected test file patterns');
  }

  const platformSpecs = parsePlatformFilter(platformFilter);

  const cwd = process.cwd();

  await ensureExpectBundle(cwd);

  const resultsByPlatform = await Promise.all(
    platformSpecs.map(([platformId, overrideVersion]) =>
      runForPlatformId(platformId, globs, {
        cwd,
        isDebug,
        overrideVersion,
      }),
    ),
  );

  const compatData = new CompatData(
    new CompatDataDiskSource({
      rootDir: join(cwd, COMPAT_DATA_DIR),
    }),
    !isUpdate,
  );

  for (const results of resultsByPlatform) {
    for (const result of results.values()) {
      compatData.applyTestResult(result);
    }
  }

  if (!isUpdate) {
    for (const change of compatData.changes()) {
      console.log(change);
    }
    if (compatData.hasChanges()) {
      process.exitCode = 1;
    } else {
      console.error('No changes - all data is up-to-date.');
    }
  } else {
    await compatData.save();
  }
}

await main(process.argv.slice(2));
