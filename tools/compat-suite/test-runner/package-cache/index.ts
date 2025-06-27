import { execSync } from 'node:child_process';

export async function getPackageAtVersion(name: string, version: string) {
  execSync(`bun install --silent --no-save ${name}@${version}`, {
    cwd: import.meta.dirname,
    stdio: 'inherit',
  });
  return import(name);
}
