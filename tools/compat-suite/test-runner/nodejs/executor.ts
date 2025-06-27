import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

import { ExecTestCaseExecutor, type PlatformInfo } from '../executor.ts';
import { PLATFORMS } from '../compat_data_schema.ts';

const execFile = promisify(execFileCb);

export class NodejsTestCaseExecutor extends ExecTestCaseExecutor<'nodejs'> {
  protected getExecPath(): string {
    return 'node';
  }

  protected getExecFlags(): string[] {
    return ['--no-warnings', `--require=./.tmp/expect-bundle.cjs`];
  }

  protected async getPlatformInfo(): Promise<PlatformInfo<'nodejs'>> {
    const { stdout } = await execFile('node', ['--version']);
    return {
      ...PLATFORMS.nodejs,
      version: stdout.trim().replace(/^v/, ''),
    };
  }
}
