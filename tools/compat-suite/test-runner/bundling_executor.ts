import {
  createServer,
  type Server,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { type AddressInfo } from 'node:net';
import { chromium, type Browser } from 'playwright';
import { extname } from 'node:path';
import { readFileSync } from 'node:fs';

import {
  TestCaseExecutor,
  type TestResult,
  type TestSuiteResult,
  toTestSuiteResult,
  type PlatformInfo,
  type ExecutorOptions,
} from './executor.ts';
import type { PlatformId } from './compat_data_schema.ts';
import { getPackageAtVersion } from './package-cache/index.ts';
import { SemVer } from 'semver';

export interface PageContext {
  id: string;
  files: Map<string, string | Uint8Array>;
  mainUrl: string;
  mainIsModule: boolean;
}

function getContentType(filename: string): string {
  switch (extname(filename)) {
    case '.js':
      return 'text/javascript';

    case '.txt':
      return 'text/plain';

    default:
      throw new Error(`TODO: Handle extension ${extname(filename)}`);
  }
}

export abstract class BundlingTestCaseExecutor<
  T extends PlatformId,
  PackageT,
> extends TestCaseExecutor<T> {
  protected abstract getPlatformInfo(
    pkg: PackageT,
    versionHint: string | null,
  ): Promise<PlatformInfo<T>>;
  protected abstract setupPageContext(
    filename: string,
    cwd: string,
    pkg: PackageT,
    pageContext: PageContext,
  ): Promise<TestResult[] | null>;
  protected abstract getPackageName(versionHint: string): string;
  protected abstract loadDefaultPackage(): Promise<PackageT>;

  #testScript: string | null = null;

  #pageContexts = new Map<string, PageContext>();

  #server = new Promise<Server>((resolve) => {
    const inst = createServer((req, res) => this.#handleRequest(req, res));
    inst.unref();
    inst.listen(0, () => resolve(inst));
  });

  #handleRequest(req: IncomingMessage, res: ServerResponse) {
    if (req.url === '/favicon.ico') {
      res.end('');
      return;
    }

    const routeMatch = `${req.url}`.match(/^\/([^/]+)(\/(?:.*))/);
    const pageContext = this.#pageContexts.get(routeMatch?.[1]!);
    if (!routeMatch || !pageContext) {
      res.statusCode = 404;
      console.error('Unexpected request: %s %s', req.method, req.url);
      res.end('Not found');
      return;
    }
    const subPath = routeMatch[2];
    if (subPath === '/') {
      if (this.#testScript === null) {
        this.#testScript = readFileSync('.tmp/expect-bundle.js', 'utf8');
      }
      res.setHeader('Content-Type', 'text/html');
      res.end(`<!-- TODO: Make this a proper prebundled script? -->
<script>${this.#testScript}</script>
<script src="/${pageContext.id}${pageContext.mainUrl}"${pageContext.mainIsModule ? ' type="module"' : ''}></script>`);
      return;
    }

    const fileContents = pageContext.files.get(subPath);
    if (!fileContents) {
      res.statusCode = 404;
      console.error('Unexpected request: %s %s', req.method, req.url);
      res.end('Not found');
      return;
    }

    res.setHeader('Content-Type', getContentType(subPath));
    res.end(fileContents);
  }

  async #runTestCase(
    filename: string,
    cwd: string,
    pkg: PackageT,
    browser: Browser,
    pageContext: PageContext,
  ): Promise<TestResult[]> {
    const earlyErrors = await this.setupPageContext(
      filename,
      cwd,
      pkg,
      pageContext,
    );
    if (earlyErrors) {
      return earlyErrors;
    }

    const pageErrors: Error[] = [];

    let resolve: () => void;
    const allDone = new Promise<void>((r) => {
      resolve = r;
    });

    const lines: TestResult[] = [];

    const page = await browser.newPage();
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });
    page.on('console', (consoleMessage) => {
      if (consoleMessage.text() === '<done>') {
        resolve();
        return;
      }
      if (consoleMessage.type() !== 'log') {
        console.log(consoleMessage);
        return;
      }
      lines.push(JSON.parse(consoleMessage.text()) as TestResult);
    });
    const pageUrl = await this.getPageUrl(pageContext);
    await page.goto(pageUrl);
    await Promise.race([
      allDone,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Test timed out')), 1000);
      }),
    ]);
    await page.close();

    if (pageErrors.length) {
      return pageErrors.map((err) => ({
        description: 'Failed to run on page',
        error: {
          message: err.message,
          stack: err.stack,
        },
      }));
    }

    return lines;
  }

  private createPageContext() {
    const pageContext: PageContext = {
      id: crypto.randomUUID(),
      files: new Map<string, string>(),
      mainUrl: '/main.js',
      mainIsModule: false,
    };
    this.#pageContexts.set(pageContext.id, pageContext);
    return pageContext;
  }

  private async getPageUrl(pageContext: PageContext) {
    const port = await this.#server.then(
      (s) => (s.address() as AddressInfo).port,
    );
    const pageUrl = `http://127.0.0.1:${port}/${pageContext.id}/`;
    return pageUrl;
  }

  private async getPackage(overrideVersion: string | null): Promise<PackageT> {
    if (overrideVersion) {
      const packageName = this.getPackageName(overrideVersion);
      return getPackageAtVersion(packageName, overrideVersion) as PackageT;
    } else {
      return this.loadDefaultPackage();
    }
  }

  async run(
    filenames: string[],
    { cwd, isDebug, overrideVersion }: ExecutorOptions,
  ): Promise<Map<string, TestSuiteResult<T>>> {
    const pkg: PackageT = await this.getPackage(overrideVersion);

    if (isDebug) {
      const [filename] = filenames;
      const pageContext = this.createPageContext();
      const earlyErrors = await this.setupPageContext(
        filename,
        cwd,
        pkg,
        pageContext,
      );
      if (earlyErrors) {
        console.error(earlyErrors);
        throw new Error('Bundling failed');
      }
      const pageUrl = await this.getPageUrl(pageContext);
      if (isDebug) {
        console.log('Open: %s', pageUrl);
        await new Promise((resolve) => {
          setTimeout(resolve, 1_000_000);
        }); // hang
      }
      return new Map();
    }

    const browser = await chromium.launch();
    const platform = await this.getPlatformInfo(pkg, overrideVersion);
    if (
      !platform.version ||
      typeof platform.version !== 'string' ||
      !new SemVer(platform.version)
    ) {
      if (overrideVersion) {
        console.warn(
          `Gracefully setting version of ${platform.id} to ${overrideVersion}`,
        );
        platform.version = overrideVersion;
      } else {
        throw new Error(
          `Invalid version '${platform.version}' returned for ${platform.id}`,
        );
      }
    }

    const suites = new Map<string, TestSuiteResult<T>>();
    for (const filename of filenames) {
      const pageContext = this.createPageContext();
      const results = await this.#runTestCase(
        filename,
        cwd,
        pkg,
        browser,
        pageContext,
      );
      suites.set(filename, toTestSuiteResult(platform, filename, results));
    }
    await browser.close();
    return suites;
  }
}
