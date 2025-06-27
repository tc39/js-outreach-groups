test('<code>import&#8288;.meta.env</code> is an object', () => {
  expect(typeof import.meta.env).toBe('object');
});

test('<code>import&#8288;.meta.env</code> gracefully handles missing values', () => {
  expect(import.meta.env.ENV_VALUE_NOT_SET || 42).toBe(42);
  expect(import.meta.env['ENV_VALUE_NOT_SET'] || 42).toBe(42);
});

test('<code>import&#8288;.meta.env.{DEV,PROD}</code> exist and are mutually exclusive', () => {
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;
  expect(typeof isDev).toBe('boolean');
  expect(typeof isProd).toBe('boolean');
  expect((!!isDev && !isProd) || (!isDev && !!isProd)).toBe(true);
});

test('<code>import&#8288;.meta.env.MODE</code> is a string', () => {
  expect(typeof import.meta.env.MODE).toBe('string');
});
