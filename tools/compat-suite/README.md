# Compat Test Suite

> [!IMPORTANT]
> All commands listed below assume that they are run from this directory,
> not from the repository root.

## Setup

```sh
npm install
npx playwright install
```

## Running the compat suite

Print any unexpected outcomes (pass or fail) and exit with no-success
when the compat data isn't fully consistent with the test results:

```sh
npm run check-compat-data
```

Update the compat data with the latest test suite results:

```sh
npm run update-compat-data
```

It's also possible to just run individual tests for specific platforms only:

```sh
# Run a single test for a single platform:
node ./test-runner/main.ts 'tests/modules/import_meta/_.test.js' '--platform=bun'
# Use ',' to specify more than one platform:
node ./test-runner/main.ts 'tests/modules/import_meta/_.test.js' '--platform=bun,deno'
# Run a single test for all platforms:
node ./test-runner/main.ts 'tests/modules/import_meta/_.test.js' '--platform=*'
# Run all import_meta tests for vite:
node ./test-runner/main.ts 'tests/modules/import_meta/*.test.js' '--platform=vite'
```

## How these tests work

1. All tests are written using plain JS.
2. Tests use `chai` with `vitest`-style `expect` assertions.
3. Tests run in the context of the tool's output or execution environment.

The tests for a `../compat/` markdown file will always be in a directory of the
same name (without `.md`) under `tests/`. Example:

- Markdown file: `compat/modules/import_meta.md`
- Tests: `compat-suite/tests/modules/import_meta/`

Each `__compat` node should have exactly one `.test.js` file. The top level node
uses a special `_.test.js` name. All others are named after their (potentially
nested) path. Example:

- Test: `compat-suite/tests/modules/import_meta/url.web_worker.test.js`
- Compat data: `url.web_worker.__compat` in `compat/modules/import_meta.md`.

### Test Results

The test outcomes are directly converted to compat metadata. If all tests succeed,
it counts as "full support". If none of the tests succeed, it counts as "no support".
Partial support will list all failing test cases as notes.

A test case with a `NOTE: ` prefix will report the remaining string as a note in the
compat data on success. It will not generate any compat data on failure.

A test case with a `NOTE/FAIL: ` prefix will report the remaining string as a note
in the compat data on failure. It will not generate any compat data on success.

### Platform Overrides

Sometimes supports a slight variant of a feature but it works differently from
how it would work elsewhere. In those cases, an override can be specified:

```sh
# Test for new Worker() across most tools:
url.web_worker.test.js
# Test that accounts for the slightly different API for workers in nodejs:
url.web_worker~nodejs.test.js
```

The value after `~` is a `PlatformId`, as defined in `compat_data_schema.ts`.

> [!NOTE]
> The override will completely replace the existing tests. If the override
> contains _additional_ tests, the baseline tests can be imported from the
> override test file.
