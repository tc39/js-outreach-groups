import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

import { ExecTestCaseExecutor, type PlatformInfo } from '../executor.ts';
import { PLATFORMS } from '../compat_data_schema.ts';

const execFile = promisify(execFileCb);

export class DenoTestCaseExecutor extends ExecTestCaseExecutor<'deno'> {
  protected getExecPath(): string {
    return 'deno';
  }

  protected getExecFlags(): string[] {
    // Deno has no preload scripts so we need to roll our own.
    // If we want data on import.meta.main, that'll be annoying.
    return [
      'run',
      '--allow-env',
      '--allow-read',
      '--cached-only',
      '--no-lock',
      import.meta.resolve('./entry-wrap.ts'),
    ];
  }

  protected async getPlatformInfo(): Promise<PlatformInfo<'deno'>> {
    // Example output:
    // $ deno --version
    // deno 1.46.3 (stable, release, aarch64-apple-darwin)
    // v8 12.9.202.5-rusty
    // typescript 5.5.2
    const { stdout } = await execFile('deno', ['--version']);
    const denoMatch = stdout.match(/^deno v?([\d.]+)/m);
    if (!denoMatch) {
      throw new Error(`Could not find deno version in ${stdout}`);
    }
    return {
      ...PLATFORMS.deno,
      version: denoMatch[1],
    };
  }
}
