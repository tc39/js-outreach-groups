test('<code>import.meta.resolve</code> is a function', () => {
  expect(typeof import.meta.resolve).toBe('function');
});

test('Returns an string', async () => {
  expect(typeof import.meta.resolve('./testdata/worker.js')).toBe('string');
});

test('NOTE: Returns a <code>URL</code> object instead of a string', async () => {
  expect(import.meta.resolve('./testdata/worker.js') instanceof URL).toBe(true);
});

test('NOTE/FAIL: Cannot <code>fetch()</code> the result of <code>import.meta.resolve</code>', async () => {
  let textFileUrl;
  try {
    textFileUrl = import.meta.resolve('./testdata/file.txt');
  } catch {
    // If resolving failed, we don't want to continue.
    return;
  }
  const contents = await fetch(textFileUrl).then((resp) => resp.text());
  expect(contents).toBe('~~ok~~\n');
});

test('NOTE: Throws when resolved URL cannot be reached', async () => {
  expect(() => import.meta.resolve('./testdata/not_a_file.txt')).toThrow();
  expect(() => import.meta.resolve('./testdata/worker.js')).not.toThrow();
});
