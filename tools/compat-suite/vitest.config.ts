import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      // These are the compat tests, not the test runner tests.
      'tests',
      // Don't run tests inside of dependencies.
      // We install tool-specific dependencies in subdirectories which
      // confuses vitest a bit.
      '**/node_modules',
    ],
  },
});
