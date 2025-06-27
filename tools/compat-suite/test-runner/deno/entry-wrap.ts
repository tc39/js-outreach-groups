import { runTests } from '../../.tmp/expect-bundle.mjs';

// @ts-expect-error: Not worth pulling in deno types for this.
await import(`../../${Deno.args[0]}`).then(runTests);
