import { describe, it, expect } from 'vitest';

import { NormalizedSupportHistory } from './compat_data.ts';
import {
  PLATFORMS,
  type PlatformId,
  type SupportStatement,
} from './compat_data_schema.ts';
import {
  toTestSuiteResult,
  type PlatformInfo,
  type TestResult,
  type TestSuiteResult,
} from './executor.ts';

const PLATFORM = PLATFORMS.bun;

interface TestSuiteResultOptions {
  pass?: number;
  fail?: number;
  notes?: number;
}

function makeTestSuiteResult<T extends PlatformId>(
  platform: PlatformInfo<T>,
  options: TestSuiteResultOptions,
): TestSuiteResult<T> {
  let { pass = 0, fail = 0, notes = 0 } = options;
  const results: TestResult[] = [];

  for (let i = 0; i < pass; ++i) {
    results.push({ description: `Pass ${i}`, error: null });
  }
  for (let i = 0; i < fail; ++i) {
    results.push({
      description: `Fail ${i}`,
      error: { message: `Error message ${i}` },
    });
  }
  for (let i = 0; i < notes; ++i) {
    results.push({
      description: `NOTE: Note ${i}`,
      error: null,
    });
  }

  const suiteResult = toTestSuiteResult(
    platform,
    'some/filename.test.js',
    results,
  );
  expect(suiteResult.pass).toBe(pass + notes);
  expect(suiteResult.fail).toBe(fail);
  expect(suiteResult.notes.length).toEqual(notes + (pass && fail ? fail : 0));
  return suiteResult;
}

function getCanonical(history: NormalizedSupportHistory): SupportStatement {
  return JSON.parse(JSON.stringify(history));
}

describe('NormalizedSupportHistory', () => {
  it('generates empty history entries', () => {
    expect(new NormalizedSupportHistory().toJSON()).toEqual({
      version_added: false,
    });
  });

  it('parses valid histories', () => {
    const testCases: [SupportStatement, string][] = [
      [{ version_added: false }, '0.0.0: none'],
      [{ version_added: '1.2.3' }, '1.2.3: full\n0.0.0: none'],
      [
        { version_added: '1.2.3', notes: ['a', 'b'] },
        '1.2.3: full - ["a","b"]\n0.0.0: none',
      ],
      [
        {
          version_added: '1.2.3',
          notes: ['a', 'b'],
          partial_implementation: true,
        },
        '1.2.3: partial - ["a","b"]\n0.0.0: none',
      ],
      [
        {
          version_added: '1.2.3',
          version_removed: '2.3.1',
          notes: ['a', 'b'],
          partial_implementation: true,
        },
        '2.3.1: none\n1.2.3: partial - ["a","b"]\n0.0.0: none',
      ],
      [
        {
          version_added: '1.2.3',
          version_last: '2.2.39',
          version_removed: '2.3.0',
          notes: ['a'],
          partial_implementation: true,
        },
        '2.3.0: none\n2.2.39: partial - ["a"]\n1.2.3: partial - ["a"]\n0.0.0: none',
      ],
      [
        [
          {
            version_added: '1.2.3',
          },
        ],
        '1.2.3: full\n0.0.0: none',
      ],
      [
        [
          {
            version_added: '1.2.3',
          },
          {
            version_added: '1.2.0',
            version_removed: '1.2.3',
            version_last: '1.2.2',
            partial_implementation: true,
            notes: ['a'],
          },
        ],
        '1.2.3: full\n1.2.2: partial - ["a"]\n1.2.0: partial - ["a"]\n0.0.0: none',
      ],
    ];

    for (const [history, expected] of testCases) {
      expect(new NormalizedSupportHistory(history).toString()).toEqual(
        expected,
      );
    }
  });

  it('preserves valid histories', () => {
    const histories: SupportStatement[] = [
      { version_added: false },
      { version_added: false, notes: ['a', 'b'] },
      { version_added: '1.2.3' },
      { version_added: '1.2.3', notes: ['a', 'b'] },
      {
        version_added: '1.2.3',
        notes: ['a', 'b'],
        partial_implementation: true,
      },
      {
        version_added: '1.2.3',
        version_removed: '2.3.1',
        notes: ['a', 'b'],
        partial_implementation: true,
      },
      [
        {
          version_added: '1.2.3',
        },
        {
          version_added: '1.2.0',
          version_removed: '1.2.3',
          version_last: '1.2.2',
          partial_implementation: true,
          notes: ['a'],
        },
      ],
    ];

    for (const history of histories) {
      expect(getCanonical(new NormalizedSupportHistory(history))).toEqual(
        history,
      );
    }
  });

  it('removes less-than from version', () => {
    expect(
      getCanonical(new NormalizedSupportHistory({ version_added: '<1.2.3' })),
    ).toEqual({ version_added: '1.2.3' });
  });

  it('tightens support if earlier version is tested', () => {
    const history = new NormalizedSupportHistory({
      version_added: '2.1.0',
    });
    history.mergeTestResult(
      makeTestSuiteResult({ ...PLATFORM, version: '2.0.0' }, { pass: 1 }),
    );
    expect(history.toString()).toBe('2.0.0: full\n0.0.0: none');
    expect(getCanonical(history)).toEqual({
      version_added: '2.0.0',
    });
  });

  it('inserts a history entry if support changes', () => {
    const history = new NormalizedSupportHistory({
      version_added: '2.1.0',
    });
    history.mergeTestResult(
      makeTestSuiteResult({ ...PLATFORM, version: '2.3.0' }, { fail: 1 }),
    );
    expect(history.toString()).toBe('2.3.0: none\n2.1.0: full\n0.0.0: none');
    expect(getCanonical(history)).toEqual({
      version_added: '2.1.0',
      version_removed: '2.3.0',
    });
  });

  it('takes notes from new entry', () => {
    const history = new NormalizedSupportHistory({
      version_added: '2.1.0',
      notes: ['a'],
    });
    history.mergeTestResult(
      makeTestSuiteResult(
        { ...PLATFORM, version: '2.1.0' },
        { pass: 1, notes: 1 },
      ),
    );
    expect(history.toString()).toBe('2.1.0: full - ["Note 0"]\n0.0.0: none');
    expect(getCanonical(history)).toEqual({
      version_added: '2.1.0',
      notes: ['Note 0'],
    });
  });

  it('updates notes from previous version results', () => {
    const history = new NormalizedSupportHistory({
      version_added: '2.1.0',
      partial_implementation: true,
    });
    history.mergeTestResult(
      makeTestSuiteResult(
        { ...PLATFORM, version: '2.3.0' },
        { pass: 1, fail: 1 },
      ),
    );
    expect(history.toString()).toBe(
      '2.1.0: partial - ["Fails: Fail 0"]\n0.0.0: none',
    );
    expect(getCanonical(history)).toEqual({
      version_added: '2.1.0',
      partial_implementation: true,
      notes: ['Fails: Fail 0'],
    });
  });
});
