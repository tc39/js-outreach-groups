import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

import { ExecTestCaseExecutor, type PlatformInfo } from '../executor.ts';
import { PLATFORMS } from '../compat_data_schema.ts';

const execFile = promisify(execFileCb);

export class BunTestCaseExecutor extends ExecTestCaseExecutor<'bun'> {
  protected getExecPath(): string {
    return 'bun';
  }

  protected getExecFlags(): string[] {
    return [`--preload=${import.meta.resolve('../../.tmp/expect-bundle.cjs')}`];
  }

  protected async getPlatformInfo(): Promise<PlatformInfo<'bun'>> {
    const { stdout } = await execFile('bun', ['--version']);
    return {
      ...PLATFORMS.bun,
      version: stdout.trim().replace(/^v/, ''),
    };
  }
}
