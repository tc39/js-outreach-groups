test('<code>import.meta.url</code> is a string', () => {
  expect(typeof import.meta.url).toBe('string');
});

test('NOTE: <code>import.meta.url</code> has <code>file://</code> protocol', async () => {
  expect(new URL(import.meta.url).protocol).toBe('file:');
});

test('NOTE/FAIL: Cannot <code>fetch()</code> the result of <code>import.meta.url</code>', async () => {
  let textFileUrl;
  try {
    textFileUrl = new URL('./testdata/file.txt', import.meta.url).href;
  } catch {
    // If resolving failed, we don't want to continue.
    return;
  }
  expect(typeof textFileUrl).toBe('string');
  const contents = await fetch(textFileUrl).then((resp) => resp.text());
  expect(contents).toBe('~~ok~~\n');
});
