import * as chai from 'chai';
import {
  JestAsymmetricMatchers,
  JestChaiExpect,
  JestExtend,
} from '@vitest/expect';

chai.use(JestExtend);
chai.use(JestChaiExpect);
chai.use(JestAsymmetricMatchers);

/**
 * @typedef {() => void | Promise<void>} TestFunction
 */

/** @type {Map<string, TestFunction>} */
const tests = new Map();

let ranTests = false;

export async function runTests() {
  if (ranTests) {
    return;
  }
  ranTests = true;

  for (const [description, fn] of tests) {
    let error = null;
    try {
      let timer;
      await Promise.race([
        fn(),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error(`Timed out while running '${description}'`));
          }, 2000);
        }),
      ]);
      clearTimeout(timer);
    } catch (e) {
      error = {
        message: `${e instanceof Error ? e.message : e}`,
        stack: e instanceof Error ? e.stack : null,
      };
    }
    console.log(JSON.stringify({ description, error }));
  }
  if (
    typeof process !== 'undefined' &&
    process &&
    typeof process.exit === 'function'
  ) {
    process.exit(0);
  } else if (typeof Deno !== 'undefined') {
    Deno.exit(0);
  } else if (typeof window !== 'undefined' && typeof Bun === 'undefined') {
    console.log('<done>');
  }
}

Object.assign(globalThis, {
  /**
   * @param {string} description
   * @param {TestFunction} fn
   */
  test: async (description, fn) => {
    if (tests.has(description)) {
      throw new Error(`Duplicate test with description: ${description}`);
    }
    if (ranTests) {
      throw new Error(`Non-synchronous test registration for ${description}`);
    }
    tests.set(description, fn);

    queueMicrotask(runTests);
  },
  expect: chai.expect,
});

setTimeout(runTests, 250);
