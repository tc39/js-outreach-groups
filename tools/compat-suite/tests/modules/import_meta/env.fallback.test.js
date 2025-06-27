test('<code>import&#8288;.meta.env</code> allows graceful access', () => {
  expect(import.meta.env?.ENV_VALUE_NOT_SET ?? 42).toBe(42);
});

test('<code>import&#8288;.meta.env</code> allows graceful bracket access', () => {
  expect(import.meta.env?.['ENV_VALUE_NOT_SET'] || 42).toBe(42);
});
