import { join } from 'node:path';
import { createFsFromVolume, Volume } from 'memfs';

import { type TestResult, type PlatformInfo } from '../executor.ts';
import {
  BundlingTestCaseExecutor,
  type PageContext,
} from '../bundling_executor.ts';
import { PLATFORMS } from '../compat_data_schema.ts';

export class RsbuildTestCaseExecutor extends BundlingTestCaseExecutor<
  'rsbuild',
  typeof import('@rsbuild/core')
> {
  protected override async getPlatformInfo(
    pkg: typeof import('@rsbuild/core'),
  ): Promise<PlatformInfo<'rsbuild'>> {
    return {
      ...PLATFORMS.rsbuild,
      version: pkg.version,
    };
  }

  protected override getPackageName(): string {
    return '@rsbuild/core';
  }

  protected override loadDefaultPackage(): Promise<
    typeof import('@rsbuild/core')
  > {
    return import('@rsbuild/core');
  }

  protected override async setupPageContext(
    filename: string,
    cwd: string,
    pkg: typeof import('@rsbuild/core'),
    pageContext: PageContext,
  ): Promise<TestResult[] | null> {
    const outdir = join(cwd, '.tmp', pageContext.id);
    const rsbuild = await pkg.createRsbuild({
      cwd: cwd,
      rsbuildConfig: {
        root: cwd,
        mode: 'development',
        source: {
          entry: {
            main: `./${filename}`,
          },
        },
        output: {
          assetPrefix: `/${pageContext.id}/`,
          target: 'web',
          distPath: {
            root: outdir,
          },
        },
        dev: {
          assetPrefix: `/${pageContext.id}/`,
        },
        performance: {
          printFileSize: false,
        },
      },
    });
    const volume = new Volume();
    const fs = createFsFromVolume(volume);
    const compiler = await rsbuild.createCompiler();
    compiler.outputFileSystem = fs as typeof compiler.outputFileSystem;

    let stats;

    try {
      ({ stats } = await rsbuild.build({
        compiler: compiler,
        watch: false,
      }));
    } catch (e) {
      return [
        {
          description: 'Build test suite',
          error: {
            message: `Test suite failed to build: ${e instanceof Error ? e.message : e}`,
          },
        },
      ];
    }

    if (!stats) {
      throw new Error('Expected non-null stats');
    }

    const { errors, assetsByChunkName } = stats?.toJson({ logging: 'none' });

    if (errors?.length) {
      return errors.map((err) => ({
        description: err.message,
        error: {
          message: err.message,
        },
      }));
    }

    pageContext.mainUrl = `/${assetsByChunkName!['main'][0]}`;

    function forwardFiles(subPath: string = '') {
      const fsPath = `${outdir}${subPath}`;
      for (const outFile of fs.readdirSync(fsPath)) {
        const newSubPath = `${subPath}/${outFile}`;
        const newFsPath = `${outdir}${newSubPath}`;
        try {
          const contents = fs.readFileSync(newFsPath);
          pageContext.files.set(newSubPath, contents);
          continue;
        } catch (e) {
          if ((e as any)?.code !== 'EISDIR') {
            throw e;
          }
        }
        forwardFiles(newSubPath);
      }
    }

    forwardFiles();

    return null;
  }
}
