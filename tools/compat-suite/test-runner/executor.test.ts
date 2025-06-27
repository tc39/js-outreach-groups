import { describe, it, expect } from 'vitest';

import { toTestSuiteResult } from './executor.ts';

const TEST_ENV = {
  id: 'nodejs',
  version: '1.2.0',
  name: 'Fake',
  type: 'runtime',
} as const;
const TEST_FILENAME = 'compat-suite/group/file.test.js';

describe('toTestSuiteResult', () => {
  it('considers an empty test result as "failed"', () => {
    const result = toTestSuiteResult(TEST_ENV, TEST_FILENAME, []);
    expect(result).toMatchObject({
      ok: false,
      partial: false,
      notes: [],
    });
  });

  it('includes failed test cases in notes for partial success', () => {
    const result = toTestSuiteResult(TEST_ENV, TEST_FILENAME, [
      { description: 'Ok test', error: null },
      { description: 'Not ok test', error: { message: 'Reason why' } },
      {
        description: 'Other not ok test',
        error: { message: 'Other reason why' },
      },
    ]);
    expect(result).toMatchObject({
      ok: false,
      partial: true,
      notes: ['Fails: Not ok test', 'Fails: Other not ok test'],
    });
  });

  it('reports notes from annotated test cases', () => {
    const result = toTestSuiteResult(TEST_ENV, TEST_FILENAME, [
      { description: 'NOTE: Reported on success', error: null },
      {
        description: 'NOTE/FAIL: Reported on error',
        error: { message: 'Reason why' },
      },
      {
        description: 'NOTE: Reported on success (but failed)',
        error: { message: 'Reason why' },
      },
      {
        description: 'NOTE/FAIL: Reported on error (but succeeded)',
        error: null,
      },
    ]);
    expect(result).toMatchObject({
      ok: true,
      partial: false,
      notes: ['Reported on success', 'Reported on error'],
    });
  });

  it('parses compat group & subpath', () => {
    expect(
      toTestSuiteResult(TEST_ENV, 'compat-suite/some/path/_.test.js', []),
    ).toMatchObject({
      compatGroup: 'some/path',
      compatSubpath: [],
    });
    expect(
      toTestSuiteResult(
        TEST_ENV,
        'compat-suite/some/path/_~tag~tag2.test.js',
        [],
      ),
    ).toMatchObject({
      compatGroup: 'some/path',
      compatSubpath: [],
    });
    expect(
      toTestSuiteResult(
        TEST_ENV,
        'compat-suite/some/path/obj.nested.test.js',
        [],
      ),
    ).toMatchObject({
      compatGroup: 'some/path',
      compatSubpath: ['obj', 'nested'],
    });
    expect(
      toTestSuiteResult(
        TEST_ENV,
        'compat-suite/some/path/obj.nested~tag~tag2.test.js',
        [],
      ),
    ).toMatchObject({
      compatGroup: 'some/path',
      compatSubpath: ['obj', 'nested'],
    });
  });
});
