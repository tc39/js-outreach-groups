test('<code>import&#8288;.meta.webpack</code> is a major version number', () => {
  expect(typeof import.meta.webpack).toBe('number');
});

test('<code>import&#8288;.meta.webpackContext</code> is available', () => {
  const ctx = import.meta.webpackContext('./testdata/context');
  const { A } = ctx('./a.js');
  const { B } = ctx('./b.js');
  expect(A).toBe(42);
  expect(B).toBe(2);
});
