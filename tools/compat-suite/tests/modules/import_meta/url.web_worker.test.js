test('<code>import.meta.url</code> can load a <code>Worker</code>', async () => {
  const worker = new Worker(new URL('./testdata/worker.js', import.meta.url), {
    type: 'module',
  });
  const n = 42;
  try {
    const resp = await Promise.race([
      new Promise((resolve, reject) => {
        worker.onerror = reject;
        worker.onmessageerror = reject;
        worker.onmessage = ({ data }) => resolve(data);

        worker.postMessage(n);
      }),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('No response from worker after timeout'));
        }, 5000);
      }),
    ]);
    expect(resp).toBe(21);
  } finally {
    worker.terminate();
  }
});
